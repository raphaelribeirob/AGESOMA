"use client";
import {useState} from "react";
type DemoResult={reply:string;status:"answered"|"needs_human";simulation:true;persisted:false;externallyExecuted:false;knowledgeId:string|null};
const demos=["Qual é o prazo de entrega?","Qual é o horário de atendimento?","Posso alterar um pedido pago?"];
export default function SupportDemo(){
 const [message,setMessage]=useState(demos[0]);
 const [result,setResult]=useState<DemoResult|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(value=message){
  if(busy)return;
  setBusy(true);setError("");setResult(null);
  try{
   const response=await fetch("/api/demo/support",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:value})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error??"Prévia indisponível");
   setResult(data);
  }catch(e){setError(e instanceof Error?e.message:"Erro na demonstração");}
  finally{setBusy(false);}
 }
 return <section id="demonstracao" aria-label="Demonstração do produto" style={{border:"1px solid #dfe4e9",background:"#fff",borderRadius:18,padding:"clamp(18px,4vw,28px)",display:"grid",gap:16}}>
  <div><span style={{fontSize:12,fontWeight:700,letterSpacing:1.5,color:"#64748b"}}>DEMONSTRAÇÃO INTERATIVA</span>
   <h2 style={{fontSize:27,letterSpacing:"-.045em",margin:"7px 0"}}>Veja quando o AGESOMA responde — e quando não responde.</h2>
   <p style={{margin:0,color:"#475569",lineHeight:1.6}}>Use a base fictícia abaixo. O teste executa o mesmo mecanismo conservador de perguntas e respostas do primeiro produto, sem acessar dados de empresas.</p>
  </div>
  <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
   {demos.map(question=><button type="button" key={question} onClick={()=>{setMessage(question);void submit(question);}}
     disabled={busy} style={{border:"1px solid #cbd5e1",borderRadius:99,background:"#f8fafc",padding:"10px 13px",fontSize:13,cursor:"pointer"}}>{question}</button>)}
  </div>
  <form onSubmit={e=>{e.preventDefault();void submit();}} style={{display:"flex",gap:10,flexWrap:"wrap"}}>
   <input aria-label="Pergunta para demonstrar" minLength={3} maxLength={300} required value={message} onChange={e=>setMessage(e.target.value)}
    style={{flex:"1 1 300px",padding:13,borderRadius:9,border:"1px solid #cbd5e1",font:"inherit"}}/>
   <button type="submit" disabled={busy} style={{background:"#111827",color:"#fff",borderRadius:9,padding:"12px 20px",border:0,fontWeight:650}}>{busy?"Testando…":"Testar"}</button>
  </form>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {result?<div aria-live="polite" style={{padding:18,borderRadius:12,background:"#f1f5f9"}}>
    <strong>{result.status==="answered"?"Resposta encontrada na base":"Resposta desconhecida → encaminhamento humano"}</strong>
    <p style={{whiteSpace:"pre-wrap",lineHeight:1.6}}>{result.reply}</p>
    <small style={{color:"#64748b"}}>Dados fictícios · Sem registro de ticket, uso de integração externa ou contratação</small>
   </div>:null}
  <p style={{margin:0,fontSize:12,color:"#64748b"}}>A demonstração não comprova resolução de problemas reais nem execução autônoma. Para testar sua própria empresa, crie uma conta e use a prévia privada.</p>
 </section>;
}
