"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type JarvisApproval = {
  taskId: string;
  summary: string;
};

type JarvisInitialState = {
  greeting: string;
  brief: string;
  activeWork: number;
  verifiedResults: number;
  verifiedValue: string;
  approval: JarvisApproval | null;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  approval?: JarvisApproval | null;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor() {
  if (typeof window === "undefined") return null;
  const candidate = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

export default function JarvisClient({ initial }: { initial: JarvisInitialState }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      text: `${initial.greeting}\n\n${initial.brief}`,
      approval: initial.approval
    }
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const voiceAvailable = useMemo(() => Boolean(recognitionConstructor()), []);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || pending) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: clean };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "message", message: clean })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não consegui concluir isso agora.");
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: body.reply,
        approval: body.approval ?? null
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: error instanceof Error ? error.message : "Não consegui concluir isso agora."
      }]);
    } finally {
      setPending(false);
    }
  }

  async function approve(approval: JarvisApproval) {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "approve", taskId: approval.taskId })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível aprovar.");
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: body.reply
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: error instanceof Error ? error.message : "Não foi possível aprovar."
      }]);
    } finally {
      setPending(false);
    }
  }

  function toggleVoice() {
    if (!voiceAvailable || pending) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = recognitionConstructor();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      setInput(transcript.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <main className="jarvisShell">
      <header className="jarvisHeader">
        <img src="/agesoma-wordmark.jpeg" alt="AGESOMA" className="jarvisWordmark" />
        <span className="jarvisStatus"><i /> ativo</span>
      </header>

      <section className="jarvisStage" aria-live="polite">
        <div className={pending ? "jarvisOrb isThinking" : listening ? "jarvisOrb isListening" : "jarvisOrb"} aria-label={pending ? "AGESOMA pensando" : listening ? "AGESOMA ouvindo" : "AGESOMA"}>
          <span className="jarvisOrbLobe jarvisOrbLobeA" />
          <span className="jarvisOrbLobe jarvisOrbLobeB" />
          <span className="jarvisOrbGrain" />
        </div>
        <div className="jarvisStateText">{pending ? "Pensando…" : listening ? "Ouvindo…" : "Converse com sua empresa."}</div>
      </section>

      <section className="jarvisConversation">
        {messages.map((message) => (
          <article key={message.id} className={`jarvisMessage ${message.role}`}>
            <span className="jarvisMessageRole">{message.role === "assistant" ? "AGESOMA" : "VOCÊ"}</span>
            <div className="jarvisMessageText">{message.text}</div>
            {message.approval ? (
              <div className="jarvisApproval">
                <span>Preciso da sua autorização</span>
                <strong>{message.approval.summary}</strong>
                <div className="jarvisApprovalActions">
                  <button type="button" onClick={() => void approve(message.approval!)} disabled={pending}>Aprovar</button>
                  <button type="button" className="quiet" onClick={() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "Certo. Não vou executar essa ação." }])}>Não aprovar</button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
        {pending ? (
          <article className="jarvisMessage assistant isPending">
            <span className="jarvisMessageRole">AGESOMA</span>
            <div className="jarvisThinkingDots"><i /><i /><i /></div>
          </article>
        ) : null}
      </section>

      <form className="jarvisComposer" onSubmit={submit}>
        <button type="button" className={listening ? "jarvisMic active" : "jarvisMic"} onClick={toggleVoice} disabled={!voiceAvailable || pending} aria-label={voiceAvailable ? "Falar com AGESOMA" : "Voz indisponível neste navegador"}>
          <span>●</span>
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="O que você quer saber ou fazer na sua empresa?"
          aria-label="Mensagem para AGESOMA"
          autoComplete="off"
        />
        <button className="jarvisSend" type="submit" disabled={!input.trim() || pending}>Enviar</button>
      </form>
    </main>
  );
}
