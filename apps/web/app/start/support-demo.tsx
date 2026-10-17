"use client";

import { useState } from "react";
import styles from "./support-demo-age.module.css";

type DemoResult = {
  reply: string;
  status: "answered" | "needs_human";
  simulation: true;
  persisted: false;
  externallyExecuted: false;
  knowledgeId: string | null;
};
const questions = ["Qual é o prazo de entrega?", "Qual é o horário de atendimento?", "Posso alterar um pedido pago?"];

export default function SupportDemo() {
  const [message, setMessage] = useState(questions[0]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(question = message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/demo/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Prévia indisponível");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na demonstração");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="demonstracao" aria-label="Demonstração do produto" className={styles.demo}>
      <div>
        <span className={styles.headingLabel}>DEMONSTRAÇÃO INTERATIVA</span>
        <h2>Veja quando o AGESOMA responde — e quando não responde.</h2>
        <p>Use uma base fictícia. Este teste executa o mecanismo de FAQ do primeiro produto, sem acessar empresas reais.</p>
      </div>
      <div className={styles.examples} aria-label="Perguntas de exemplo">
        {questions.map((question) => (
          <button
            type="button"
            key={question}
            disabled={busy}
            className={styles.example}
            onClick={() => { setMessage(question); void submit(question); }}
          >
            {question}
          </button>
        ))}
      </div>
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className={styles.field}>
          <label htmlFor="age-demo-question">Pergunta para demonstrar</label>
          <input
            id="age-demo-question"
            minLength={3}
            maxLength={300}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <button type="submit" className="ageButton ageButtonPrimary" disabled={busy}>
          {busy ? "Testando…" : "Testar pergunta"}
        </button>
      </form>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {result ? (
        <div role="status" aria-live="polite" className={styles.result}>
          <strong>{result.status === "answered" ? "Resposta encontrada na base" : "Resposta desconhecida → encaminhamento humano"}</strong>
          <p>{result.reply}</p>
          <small>Dados fictícios · Sem registro de ticket, integração externa ou contratação.</small>
        </div>
      ) : null}
      <p className={styles.note}>A demonstração não comprova resolução de problemas reais nem execução autônoma. Para testar sua empresa, crie uma conta e use a prévia privada.</p>
    </section>
  );
}
