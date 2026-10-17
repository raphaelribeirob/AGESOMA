"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./ceo-intake.module.css";
import CeoCompanion from "./ceo-companion";
import CeoQuickWin from "./ceo-quick-win";

type IntakeFields = {
  companyName: string;
  website: string;
  sector: string;
  offer: string;
  customers: string;
  operations: string;
  challenge: string;
  objective: string;
};
type IntakeResponse = {
  status: "not_started" | "draft" | "owner_confirmed";
  fields: IntakeFields | null;
  fingerprint: string | null;
  canEdit: boolean;
  source: string | null;
  note: string;
};
const empty = (companyName: string): IntakeFields => ({
  companyName, website: "", sector: "", offer: "", customers: "",
  operations: "", challenge: "", objective: ""
});
const questions: {
  field: keyof IntakeFields;
  label: string;
  help: string;
  max: number;
  multiline?: boolean;
  required?: boolean;
}[] = [
  { field: "companyName", label: "Qual é o nome da empresa?", help: "Nome usado pelo CEO para identificar a empresa.", max: 160, required: true },
  { field: "website", label: "Qual é o site oficial?", help: "A URL será registrada, mas ainda não será rastreada automaticamente. HTTPS obrigatório.", max: 320 },
  { field: "sector", label: "Em qual setor ela atua?", help: "Ex.: serviços, SaaS, varejo, indústria.", max: 120, required: true },
  { field: "offer", label: "O que a empresa vende?", help: "Descreva produtos, serviços e a principal proposta de valor.", max: 1200, multiline: true, required: true },
  { field: "customers", label: "Quem são seus clientes?", help: "Público-alvo e principais necessidades.", max: 1200, multiline: true, required: true },
  { field: "operations", label: "Como a operação funciona hoje?", help: "Etapas principais, sistemas e pessoas envolvidas. Não cole credenciais ou informações pessoais.", max: 1200, multiline: true, required: true },
  { field: "challenge", label: "Qual é o maior problema agora?", help: "Identifique gargalos, custos ou oportunidades.", max: 1200, multiline: true, required: true },
  { field: "objective", label: "Qual resultado quer alcançar primeiro?", help: "Defina o que será considerado sucesso e como medir.", max: 1200, multiline: true, required: true }
];

export default function CeoIntake({ workspaceName }: { workspaceName: string }) {
  const [fields, setFields] = useState<IntakeFields>(() => empty(workspaceName));
  const [status, setStatus] = useState<IntakeResponse["status"]>("not_started");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/workforce/ceo/intake", { signal: controller.signal, cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar o perfil.");
        if (controller.signal.aborted) return;
        const data = body as IntakeResponse;
        if (data.fields) setFields(data.fields);
        setStatus(data.status);
        setFingerprint(data.fingerprint);
        setCanEdit(data.canEdit);
      } catch (ex) {
        if (!controller.signal.aborted) setError(ex instanceof Error ? ex.message : "Erro ao carregar.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true); setError(""); setMessage(""); setConsent(false);
    try {
      const response = await fetch("/api/workforce/ceo/intake", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "save_draft", ...fields })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar.");
      setStatus(body.status);
      setFingerprint(body.fingerprint);
      setDirty(false);
      setMessage("Rascunho salvo. Agora revise e confirme os dados.");
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  async function confirm() {
    if (!canEdit || saving || !fingerprint || !consent || dirty) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/workforce/ceo/intake", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "confirm", fingerprint, consent: true })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível confirmar.");
      setStatus(body.status);
      setMessage("Perfil confirmado pelo responsável. Isso não autoriza execução nem verifica documentos externos.");
      setConsent(false);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Erro ao confirmar.");
    } finally { setSaving(false); }
  }

  const editable = canEdit && !loading;
  const confirmed = status === "owner_confirmed" && !dirty;

  return (
    <main className={`${styles.page} ageTheme`}>
      <div className={styles.shell}>
        <nav aria-label="Navegação" className={styles.nav}>
          <Link href="/workforce">← Equipe executiva</Link>
          <span>AGESOMA · CEO + COO</span>
        </nav>
        <header className={styles.heading}>
          <div className={styles.kicker}>ETAPA 01 · CONHECIMENTO DA EMPRESA</div>
          <h1>Primeiro, o CEO entende seu negócio.</h1>
          <p>Comece com um diagnóstico local opcional, sem conexão bancária. Depois confirme os dados do negócio; o CEO poderá organizar as informações antes de propor ações aos demais agentes.</p>
          <div className={styles.stepBadge} role="status">
            {loading ? "Carregando…" : confirmed ? "Perfil confirmado pelo responsável" :
              status === "draft" || dirty ? "Informações ainda não confirmadas" : "Aguardando informações"}
          </div>
        </header>
        {!confirmed && <CeoQuickWin />}
        <div className={styles.layout}>
          <section className={styles.formCard} aria-label="Informações da empresa">
            {!loading && !canEdit && <p role="status" className={styles.message}>O CEO pode consultar informações confirmadas, mas somente o dono ou um administrador pode cadastrar e validar o perfil. Solicite ao responsável que conclua esta etapa.</p>}
            {loading ? <p>Carregando formulário…</p> : (
              <form onSubmit={(event) => void save(event)}>
                <h2>Mapa inicial da empresa</h2>
                <p>Os dados informados são declarações do proprietário. Não fazemos leitura automática de sites ou sistemas nesta etapa.</p>
                {questions.map((question) => (
                  <div className={styles.field} key={question.field}>
                    <label htmlFor={question.field}>{question.label}</label>
                    {question.multiline ? (
                      <textarea
                        id={question.field} rows={3} maxLength={question.max}
                        minLength={question.required ? 5 : undefined}
                        required={question.required}
                        value={fields[question.field]} disabled={!editable || saving}
                        onChange={(event) => { setFields((prev) => ({ ...prev, [question.field]: event.target.value })); setDirty(true); setConsent(false); }}
                      />
                    ) : (
                      <input
                        id={question.field} type={question.field === "website" ? "url" : "text"}
                        minLength={question.required ? 2 : undefined}
                        maxLength={question.max} required={question.required}
                        value={fields[question.field]} disabled={!editable || saving}
                        onChange={(event) => { setFields((prev) => ({ ...prev, [question.field]: event.target.value })); setDirty(true); setConsent(false); }}
                      />
                    )}
                    <small>{question.help}</small>
                  </div>
                ))}
                <button type="submit" className="ageButton ageButtonPrimary" disabled={!editable || saving || (!dirty && status !== "not_started")}>
                  {saving ? "Salvando…" : "Salvar mapa inicial"}
                </button>
              </form>
            )}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {message ? <p className={styles.message} role="status">{message}</p> : null}
          </section>
          <aside className={styles.review} aria-label="Revisão e próximas etapas">
            <h2>Revisão do CEO</h2>
            <p>Após salvar, confirme que o mapa representa sua empresa. Isso habilita um contexto declarado, não agentes autônomos.</p>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} disabled={!editable || saving || dirty || !fingerprint || confirmed}
                onChange={(event) => setConsent(event.target.checked)} />
              <span>Revisei as informações, tenho autorização para fornecê-las e confirmo que descrevem minha empresa.</span>
            </label>
            <button type="button" className="ageButton ageButtonSecondary"
              disabled={!editable || saving || !consent || dirty || !fingerprint || confirmed}
              onClick={() => void confirm()}>
              Confirmar informações
            </button>
            {confirmed && (
              <section className={styles.brief} aria-label="Mapa da empresa confirmado">
                <h3>Mapa confirmado pelo proprietário</h3>
                <dl>
                  <dt>O que vende</dt><dd>{fields.offer}</dd>
                  <dt>Quem atende</dt><dd>{fields.customers}</dd>
                  <dt>Como opera</dt><dd>{fields.operations}</dd>
                  <dt>Desafio atual</dt><dd>{fields.challenge}</dd>
                  <dt>Primeiro objetivo</dt><dd>{fields.objective}</dd>
                </dl>
                <p>Resumo organizado a partir das suas declarações; nenhuma fonte externa foi verificada.</p>
              </section>
            )}
            <div className={styles.divider} />
            <h3>O que vem depois</h3>
            <ol>
              <li>O CEO identifica processos e pontos que exigem esclarecimento.</li>
              <li>Você autoriza conexões e verifica as evidências.</li>
              <li>Ele encaminha tarefas ao CFO, CMO+CRO ou CTO+CPO.</li>
              <li>Cada execução requer recursos e permissões próprios, ainda em desenvolvimento.</li>
            </ol>
            <p className={styles.warning}>Sem documentos verificados ou integrações ativas, as respostas não devem ser tratadas como auditoria da empresa. Nenhuma ação externa é iniciada.</p>
          </aside>
        </div>
        {confirmed && <CeoCompanion profile={fields} />}
      </div>
    </main>
  );
}
