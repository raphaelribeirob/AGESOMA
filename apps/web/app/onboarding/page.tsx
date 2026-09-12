"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Choice = { label: string; value: string; detail?: string };
type Draft = {
  request: string;
  goal: string;
  currentState: string;
  bottleneck: string;
  preference: string;
  source: string;
};

const initialDraft: Draft = {
  request: "",
  goal: "",
  currentState: "",
  bottleneck: "",
  preference: "",
  source: ""
};

const goalChoices: Choice[] = [
  { label: "Vender mais", value: "sales" },
  { label: "Responder clientes melhor", value: "service" },
  { label: "Organizar a operação", value: "operations" },
  { label: "Reduzir trabalho manual", value: "automation" }
];

const sourceChoices: Choice[] = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "E-mail", value: "email" },
  { label: "Planilha ou arquivo", value: "files" },
  { label: "CRM ou sistema da empresa", value: "crm" },
  { label: "Outro lugar", value: "other" }
];

const workChoices: Choice[] = [
  { label: "Me mostrar primeiro", value: "show", detail: "Organize e explique antes de qualquer ação externa." },
  { label: "Fazer o simples sozinho", value: "simple", detail: "Cuide do reversível e me chame quando uma decisão realmente importar." },
  { label: "Seguir minhas regras", value: "rules", detail: "Trabalhe sozinho dentro das regras que eu definir." }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);

  useEffect(() => {
    const saved = sessionStorage.getItem("instantwork:onboarding");
    if (saved) {
      try {
        setDraft({ ...initialDraft, ...JSON.parse(saved) });
        return;
      } catch {
        // Ignore malformed local onboarding state and start clean.
      }
    }
    const request = sessionStorage.getItem("instantwork:first-request");
    if (request) setDraft((current) => ({ ...current, request }));
  }, []);

  const steps = [
    {
      eyebrow: "InstantWork",
      title: "Diga o resultado. Eu cuido do trabalho.",
      body: "Sem agentes, prompts ou automações para aprender. Você começa pelo que precisa mudar no negócio.",
      kind: "promise"
    },
    {
      eyebrow: "Veja a mágica",
      title: "Qual trabalho você quer tirar da sua frente?",
      body: "Escreva como falaria com alguém da sua equipe. O InstantWork transforma isso em trabalho observável, reversível e, quando necessário, uma ação exata para sua autorização.",
      kind: "request"
    },
    {
      eyebrow: "Seu objetivo",
      title: "Qual resultado importa mais agora?",
      body: "Isso define o que deve ganhar prioridade quando houver mais de uma oportunidade.",
      kind: "goal"
    },
    {
      eyebrow: "Como funciona hoje",
      title: "Como esse trabalho acontece atualmente?",
      body: "Uma frase basta. Não descreva tecnologia; descreva a rotina.",
      kind: "current"
    },
    {
      eyebrow: "Onde trava",
      title: "Onde clientes, dinheiro ou tempo costumam se perder?",
      body: "Esse é o ponto que o InstantWork deve observar primeiro.",
      kind: "bottleneck"
    },
    {
      eyebrow: "Autonomia",
      title: "Como você quer que eu trabalhe?",
      body: "O reversível pode andar sozinho. Consequências continuam sob seu controle.",
      kind: "preference"
    },
    {
      eyebrow: "Conexões",
      title: "Onde esse trabalho acontece?",
      body: "Escolha só o lugar principal. Outras conexões aparecem apenas quando forem necessárias.",
      kind: "source"
    },
    {
      eyebrow: "Montando",
      title: "Separando trabalho de decisões.",
      body: "Primeiro eu observo e preparo. Se houver efeito externo, resolvo exatamente destino, operação, recurso e parâmetros antes de pedir autorização.",
      kind: "build"
    },
    {
      eyebrow: "Seu primeiro plano",
      title: draft.request.trim() || "Seu primeiro trabalho está definido.",
      body: "O pedido começa pelo menor passo seguro que produz evidência. O que exigir consequência externa aparece como uma decisão concreta, nunca como uma autorização genérica.",
      kind: "plan"
    },
    {
      eyebrow: "Pronto",
      title: "Você pede trabalho. O InstantWork entrega resultado.",
      body: "A experiência termina no resultado e na evidência — não em um painel de agentes.",
      kind: "offer"
    }
  ] as const;

  const step = steps[index];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function canContinue() {
    if (step.kind === "request") return draft.request.trim().length >= 3;
    if (step.kind === "goal") return Boolean(draft.goal);
    if (step.kind === "current") return draft.currentState.trim().length >= 3;
    if (step.kind === "bottleneck") return draft.bottleneck.trim().length >= 3;
    if (step.kind === "preference") return Boolean(draft.preference);
    if (step.kind === "source") return Boolean(draft.source);
    return true;
  }

  function next() {
    if (!canContinue()) return;
    sessionStorage.setItem("instantwork:onboarding", JSON.stringify(draft));
    sessionStorage.setItem("instantwork:first-request", draft.request.trim());

    if (index < steps.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    sessionStorage.setItem("instantwork:prepared-request", JSON.stringify(draft));
    router.push("/");
  }

  const choices = step.kind === "goal"
    ? goalChoices
    : step.kind === "preference"
      ? workChoices
      : step.kind === "source"
        ? sourceChoices
        : null;
  const selected = step.kind === "goal"
    ? draft.goal
    : step.kind === "preference"
      ? draft.preference
      : draft.source;

  return (
    <main className="onboardingShell">
      <div className="onboardingTop">
        <button className="backButton" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} aria-label="Voltar">←</button>
        <div className="progressTrack" aria-label={`Progresso ${progress}%`}><div className="progressFill" style={{ width: `${progress}%` }} /></div>
        <span className="progressText">{index + 1}/{steps.length}</span>
      </div>

      <section className="onboardingCard">
        <div className="onboardingCopy">
          <div className="eyebrow">{step.eyebrow}</div>
          <h1 className="onboardingTitle">{step.title}</h1>
          <p className="onboardingBody">{step.body}</p>
        </div>

        {step.kind === "request" ? (
          <textarea className="onboardingTextarea" aria-label="Descreva o trabalho" placeholder="Ex.: Tenho clientes que pediram orçamento e ninguém respondeu." value={draft.request} onChange={(event) => update("request", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.kind === "current" ? (
          <textarea className="onboardingTextarea" aria-label="Como funciona hoje" placeholder="Ex.: Os pedidos chegam pelo WhatsApp e minha equipe anota em uma planilha." value={draft.currentState} onChange={(event) => update("currentState", event.target.value)} rows={4} autoFocus />
        ) : null}

        {step.kind === "bottleneck" ? (
          <textarea className="onboardingTextarea" aria-label="Onde o trabalho trava" placeholder="Ex.: Quando estamos ocupados, alguns pedidos ficam sem resposta." value={draft.bottleneck} onChange={(event) => update("bottleneck", event.target.value)} rows={4} autoFocus />
        ) : null}

        {choices ? (
          <div className="choiceGrid">
            {choices.map((choice) => {
              const active = selected === choice.value;
              return (
                <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => {
                  if (step.kind === "goal") update("goal", choice.value);
                  if (step.kind === "preference") update("preference", choice.value);
                  if (step.kind === "source") update("source", choice.value);
                }}>
                  <span className="choiceCheck">{active ? "✓" : ""}</span>
                  <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="onboardingActions">
          <button className="primaryButton" onClick={next} disabled={!canContinue()}>{index === steps.length - 1 ? "Entrar no InstantWork" : "Continuar"}</button>
          <span className="privacyNote">Você pode mudar tudo depois em linguagem normal.</span>
        </div>
      </section>
    </main>
  );
}
