"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
export default function SupportStatus(){
 const [token,setToken]=useState(""),[response,setResponse]=useState(""),[busy,setBusy]=useState(false);
 async function check(e:FormEvent){
  e.preventDefault();setBusy(true);setResponse("");
  try{
   const res=await fetch("/api/support/ticket",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:token.trim()})});
   const body=await res.json();
   if(!res.ok)throw new Error("Protocolo inválido ou indisponível.");
   setResponse(body.status==="resolved"?body.operatorReply:"Sua solicitação permanece aberta.");
  }catch(x){setResponse(x instanceof Error?x.message:"Erro na consulta.");}finally{setBusy(false);}
 }
 return <main style={{maxWidth:580,margin:"0 auto",padding:"60px 20px",fontFamily:"Arial,sans-serif",color:"#111827"}}>
  <h1 style={{fontSize:30}}>Consultar atendimento</h1>
  <p>Digite o protocolo privado fornecido pelo agente. Este identificador dá acesso à resposta, por isso não deve ser compartilhado.</p>
  <form onSubmit={e=>void check(e)} style={{display:"grid",gap:12}}>
   <input aria-label="Protocolo privado" required pattern="[a-f0-9]{64}" minLength={64} maxLength={64} value={token} onChange={e=>setToken(e.target.value)} placeholder="Cole o protocolo recebido"
    style={{padding:14,borderRadius:9,border:"1px solid #cbd5e1",width:"100%",font:"inherit"}}/>
   <button type="submit" disabled={busy} style={{background:"#111827",color:"#fff",border:0,borderRadius:9,padding:13}}>{busy?"Consultando…":"Consultar resposta"}</button>
  </form>
  {response?<p role="status" style={{padding:14,background:"#f1f5f9",borderRadius:9,whiteSpace:"pre-wrap"}}>{response}</p>:null}
  <Link href="/start" style={{display:"inline-block",marginTop:20,textDecoration:"underline"}}>Voltar ao AGESOMA</Link>
 </main>;
}
