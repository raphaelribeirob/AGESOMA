import { timingSafeEqual } from "node:crypto";
import { createServer, request as httpRequest, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "node:http";

const port=Number(process.env.PORT??8090);
const token=process.env.WORKCELL_CONTROL_TOKEN?.trim()??"";
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const maxRequestBytes=Number(process.env.WORKCELL_CONTROL_MAX_REQUEST_BYTES??32*1024*1024);

type RouteTarget={
  prefix:string;
  host:string;
  port:number;
  upstreamPrefix:string;
  methods:Set<string>;
};

const targets:RouteTarget[]=[
  {
    prefix:"/v1/hermes",
    host:"hermes",
    port:8642,
    upstreamPrefix:"",
    methods:new Set(["GET","POST","HEAD"])
  },
  {
    prefix:"/v1/broker",
    host:"credential-broker",
    port:8080,
    upstreamPrefix:"",
    methods:new Set(["GET","POST","HEAD"])
  },
  {
    prefix:"/v1/egress",
    host:"egress-gateway",
    port:8085,
    upstreamPrefix:"",
    methods:new Set(["GET","POST","HEAD"])
  }
];

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

function sameSecret(a:string,b:string){
  const left=Buffer.from(a);
  const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function authorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-workcell-token"];
  return typeof supplied==="string"&&sameSecret(supplied,token);
}

function safeHeaders(headers:IncomingHttpHeaders){
  const out:Record<string,string>={};
  for(const [name,raw] of Object.entries(headers)){
    const lower=name.toLowerCase();
    if([
      "host","connection","keep-alive","proxy-authenticate","proxy-authorization",
      "te","trailer","transfer-encoding","upgrade","x-agesoma-workcell-token"
    ].includes(lower)) continue;
    const value=Array.isArray(raw)?raw.join(","):raw;
    if(typeof value==="string") out[lower]=value;
  }
  return out;
}

function responseHeaders(headers:IncomingHttpHeaders){
  const out:Record<string,string>={};
  for(const [name,raw] of Object.entries(headers)){
    const lower=name.toLowerCase();
    if(["connection","keep-alive","transfer-encoding","upgrade"].includes(lower)) continue;
    const value=Array.isArray(raw)?raw.join(","):raw;
    if(typeof value==="string") out[lower]=value;
  }
  return out;
}

function resolveTarget(rawUrl:string){
  const parsed=new URL(rawUrl,"http://workcell.internal");
  if(parsed.pathname.includes("..")) throw new Error("invalid_path");
  const target=targets.find((item)=>
    parsed.pathname===item.prefix||parsed.pathname.startsWith(item.prefix+"/")
  );
  if(!target) throw new Error("route_denied");
  const suffix=parsed.pathname.slice(target.prefix.length)||"/";
  return {
    target,
    path:`${target.upstreamPrefix}${suffix}${parsed.search}`
  };
}

async function dependencyHealth(){
  const checks=await Promise.all(targets.map(async(target)=>{
    const path=target.prefix==="/v1/hermes"?"/health":"/health";
    return await new Promise<{name:string;ok:boolean}>((resolve)=>{
      const req=httpRequest({
        hostname:target.host,
        port:target.port,
        method:"GET",
        path,
        timeout:3000
      },(res)=>{
        res.resume();
        resolve({name:target.prefix.slice(4),ok:Boolean(res.statusCode&&res.statusCode>=200&&res.statusCode<300)});
      });
      req.on("timeout",()=>{req.destroy();resolve({name:target.prefix.slice(4),ok:false});});
      req.on("error",()=>resolve({name:target.prefix.slice(4),ok:false}));
      req.end();
    });
  }));
  return checks;
}

function proxy(req:IncomingMessage,res:ServerResponse){
  if(!authorized(req)) return json(res,403,{error:"forbidden"});
  if(!req.url) return json(res,404,{error:"not_found"});

  let resolved:ReturnType<typeof resolveTarget>;
  try{
    resolved=resolveTarget(req.url);
  }catch(error){
    const message=error instanceof Error?error.message:"route_error";
    return json(res,message==="route_denied"?404:400,{error:message});
  }

  const method=req.method??"GET";
  if(!resolved.target.methods.has(method)) return json(res,405,{error:"method_not_allowed"});

  const declared=Number(req.headers["content-length"]??0);
  if(Number.isFinite(declared)&&declared>maxRequestBytes){
    return json(res,413,{error:"request_too_large"});
  }

  const upstream=httpRequest({
    hostname:resolved.target.host,
    port:resolved.target.port,
    method,
    path:resolved.path,
    headers:safeHeaders(req.headers)
  },(upstreamRes)=>{
    res.writeHead(upstreamRes.statusCode??502,responseHeaders(upstreamRes.headers));
    upstreamRes.pipe(res);
  });

  let bytes=0;
  req.on("data",(chunk:Buffer)=>{
    bytes+=chunk.length;
    if(bytes>maxRequestBytes){
      upstream.destroy(new Error("request_too_large"));
      if(!res.headersSent) json(res,413,{error:"request_too_large"});
      else res.destroy();
      req.destroy();
      return;
    }
    upstream.write(chunk);
  });
  req.on("end",()=>upstream.end());
  req.on("aborted",()=>upstream.destroy());
  req.on("error",(error)=>upstream.destroy(error));
  upstream.setTimeout(310_000,()=>upstream.destroy(new Error("upstream_timeout")));
  upstream.on("error",(error)=>{
    if(!res.headersSent){
      return json(res,error.message==="request_too_large"?413:502,{
        error:error.message==="request_too_large"?"request_too_large":"workcell_upstream_unavailable"
      });
    }
    res.destroy(error);
  });
}

const server=createServer(async(req,res)=>{
  if(req.method==="GET"&&req.url==="/health"){
    const dependencies=await dependencyHealth();
    return json(res,200,{
      ok:true,
      tenantId,
      mode:"narrow-control-plane-ingress",
      dependencies
    });
  }
  return proxy(req,res);
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!token) throw new Error("WORKCELL_CONTROL_TOKEN is required");
if(!Number.isFinite(maxRequestBytes)||maxRequestBytes<1024){
  throw new Error("WORKCELL_CONTROL_MAX_REQUEST_BYTES is invalid");
}

server.listen(port,"0.0.0.0",()=>{
  console.log(`AGESOMA Work Cell control gateway listening on ${port}`);
});
