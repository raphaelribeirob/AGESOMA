"use client";
import {useState} from "react";
export default function SupportPortability({onUpdate}:{onUpdate:()=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function download(){
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/support/portability",{cache:"no-store"});
   if(!response.ok)throw new Error((await response.json()).error??"Exportação indisponível.");
   const body=await response.blob();
   const url=URL.createObjectURL(body);
   const link=document.createElement("a");link.href=url;link.download="agesoma-support-knowledge.json";link.click();
   URL.revokeObjectURL(url);
   setMessage("Conhecimento exportado. Tickets, conversas, dados de cobrança e segredos não são incluídos.");
  }catch(e){setError(e instanceof Error?e.message:"Erro ao exportar.");}
  finally{setBusy(false);}
 }
 async function upload(file:File|undefined){
  if(!file)return;
  setBusy(true);setError("");setMessage("");
  try{
   if(file.size>130000)throw new Error("O arquivo ultrapassa o limite de 130 KB.");
   const raw=await file.text();
   const payload=JSON.parse(raw) as unknown;
   if(!payload||typeof payload!=="object")throw new Error("Arquivo não reconhecido.");
   const response=await fetch("/api/support/portability",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.error??"Importação rejeitada.");
   setMessage(result.imported+" perguntas importadas. Execute novamente a avaliação antes de publicar o agente.");
   onUpdate();
  }catch(e){setError(e instanceof Error?e.message:"Arquivo inválido.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Portabilidade do conhecimento" style={{padding:24,border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",display:"grid",gap:12}}>
  <h2 style={{fontSize:20,margin:0}}>7. Importar e exportar conhecimento</h2>
  <p style={{margin:0,fontSize:13,color:"#64748b"}}>Leve suas respostas aprovadas para outro ambiente e importe até 100 pares pergunta/resposta por arquivo. A importação fica pendente de nova avaliação.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
   <button type="button" disabled={busy} onClick={()=>void download()} style={{padding:12,border:"1px solid #cbd5e1",borderRadius:8,background:"#fff"}}>Exportar JSON</button>
   <label style={{padding:12,border:"1px solid #cbd5e1",borderRadius:8,cursor:"pointer"}}>
    Importar arquivo JSON
    <input disabled={busy} type="file" accept=".json,application/json" style={{display:"block",maxWidth:220,marginTop:7}} onChange={e=>void upload(e.target.files?.[0])}/>
   </label>
  </div>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {message?<p role="status" style={{color:"#166534"}}>{message}</p>:null}
 </section>;
}
