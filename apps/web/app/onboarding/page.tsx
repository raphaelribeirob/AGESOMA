"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { agesomaPackage } from "../../lib/riverthree-product";

type Choice = { label: string; value: string; detail?: string };
type Draft = {
  request: string;
  goal: string;
  companyContext: string;
  currentChannel: string;
  source: string;
};

const STORAGE_KEY = "agesoma:onboarding";
const FIRST_REQUEST_KEY = "agesoma:first-request";
const PREPARED_REQUEST_KEY = "agesoma:prepared-request";

const initialDraft: Draft = {
  request: "",
  goal: "",
  companyContext: "",
  currentChannel: "",
  source: ""
};

const goalChoices: Choice[] = [
  { label: "Vender mais", value: "sales", detail: "Avançar oportunidades e recuperar conversas." },
  { label: "Atender melhor", value: "service", detail: "Responder mais rápido e acompanhar clientes." },
  { label: "Organizar a operação", value: "operations", detail: "Reduzir atrasos, ruído e tarefas esquecidas." },
  { label: "Ganhar tempo", value: "automation", detail: "Tirar trabalho repetitivo da equipe." }
];

const channelChoices: Choice[] = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "E-mail", value: "email" },
  { label: "Planilhas e arquivos", value: "files" },
  { label: "CRM ou sistema", value: "crm" },
  { label: "Ainda não sei", value: "unknown" }
];

const sourceChoices: Choice[] = [
  { label: "WhatsApp", value: "whatsapp", detail: "Conversas, atendimento e acompanhamento." },
  { label: "E-mail", value: "email", detail: "Caixa de entrada e comunicação com clientes." },
  { label: "Planilhas e arquivos", value: "files", detail: "Listas, documentos e materiais do negócio." },
  { label: "CRM ou sistema", value: "crm", detail: "Dados e rotinas que já vivem em outra ferramenta." },
  { label: "Depois", value: "later", detail: "Entrar primeiro e conectar somente quando for necessário." }
];

function labelFor(value: string, choices: Choice[], fallback: string) {
  return choices.find((choice) => choice.value === value)?.label ?? fallback;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const steps = agesomaPackage.onboarding.steps;
  const step = steps[index];

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDraft({ ...initialDraft, ...JSON.parse(saved) });
        return;
      } catch {
        // Ignore malformed local state and let the user start cleanly.
      }
    }
    const request = sessionStorage.getItem(FIRST_REQUEST_KEY);
    if (request) setDraft((current) => ({ ...current, request }));
  }, []);

  const preview = useMemo(() => ({
    priority: labelFor(draft.goal, goalChoices, "Sua prioridade"),
    firstWork: draft.request.trim() || "Seu primeiro pedido",
    context: draft.companyContext.trim() || "Seu negócio",
    channel: labelFor(draft.currentChannel, channelChoices, "Onde o trabalho acontece hoje")
  }), [draft]);

  const progress = Math.round(((index + 1) / steps.length) * 100);
  const isAutoStep = step.id === "business_goal" || step.id === "channels_optional";

  function persist(nextDraft: Draft) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
    sessionStorage.setItem(FIRST_REQUEST_KEY, nextDraft.request.trim());
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => {
      const nextDraft = { ...current, [key]: value };
      persist(nextDraft);
      return nextDraft;
    });
  }

  function selectAndAdvance(key: "goal" | "currentChannel", value: string) {
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
    return true;
  }

  function next() {
    if (!canContinue()) return;
    persist(draft);
    if (index < steps.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    sessionStorage.setItem(PREPARED_REQUEST_KEY, JSON.stringify({
      ...draft,
      product: agesomaPackage.product.id,
      activationState: "prepared_not_executed",
      preparedAt: new Date().toISOString()
    }));
    router.push("/");
  }

  const screen = (() => {
    if (step.id === "welcome") return {
      eyebrow: "",
      title: "Diga o que precisa. O trabalho começa daqui.",
      body: "Você fala do negócio. A AGESOMA organiza o próximo passo e mantém você no controle quando uma decisão realmente importa.",
      surface: "welcome"
    };
    if (step.id === "business_goal") return {
      eyebrow: "Prioridade",
      title: "O que mais importa agora?",
      body: "Escolha uma coisa. O restante pode esperar.",
      surface: "plain"
    };
    if (step.id === "company_context") return {
      eyebrow: "Seu negócio",
      title: "Como a operação funciona hoje?",
      body: "Uma frase basta. Conte o que sua equipe faz, não como a tecnologia funciona.",
      surface: "plain"
    };
    if (step.id === "channels_optional") return {
      eyebrow: "Rotina",
      title: "Onde o trabalho acontece mais?",
      body: "Isso ajuda a montar um primeiro passo que faça sentido para sua realidade.",
      surface: "plain"
    };
    if (step.id === "desired_outcome") return {
      eyebrow: "Primeiro pedido",
      title: "O que você quer tirar da sua frente?",
      body: "Escreva como falaria com alguém da sua equipe.",
      surface: "plain"
    };
    if (step.id === "workflow_roi_preview") return {
      eyebrow: "Seu primeiro plano",
      title: "Eu começaria por aqui.",
      body: "A proposta abaixo usa o que você acabou de contar. Nada externo foi feito ainda.",
      surface: "resultPreview"
    };
    if (step.id === "connect_tools") return {
      eyebrow: "Começar",
      title: "Onde devo trabalhar primeiro?",
      body: "Escolha uma fonte ou deixe para depois. A autorização real só aparece quando for necessária.",
      surface: "plain"
    };
    return {
      eyebrow: "Pronto",
      title: "Seu primeiro pedido está preparado.",
      body: "Nada foi executado ainda. Ao entrar, você verá o estado do trabalho, o que precisa da sua atenção e o próximo passo útil.",
      surface: "success"
    };
  })();

  return (
    <main className={`onboardingShell r3Surface-${screen.surface}`}>
      <div className="r3ProgressHeader onboardingTop">
        <button className="backButton" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} aria-label="Voltar">←</button>
        <div className="progressTrack" aria-label={`Progresso ${progress}%`}><div className="progressFill" style={{ width: `${progress}%` }} /></div>
        <span className="progressText">{index + 1}/{steps.length}</span>
      </div>

      <section className="onboardingCard">
        <div className="onboardingCopy">
          {step.id === "welcome" ? <div className="agesomaWelcomeBrand"><img src={agesomaPackage.identity.wordmark} alt="AGESOMA" /></div> : null}
          {screen.eyebrow ? <div className="eyebrow">{screen.eyebrow}</div> : null}
          <h1 className="onboardingTitle">{screen.title}</h1>
          <p className="onboardingBody">{screen.body}</p>
        </div>

        {step.id === "welcome" ? (
          <div className="r3WelcomeMaterial" aria-hidden="true">
            <span>peça.</span>
            <span>acompanhe.</span>
            <span>decida só quando importa.</span>
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
          <textarea className="onboardingTextarea" aria-label="Como sua operação funciona hoje" placeholder="Ex.: Somos uma empresa de consórcio com quatro vendedores. Os clientes chegam pelo WhatsApp e a equipe acompanha tudo em planilhas." value={draft.companyContext} onChange={(event) => update("companyContext", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.id === "channels_optional" ? (
          <div className="choiceGrid">
            {channelChoices.map((choice) => {
              const active = draft.currentChannel === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => selectAndAdvance("currentChannel", choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong></span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "desired_outcome" ? (
          <textarea className="onboardingTextarea" aria-label="Descreva o primeiro pedido" placeholder="Ex.: Tenho clientes que pediram orçamento e ninguém respondeu. Quero recuperar essas conversas." value={draft.request} onChange={(event) => update("request", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.id === "workflow_roi_preview" ? (
          <div className="r3ResultPreview">
            <div className="previewHero">
              <span className="monoLabel">PRIMEIRO PASSO</span>
              <strong>{preview.firstWork}</strong>
              <p>Começar pela menor ação útil, observar o que acontece e trazer para você apenas decisões com consequência real.</p>
            </div>
            <div className="personalizationEvidence">
              <div><span>Prioridade</span><strong>{preview.priority}</strong></div>
              <div><span>Seu contexto</span><strong>{preview.context}</strong></div>
              <div><span>Rotina principal</span><strong>{preview.channel}</strong></div>
            </div>
          </div>
        ) : null}

        {step.id === "connect_tools" ? (
          <div className="choiceGrid">
            {sourceChoices.map((choice) => {
              const active = draft.source === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => update("source", choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "first_execution" ? (
          <div className="r3FirstAction">
            <div><span className="monoLabel">PRIORIDADE</span><strong>{preview.priority}</strong></div>
            <div><span className="monoLabel">PRIMEIRO PEDIDO</span><strong>{preview.firstWork}</strong></div>
            <div><span className="monoLabel">FONTE</span><strong>{labelFor(draft.source, sourceChoices, "Conectar quando precisar")}</strong></div>
          </div>
        ) : null}

        {!isAutoStep ? (
          <div className="onboardingActions">
            <button className="primaryButton" onClick={next} disabled={!canContinue()}>{step.id === "first_execution" ? "Abrir AGESOMA" : step.id === "welcome" ? "Começar" : "Continuar"}</button>
            {step.id === "connect_tools" ? <span className="privacyNote">Nenhuma conta é acessada nesta tela.</span> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
