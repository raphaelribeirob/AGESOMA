"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = mode === "sign-in"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name: name.trim() || "Owner", email, password });

    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Não foi possível entrar.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="onboardingShell r3Surface-plain authShell">
      <section className="onboardingCard" style={{ maxWidth: 560, margin: "8vh auto 0" }}>
        <div className="onboardingCopy">
          <div className="agesomaWelcomeBrand"><img src="/agesoma-wordmark.jpeg" alt="AGESOMA" /></div>
          <div className="eyebrow">Acesso seguro</div>
          <h1 className="onboardingTitle">{mode === "sign-in" ? "Entre na sua empresa." : "Crie seu acesso."}</h1>
          <p className="onboardingBody">Sua sessão define qual empresa pode ser acessada. O navegador não escolhe tenant nem identidade por cabeçalho.</p>
        </div>

        <form onSubmit={submit} className="workspaceStack">
          {mode === "sign-up" ? (
            <input className="onboardingTextarea" aria-label="Seu nome" placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} required />
          ) : null}
          <input className="onboardingTextarea" aria-label="E-mail" type="email" placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <input className="onboardingTextarea" aria-label="Senha" type="password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete={mode === "sign-in" ? "current-password" : "new-password"} />
          {error ? <p className="onboardingBody" role="alert">{error}</p> : null}
          <button className="primaryButton" type="submit" disabled={pending}>{pending ? "Aguarde…" : mode === "sign-in" ? "Entrar" : "Criar acesso"}</button>
        </form>

        <div className="onboardingActions">
          <button className="backButton" type="button" onClick={() => { setError(""); setMode(mode === "sign-in" ? "sign-up" : "sign-in"); }}>
            {mode === "sign-in" ? "Ainda não tenho acesso" : "Já tenho acesso"}
          </button>
        </div>
      </section>
    </main>
  );
}
