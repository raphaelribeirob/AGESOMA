import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

const port=Number(process.env.PORT??8088);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const cdpToken=process.env.BROWSER_CDP_TOKEN?.trim()??"";
const trustStoreUrl=(process.env.TRUST_STORE_URL??"http://trust-store:8084").replace(/\/$/,"");
const trustStoreToken=process.env.TRUST_STORE_TENANT_TOKEN?.trim()??"";
const authdUrl=(process.env.AUTHD_URL??"http://authd:8083").replace(/\/$/,"");
const authdToken=process.env.AUTHD_BROWSER_CDP_TOKEN?.trim()??"";

function sameSecret(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function reject(socket:import("node:net").Socket,status=403,message="Forbidden"){
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

async function trust(taskId:string,sessionId:string){
  const response=await fetch(`${trustStoreUrl}/v1/browser/cdp-context`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-trust-caller":"browser_cdp_gateway",
      "x-agesoma-trust-token":trustStoreToken
    },
    body:JSON.stringify({tenantId,taskId,sessionId}),
    signal:AbortSignal.timeout(10_000)
  });
  if(!response.ok) throw new Error("browser_session_not_authorized");
}

async function steelCredential(taskId:string){
  const response=await fetch(`${authdUrl}/v1/resolve`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-authd-caller":"browser_cdp_gateway",
      "x-agesoma-authd-token":authdToken
    },
    body:JSON.stringify({
      tenantId,taskId,surrogate:"cred://steel/default",purpose:"browser.cdp"
    }),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {credential?:string}|null;
  if(!response.ok||!result?.credential) throw new Error("steel_credential_unavailable");
  return result.credential;
}

const server=createServer((req,res)=>{
  if(req.method==="GET"&&req.url==="/health"){
    const raw=JSON.stringify({ok:true,mode:"fixed-steel-cdp-gateway",cdpExposedToRuntime:false});
    res.writeHead(200,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
    res.end(raw);
    return;
  }
  res.writeHead(404);res.end();
});

const wss=new WebSocketServer({noServer:true,maxPayload:16*1024*1024,perMessageDeflate:false});

server.on("upgrade",async(req,socket,head)=>{
  try{
    const url=new URL(req.url??"/","http://browser-cdp.internal");
    if(url.pathname!=="/v1/cdp") return reject(socket,404,"Not Found");
    const supplied=url.searchParams.get("token")??"";
    const taskId=url.searchParams.get("taskId")??"";
    const sessionId=url.searchParams.get("sessionId")??"";
    if(!sameSecret(supplied,cdpToken)||!taskId||!sessionId) return reject(socket);

    await trust(taskId,sessionId);
    const steelKey=await steelCredential(taskId);
    const upstreamUrl=`wss://connect.steel.dev/?apiKey=${encodeURIComponent(steelKey)}&sessionId=${encodeURIComponent(sessionId)}`;

    wss.handleUpgrade(req,socket,head,(client)=>{
      const upstream=new WebSocket(upstreamUrl,{perMessageDeflate:false,maxPayload:16*1024*1024});

      const closeBoth=(code=1011,reason="bridge_closed")=>{
        if(client.readyState===WebSocket.OPEN) client.close(code,reason);
        if(upstream.readyState===WebSocket.OPEN) upstream.close(code,reason);
      };

      upstream.on("open",()=>{
        client.on("message",(data,isBinary)=>{
          if(upstream.readyState===WebSocket.OPEN) upstream.send(data,{binary:isBinary});
        });
        upstream.on("message",(data,isBinary)=>{
          if(client.readyState===WebSocket.OPEN) client.send(data,{binary:isBinary});
        });
      });
      client.on("close",()=>{if(upstream.readyState===WebSocket.OPEN) upstream.close();});
      upstream.on("close",(code,reason)=>{
        if(client.readyState===WebSocket.OPEN) client.close(code,reason.toString().slice(0,120));
      });
      client.on("error",()=>closeBoth());
      upstream.on("error",()=>closeBoth());
    });
  }catch{
    reject(socket);
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!cdpToken||!trustStoreToken||!authdToken) throw new Error("Browser CDP gateway tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser CDP gateway listening on ${port}`));
