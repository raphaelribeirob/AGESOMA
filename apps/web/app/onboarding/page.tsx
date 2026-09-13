"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { agesomaPackage } from "../../lib/riverthree-product";

type Choice = { label: string; value: string; detail?: string };
type Draft = {
  companyContext: string;
  teamSize: string;
  teamStructure: string;
  coordinationProblem: string;
  request: string;
};

const STORAGE_KEY = "agesoma:onboarding";
const FIRST_REQUEST_KEY = "agesoma:first-request";
const PREPARED_REQUEST_KEY = "agesoma:prepared-request";

const initialDraft: Draft = {
  companyContext: "",
  teamSize: "",
  teamStructure: "",
  coordinationProblem: "",
  request: ""
};

const problemChoices: Choice[] = [
  { label: "Ninguém sabe o que é prioridade", value: "priority", detail: "O trabalho muda e a equipe perde foco." },
  { label: "As coisas ficam paradas", value: "blocked", detail: "Tarefas dependem de cobrança e acompanhamento." },
  { label: "Algumas pessoas ficam sobrecarregadas", value: "capacity", detail: "A distribuição de trabalho não está clara." },
  { label: "Eu preciso acompanhar tudo", value: "owner_bottleneck", detail: "A empresa depende demais do dono para andar." }
];

function problemLabel(value: string) {
  return problemChoices.find((choice) => choice.value === value)?.label ?? "Coordenação da equipe";
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
        // Start cleanly when local state is malformed.
      }
    }
    const request = sessionStorage.getItem(FIRST_REQUEST_KEY);
    if (request) setDraft((current) => ({ ...current, request }));
  }, []);

  const peoplePreview = useMemo(() => {
    return draft.teamStructure
      .split(/\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [draft.teamStructure]);

  const progress = Math.round(((index + 1) / steps.length) * 100);
  const isAutoStep = step.id === "coordination_problem";

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

  function selectProblem(value: string) {
    setDraft((current) => {
      const nextDraft = { ...current, coordinationProblem: value };
      persist(nextDraft);
      return nextDraft;
    });
    window.setTimeout(() => setIndex((current) => Math.min(current + 1, steps.length - 1)), 170);
  }

  function canContinue() {
    if (step.id === "company_context") return draft.companyContext.trim().length >= 3;
    if (step.id === "team_size") return Number(draft.teamSize) >= 1 && Number(draft.teamSize) <= 500;
    if (step.id === "team_structure") return draft.teamStructure.trim().length >= 3;
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
      activationState: "team_structure_prepared",
      preparedAt: new Date().toISOString()
    }));
    router.push("/");
  }

  const screen = (() => {
    if (step.id === "welcome") return {
      eyebrow: "",
      title: "Organize a empresa sem precisar cobrar todo mundo.",
      body: "A AGESOMA entende quem faz o quê, distribui o trabalho e acompanha o que precisa avançar.",
      surface: "welcome"
    };
    if (step.id === "company_context") return {
      eyebrow: "Sua empresa",
      title: "O que sua empresa faz?",
      body: "Uma frase basta. Isso me dá contexto para entender o trabalho da equipe.",
      surface: "plain"
    };
    if (step.id === "team_size") return {
      eyebrow: "Equipe",
      title: "Quantas pessoas trabalham com você?",
      body: "Conte somente quem participa da operação do dia a dia.",
      surface: "plain"
    };
    if (step.id === "team_structure") return {
      eyebrow: "Responsabilidades",
      title: "Quem faz o quê?",
      body: "Escreva nomes e funções de forma simples. Não precisa montar organograma.",
      surface: "plain"
    };
    if (step.id === "coordination_problem") return {
      eyebrow: "Hoje",
      title: "Onde a organização mais falha?",
      body: "Isso define o que eu devo acompanhar primeiro.",
      surface: "plain"
    };
    if (step.id === "desired_outcome") return {
      eyebrow: "Primeiro trabalho",
      title: "O que precisa andar agora?",
      body: "Escreva como falaria com alguém que conhece toda a sua empresa.",
      surface: "plain"
    };
    if (step.id === "coordination_preview") return {
      eyebrow: "Como vou organizar",
      title: "Um responsável para cada trabalho.",
      body: "Eu acompanho pessoas, assumo o que puder ser resolvido digitalmente e só chamo você quando for necessário.",
      surface: "resultPreview"
    };
    return {
      eyebrow: "Pronto",
      title: "A estrutura inicial da sua empresa está preparada.",
      body: "Ao entrar, você verá equipe, trabalho, bloqueios e resultados em um só lugar. Nenhuma ação externa foi executada nesta etapa.",
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
            <span>entenda.</span>
            <span>organize.</span>
            <span>faça avançar.</span>
          </div>
        ) : null}

        {step.id === "company_context" ? (
          <textarea className="onboardingTextarea" aria-label="O que sua empresa faz" placeholder="Ex.: Vendemos consórcios e atendemos clientes pelo WhatsApp." value={draft.companyContext} onChange={(event) => update("companyContext", event.target.value)} rows={4} autoFocus />
        ) : null}

        {step.id === "team_size" ? (
          <input className="onboardingTextarea" aria-label="Tamanho da equipe" type="number" min="1" max="500" inputMode="numeric" placeholder="Ex.: 8" value={draft.teamSize} onChange={(event) => update("teamSize", event.target.value)} autoFocus />
        ) : null}

        {step.id === "team_structure" ? (
          <textarea className="onboardingTextarea" aria-label="Quem faz o quê" placeholder={"Ex.:\nCarlos — vendas e propostas\nAna — financeiro e cobranças\nJoana — atendimento"} value={draft.teamStructure} onChange={(event) => update("teamStructure", event.target.value)} rows={6} autoFocus />
        ) : null}

        {step.id === "coordination_problem" ? (
          <div className="choiceGrid">
            {problemChoices.map((choice) => {
              const active = draft.coordinationProblem === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => selectProblem(choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "desired_outcome" ? (
          <textarea className="onboardingTextarea" aria-label="O que precisa andar agora" placeholder="Ex.: Organize a equipe para responder todos os clientes atrasados até amanhã." value={draft.request} onChange={(event) => update("request", event.target.value)} rows={5} autoFocus />
        ) : null}

        {step.id === "coordination_preview" ? (
          <div className="r3ResultPreview">
            <div className="previewHero">
              <span className="monoLabel">PRIMEIRO TRABALHO</span>
              <strong>{draft.request.trim() || "Organizar a primeira prioridade"}</strong>
              <p>A AGESOMA define o responsável, acompanha até a conclusão e assume internamente o que não precisa ocupar uma pessoa.</p>
            </div>
            <div className="personalizationEvidence">
              <div><span>Empresa</span><strong>{draft.companyContext || "Seu negócio"}</strong></div>
              <div><span>Equipe</span><strong>{draft.teamSize ? `${draft.teamSize} pessoa${Number(draft.teamSize) === 1 ? "" : "s"}` : "Sua equipe"}</strong></div>
              <div><span>Primeiro foco</span><strong>{problemLabel(draft.coordinationProblem)}</strong></div>
            </div>
          </div>
        ) : null}

        {step.id === "first_execution" ? (
          <div className="r3FirstAction">
            <div><span className="monoLabel">EMPRESA</span><strong>{draft.companyContext || "Seu negócio"}</strong></div>
            <div><span className="monoLabel">EQUIPE</span><strong>{peoplePreview.length ? peoplePreview.join(" · ") : `${draft.teamSize || "—"} pessoas`}</strong></div>
            <div><span className="monoLabel">PRIMEIRO TRABALHO</span><strong>{draft.request || "Organizar a próxima prioridade"}</strong></div>
          </div>
        ) : null}

        {!isAutoStep ? (
          <div className="onboardingActions">
            <button className="primaryButton" onClick={next} disabled={!canContinue()}>{step.id === "first_execution" ? "Abrir AGESOMA" : step.id === "welcome" ? "Começar" : "Continuar"}</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
