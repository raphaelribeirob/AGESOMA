import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { classifyBrowserAction, classifyBrowserContent } from "./policy";

const port=Number(process.env.PORT??8089);
const serviceToken=process.env.BROWSER_SAFETY_TOKEN?.trim()??"";

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}
function sameSecret(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}
function authorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-browser-safety-token"];
  return typeof supplied==="string"&&sameSecret(supplied,serviceToken);
}
async function readJson(req:IncomingMessage,max=512*1024){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>max) throw new Error("request_too_large");chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"independent-browser-safety-v1"});
    if(!authorized(req)) return json(res,403,{error:"forbidden"});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    if(req.url==="/v1/content"){
      const snapshot=typeof input.snapshot==="string"?input.snapshot:"";
      if(!snapshot) return json(res,400,{error:"snapshot_required"});
      return json(res,200,classifyBrowserContent({
        snapshot,
        url:typeof input.url==="string"?input.url:null,
        title:typeof input.title==="string"?input.title:null
      }));
    }
    if(req.url==="/v1/action"){
      return json(res,200,classifyBrowserAction({
        action:typeof input.action==="string"?input.action:"",
        ref:typeof input.ref==="string"?input.ref:null,
        refs:input.refs&&typeof input.refs==="object"&&!Array.isArray(input.refs)
          ? input.refs as Record<string,Record<string,unknown>>:null,
        value:input.value,
        url:typeof input.url==="string"?input.url:null
      }));
    }
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"browser_safety_error";
    return json(res,message==="request_too_large"?413:400,{error:message});
  }
});

if(!serviceToken) throw new Error("BROWSER_SAFETY_TOKEN is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser safety listening on ${port}`));
