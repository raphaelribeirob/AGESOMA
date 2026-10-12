"use client";
import {useEffect,useState} from "react";
type Ticket={id:string;question:string;status:"open"|"resolved";operator_reply:string|null;created_at:string};
export default function SupportInbox(){
 const [items,setItems]=useState<Ticket[]>([]);
 const [loading,setLoading]=useState(true);
 const [drafts,setDrafts]=useState<Record<string,string>>({});
 const [error,setError]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
 async function load(){
  const response=await fetch("/api/support/inbox",{cache:"no-store"});
  if(!response.ok)throw new Error("Não foi possível consultar a fila de atendimento.");
  const data=await response.json();
  setItems(data.tickets??[]);
 }
 useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 async function resolve(id:string){
  setBusy(id);setError("");
  try{
   const response=await fetch("/api/support/inbox",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ticketId:id,reply:drafts[id]??""})});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error??"Falha ao responder.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Erro ao responder.");}
  finally{setBusy(null);}
 }
 const open=items.filter(t=>t.status==="open");
 return <section aria-label="Fila humana" style={{padding:24,border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",display:"grid",gap:12}}>
  <h2 style={{fontSize:20,margin:0}}>5. Fila de atendimento humano</h2>
  <p style={{fontSize:13,color:"#64748b",margin:0}}>Solicitações sem resposta segura ficam abertas até serem respondidas por um operador. O cliente consulta a resposta usando seu protocolo privado.</p>
  {loading?<p>Carregando solicitações…</p>:null}
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {!loading&&!open.length?<p style={{fontSize:13}}>Nenhuma solicitação aguardando resposta.</p>:null}
  {open.map(t=><article key={t.id} style={{borderTop:"1px solid #e2e8f0",paddingTop:14,display:"grid",gap:8}}>
   <strong>Cliente: {t.question}</strong>
   <span style={{fontSize:12,color:"#64748b"}}>Recebida em {new Date(t.created_at).toLocaleString("pt-BR")}</span>
   <textarea aria-label={"Resposta para o caso "+t.id} rows={3} minLength={2} maxLength={2000} value={drafts[t.id]??""} onChange={e=>setDrafts(old=>({...old,[t.id]:e.target.value}))}
    placeholder="Escreva sua resposta ao cliente" style={{width:"100%",padding:12,border:"1px solid #cbd5e1",borderRadius:8}}/>
   <button type="button" disabled={busy!==null||(drafts[t.id]??"").trim().length<2} onClick={()=>void resolve(t.id)}
    style={{justifySelf:"start",padding:"12px 18px",background:"#111827",color:"#fff",border:0,borderRadius:8}}>
    {busy===t.id?"Registrando…":"Responder e encerrar"}
   </button>
  </article>)}
  {items.some(t=>t.status==="resolved")?<details><summary>Casos resolvidos</summary>
   {items.filter(t=>t.status==="resolved").map(t=><div key={t.id} style={{padding:10,borderTop:"1px solid #e2e8f0"}}>
    <strong>{t.question}</strong><p>{t.operator_reply}</p>
   </div>)}
  </details>:null}
  <button type="button" onClick={()=>void load().catch(e=>setError(e.message))} style={{justifySelf:"start",padding:10,border:"1px solid #cbd5e1",borderRadius:8,background:"#fff"}}>Atualizar fila</button>
 </section>;
}
