"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Choice = { label: string; value: string; detail?: string };
type Step = { eyebrow: string; title: string; body?: string; choices?: Choice[] };

const steps: Step[] = [
  {
    eyebrow: "Onde acontece",
    title: "Onde esse trabalho acontece hoje?",
    body: "Escolha o lugar principal. Se eu precisar de outra conexão depois, pergunto só naquele momento.",
    choices: [
      { label: "WhatsApp", value: "WhatsApp" },
      { label: "E-mail", value: "e-mail" },
      { label: "Planilha ou arquivo", value: "planilha ou arquivo" },
      { label: "CRM ou sistema da empresa", value: "CRM ou sistema da empresa" },
      { label: "Outro lugar", value: "outro lugar" }
    ]
  },
  {
    eyebrow: "Como trabalhar",
    title: "Quando eu encontrar algo, o que você prefere?",
    body: "Isso pode ser alterado depois em linguagem normal.",
    choices: [
      { label: "Me mostrar primeiro", value: "show", detail: "Eu organizo e explico antes de qualquer ação externa." },
      { label: "Fazer tarefas simples sozinho", value: "simple", detail: "Eu cuido do que for reversível e peço sua decisão quando realmente importar." },
      { label: "Seguir minhas regras", value: "rules", detail: "Eu trabalho sozinho dentro das regras que você já definiu e paro nas decisões sensíveis." }
    ]
  },
  {
    eyebrow: "Pronto",
    title: "Entendi como começar.",
    body: "Seu pedido ficou preparado. O InstantWork só vai pedir conexão ou autorização quando o trabalho realmente precisar disso."
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [request, setRequest] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const step = steps[index];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  useEffect(() => {
    setRequest(sessionStorage.getItem("instantwork:first-request") ?? "");
  }, []);

  function choose(value: string) {
    setAnswers((current) => ({ ...current, [index]: value }));
  }

  function canContinue() {
    return !step.choices || Boolean(answers[index]);
  }

  function next() {
    if (!canContinue()) return;
    if (index < steps.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    sessionStorage.setItem("instantwork:prepared-request", JSON.stringify({
      request: request || "Pedido iniciado",
      source: answers[0] ?? null,
      preference: answers[1] ?? null
    }));
    router.push("/");
  }

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
          {request ? <p className="onboardingRequest">“{request}”</p> : null}
          {step.body ? <p className="onboardingBody">{step.body}</p> : null}
        </div>

        {step.choices ? (
          <div className="choiceGrid">
            {step.choices.map((choice) => {
              const active = answers[index] === choice.value;
              return (
                <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => choose(choice.value)}>
                  <span className="choiceCheck">{active ? "✓" : ""}</span>
                  <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="planReveal">
            <div className="planLine"><span>Seu pedido</span><p>{request || "Pedido iniciado"}</p></div>
            <div className="planLine"><span>Onde</span><p>{answers[0] ?? "Pergunto quando for necessário"}</p></div>
            <div className="planLine"><span>Como</span><p>{answers[1] === "show" ? "Mostrar antes" : answers[1] === "simple" ? "Fazer tarefas simples sozinho" : "Seguir suas regras"}</p></div>
          </div>
        )}

        <div className="onboardingActions">
          <button className="primaryButton" onClick={next} disabled={!canContinue()}>{index === steps.length - 1 ? "Continuar" : "Próximo"}</button>
          <span className="privacyNote">Sem agentes, prompts ou configurações técnicas.</span>
        </div>
      </section>
    </main>
  );
}
