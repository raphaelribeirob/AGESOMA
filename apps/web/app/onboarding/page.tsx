"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agesomaPackage } from "../../lib/riverthree-product";

type Choice = { label: string; value: string; detail?: string };
type Draft = {
  personalContext: string;
  priorityArea: string;
  request: string;
};

const STORAGE_KEY = "agesoma:onboarding";
const FIRST_REQUEST_KEY = "agesoma:first-request";
const PREPARED_REQUEST_KEY = "agesoma:prepared-request";

const initialDraft: Draft = {
  personalContext: "",
  priorityArea: "",
  request: ""
};

const priorityChoices: Choice[] = [
  { label: "Agenda e compromissos", value: "calendar", detail: "Organizar reuniões, prazos, eventos e lembretes." },
  { label: "E-mail e mensagens", value: "communication", detail: "Ler contexto, preparar respostas e acompanhar pendências." },
  { label: "Pesquisa e decisões", value: "research", detail: "Investigar opções, comparar informações e preparar decisões." },
  { label: "Trabalho e documentos", value: "work", detail: "Preparar arquivos, relatórios, apresentações e tarefas digitais." },
  { label: "Administração pessoal", value: "life_admin", detail: "Resolver pequenas burocracias e rotinas que consomem tempo." }
];

function priorityLabel(value: string) {
  return priorityChoices.find((choice) => choice.value === value)?.label ?? "O que for mais importante";
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

  const progress = Math.round(((index + 1) / steps.length) * 100);
  const isAutoStep = step.id === "priority_area";

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

  function selectPriority(value: string) {
    setDraft((current) => {
      const nextDraft = { ...current, priorityArea: value };
      persist(nextDraft);
      return nextDraft;
    });
    window.setTimeout(() => setIndex((current) => Math.min(current + 1, steps.length - 1)), 170);
  }

  function canContinue() {
    if (step.id === "personal_context") return draft.personalContext.trim().length >= 3;
    if (step.id === "first_request") return draft.request.trim().length >= 3;
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
      activationState: "personal_context_prepared",
      preparedAt: new Date().toISOString()
    }));
    router.push("/");
  }

  const screen = (() => {
    if (step.id === "welcome") return {
      eyebrow: "",
      title: "Um assistente que cuida das coisas por você.",
      body: "Explique o que precisa ser resolvido. A AGESOMA organiza o trabalho, usa seu contexto e só pede sua decisão quando for necessário.",
      surface: "welcome"
    };
    if (step.id === "personal_context") return {
      eyebrow: "Seu contexto",
      title: "O que eu deveria saber sobre sua rotina?",
      body: "Uma ou duas frases bastam. Você poderá corrigir ou apagar isso depois.",
      surface: "plain"
    };
    if (step.id === "priority_area") return {
      eyebrow: "Primeiro foco",
      title: "Onde você mais quer recuperar tempo?",
      body: "Isso só define por onde começamos. Você poderá pedir qualquer outra coisa depois.",
      surface: "plain"
    };
    if (step.id === "first_request") return {
      eyebrow: "Primeira delegação",
      title: "O que você quer tirar da sua cabeça agora?",
      body: "Escreva o resultado que você quer. Não precisa explicar como fazer.",
      surface: "plain"
    };
    if (step.id === "assistant_preview") return {
      eyebrow: "Como vou trabalhar",
      title: "Você pede o resultado. Eu cuido da coordenação.",
      body: "Eu reúno contexto, preparo os passos, executo o que estiver autorizado e volto quando houver algo para decidir ou quando estiver concluído.",
      surface: "resultPreview"
    };
    return {
      eyebrow: "Pronto",
      title: "Seu assistente está preparado.",
      body: "A primeira tarefa está pronta para entrar na conversa. Nenhuma ação externa foi executada durante o onboarding.",
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
            <span>lembre.</span>
            <span>organize.</span>
            <span>resolva.</span>
          </div>
        ) : null}

        {step.id === "personal_context" ? (
          <textarea
            className="onboardingTextarea"
            aria-label="Contexto pessoal"
            placeholder="Ex.: Trabalho com tecnologia, tenho uma rotina corrida e quero reduzir o tempo gasto com agenda, e-mails e pesquisas."
            value={draft.personalContext}
            onChange={(event) => update("personalContext", event.target.value)}
            rows={5}
            autoFocus
          />
        ) : null}

        {step.id === "priority_area" ? (
          <div className="choiceGrid">
            {priorityChoices.map((choice) => {
              const active = draft.priorityArea === choice.value;
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => selectPriority(choice.value)}>
                <span className="choiceCheck">{active ? "✓" : ""}</span>
                <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
              </button>;
            })}
          </div>
        ) : null}

        {step.id === "first_request" ? (
          <textarea
            className="onboardingTextarea"
            aria-label="Primeira delegação"
            placeholder="Ex.: Organize minha próxima semana e deixe prontas as respostas dos e-mails que precisam de mim."
            value={draft.request}
            onChange={(event) => update("request", event.target.value)}
            rows={5}
            autoFocus
          />
        ) : null}

        {step.id === "assistant_preview" ? (
          <div className="r3ResultPreview">
            <div className="previewHero">
              <span className="monoLabel">PRIMEIRA DELEGAÇÃO</span>
              <strong>{draft.request.trim() || "Organizar a próxima prioridade"}</strong>
              <p>A AGESOMA assume a coordenação e mantém você no controle das ações que exigem autorização.</p>
            </div>
            <div className="personalizationEvidence">
              <div><span>Contexto</span><strong>{draft.personalContext || "Sua rotina"}</strong></div>
              <div><span>Primeiro foco</span><strong>{priorityLabel(draft.priorityArea)}</strong></div>
            </div>
          </div>
        ) : null}

        {step.id === "first_execution" ? (
          <div className="r3FirstAction">
            <div><span className="monoLabel">CONTEXTO</span><strong>{draft.personalContext || "Sua rotina"}</strong></div>
            <div><span className="monoLabel">FOCO</span><strong>{priorityLabel(draft.priorityArea)}</strong></div>
            <div><span className="monoLabel">PRIMEIRA TAREFA</span><strong>{draft.request || "Organizar a próxima prioridade"}</strong></div>
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
