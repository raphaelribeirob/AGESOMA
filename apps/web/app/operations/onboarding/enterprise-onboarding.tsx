"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Stage = { id: string; operator: string; purpose: string; produces: string; autonomy: string };
type Gate = { key: string; status: string };
type Plan = {
  companyName: string; service: string; templateVersion: string; businessOutcome: string;
  state: "draft_only"; permittedActions: "none";
  sourceCoverage: { provided: string[]; missing: string[]; trust: string };
  stages: Stage[]; gates: Gate[];
  metrics: { verifiedRecoveredCents: null; realizedGrossMargin: null };
  warning: string;
};
type Existing = { id: string; plan: Plan; status: string; createdAt: string };

const LABELS: Record<string,string> = {
  contract:"Contrato", rateTable:"Tabela tarifária", cte:"CT-e",
  invoice:"Faturas", signed_scope:"Escopo assinado",
  data_processing_rights:"Direitos de tratamento",
  trusted_document_ingestion:"Fontes verificadas",
  tenant_isolation_e2e:"Isolamento entre clientes",
  independent_prooftree:"ProofTree independente",
  scoped_sentinel_approval:"Aprovações Sentinel",
  settlement_reconciliation:"Liquidação verificada",
  paid_pilot_economics:"Piloto pago e margem"
};
const formBox: React.CSSProperties = { display:"grid",gap:12,padding:22,border:"1px solid #d9dde3",borderRadius:16,background:"#fff" };
const field: React.CSSProperties = { width:"100%",padding:11,border:"1px solid #cbd5e1",borderRadius:8,font:"inherit",background:"#fff",color:"#111827" };

export default function EnterpriseOnboarding({canCreate}:{canCreate:boolean}) {
  const [companyName,setCompanyName] = useState("");
  const [outcome,setOutcome] = useState("Identificar e recuperar cobranças indevidas de frete");
  const [ownerRole,setOwnerRole] = useState<"cfo"|"controller"|"logistics">("controller");
  const [spend,setSpend] = useState("");
  const [sources,setSources] = useState({contract:"",rateTable:"",cte:"",invoice:""});
  const [existing,setExisting] = useState<Existing[]>([]);
  const [plan,setPlan] = useState<Plan|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [saved,setSaved] = useState(false);

  useEffect(() => {
    let active=true;
    fetch("/api/enterprise-deployments",{cache:"no-store"})
      .then(async response => { if (!response.ok) throw new Error("Não foi possível consultar os planos."); return response.json(); })
      .then(body => { if (active) setExisting(body.deployments ?? []); })
      .catch(() => { if (active) setError("Histórico indisponível. Verifique as migrações de staging."); });
    return () => { active=false; };
  }, []);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy || !canCreate) return;
    setBusy(true); setError(""); setSaved(false);
    const amount = spend.trim() === "" ? null : Number(spend.replace(",","."));
    if(amount !== null && (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount*100)))) {
      setError("O custo mensal precisa ser um valor válido em reais."); setBusy(false); return;
    }
    try {
      const response = await fetch("/api/enterprise-deployments",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({
          idempotencyKey:crypto.randomUUID(),
          companyName,outcome,ownerRole,
          monthlyFreightSpendCents:amount===null?null:Math.round(amount*100),
          sources:Object.fromEntries(Object.entries(sources).filter(([,value])=>value.trim().length>0))
        })
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.error || "Falha ao registrar o plano.");
      setPlan(body.plan as Plan);
      setSaved(true);
      const list=await fetch("/api/enterprise-deployments",{cache:"no-store"});
      if(list.ok) setExisting((await list.json()).deployments ?? []);
    } catch (cause) {
      setError(cause instanceof Error?cause.message:"Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{fontFamily:"var(--font-geist-sans, Arial),sans-serif",minHeight:"100vh",background:"#f8fafc",color:"#111827",padding:"clamp(18px,4vw,54px)"}}>
      <div style={{maxWidth:960,margin:"0 auto",display:"grid",gap:22}}>
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <Link href="/" style={{color:"#111827",textDecoration:"none",fontWeight:750,letterSpacing:"-.03em"}}>AGESOMA</Link>
          <span style={{fontSize:13,color:"#64748b"}}>Operations / implantação empresarial</span>
        </header>
        <section>
          <h1 style={{fontSize:"clamp(29px,4vw,44px)",letterSpacing:"-.055em",margin:"0 0 10px"}}>Entender. Implantar. Verificar.</h1>
          <p style={{color:"#475569",maxWidth:700,lineHeight:1.6,margin:0}}>Primeiro serviço: auditoria e recuperação de fretes. O AGESOMA prepara uma equipe operacional reutilizável e apresenta o que ainda precisa ser validado antes de qualquer execução.</p>
        </section>
        <form onSubmit={submit} style={formBox}>
          <h2 style={{fontSize:19,margin:0}}>Diagnóstico inicial</h2>
          <label>Empresa
            <input style={field} required minLength={2} maxLength={160} value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Razão social ou nome da empresa"/>
          </label>
          <label>Resultado que a empresa precisa
            <input style={field} required minLength={2} maxLength={500} value={outcome} onChange={e=>setOutcome(e.target.value)}/>
          </label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
            <label>Responsável pela decisão
              <select style={field} value={ownerRole} onChange={e=>setOwnerRole(e.target.value as typeof ownerRole)}>
                <option value="cfo">Diretor financeiro</option><option value="controller">Controller</option><option value="logistics">Gestor de logística</option>
              </select>
            </label>
            <label>Gasto mensal estimado com frete (R$)
              <input style={field} inputMode="decimal" value={spend} onChange={e=>setSpend(e.target.value)} placeholder="Ex.: 450000"/>
            </label>
          </div>
          <h3 style={{margin:"4px 0 0",fontSize:16}}>Referências disponíveis (opcionais)</h3>
          <p style={{margin:0,color:"#64748b",fontSize:13}}>Informe apenas identificadores ou referências. Não envie documentos financeiros ou segredos neste formulário. Referências não são provas verificadas.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
            {(Object.keys(sources) as Array<keyof typeof sources>).map(key=>(
              <label key={key}>{LABELS[key]}
                <input style={field} maxLength={320} value={sources[key]} onChange={e=>setSources(old=>({...old,[key]:e.target.value}))} placeholder={"Referência de "+LABELS[key]}/>
              </label>
            ))}
          </div>
          {error?<p role="alert" style={{color:"#b91c1c",margin:0}}>{error}</p>:null}
          {!canCreate?<p style={{color:"#92400e"}}>Somente owner/admin pode registrar um diagnóstico. Você pode consultar os planos existentes.</p>:null}
          <button type="submit" disabled={busy||!canCreate} style={{border:0,borderRadius:10,padding:"13px 17px",background:"#111827",color:"#fff",fontWeight:650,cursor:"pointer",opacity:(busy || !canCreate) ? 0.6 : 1}}>
            {busy?"Preparando plano...":"Gerar blueprint e critérios de aceite"}
          </button>
          {saved?<p role="status" style={{color:"#166534",margin:0}}>Plano salvo como rascunho. Nenhum agente foi ativado.</p>:null}
        </form>
        {plan?<section style={formBox} aria-live="polite">
          <h2 style={{margin:0}}>Implantação proposta · {plan.companyName}</h2>
          <p style={{color:"#475569",margin:0}}>{plan.businessOutcome}</p>
          <p style={{margin:0,fontWeight:650}}>Status: rascunho · Nenhuma execução autorizada</p>
          <p style={{margin:0}}>Fontes informadas: {plan.sourceCoverage.provided.map(k=>LABELS[k]).join(", ") || "nenhuma"}. Pendentes: {plan.sourceCoverage.missing.map(k=>LABELS[k]).join(", ") || "nenhuma referência pendente"}.</p>
          <h3 style={{margin:"8px 0 0"}}>Equipe interna proposta</h3>
          <ol style={{display:"grid",gap:11,paddingLeft:24}}>
            {plan.stages.map(stage=><li key={stage.id}><strong>{stage.operator}</strong> — {stage.purpose}<div style={{fontSize:13,color:"#64748b"}}>Entrega: {stage.produces} · {stage.autonomy}</div></li>)}
          </ol>
          <h3 style={{margin:"8px 0 0"}}>Gates para operação real</h3>
          <ul style={{display:"grid",gap:6,paddingLeft:24}}>
            {plan.gates.map(gate=><li key={gate.key}>{LABELS[gate.key]||gate.key} — <strong>não verificado</strong></li>)}
          </ul>
          <p style={{color:"#92400e",fontSize:13,margin:0}}>{plan.warning}</p>
        </section>:null}
        <section style={formBox}>
          <h2 style={{margin:0,fontSize:18}}>Implantações registradas</h2>
          {existing.length===0?<p style={{margin:0,color:"#64748b"}}>Ainda não há planos neste espaço.</p>:null}
          {existing.map(item=><div key={item.id} style={{padding:"11px 0",borderBottom:"1px solid #e2e8f0",display:"flex",gap:10,justifyContent:"space-between"}}>
            <span><strong>{item.plan.companyName}</strong><span style={{color:"#64748b"}}> · {item.plan.templateVersion}</span></span>
            <button type="button" onClick={()=>{setPlan(item.plan);setSaved(false);}} style={{border:0,background:"transparent",textDecoration:"underline",cursor:"pointer"}}>Ver plano · {item.status}</button>
          </div>)}
        </section>
      </div>
    </main>
  );
}
