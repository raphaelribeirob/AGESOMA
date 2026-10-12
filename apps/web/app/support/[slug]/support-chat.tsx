"use client";
import { FormEvent,useState } from "react";
type Item={role:"customer"|"business";content:string;escalated?:boolean};
export default function SupportChat({slug,name,greeting}:{slug:string;name:string;greeting:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[history,setHistory]=useState<Item[]>([{role:"business",content:greeting}]);
 async function send(event:FormEvent){
  event.preventDefault();if(busy||message.trim().length<3)return;
  const next=message.trim();setMessage("");setBusy(true);
  setHistory(previous=>[...previous,{role:"customer",content:next}]);
  try{
   const response=await fetch("/api/support/public",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug,message:next})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??"Atendimento indisponível.");
   setHistory(previous=>[...previous,{role:"business",content:result.reply,escalated:result.needsHuman}]);
  }catch(c){setHistory(previous=>[...previous,{role:"business",content:c instanceof Error?c.message:"Atendimento indisponível.",escalated:true}]);}
  finally{setBusy(false);}
 }
 return <main style={{maxWidth:640,margin:"28px auto",padding:"0 18px",fontFamily:"Arial,sans-serif",color:"#111827"}}>
  <header style={{borderBottom:"1px solid #e2e8f0",paddingBottom:18}}>
   <h1 style={{fontSize:24,margin:"0 0 5px",letterSpacing:"-.03em"}}>{name}</h1>
   <p style={{fontSize:13,color:"#64748b",margin:0}}>Atendimento baseado nas respostas aprovadas desta empresa</p>
  </header>
  <section aria-live="polite" style={{display:"flex",flexDirection:"column",gap:16,minHeight:300,padding:"22px 0"}}>
   {history.map((item,i)=><article key={i} style={{alignSelf:item.role==="customer"?"flex-end":"flex-start",background:item.role==="customer"?"#111827":"#f1f5f9",color:item.role==="customer"?"#fff":"#111827",borderRadius:14,padding:"12px 16px",maxWidth:"85%",whiteSpace:"pre-wrap"}}>
    {item.content}
    {item.escalated?<p style={{fontSize:11,color:"#64748b",margin:"7px 0 0"}}>Não houve resposta automática segura. Um operador pode consultar esta solicitação no histórico.</p>:null}
   </article>)}
  </section>
  <form onSubmit={e=>void send(e)} style={{display:"flex",gap:9}}>
   <input aria-label="Sua pergunta" required minLength={3} maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Como podemos ajudar?" style={{flex:1,padding:12,borderRadius:10,border:"1px solid #cbd5e1",font:"inherit"}}/>
   <button disabled={busy} style={{padding:"0 16px",borderRadius:10,background:"#111827",color:"#fff",border:0}}>{busy?"…":"Enviar"}</button>
  </form>
  <p style={{fontSize:11,color:"#64748b"}}>Evite compartilhar dados pessoais, senhas ou informações bancárias. Respostas automatizadas podem não cobrir todas as situações.</p>
 </main>;
}
