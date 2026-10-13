import { createHash,createHmac,randomBytes,timingSafeEqual } from "node:crypto";
const ttlSeconds=60*60*24*14;
export const SUPPORT_COOKIE="agesoma_support_visitor";
export function mintSupportSession(slug:string,secret:string,now=Date.now()){
  if(!/^s-[a-f0-9]{26}$/.test(slug)||secret.length<32)throw new Error("invalid_visitor_session_configuration");
  const id=randomBytes(16).toString("hex");
  const issued=String(Math.floor(now/1000));
  const value=slug+"."+id+"."+issued;
  return value+"."+createHmac("sha256",secret).update(value).digest("hex");
}
export function verifySupportSession(slug:string,token:string|null,secret:string,now=Date.now()){
  if(!token||secret.length<32)return null;
  const parts=token.split(".");
  if(parts.length!==4||parts[0]!==slug||!/^[a-f0-9]{32}$/.test(parts[1])||!/^\d{10}$/.test(parts[2])||!/^[a-f0-9]{64}$/.test(parts[3]))return null;
  const age=Math.floor(now/1000)-Number(parts[2]);
  if(age<0||age>ttlSeconds)return null;
  const signed=parts.slice(0,3).join(".");
  const expected=createHmac("sha256",secret).update(signed).digest();
  if(!timingSafeEqual(expected,Buffer.from(parts[3],"hex")))return null;
  return createHash("sha256").update(slug+":"+parts[1]).digest("hex");
}
export function supportSessionSecret():string{
  return process.env.SUPPORT_SESSION_SECRET||process.env.BETTER_AUTH_SECRET||"";
}
