"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { instantWorkPackage } from "../../lib/riverthree-product";

type Choice = { label: string; value: string; detail?: string };
type Draft = {
  request: string;
  goal: string;
  companyContext: string;
  preference: string;
  source: string;
};

const initialDraft: Draft = {
  request: "",
  goal: "",
  companyContext: "",
  preference: "",
  source: ""
};

const goalChoices: Choice[] = [
  { label: "Vender mais", value: "sales", detail: "Encontrar e avançar oportunidades comerciais." },
  { label: "Atender melhor", value: "service", detail: "Responder, acompanhar e não perder clientes." },
  { label: "Organizar a operação", value: "operations", detail: "Reduzir ruído, atrasos e tarefas esquecidas." },
  { label: "Ganhar tempo", value: "automation", detail: "Tirar trabalho repetitivo da equipe." }
];

const workChoices: Choice[] = [
  { label: "Me mostrar primeiro", value: "show", detail: "Prepare o trabalho e me mostre antes de qualquer ação externa." },
  { label: "Fazer o simples sozinho", value: "simple", detail: "Cuide do reversível e me chame quando uma decisão realmente importar." },
  { label: "Seguir minhas regras", value: "rules", detail: "Trabalhe sozinho dentro das regras que eu definir." }
];

const sourceChoices: Choice[] = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "E-mail", value: "email" },
  { label: "Planilha ou arquivo", value: "files" },
  { label: "CRM ou sistema da empresa", value: "crm" },
  { label: "Outro lugar", value: "other" }
];

function goalLabel(value: string) {
  return goalChoices.find((choice) => choice.value === value)?.label ?? "Seu objetivo";
}

function sourceLabel(value: string) {
  return sourceChoices.find((choice) => choice.value === value)?.label ?? "fonte principal";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const steps = instantWorkPackage.onboarding.steps;
  const step = steps[index];

  useEffect(() => {
    const saved = sessionStorage.getItem("instantwork:onboarding");
    if (saved) {
      try {
        setDraft({ ...initialDraft, ...JSON.parse(saved) });
        return;
      } catch {
        // Malformed local state is ignored so the user can continue safely.
      }
    }
    const request = sessionStorage.getItem("instantwork:first-request");
    if (request) setDraft((current) => ({ ...current, request }));
  }, []);

  const preview = useMemo(() => ({
    priority: goalLabel(draft.goal),
    firstWork: draft.request.trim() || "Definir o primeiro trabalho",
    context: draft.companyContext.trim() || "Entender a rotina atual",
    source: draft.source ? sourceLabel(draft.source) : "Conectar a fonte somente quando necessário"
  }), [draft]);

  const progress = Math.round(((index + 1) / steps.length) * 100);
  const isAutoStep = step.id === "business_goal" || step.id === "work_style";

  function persist(nextDraft: Draft) {
    sessionStorage.setItem("instantwork:onboarding", JSON.stringify(nextDraft));
    sessionStorage.setItem("instantwork:first-request", nextDraft.request.trim());
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => {
      const nextDraft = { ...current, [key]: value };
      persist(nextDraft);
      return nextDraft;
    });
  }

  function selectAndAdvance(key: "goal" | "preference", value: string) {
    setDraft((current) => {
      const nextDraft = { ...current, [key]: value };
      persist(nextDraft);
      return nextDraft;
    });
    window.setTimeout(() => setIndex((current) => Math.min(current + 1, steps.length - 1)), 170);
  }

  function canContinue() {
    if (step.id === "company_context") return draft.companyContext.trim().length >= 3;
    if (step.id === "desired_outcome") return draft.request.trim().length >= 3;
    if (step.id === "connect_tools") return Boolean(draft.source);
    return true;
  }

  function next() {
    if (!canContinue()) return;
    persist(draft);
    if (index < steps.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    sessionStorage.setItem("instantwork:prepared-request", JSON.stringify({
      ...draft,
      package: instantWorkPackage.product.id,
      onboardingMode: instantWorkPackage.product.onboardingMode,
      preparedAt: new Date().toISOString()
    }));
    router.push("/");
  }

  const screen = (() => {
    if (step.id === "welcome") return {
      eyebrow: "InstantWork",
      title: instantWorkPackage.promise.headline,
      body: "Sem agentes, prompts ou configurações para aprender. Você começa pelo resultado que precisa no negócio.",
      surface: "welcome"
    };
    if (step.id === "business_goal") return {
      eyebrow: "Seu objetivo",
      title: "O que mais importa agora?",
      body: "Escolha uma prioridade. Você pode mudar isso depois em linguagem normal.",
      surface: "plain"
    };
    if (step.id === "company_context") return {
      eyebrow: "Seu negócio",
      title: "Como esse trabalho acontece hoje?",
      body: "Explique a rotina em uma frase. Não descreva tecnologia; descreva o que sua equipe faz.",
      surface: "plain"
    };
    if (step.id === "desired_outcome") return {
      eyebrow: "Primeiro trabalho",
      title: "O que você quer tirar da sua frente?",
      body: "Peça como pediria a alguém da sua equipe. O InstantWork transforma isso em trabalho seguro e observável.",
      surface: "plain"
    };
    if (step.id === "work_style") return {
      eyebrow: "Autonomia",
      title: "Como você quer que eu trabalhe?",
      body: "O reversível pode andar sozinho. Consequências externas continuam sob seu controle.",
      surface: "plain"
    };
    if (step.id === "workflow_value_preview") return {
      eyebrow: "Seu primeiro fluxo",
      title: "Entendi o que deve acontecer primeiro.",
      body: "Este preview mostra como suas respostas mudaram o trabalho proposto. Nada externo foi executado.",
      surface: "resultPreview"
    };
    if (step.id === "connect_tools") return {
      eyebrow: "Conexão",
      title: "Onde esse trabalho acontece?",
      body: "Escolha a fonte principal. A conexão real só será pedida no momento em que for necessária.",
      surface: "plain"
    };
    return {
      eyebrow: "Pronto",
      title: "Seu InstantWork está preparado.",
      body: "Na Home, o estado do negócio vem primeiro; depois aparece apenas a próxima ação útil ou uma decisão que realmente precise de você.",
      surface: "success"
    };
  })();

  return (
    <main className={`onboardingShell r3Surface-${screen.surface}`}>
      <div className="onboardingTop r3ProgressHeader">
        <button className="backButton" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} aria-label="Voltar">←</button>
        <div className="progressTrack" aria-label={`Progresso ${progress}%`}><div className="progressFill" style={{ width: `${progress}%` }} /></div>
        <span className="progressText">{index + 1}/{steps.length}</span>
      </div>

      <section className="onboardingCard">
        <div className="onboardingCopy">
          <div className="eyebrow">{screen.eyebrow}</div>
          <h1 className="onboardingTitle">{screen.title}</h1>
          <p className="onboardingBody">{screen.body}</p>
        </div>

        {step.id === "welcome" ? (
          <div className="r3WelcomeMaterial" aria-hidden="true">
            <span>Você pede.</span><span>O trabalho acontece.</span><span>O resultado fica comprovado.</span>
          </div>
        ) : null}

        {step.id === "business_goal" ? (
          <div className="choiceGrid">
            {goalChoices.map((choice) => {
              const active = draft.goal === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => selectAndAdvance("goal", choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "company_context" ? (
          <textarea className="onboardingTextarea" aria-label="Como o trabalho acontece hoje" placeholder="Ex.: Os pedidos chegam pelo WhatsApp, minha equipe responde quando consegue e anota os interessados em uma planilha." value={draft.companyContext} onChange={(event) => update("companyContext", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.id === "desired_outcome" ? (
          <textarea className="onboardingTextarea" aria-label="Descreva o primeiro trabalho" placeholder="Ex.: Tenho clientes que pediram orçamento e ninguém respondeu. Quero recuperar essas conversas." value={draft.request} onChange={(event) => update("request", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.id === "work_style" ? (
          <div className="choiceGrid">
            {workChoices.map((choice) => {
              const active = draft.preference === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => selectAndAdvance("preference", choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "workflow_value_preview" ? (
          <div className="r3ResultPreview">
            <div className="previewHero">
              <span className="monoLabel">PRIMEIRO TRABALHO PROPOSTO</span>
              <strong>{preview.firstWork}</strong>
              <p>Começar pelo menor passo seguro que produza evidência. Se houver efeito externo, o InstantWork resolve o destino e a ação exatos antes de pedir sua autorização.</p>
            </div>
            <div className="personalizationEvidence">
              <div><span>Prioridade</span><strong>{preview.priority}</strong></div>
              <div><span>Contexto considerado</span><strong>{preview.context}</strong></div>
              <div><span>Seu controle</span><strong>{draft.preference === "show" ? "Mostrar antes" : draft.preference === "rules" ? "Seguir regras definidas" : "Fazer o reversível sozinho"}</strong></div>
            </div>
          </div>
        ) : null}

        {step.id === "connect_tools" ? (
          <div className="choiceGrid">
            {sourceChoices.map((choice) => {
              const active = draft.source === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => update("source", choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong></span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "first_action" ? (
          <div className="r3FirstAction">
            <div><span className="monoLabel">PRIORIDADE</span><strong>{preview.priority}</strong></div>
            <div><span className="monoLabel">FONTE PRINCIPAL</span><strong>{preview.source}</strong></div>
            <div><span className="monoLabel">PRÓXIMO PASSO</span><strong>Revisar e iniciar o primeiro trabalho</strong></div>
          </div>
        ) : null}

        {!isAutoStep ? (
          <div className="onboardingActions">
            <button className="primaryButton" onClick={next} disabled={!canContinue()}>{step.id === "first_action" ? "Entrar no InstantWork" : step.id === "connect_tools" ? "Usar esta fonte" : "Continuar"}</button>
            <span className="privacyNote">Progresso real, permissões no momento de uso e nenhuma ação externa sem escopo claro.</span>
          </div>
        ) : <span className="autoAdvanceNote">Avança após sua escolha.</span>}
      </section>
    </main>
  );
}
