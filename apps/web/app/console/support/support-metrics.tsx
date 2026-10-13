"use client";
import {useEffect,useState} from "react";

type Metrics={
 periodDays:number;
 flows:{total_count:number;automatic_count:number;escalated_count:number;avg_decision_ms:number|null;p95_decision_ms:number|null};
 tickets:{opened_count:number;operator_resolved_count:number;open_count:number;awaiting_over_24h:number;p95_operator_hours:number|null};
 customerFeedback:{responses:number;confirmed:number;not_resolved:number};
 limitations:string[];
};
const surface:React.CSSProperties={padding:16,border:"1px solid #e2e8f0",borderRadius:10,background:"#f8fafc"};
export default function SupportMetrics(){
 const [metrics,setMetrics]=useState<Metrics|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function refresh(){
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/support/metrics",{cache:"no-store"});
   if(!res.ok)throw new Error("Métricas indisponíveis; confira a migração 0028 e suas permissões.");
   setMetrics(await res.json());
  }catch(e){setError(e instanceof Error?e.message:"Métricas indisponíveis.");}finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <section aria-label="Resultados operacionais" style={{padding:24,border:"1px solid #e2e8f0",borderRadius:14,background:"#fff",display:"grid",gap:13}}>
  <h2 style={{fontSize:20,margin:0}}>4. Resultados e qualidade</h2>
  <p style={{margin:0,color:"#64748b",fontSize:13}}>Janela móvel de 30 dias. Respostas automáticas, tickets fechados e problemas confirmados pelo cliente são indicadores distintos.</p>
  {error?<p role="alert" style={{color:"#b91c1c"}}>{error}</p>:null}
  {metrics?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.flows.automatic_count}</strong><div>Respostas encontradas</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.flows.escalated_count}</strong><div>Encaminhadas ao humano</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.tickets.open_count}</strong><div>Tickets abertos</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.tickets.awaiting_over_24h}</strong><div>Aguardando há mais de 24 horas</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.tickets.operator_resolved_count}</strong><div>Respondidos pelo operador</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.customerFeedback.confirmed}</strong><div>Confirmados como resolvidos por clientes</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.customerFeedback.not_resolved}</strong><div>Clientes que disseram não resolvido</div></div>
   <div style={surface}><strong style={{fontSize:25}}>{metrics.tickets.p95_operator_hours===null?"—":metrics.tickets.p95_operator_hours+" h"}</strong><div>P95 de tempo até resposta humana</div></div>
  </div>:<p>{busy?"Calculando métricas…":"Nenhuma informação disponível."}</p>}
  <p style={{fontSize:12,color:"#64748b",margin:0}}>Feedback é voluntário; resoluções não confirmadas não são contabilizadas como resultado verificado. Custos de infraestrutura e SLA contratado ainda não são mensurados.</p>
  <button type="button" onClick={()=>void refresh()} disabled={busy} style={{justifySelf:"start",padding:10,borderRadius:8,border:"1px solid #cbd5e1",background:"#fff"}}>Atualizar resultados</button>
 </section>;
}
