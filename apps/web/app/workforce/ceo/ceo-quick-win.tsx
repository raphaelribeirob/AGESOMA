"use client";

import { useState, type ChangeEvent } from "react";
import {
  SMB_SKILLS, analyzeCashCsv, analyzeLeadCsv, buildLocalBusinessPulse, parseLocalCsv,
  skillForArea,
  type CashSnapshot, type LeadSnapshot, type SmbArea
} from "@agesoma/core/src/smb-skills";
import styles from "./ceo-quick-win.module.css";

const choices: readonly { id:SmbArea;label:string;description:string }[] = [
  {id:"finance",label:"Caixa e despesas",description:"Extrato CSV de entradas e saídas"},
  {id:"sales",label:"Vendas e clientes",description:"Planilha CSV de leads e contatos"},
  {id:"operations",label:"Organizar a empresa",description:"Início do briefing executivo"},
  {id:"technology",label:"Conectar meus sistemas",description:"Descobrir opções de integração"}
];
const examples:Record<"finance"|"sales",string>={
  finance:"data;tipo;valor;descricao\n2026-09-01;entrada;1250,00;Venda\n2026-09-02;saida;380,00;Fornecedor",
  sales:"nome;empresa;status;ultimo_contato\nPessoa A;Empresa A;interessado;2026-09-30\nPessoa B;Empresa B;proposta;2026-09-20"
};
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v/100);
type Insight=CashSnapshot|LeadSnapshot;

export default function CeoQuickWin(){
  const [area,setArea]=useState<SmbArea>("finance");
  const [raw,setRaw]=useState("");
  const [fileLabel,setFileLabel]=useState("");
  const [result,setResult]=useState<Insight|null>(null);
  const [problem,setProblem]=useState("");
  const [busy,setBusy]=useState(false);
  const [today] = useState(()=>new Date().toISOString().slice(0,10));
  const chosen=choices.find(c=>c.id===area)!;
  const skill=SMB_SKILLS.find(s=>s.id===skillForArea(area))!;

  async function loadCsv(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    setResult(null);setProblem("");setRaw("");setFileLabel("");
    if(!file)return;
    if(file.size>200_000){setProblem("O CSV deve ter no máximo 200 KB.");return;}
    setBusy(true);
    try{
      const text=await file.text();
      setRaw(text);
      setFileLabel(file.name);
    }catch{setProblem("Não foi possível ler o arquivo no navegador.");}
    finally{setBusy(false);event.target.value="";}
  }
  function examine(){
    setProblem("");setResult(null);
    try{
      const data=parseLocalCsv(raw);
      const insight=area==="finance"?analyzeCashCsv(data):area==="sales"?analyzeLeadCsv(data,today):null;
      if(insight)setResult(insight);
    }catch(e){setProblem(e instanceof Error?e.message:"Arquivo inválido.");}
  }
  function pick(next:SmbArea){
    setArea(next);setRaw("");setFileLabel("");setResult(null);setProblem("");
  }
  return (
    <section className={styles.root} aria-labelledby="first-value-title">
      <header className={styles.heading}>
        <span className={styles.kicker}>ANTES DO QUESTIONÁRIO · VALOR INICIAL</span>
        <h2 id="first-value-title">O que mais preocupa você na empresa?</h2>
        <p>Escolha uma prioridade. Para caixa ou leads, o CEO pode mostrar um primeiro resultado com um CSV — sem conectar sistemas, gastar tokens ou transmitir os dados ao servidor.</p>
      </header>
      <div className={styles.choices} aria-label="Principal preocupação">
        {choices.map((choice)=>(
          <button key={choice.id} type="button" className={choice.id===area?styles.chosen:styles.choice}
            aria-pressed={choice.id===area} onClick={()=>pick(choice.id)}>
            <strong>{choice.label}</strong><small>{choice.description}</small>
          </button>
        ))}
      </div>
      {area==="finance"||area==="sales"?(
        <div className={styles.workArea}>
          <div className={styles.workTitle}>
            <div>
              <h3>{area==="finance"?"Diagnóstico inicial do CFO":"Primeira triagem do CMO + CRO"}</h3>
              <p>Workflow: <code>{skill.id}</code> · Execução local, somente leitura.</p>
            </div>
          </div>
          <p className={styles.template}>Formato aceito — cabeçalho e lançamentos reais de sua empresa:</p>
          <pre className={styles.example}>{examples[area]}</pre>
          <label className={styles.inputLabel} htmlFor="age-local-csv">Escolher arquivo CSV (até 200 KB)</label>
          <input id="age-local-csv" className={styles.upload} type="file" accept=".csv,text/csv" onChange={e=>void loadCsv(e)} disabled={busy}/>
          {fileLabel&&<p className={styles.helper}>Arquivo carregado no navegador: {fileLabel}</p>}
          <label className={styles.inputLabel} htmlFor="age-local-paste">Ou cole o conteúdo CSV</label>
          <textarea id="age-local-paste" className={styles.paste} value={raw} onChange={e=>{setRaw(e.target.value);setResult(null);setProblem("");}}
            rows={5} maxLength={200_000} placeholder={area==="finance"?"data;tipo;valor;descricao":"nome;empresa;status;ultimo_contato"}/>
          <button type="button" className="ageButton ageButtonPrimary" disabled={busy||!raw.trim()} onClick={examine}>Analisar dados locais</button>
          {problem&&<p className={styles.error} role="alert">{problem}</p>}
          {result?.skill==="cash-flow-snapshot"&&(
            <div className={styles.result} role="status" aria-live="polite">
              <strong>Movimentação dos registros fornecidos</strong>
              <p>{result.rowCount} lançamentos · {result.periodStart} até {result.periodEnd}</p>
              <dl>
                <div><dt>Entradas</dt><dd>{money(result.incomeCents)}</dd></div>
                <div><dt>Saídas</dt><dd>{money(result.expenseCents)}</dd></div>
                <div><dt>Variação líquida</dt><dd>{money(result.netChangeCents)}</dd></div>
              </dl>
              <p>{result.note}</p>
            </div>
          )}
          {result?.skill==="lead-triage"&&(
            <div className={styles.result} role="status" aria-live="polite">
              <strong>{result.hasRanking?"Contatos para sua revisão":"Contatos recebidos — sem pontuação confiável"}</strong>
              <p>{result.rowCount} contatos analisados; até oito apresentados.</p>
              <div className={styles.leadList}>
                {result.leads.map((lead,i)=>(
                  <div key={`${lead.name}-${i}`} className={styles.lead}>
                    <strong>{lead.name}</strong>
                    <span>{lead.company} · {lead.status}</span>
                    <small>{lead.daysSinceContact===null?"Sem data do último contato":`Último contato há ${lead.daysSinceContact} dias`}</small>
                    {result.hasRanking&&<small>Índice heurístico {lead.score} — sujeito a revisão</small>}
                  </div>
                ))}
              </div>
              <p>{result.note}</p>
            </div>
          )}
          {result && (
            <section className={styles.pulse} aria-label="Resumo executivo parcial">
              <h4>CEO · Primeiro panorama da empresa</h4>
              <p>{buildLocalBusinessPulse(result).headline}</p>
              <p><strong>Próximo passo:</strong> {buildLocalBusinessPulse(result).nextStep}</p>
              <small>{buildLocalBusinessPulse(result).limits} Fonte: apenas o CSV local fornecido.</small>
            </section>
          )}
          <p className={styles.privacy}>Fonte: CSV informado por você. O arquivo é processado somente neste navegador; não é armazenado na memória empresarial. Nenhuma conta bancária, CRM, mensagem ou sistema foi acessado. Confira os resultados antes de decidir.</p>
        </div>
      ):(
        <div className={styles.workArea}>
          <h3>{area==="operations"?"Vamos estruturar sua operação":"Seu CTO pode mapear as conexões necessárias"}</h3>
          <p>{area==="operations"
            ?"O briefing estruturado do CEO está logo abaixo. Após confirmar os dados, o CEO poderá organizar processos e prioridades declaradas."
            :"Informe no mapa empresarial quais sistemas você já utiliza. Esta versão não cria uma conexão: autenticação, escopo mínimo e verificação do primeiro dado real ainda dependem de implementação."}</p>
          <p className={styles.privacy}>Workflow <code>{skill.id}</code> — {skill.state==="planned"?"planejado":"parcial"}. Nenhuma ação externa foi realizada.</p>
        </div>
      )}
      <div className={styles.next}>
        <strong>Próximo: ensine o CEO sobre sua empresa.</strong>
        <p>Depois da primeira análise, confirme seu perfil no formulário abaixo para criar memória compartilhável entre os quatro agentes. Este diagnóstico local não libera execução autônoma.</p>
      </div>
    </section>
  );
}
