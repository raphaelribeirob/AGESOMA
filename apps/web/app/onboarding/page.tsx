"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Choice = { label: string; value: string; detail?: string };

const sourceChoices: Choice[] = [
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "E-mail", value: "e-mail" },
  { label: "Planilha ou arquivo", value: "planilha ou arquivo" },
  { label: "CRM ou sistema da empresa", value: "CRM ou sistema da empresa" },
  { label: "Outro lugar", value: "outro lugar" }
];

const workChoices: Choice[] = [
  { label: "Me mostrar primeiro", value: "show", detail: "Eu organizo e explico antes de qualquer ação externa." },
  { label: "Fazer tarefas simples sozinho", value: "simple", detail: "Eu cuido do que for reversível e peço sua decisão quando realmente importar." },
  { label: "Seguir minhas regras", value: "rules", detail: "Eu trabalho sozinho dentro das regras que você já definiu e paro nas decisões sensíveis." }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [request, setRequest] = useState("");
  const [source, setSource] = useState("");
  const [preference, setPreference] = useState("");

  useEffect(() => {
    setRequest(sessionStorage.getItem("instantwork:first-request") ?? "");
  }, []);

  const progress = Math.round(((index + 1) / 3) * 100);

  function canContinue() {
    if (index === 0) return request.trim().length >= 3;
    if (index === 1) return Boolean(source);
    return Boolean(preference);
  }

  function next() {
    if (!canContinue()) return;
    if (index < 2) {
      setIndex((value) => value + 1);
      return;
    }

    sessionStorage.setItem("instantwork:first-request", request.trim());
    sessionStorage.setItem("instantwork:prepared-request", JSON.stringify({
      request: request.trim(),
      source,
      preference
    }));
    router.push("/");
  }

  const title = index === 0
    ? "O que você precisa resolver?"
    : index === 1
      ? "Onde isso acontece hoje?"
      : "Quando eu encontrar algo, o que você prefere?";

  const body = index === 0
    ? "Explique como explicaria para alguém da sua equipe. Não precisa usar palavras técnicas."
    : index === 1
      ? "Escolha o lugar principal. Se eu precisar de outra conexão depois, pergunto só naquele momento."
      : "Você pode mudar isso depois em linguagem normal.";

  const eyebrow = index === 0 ? "Seu pedido" : index === 1 ? "Onde acontece" : "Como trabalhar";

  const choices = index === 1 ? sourceChoices : index === 2 ? workChoices : null;
  const selected = index === 1 ? source : preference;

  return (
    <main className="onboardingShell">
      <div className="onboardingTop">
        <button className="backButton" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} aria-label="Voltar">←</button>
        <div className="progressTrack" aria-label={`Progresso ${progress}%`}><div className="progressFill" style={{ width: `${progress}%` }} /></div>
        <span className="progressText">{index + 1}/3</span>
      </div>

      <section className="onboardingCard">
        <div className="onboardingCopy">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="onboardingTitle">{title}</h1>
          <p className="onboardingBody">{body}</p>
        </div>

        {index === 0 ? (
          <textarea
            className="onboardingTextarea"
            aria-label="Descreva o que você precisa resolver"
            placeholder="Ex.: Tenho vários clientes que pediram orçamento e ninguém respondeu."
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            rows={5}
            autoFocus
          />
        ) : null}

        {choices ? (
          <div className="choiceGrid">
            {choices.map((choice) => {
              const active = selected === choice.value;
              return (
                <button
                  key={choice.value}
                  className={active ? "choice active" : "choice"}
                  onClick={() => index === 1 ? setSource(choice.value) : setPreference(choice.value)}
                >
                  <span className="choiceCheck">{active ? "✓" : ""}</span>
                  <span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="onboardingActions">
          <button className="primaryButton" onClick={next} disabled={!canContinue()}>{index === 2 ? "Preparar meu pedido" : "Próximo"}</button>
          <span className="privacyNote">Sem agentes, prompts ou configurações técnicas.</span>
        </div>
      </section>
    </main>
  );
}
