"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ContextEntry = {
  id: string;
  kind: string;
  value: string;
  source_type: string;
  created_at: string;
};

type Connection = {
  id: string;
  provider: string;
  external_account_id: string;
  display_name: string | null;
  status: string;
};

type ProviderOption = {
  provider: string;
  authorizationAvailable: boolean;
};

type Preferences = {
  enabled: boolean;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  max_interruptions_per_day: number;
  allowed_kinds: string[];
};

type Watcher = {
  id: string;
  cadence: string | null;
  config: { objective?: string; proactivityKind?: string };
  status: string;
  interrupt_policy: string;
};

type Interruption = {
  id: string;
  kind: string;
  summary: string;
  status: string;
  created_at: string;
};

const providerLabels: Record<string, string> = {
  gmail: "Gmail",
  google_calendar: "Google Calendar",
  google_drive: "Google Drive",
  google_contacts: "Google Contacts",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  whatsapp: "WhatsApp"
};

export default function SettingsPage() {
  const [context, setContext] = useState<ContextEntry[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    enabled: false,
    timezone: "UTC",
    quiet_hours_start: null,
    quiet_hours_end: null,
    max_interruptions_per_day: 3,
    allowed_kinds: ["calendar", "communication", "paid_media", "general"]
  });
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [watchObjective, setWatchObjective] = useState("");
  const [watchKind, setWatchKind] = useState("general");
  const [watchCadence, setWatchCadence] = useState("6h");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const [contextResponse, connectionsResponse, proactivityResponse] = await Promise.all([
      fetch("/api/personal-context", { cache: "no-store" }),
      fetch("/api/connections", { cache: "no-store" }),
      fetch("/api/proactivity", { cache: "no-store" })
    ]);

    if (!contextResponse.ok || !connectionsResponse.ok || !proactivityResponse.ok) {
      throw new Error("Não foi possível carregar seus ajustes.");
    }

    const contextBody = await contextResponse.json();
    const connectionsBody = await connectionsResponse.json();
    const proactivityBody = await proactivityResponse.json();

    setContext(contextBody.entries ?? []);
    setConnections(connectionsBody.services ?? []);
    setProviders(connectionsBody.providers ?? []);
    setPreferences(proactivityBody.preferences);
    setWatchers(proactivityBody.watchers ?? []);
    setInterruptions(proactivityBody.interruptions ?? []);
  }

  useEffect(() => {
    void load().catch((error) => setNotice(error instanceof Error ? error.message : "Não foi possível carregar seus ajustes."));
  }, []);

  const activeConnections = useMemo(
    () => new Map(connections.filter((item) => item.status === "active").map((item) => [item.provider, item])),
    [connections]
  );

  async function correctMemory(entry: ContextEntry) {
    if (!editingValue.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/personal-context", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: entry.id, value: editingValue.trim() })
      });
      if (!response.ok) throw new Error("Não foi possível corrigir esse contexto.");
      setEditingId(null);
      setEditingValue("");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível corrigir esse contexto.");
    } finally {
      setBusy(false);
    }
  }

  async function forgetMemory(id: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/personal-context?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível apagar esse contexto.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível apagar esse contexto.");
    } finally {
      setBusy(false);
    }
  }

  async function beginConnection(provider: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "begin", provider })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível iniciar a conexão.");
      window.location.assign(body.authorizationUrl);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível iniciar a conexão.");
      setBusy(false);
    }
  }

  async function savePreferences() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/proactivity", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled: preferences.enabled,
          timezone: preferences.timezone,
          quietHoursStart: preferences.quiet_hours_start || null,
          quietHoursEnd: preferences.quiet_hours_end || null,
          maxInterruptionsPerDay: Number(preferences.max_interruptions_per_day),
          allowedKinds: preferences.allowed_kinds
        })
      });
      if (!response.ok) throw new Error("Não foi possível salvar a proatividade.");
      setNotice("Preferências salvas.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a proatividade.");
    } finally {
      setBusy(false);
    }
  }

  async function addWatcher() {
    if (watchObjective.trim().length < 3) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/proactivity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          objective: watchObjective.trim(),
          cadence: watchCadence,
          kind: watchKind,
          interruptPolicy: "only_if_actionable"
        })
      });
      if (!response.ok) throw new Error("Não foi possível criar o acompanhamento.");
      setWatchObjective("");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível criar o acompanhamento.");
    } finally {
      setBusy(false);
    }
  }

  async function markInterruption(id: string, status: "read" | "dismissed") {
    const response = await fetch("/api/proactivity", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (response.ok) await load();
  }

  return (
    <main className="settingsShell">
      <header className="settingsHeader">
        <Link href="/" className="settingsBack">← AGESOMA</Link>
        <span className="monoLabel">CONTEXTO E CONEXÕES</span>
      </header>

      <section className="settingsHero">
        <h1>Você controla o que eu sei e o que posso acessar.</h1>
        <p>Memória ajuda a entender contexto. Conexões dão acesso a serviços. Nenhuma das duas amplia permissões para ações consequenciais.</p>
      </section>

      {notice ? <div className="settingsNotice" role="status">{notice}</div> : null}

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">MEMÓRIA</span>
          <h2>Contexto pessoal</h2>
          <p>Revise, corrija ou apague o que a AGESOMA mantém como contexto ativo.</p>
        </div>
        <div className="settingsStack">
          {context.length ? context.map((entry) => (
            <article className="settingsRow" key={entry.id}>
              <div>
                <span className="settingsMeta">{entry.source_type.replaceAll("_", " ")}</span>
                {editingId === entry.id ? (
                  <textarea className="settingsTextarea" value={editingValue} onChange={(event) => setEditingValue(event.target.value)} rows={3} />
                ) : <p className="settingsValue">{entry.value}</p>}
              </div>
              <div className="settingsActions">
                {editingId === entry.id ? (
                  <>
                    <button disabled={busy} onClick={() => void correctMemory(entry)}>Salvar</button>
                    <button className="quiet" onClick={() => setEditingId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(entry.id); setEditingValue(entry.value); }}>Corrigir</button>
                    <button className="quiet" disabled={busy} onClick={() => void forgetMemory(entry.id)}>Apagar</button>
                  </>
                )}
              </div>
            </article>
          )) : <p className="settingsEmpty">Nenhum contexto pessoal salvo.</p>}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">CONEXÕES</span>
          <h2>Serviços</h2>
          <p>As credenciais ficam fora do agente. A AGESOMA recebe apenas a conexão e as permissões concedidas.</p>
        </div>
        <div className="settingsStack">
          {providers.map((item) => {
            const connection = activeConnections.get(item.provider);
            return (
              <article className="settingsRow settingsConnection" key={item.provider}>
                <div>
                  <strong>{providerLabels[item.provider] ?? item.provider}</strong>
                  <p>{connection ? connection.display_name ?? "Conectado" : "Não conectado"}</p>
                </div>
                <div>
                  {connection ? <span className="connectionStatus">ativo</span> : (
                    <button disabled={!item.authorizationAvailable || busy} onClick={() => void beginConnection(item.provider)}>
                      {item.authorizationAvailable ? "Conectar" : "OAuth não configurado"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">PROATIVIDADE</span>
          <h2>Quando devo agir sozinho?</h2>
          <p>Trabalho em segundo plano pode continuar sem interromper você. Os limites abaixo controlam quando a AGESOMA pode chamar sua atenção.</p>
        </div>
        <div className="settingsPanel">
          <label className="settingsToggle">
            <input type="checkbox" checked={preferences.enabled} onChange={(event) => setPreferences({ ...preferences, enabled: event.target.checked })} />
            <span>Permitir acompanhamento proativo</span>
          </label>

          <div className="settingsFields">
            <label>Fuso horário<input value={preferences.timezone} onChange={(event) => setPreferences({ ...preferences, timezone: event.target.value })} /></label>
            <label>Máximo de interrupções/dia<input type="number" min={0} max={24} value={preferences.max_interruptions_per_day} onChange={(event) => setPreferences({ ...preferences, max_interruptions_per_day: Number(event.target.value) })} /></label>
            <label>Silêncio a partir de<input type="time" value={preferences.quiet_hours_start ?? ""} onChange={(event) => setPreferences({ ...preferences, quiet_hours_start: event.target.value || null })} /></label>
            <label>Silêncio até<input type="time" value={preferences.quiet_hours_end ?? ""} onChange={(event) => setPreferences({ ...preferences, quiet_hours_end: event.target.value || null })} /></label>
          </div>
          <button className="settingsPrimary" disabled={busy} onClick={() => void savePreferences()}>Salvar proatividade</button>
        </div>

        <div className="settingsPanel">
          <span className="monoLabel">NOVO ACOMPANHAMENTO</span>
          <textarea className="settingsTextarea" rows={3} placeholder="Ex.: Acompanhe meu Meta Ads e só me avise se houver desperdício relevante ou uma decisão que precise de mim." value={watchObjective} onChange={(event) => setWatchObjective(event.target.value)} />
          <div className="settingsFields compact">
            <label>Tipo<select value={watchKind} onChange={(event) => setWatchKind(event.target.value)}><option value="general">Geral</option><option value="calendar">Agenda</option><option value="communication">Comunicação</option><option value="paid_media">Tráfego pago</option></select></label>
            <label>Frequência<select value={watchCadence} onChange={(event) => setWatchCadence(event.target.value)}><option value="1h">A cada hora</option><option value="6h">A cada 6 horas</option><option value="1d">Diariamente</option><option value="7d">Semanalmente</option></select></label>
          </div>
          <button className="settingsPrimary" disabled={busy || watchObjective.trim().length < 3} onClick={() => void addWatcher()}>Criar acompanhamento</button>
          {watchers.length ? <div className="watcherList">{watchers.map((watcher) => <div key={watcher.id}><strong>{watcher.config.objective ?? "Acompanhamento"}</strong><span>{watcher.cadence} · {watcher.status}</span></div>)}</div> : null}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">ATENÇÃO</span>
          <h2>Avisos recentes</h2>
          <p>Somente itens que passaram pela política de interrupção aparecem aqui.</p>
        </div>
        <div className="settingsStack">
          {interruptions.length ? interruptions.map((item) => (
            <article className="settingsRow" key={item.id}>
              <div>
                <span className="settingsMeta">{item.kind}</span>
                <p className="settingsValue">{item.summary}</p>
              </div>
              <div className="settingsActions">
                {item.status === "unread" ? <button onClick={() => void markInterruption(item.id, "read")}>Marcar como lido</button> : <span className="connectionStatus">{item.status}</span>}
              </div>
            </article>
          )) : <p className="settingsEmpty">Nenhum aviso proativo ainda.</p>}
        </div>
      </section>
    </main>
  );
}
