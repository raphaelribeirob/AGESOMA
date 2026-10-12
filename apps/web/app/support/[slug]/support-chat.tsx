"use client";
import {FormEvent,useEffect,useState} from "react";
type Item={role:"customer"|"business";content:string;escalated?:boolean;ticketToken?:string};
export default function SupportChat({slug,name,greeting}:{slug:string;name:string;greeting:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState("");
 const [history,setHistory]=useState<Item[]>([{role:"business",content:greeting}]);
 const [ticketResults,setTicketResults]=useState<Record<string,string>>({});
 useEffect(()=>{
  let mounted=true;
  fetch("/api/support/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug})})
   .then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error??"Atendimento indisponível");if(mounted)setReady(true);})
   .catch(e=>{if(mounted)setError(e instanceof Error?e.message:"Erro de sessão");});
  return()=>{mounted=false;};
 },[slug]);
 async function send(event:FormEvent){
  event.preventDefault();if(busy||!ready||message.trim().length<3)return;
  const next=message.trim();setMessage("");setBusy(true);setError("");
  setHistory(previous=>[...previous,{role:"customer",content:next}]);
  try{
   const response=await fetch("/api/support/public",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slug,message:next})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??"Atendimento indisponível.");
   setHistory(previous=>[...previous,{role:"business",content:result.reply,escalated:result.needsHuman,ticketToken:result.ticketToken??undefined}]);
  }catch(c){setHistory(previous=>[...previous,{role:"business",content:c instanceof Error?c.message:"Atendimento indisponível.",escalated:true}]);}
  finally{setBusy(false);}
 }
 async function check(token:string){
  try{
   const r=await fetch("/api/support/ticket",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
   const body=await r.json();
   if(!r.ok)throw new Error(body.error);
   setTicketResults(old=>({...old,[token]:body.status==="resolved"?body.operatorReply:"Ainda aguardando resposta do atendente."}));
  }catch{setTicketResults(old=>({...old,[token]:"Não foi possível consultar o protocolo. Tente novamente."}));}
 }
 return <main style={{maxWidth:640,margin:"28px auto",padding:"0 18px",fontFamily:"Arial,sans-serif",color:"#111827"}}>
  <header style={{borderBottom:"1px solid #e2e8f0",paddingBottom:18}}>
   <h1 style={{fontSize:24,margin:"0 0 5px",letterSpacing:"-.03em"}}>{name}</h1>
   <p style={{fontSize:13,color:"#64748b",margin:0}}>Atendimento baseado em informações aprovadas desta empresa</p>
  </header>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  <section aria-live="polite" style={{display:"flex",flexDirection:"column",gap:16,minHeight:300,padding:"22px 0"}}>
   {history.map((item,i)=><article key={i} style={{alignSelf:item.role==="customer"?"flex-end":"flex-start",background:item.role==="customer"?"#111827":"#f1f5f9",color:item.role==="customer"?"#fff":"#111827",borderRadius:14,padding:"12px 16px",maxWidth:"85%",whiteSpace:"pre-wrap"}}>
    {item.content}
    {item.escalated&&item.ticketToken?<div style={{marginTop:12,borderTop:"1px solid #cbd5e1",paddingTop:10,color:"#111827",fontSize:12}}>
     <p>Seu pedido foi registrado para o responsável humano. Guarde o protocolo privado para consultar a resposta.</p>
     <code style={{display:"block",overflowWrap:"anywhere",fontSize:10}}>{item.ticketToken}</code>
     <button type="button" onClick={()=>void navigator.clipboard.writeText(item.ticketToken!)} style={{marginTop:9,border:"1px solid #cbd5e1",padding:8,borderRadius:7}}>Copiar protocolo</button>
     <button type="button" onClick={()=>void check(item.ticketToken!)} style={{marginLeft:7,border:"1px solid #cbd5e1",padding:8,borderRadius:7}}>Ver resposta</button>
     {ticketResults[item.ticketToken]?<p style={{whiteSpace:"pre-wrap"}}>{ticketResults[item.ticketToken]}</p>:null}
    </div>:null}
   </article>)}
  </section>
  <form onSubmit={e=>void send(e)} style={{display:"flex",gap:9}}>
   <input aria-label="Sua pergunta" required minLength={3} maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Como podemos ajudar?" style={{flex:1,padding:12,borderRadius:10,border:"1px solid #cbd5e1",font:"inherit"}}/>
   <button disabled={busy||!ready} style={{padding:"0 16px",borderRadius:10,background:"#111827",color:"#fff",border:0}}>{busy?"…":ready?"Enviar":"Conectando…"}</button>
  </form>
  <p style={{fontSize:11,color:"#64748b"}}>Não compartilhe senhas, cartões ou documentos sensíveis. Sem resposta segura, um operador poderá responder pelo protocolo.</p>
  <a href="/support/status" style={{fontSize:12,textDecoration:"underline"}}>Consultar resposta de um protocolo antigo</a>
 </main>;
}
