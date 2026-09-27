"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  permissions: Record<string, boolean>;
  status: string;
};

type ProviderOption = {
  provider: string;
  authorizationAvailable: boolean;
  permissionOptions: string[];
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: "low" | "normal" | "high";
  progress: number | string;
  due_at: string | null;
};

type Activity = {
  id: string;
  event_type: string;
  title: string;
  summary: string | null;
  status: string;
  created_at: string;
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
  delivery_mode?: string;
  created_at: string;
};

type ToolRecipe = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "validated" | "approved" | "disabled";
  tool_kind: string;
  source_url: string | null;
  spec_url: string | null;
  base_url: string | null;
  risk_class: string;
  auth_mode: string;
  validation: {
    contractValid?: boolean;
    readOnly?: boolean;
    externalExecutionTested?: boolean;
    testMode?: string;
    notes?: string[];
  };
  permissions: Record<string, boolean>;
  approved_at: string | null;
  last_tested_at: string | null;
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

const permissionLabels: Record<string, string> = {
  read: "Ler",
  search: "Pesquisar",
  draft: "Criar rascunhos",
  send: "Enviar",
  delete: "Excluir",
  create: "Criar",
  update: "Alterar",
  create_drafts: "Criar rascunhos",
  pause: "Pausar",
  activate: "Ativar",
  change_budget: "Alterar orçamento"
};

export default function SettingsPage() {
  const [context, setContext] = useState<ContextEntry[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
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
  const [tools, setTools] = useState<ToolRecipe[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalPriority, setGoalPriority] = useState<Goal["priority"]>("normal");
  const [watchObjective, setWatchObjective] = useState("");
  const [watchKind, setWatchKind] = useState("general");
  const [watchCadence, setWatchCadence] = useState("6h");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const [contextResponse, connectionsResponse, proactivityResponse, goalsResponse, activityResponse, toolsResponse] = await Promise.all([
      fetch("/api/personal-context", { cache: "no-store" }),
      fetch("/api/connections", { cache: "no-store" }),
      fetch("/api/proactivity", { cache: "no-store" }),
      fetch("/api/goals", { cache: "no-store" }),
      fetch("/api/activity?limit=30", { cache: "no-store" }),
      fetch("/api/tools", { cache: "no-store" })
    ]);

    if (
      !contextResponse.ok ||
      !connectionsResponse.ok ||
      !proactivityResponse.ok ||
      !goalsResponse.ok ||
      !activityResponse.ok ||
      !toolsResponse.ok
    ) {
      throw new Error("Não foi possível carregar seus ajustes.");
    }

    const [contextBody, connectionsBody, proactivityBody, goalsBody, activityBody, toolsBody] = await Promise.all([
      contextResponse.json(),
      connectionsResponse.json(),
      proactivityResponse.json(),
      goalsResponse.json(),
      activityResponse.json(),
      toolsResponse.json()
    ]);

    setContext(contextBody.entries ?? []);
    setConnections(connectionsBody.services ?? []);
    setProviders(connectionsBody.providers ?? []);
    setPreferences(proactivityBody.preferences);
    setWatchers(proactivityBody.routines ?? proactivityBody.watchers ?? []);
    setInterruptions(proactivityBody.interruptions ?? []);
    setGoals(goalsBody.goals ?? []);
    setActivity(activityBody.activity ?? []);
    setTools(toolsBody.tools ?? []);
  }

  useEffect(() => {
    void load().catch((error) => setNotice(error instanceof Error ? error.message : "Não foi possível carregar seus ajustes."));
  }, []);

  const activeConnections = useMemo(
    () => new Map(connections.filter((item) => item.status === "active").map((item) => [item.provider, item])),
    [connections]
  );

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  async function correctMemory(entry: ContextEntry) {
    if (!editingValue.trim()) return;
    await run(async () => {
      const response = await fetch("/api/personal-context", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: entry.id, value: editingValue.trim() })
      });
      if (!response.ok) throw new Error("Não foi possível corrigir esse contexto.");
      setEditingId(null);
      setEditingValue("");
      await load();
    }, "Não foi possível corrigir esse contexto.");
  }

  async function forgetMemory(id: string) {
    await run(async () => {
      const response = await fetch(`/api/personal-context?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível apagar esse contexto.");
      await load();
    }, "Não foi possível apagar esse contexto.");
  }

  async function createGoal() {
    if (goalTitle.trim().length < 2) return;
    await run(async () => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: goalTitle.trim(), priority: goalPriority })
      });
      if (!response.ok) throw new Error("Não foi possível criar essa meta.");
      setGoalTitle("");
      setGoalPriority("normal");
      await load();
    }, "Não foi possível criar essa meta.");
  }

  async function setGoalStatus(id: string, status: "active" | "paused" | "completed") {
    await run(async () => {
      const response = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status, ...(status === "completed" ? { progress: 1 } : {}) })
      });
      if (!response.ok) throw new Error("Não foi possível atualizar essa meta.");
      await load();
    }, "Não foi possível atualizar essa meta.");
  }

  async function disconnectConnection(id: string) {
    await run(async () => {
      const response = await fetch(`/api/connections?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível desconectar esse serviço.");
      await load();
    }, "Não foi possível desconectar esse serviço.");
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

  async function setConnectionPermission(connection: Connection, key: string, enabled: boolean) {
    const nextPermissions = { ...(connection.permissions ?? {}), [key]: enabled };
    await run(async () => {
      const response = await fetch("/api/connections", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: connection.id, permissions: nextPermissions })
      });
      if (!response.ok) throw new Error("Não foi possível atualizar essa permissão.");
      await load();
    }, "Não foi possível atualizar essa permissão.");
  }

  async function approveTool(id: string) {
    await run(async () => {
      const response = await fetch("/api/tools", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action: "approve" })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Não foi possível aprovar essa ferramenta.");
      await load();
    }, "Não foi possível aprovar essa ferramenta.");
  }

  async function disableTool(id: string) {
    await run(async () => {
      const response = await fetch("/api/tools", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action: "disable" })
      });
      if (!response.ok) throw new Error("Não foi possível desativar essa ferramenta.");
      await load();
    }, "Não foi possível desativar essa ferramenta.");
  }

  async function savePreferences() {
    await run(async () => {
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
    }, "Não foi possível salvar a proatividade.");
  }

  async function addWatcher() {
    if (watchObjective.trim().length < 3) return;
    await run(async () => {
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
      if (!response.ok) throw new Error("Não foi possível criar a rotina.");
      setWatchObjective("");
      await load();
    }, "Não foi possível criar a rotina.");
  }

  async function pauseWatcher(id: string) {
    await run(async () => {
      const response = await fetch(`/api/proactivity?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível pausar essa rotina.");
      await load();
    }, "Não foi possível pausar essa rotina.");
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
        <span className="monoLabel">MEMÓRIA · METAS · ATIVIDADE</span>
      </header>

      <section className="settingsHero">
        <h1>Você controla o que eu sei, persigo e posso acessar.</h1>
        <p>Memória descreve contexto. Metas orientam trabalho contínuo. Conexões definem acesso. Permissão para uma ação continua sendo uma decisão separada.</p>
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
          <span className="monoLabel">METAS</span>
          <h2>O que estou tentando alcançar por você</h2>
          <p>Metas são objetivos persistentes. Elas não concedem permissão automática para ações externas.</p>
        </div>
        <div>
          <div className="settingsPanel goalComposer">
            <input className="settingsTextInput" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Ex.: reduzir o custo por aquisição do InstantSpeak" />
            <select value={goalPriority} onChange={(event) => setGoalPriority(event.target.value as Goal["priority"])}>
              <option value="low">Baixa prioridade</option>
              <option value="normal">Prioridade normal</option>
              <option value="high">Alta prioridade</option>
            </select>
            <button className="settingsPrimary" disabled={busy || goalTitle.trim().length < 2} onClick={() => void createGoal()}>Criar meta</button>
          </div>
          <div className="settingsStack">
            {goals.length ? goals.map((goal) => (
              <article className="settingsRow" key={goal.id}>
                <div>
                  <span className="settingsMeta">{goal.priority} · {Math.round(Number(goal.progress) * 100)}%</span>
                  <strong>{goal.title}</strong>
                  {goal.description ? <p className="settingsValue">{goal.description}</p> : null}
                </div>
                <div className="settingsActions">
                  {goal.status !== "completed" ? <button onClick={() => void setGoalStatus(goal.id, "completed")}>Concluir</button> : <span className="connectionStatus">concluída</span>}
                  {goal.status === "active" ? <button className="quiet" onClick={() => void setGoalStatus(goal.id, "paused")}>Pausar</button> : null}
                  {goal.status === "paused" ? <button className="quiet" onClick={() => void setGoalStatus(goal.id, "active")}>Retomar</button> : null}
                </div>
              </article>
            )) : <p className="settingsEmpty">Nenhuma meta ativa ainda.</p>}
          </div>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">CONEXÕES</span>
          <h2>Serviços e permissões</h2>
          <p>As credenciais ficam fora do executor. Você define separadamente o que cada serviço pode permitir.</p>
        </div>
        <div className="settingsStack">
          {providers.map((item) => {
            const connection = activeConnections.get(item.provider);
            return (
              <article className="settingsConnectionCard" key={item.provider}>
                <div className="settingsConnectionHeader">
                  <div>
                    <strong>{providerLabels[item.provider] ?? item.provider}</strong>
                    <p>{connection ? connection.display_name ?? "Conectado" : "Não conectado"}</p>
                  </div>
                  <div>
                    {connection ? (
                      <div className="settingsActions">
                        <span className="connectionStatus">ativo</span>
                        <button className="quiet" disabled={busy} onClick={() => void disconnectConnection(connection.id)}>Desconectar</button>
                      </div>
                    ) : (
                      <button disabled={!item.authorizationAvailable || busy} onClick={() => void beginConnection(item.provider)}>
                        {item.authorizationAvailable ? "Conectar" : "OAuth não configurado"}
                      </button>
                    )}
                  </div>
                </div>
                {connection ? (
                  <div className="permissionGrid">
                    {item.permissionOptions.map((permission) => (
                      <label key={permission} className="permissionOption">
                        <input
                          type="checkbox"
                          checked={connection.permissions?.[permission] === true}
                          disabled={busy}
                          onChange={(event) => void setConnectionPermission(connection, permission, event.target.checked)}
                        />
                        <span>{permissionLabels[permission] ?? permission}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">FERRAMENTAS</span>
          <h2>Ferramentas que aprendi</h2>
          <p>APIs descobertas podem virar ferramentas read-only. Nada é reutilizado até você aprovar.</p>
        </div>
        <div className="settingsStack">
          {tools.length ? tools.map((tool) => (
            <article className="settingsRow" key={tool.id}>
              <div>
                <span className="settingsMeta">{tool.status} · {tool.risk_class} · {tool.auth_mode}</span>
                <strong>{tool.name}</strong>
                <p className="settingsValue">{tool.description}</p>
                {tool.validation?.testMode ? (
                  <p className="settingsValue">
                    Validação: {tool.validation.testMode === "contract_only" ? "contrato OpenAPI" : tool.validation.testMode}
                    {tool.validation.externalExecutionTested ? " · chamada externa testada" : " · sem chamada externa automática"}
                  </p>
                ) : null}
              </div>
              <div className="settingsActions">
                {tool.status === "validated" ? (
                  <button disabled={busy} onClick={() => void approveTool(tool.id)}>Aprovar</button>
                ) : null}
                {tool.status === "approved" ? <span className="connectionStatus">aprovada</span> : null}
                {tool.status !== "disabled" ? (
                  <button className="quiet" disabled={busy} onClick={() => void disableTool(tool.id)}>Desativar</button>
                ) : <span className="connectionStatus">desativada</span>}
              </div>
            </article>
          )) : <p className="settingsEmpty">Nenhuma ferramenta aprendida ainda.</p>}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">ROTINAS</span>
          <h2>Quando devo agir sozinho?</h2>
          <p>O Attention Engine decide entre guardar, incluir no resumo, avisar agora ou pedir aprovação.</p>
        </div>
        <div>
          <div className="settingsPanel">
            <label className="settingsToggle">
              <input type="checkbox" checked={preferences.enabled} onChange={(event) => setPreferences({ ...preferences, enabled: event.target.checked })} />
              <span>Permitir rotinas proativas</span>
            </label>
            <div className="settingsFields">
              <label>Fuso horário<input value={preferences.timezone} onChange={(event) => setPreferences({ ...preferences, timezone: event.target.value })} /></label>
              <label>Máximo de interrupções/dia<input type="number" min={0} max={24} value={preferences.max_interruptions_per_day} onChange={(event) => setPreferences({ ...preferences, max_interruptions_per_day: Number(event.target.value) })} /></label>
              <label>Silêncio a partir de<input type="time" value={preferences.quiet_hours_start ?? ""} onChange={(event) => setPreferences({ ...preferences, quiet_hours_start: event.target.value || null })} /></label>
              <label>Silêncio até<input type="time" value={preferences.quiet_hours_end ?? ""} onChange={(event) => setPreferences({ ...preferences, quiet_hours_end: event.target.value || null })} /></label>
            </div>
            <button className="settingsPrimary" disabled={busy} onClick={() => void savePreferences()}>Salvar preferências</button>
          </div>

          <div className="settingsPanel">
            <span className="monoLabel">NOVA ROTINA</span>
            <textarea className="settingsTextarea" rows={3} placeholder="Ex.: acompanhe meu Meta Ads e me avise somente se houver desperdício relevante ou uma decisão que precise de mim." value={watchObjective} onChange={(event) => setWatchObjective(event.target.value)} />
            <div className="settingsFields compact">
              <label>Tipo<select value={watchKind} onChange={(event) => setWatchKind(event.target.value)}><option value="general">Geral</option><option value="calendar">Agenda</option><option value="communication">Comunicação</option><option value="paid_media">Tráfego pago</option></select></label>
              <label>Frequência<select value={watchCadence} onChange={(event) => setWatchCadence(event.target.value)}><option value="1h">A cada hora</option><option value="6h">A cada 6 horas</option><option value="1d">Diariamente</option><option value="7d">Semanalmente</option></select></label>
            </div>
            <button className="settingsPrimary" disabled={busy || watchObjective.trim().length < 3} onClick={() => void addWatcher()}>Criar rotina</button>
            {watchers.length ? <div className="watcherList">{watchers.map((watcher) => <div key={watcher.id}><strong>{watcher.config.objective ?? "Rotina"}</strong><span>{watcher.cadence} · {watcher.status}</span>{watcher.status === "active" ? <button className="watcherPause" disabled={busy} onClick={() => void pauseWatcher(watcher.id)}>Pausar</button> : null}</div>)}</div> : null}
          </div>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">ATENÇÃO</span>
          <h2>O que merece interromper você</h2>
          <p>Avisos imediatos e itens de resumo vêm de uma decisão explícita de atenção.</p>
        </div>
        <div className="settingsStack">
          {interruptions.length ? interruptions.map((item) => (
            <article className="settingsRow" key={item.id}>
              <div>
                <span className="settingsMeta">{item.delivery_mode ?? "notify"} · {item.kind}</span>
                <p className="settingsValue">{item.summary}</p>
              </div>
              <div className="settingsActions">
                {item.status === "unread" ? <button onClick={() => void markInterruption(item.id, "read")}>Marcar como lido</button> : <span className="connectionStatus">{item.status}</span>}
              </div>
            </article>
          )) : <p className="settingsEmpty">Nenhum aviso proativo ainda.</p>}
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsIntro">
          <span className="monoLabel">ATIVIDADE</span>
          <h2>O que foi feito</h2>
          <p>Registro recente de pedidos, conclusões, metas, conexões e decisões de atenção.</p>
        </div>
        <div className="settingsStack">
          {activity.length ? activity.map((item) => (
            <article className="settingsRow" key={item.id}>
              <div>
                <span className="settingsMeta">{item.event_type} · {new Date(item.created_at).toLocaleString("pt-BR")}</span>
                <strong>{item.title}</strong>
                {item.summary ? <p className="settingsValue">{item.summary}</p> : null}
              </div>
              <span className="connectionStatus">{item.status}</span>
            </article>
          )) : <p className="settingsEmpty">Nenhuma atividade registrada ainda.</p>}
        </div>
      </section>
    </main>
  );
}
