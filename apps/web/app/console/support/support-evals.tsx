"use client";
import {FormEvent,useEffect,useState} from "react";
type Case={id:string;question:string;expected_status:"answered"|"needs_human";expected_knowledge_id:string|null};
type Run={id:string;cases_count:number;passed_count:number;created_at:string};
export default function SupportEvals({knowledge}:{knowledge:{id:string;question:string;enabled:boolean}[]}){
 const [cases,setCases]=useState<Case[]>([]),[runs,setRuns]=useState<Run[]>([]);
 const [question,setQuestion]=useState(""),[expected,setExpected]=useState<"answered"|"needs_human">("needs_human"),[source,setSource]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function load(){
  const r=await fetch("/api/support/evals",{cache:"no-store"});
  if(!r.ok)throw Error("Avaliações indisponíveis.");
  const b=await r.json();setCases(b.cases??[]);setRuns(b.runs??[]);
 }
 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
 async function add(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/support/evals",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action:"add",question,expectedStatus:expected,knowledgeId:expected==="answered"?source:null})});
   const b=await r.json();if(!r.ok)throw Error(b.error??"Erro na avaliação");
   setQuestion("");await load();setNotice("Caso adicionado.");
  }catch(e){setError(e instanceof Error?e.message:"Erro.");}finally{setBusy(false);}
 }
 async function run(){
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/support/evals",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"run"})});
   const b=await r.json();if(!r.ok)throw Error(b.error??"Erro ao executar");
   await load();setNotice("Resultado: "+b.passed+"/"+b.total+" casos aprovados.");
  }catch(e){setError(e instanceof Error?e.message:"Erro.");}finally{setBusy(false);}
 }
 return <section aria-label="Avaliações de qualidade" style={{padding:24,border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",display:"grid",gap:13}}>
  <h2 style={{fontSize:20,margin:0}}>6. Avaliar a qualidade</h2>
  <p style={{fontSize:13,margin:0,color:"#64748b"}}>Defina perguntas com resultados esperados. Cada execução salva o resultado de regressão; isso não substitui feedback de clientes ou monitoramento em produção.</p>
  <form onSubmit={e=>void add(e)} style={{display:"grid",gap:9}}>
   <input aria-label="Pergunta de avaliação" value={question} onChange={e=>setQuestion(e.target.value)} required minLength={3} maxLength={1000} placeholder="Pergunta que o agente deve responder ou escalar"
    style={{width:"100%",padding:12,border:"1px solid #cbd5e1",borderRadius:9}}/>
   <select aria-label="Resultado esperado" value={expected} onChange={e=>setExpected(e.target.value as typeof expected)} style={{padding:12,border:"1px solid #cbd5e1",borderRadius:9}}>
    <option value="needs_human">Escalar ao humano</option><option value="answered">Responder da base aprovada</option>
   </select>
   {expected==="answered"?<select aria-label="Resposta esperada" value={source} onChange={e=>setSource(e.target.value)} required style={{padding:12,border:"1px solid #cbd5e1",borderRadius:9}}>
    <option value="">Selecione a resposta esperada</option>
    {knowledge.filter(k=>k.enabled).map(k=><option key={k.id} value={k.id}>{k.question}</option>)}
   </select>:null}
   <button type="submit" disabled={busy||cases.length>=100} style={{justifySelf:"start",padding:"12px 17px",background:"#111827",color:"#fff",border:0,borderRadius:8}}>Adicionar caso</button>
  </form>
  <p style={{fontSize:13,margin:0}}>Casos com gabarito: {cases.length}. {runs.length?("Última execução: "+runs[0].passed_count+"/"+runs[0].cases_count+" aprovados."):"Nenhuma execução registrada."}</p>
  <button type="button" onClick={()=>void run()} disabled={busy||cases.length===0} style={{justifySelf:"start",padding:"12px 17px",borderRadius:8,border:"1px solid #cbd5e1",background:"#fff"}}>Executar avaliações</button>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {notice?<p role="status" style={{color:"#166534"}}>{notice}</p>:null}
 </section>;
}
