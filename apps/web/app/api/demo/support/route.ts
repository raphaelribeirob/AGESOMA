import {NextResponse} from "next/server";
import {z} from "zod";
import {demonstrateSupport} from "@agesoma/core";

const schema=z.object({message:z.string().trim().min(3).max(300)}).strict();
export async function POST(req:Request){
 const origin=req.headers.get("origin");
 if(!origin || origin!==new URL(req.url).origin)
  return NextResponse.json({error:"Origem não autorizada."},{status:403});
 if(!req.headers.get("content-type")?.startsWith("application/json"))
  return NextResponse.json({error:"JSON obrigatório."},{status:415});
 if(Number(req.headers.get("content-length")??0)>2048)
  return NextResponse.json({error:"Mensagem muito longa."},{status:413});
 const raw=await req.text();
 if(raw.length>2048)return NextResponse.json({error:"Mensagem muito longa."},{status:413});
 let json:unknown;
 try{json=JSON.parse(raw);}catch{return NextResponse.json({error:"JSON inválido."},{status:400});}
 const parsed=schema.safeParse(json);
 if(!parsed.success)return NextResponse.json({error:"Pergunta inválida."},{status:400});
 return NextResponse.json(demonstrateSupport(parsed.data.message),{
  headers:{"cache-control":"no-store","x-robots-tag":"noindex"}
 });
}
