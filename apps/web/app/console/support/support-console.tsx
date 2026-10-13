"use client";
import Link from "next/link";
import SupportInbox from "./support-inbox";
import SupportEvals from "./support-evals";
import SupportPortability from "./support-portability";
import {FormEvent,useEffect,useState} from "react";
type Knowledge={id:string;question:string;answer:string;enabled:boolean};
type OwnerData={
 workspace:{slug:string;display_name:string;owner_enabled:boolean}|null;
 knowledge:Knowledge[];subscriptionStatus:string;paid:boolean;live:boolean;canEdit:boolean;
 release:{ready:boolean;reason:string};
 events:{total:number;answered:number;needsHuman:number;window:string};
};
type Answer={status:string;reply:string;reason:string;knowledgeId:string|null};
const field:React.CSSProperties={width:"100%",padding:12,border:"1px solid #cbd5e1",borderRadius:8,font:"inherit",color:"#111827",background:"#fff"};
const card:React.CSSProperties={padding:24,border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",display:"grid",gap:14};
export default function SupportConsole(){
 const [data,setData]=useState<OwnerData|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [name,setName]=useState(""),[question,setQuestion]=useState(""),[answer,setAnswer]=useState("");
 const [preview,setPreview]=useState(""),[result,setResult]=useState<Answer|null>(null);
 const [notice,setNotice]=useState("");
 async function load(){
  const res=await fetch("/api/support/owner",{cache:"no-store"});
  if(!res.ok)throw new Error("Não foi possível carregar o atendimento. Verifique banco e migrações.");
  setData(await res.json());
 }
 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
 async function action(body:unknown){
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/support/owner",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error??"Falha ao salvar.");
   await load();
   setNotice("Alteração salva.");
  }catch(c){setError(c instanceof Error?c.message:"Erro.");}finally{setBusy(false);}
 }
 async function addFaq(event:FormEvent){event.preventDefault();await action({action:"add_knowledge",question,answer});setQuestion("");setAnswer("");}
 async function remove(id:string){
  setBusy(true);setError("");
  try{const r=await fetch("/api/support/owner?id="+encodeURIComponent(id),{method:"DELETE"});if(!r.ok)throw new Error("Falha ao excluir.");await load();}
  catch(c){setError(c instanceof Error?c.message:"Erro.");}finally{setBusy(false);}
 }
 async function test(event:FormEvent){event.preventDefault();setBusy(true);setError("");
  try{const r=await fetch("/api/support/preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:preview})});const b=await r.json();if(!r.ok)throw new Error(b.error);setResult(b);}
  catch(c){setError(c instanceof Error?c.message:"Erro.");}finally{setBusy(false);}
 }
 async function manageSubscription(){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/billing/manage",{cache:"no-store"});
   const b=await r.json();
   if(!r.ok)throw new Error(b.error??"Portal indisponível.");
   if(!b.portalUrl)throw new Error("Link temporário ausente.");
   window.location.assign(b.portalUrl);
  }catch(e){setError(e instanceof Error?e.message:"Erro no gerenciamento.");setBusy(false);}
 }
 async function buy(){
  setBusy(true);setError("");
  try{const r=await fetch("/api/billing/checkout",{method:"POST",headers:{"content-type":"application/json"}});const b=await r.json();if(!r.ok)throw new Error(b.error??"Checkout indisponível");if(!b.checkoutUrl)throw new Error("URL de checkout ausente");window.location.assign(b.checkoutUrl);}
  catch(c){setError(c instanceof Error?c.message:"Erro.");setBusy(false);}
 }
 return <main style={{maxWidth:980,margin:"0 auto",padding:"30px 20px 90px",fontFamily:"Arial,sans-serif",color:"#111827",display:"grid",gap:20}}>
  <header style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,alignItems:"center"}}>
   <Link href="/start" style={{fontWeight:750,fontSize:22,letterSpacing:"-.05em"}}>AGESOMA</Link>
   <Link href="/" style={{textDecoration:"underline",fontSize:13}}>Voltar à conta</Link>
  </header>
  <section><h1 style={{fontSize:36,letterSpacing:"-.05em",margin:"0 0 10px"}}>Agente de Atendimento</h1>
   <p>Configure o primeiro serviço da sua empresa. A prévia é privada; a publicação exige assinatura ativa.</p></section>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {notice?<p role="status" style={{color:"#166534"}}>{notice}</p>:null}
  {!data?<p>Carregando espaço empresarial…</p>:null}
  {data&&!data.workspace?<section style={card}>
   <h2 style={{fontSize:20,margin:0}}>1. Crie seu espaço</h2>
   <input value={name} onChange={e=>setName(e.target.value)} maxLength={100} style={field} placeholder="Nome público da sua empresa"/>
   <button disabled={busy||!data.canEdit||name.trim().length<2} onClick={()=>void action({action:"create",name})} style={{background:"#111827",color:"#fff",padding:14,borderRadius:9,border:0}}>Criar atendimento</button>
  </section>:null}
  {data?.workspace?<section style={card}>
   <h2 style={{fontSize:20,margin:0}}>1. Seu atendimento</h2>
   <p style={{margin:0}}>Empresa: <strong>{data.workspace.display_name}</strong></p>
   <p style={{margin:0}}>Assinatura: <strong>{data.subscriptionStatus}</strong>. Canal público: <strong>{data.live?"ativo":"bloqueado"}</strong> · Qualidade: <strong>{data.release?.ready?"validada":"aguardando testes"}</strong>.</p>
   {data.live?<a style={{textDecoration:"underline",overflowWrap:"anywhere"}} href={"/support/"+data.workspace.slug} target="_blank" rel="noopener noreferrer">Abrir link de atendimento →</a>
    :<p style={{margin:0,color:"#64748b",fontSize:13}}>O link exige assinatura confirmada, respostas aprovadas, autorização do proprietário e avaliação de qualidade atualizada (pelo menos um caso de resposta correta e um de encaminhamento humano).</p>}
   <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    {!data.paid?<button type="button" disabled={busy||!data.canEdit} onClick={()=>void buy()} style={{background:"#111827",color:"#fff",padding:13,borderRadius:8,border:0}}>Contratar assinatura segura</button>:null}
    {data.paid?<button type="button" disabled={busy||!data.canEdit} onClick={()=>void manageSubscription()} style={{background:"#fff",border:"1px solid #cbd5e1",padding:13,borderRadius:8}}>Gerenciar ou cancelar assinatura</button>:null}
    <button type="button" disabled={busy||!data.canEdit} onClick={()=>void action({action:"publish",enabled:!data.workspace!.owner_enabled})} style={{padding:13,borderRadius:8,border:"1px solid #cbd5e1"}}>{data.workspace.owner_enabled?"Desativar publicação":"Autorizar publicação"}</button>
   </div>
  </section>:null}
  {data?.workspace?<section style={card}>
   <h2 style={{fontSize:20,margin:0}}>2. Ensine o agente</h2>
   <form onSubmit={e=>void addFaq(e)} style={{display:"grid",gap:10}}>
    <input style={field} placeholder="Pergunta comum do cliente" minLength={5} maxLength={300} required value={question} onChange={e=>setQuestion(e.target.value)}/>
    <textarea style={field} placeholder="Resposta aprovada pela empresa" minLength={5} maxLength={2000} required rows={3} value={answer} onChange={e=>setAnswer(e.target.value)}/>
    <button disabled={busy||!data.canEdit} style={{padding:13,borderRadius:8,border:0,background:"#111827",color:"#fff"}}>Adicionar resposta</button>
   </form>
   {data.knowledge.map(k=><article key={k.id} style={{borderTop:"1px solid #e2e8f0",paddingTop:12}}>
    <strong>{k.question}</strong><p style={{whiteSpace:"pre-wrap"}}>{k.answer}</p>
    {data.canEdit?<button disabled={busy} type="button" onClick={()=>void remove(k.id)} style={{textDecoration:"underline",color:"#b91c1c"}}>Excluir</button>:null}
   </article>)}
  </section>:null}
  {data?.workspace?<section style={card}>
   <h2 style={{fontSize:20,margin:0}}>3. Teste antes de contratar</h2>
   <form onSubmit={e=>void test(e)} style={{display:"flex",gap:10,flexWrap:"wrap"}}>
    <input style={{...field,flex:"1 1 300px"}} placeholder="Faça uma pergunta como cliente" minLength={3} maxLength={1000} value={preview} onChange={e=>setPreview(e.target.value)}/>
    <button disabled={busy||!data.canEdit} style={{padding:13,border:0,borderRadius:8,background:"#111827",color:"#fff"}}>Testar resposta</button>
   </form>
   {result?<div aria-live="polite" style={{padding:14,borderRadius:10,background:"#f1f5f9"}}>
    <strong>{result.status==="answered"?"Respondido pela base":"Precisa de atendimento humano"}</strong>
    <p style={{whiteSpace:"pre-wrap"}}>{result.reply}</p>
   </div>:null}
  </section>:null}
  {data?.workspace?<section style={card}>
   <h2 style={{fontSize:20,margin:0}}>4. Acompanhe resultados</h2>
   <p style={{margin:0}}>Últimas 50 interações: {data.events.total} · Respostas encontradas: {data.events.answered} · Encaminhadas para revisão humana: {data.events.needsHuman}</p>
   <p style={{fontSize:12,margin:0}}>Indicadores de uso, não prova de satisfação ou resolução efetiva. Os casos ainda não têm interface de resposta humana.</p>
  </section>:null}
  {data?.workspace&&data.canEdit?<SupportInbox/>:null}
  {data?.workspace&&data.canEdit?<SupportEvals knowledge={data.knowledge} onUpdate={()=>void load().catch(e=>setError(e.message))}/>:null}
  {data?.workspace&&data.canEdit?<SupportPortability onUpdate={()=>void load().catch(e=>setError(e.message))}/>:null}
 </main>;
}
