import { tenantSql } from "@agesoma/db";

export const dynamic = "force-dynamic";

type Task = { id: string; status: string; payload: Record<string, unknown> };
type TeamMember = { id: string; name: string; role_title: string; department: string | null; availability: string };
type Assignment = {
  id: string;
  status: string;
  executor_type: "human" | "hermes";
  team_member_name: string | null;
  role_title: string | null;
  payload: Record<string, unknown>;
};
type Artifact = { id: string; title: string };
type OutcomeSummary = { verified_count: string | number; net_value_cents: string | number };

async function safeTenantSql<T>(tenantId: string, query: string, params: unknown[]) {
  try {
    return await tenantSql<T>(tenantId, query, params);
  } catch {
    return [] as T[];
  }
}

async function loadWorkspace() {
  const tenantId = process.env.AGESOMA_DEFAULT_TENANT_ID ?? process.env.INSTANTWORK_DEFAULT_TENANT_ID;
  if (!tenantId) return null;

  const [team, assignments, approvals, running, artifacts, outcomeRows] = await Promise.all([
    safeTenantSql<TeamMember>(tenantId, `
      select id,name,role_title,department,availability
      from team_members where tenant_id=$1 and availability <> 'inactive'
      order by name asc limit 50
    `, [tenantId]),
    safeTenantSql<Assignment>(tenantId, `
      select a.id,a.status,a.executor_type,m.name as team_member_name,m.role_title,t.payload
      from work_assignments a
      join tasks t on t.id=a.task_id and t.tenant_id=a.tenant_id
      left join team_members m on m.id=a.team_member_id and m.tenant_id=a.tenant_id
      where a.tenant_id=$1 and a.status in ('assigned','in_progress','blocked')
      order by case a.status when 'blocked' then 0 when 'in_progress' then 1 else 2 end,a.updated_at desc
      limit 30
    `, [tenantId]),
    safeTenantSql<Task>(tenantId, `select id,status,payload from tasks where tenant_id=$1 and status='awaiting_approval' order by updated_at desc limit 10`, [tenantId]),
    safeTenantSql<Task>(tenantId, `select id,status,payload from tasks where tenant_id=$1 and status='running' order by updated_at desc limit 5`, [tenantId]),
    safeTenantSql<Artifact>(tenantId, `select id,title from artifacts where tenant_id=$1 order by created_at desc limit 1`, [tenantId]),
    safeTenantSql<OutcomeSummary>(tenantId, `select count(*) as verified_count,coalesce(sum(net_value_cents),0) as net_value_cents from outcome_events where tenant_id=$1`, [tenantId])
  ]);

  return { team, assignments, approvals, running, artifacts, outcomes: outcomeRows[0] };
}

function money(value: string | number | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value ?? 0) / 100);
}

function objective(payload: Record<string, unknown>) {
  return typeof payload.objective === "string" ? payload.objective : "Trabalho em andamento";
}

function assignmentObjective(assignment: Assignment) {
  return objective(assignment.payload);
}

function statusLabel(status: string) {
  if (status === "blocked") return "Travado";
  if (status === "in_progress") return "Em andamento";
  return "Atribuído";
}

function BrandWordmark() {
  return <img src="/agesoma-wordmark.jpeg" alt="AGESOMA" width="148" height="53" />;
}

function IntelligenceOrb() {
  return (
    <div className="orbMaterial r3OrbCompact" aria-label="AGESOMA trabalhando">
      <span className="orbLobe orbLobeA" />
      <span className="orbLobe orbLobeB" />
      <span className="orbGrain" />
    </div>
  );
}

export default async function Home() {
  const workspace = await loadWorkspace();
  const team = workspace?.team ?? [];
  const assignments = workspace?.assignments ?? [];
  const approvals = workspace?.approvals ?? [];
  const running = workspace?.running?.[0];
  const blocked = assignments.filter((assignment) => assignment.status === "blocked");
  const verifiedCount = Number(workspace?.outcomes?.verified_count ?? 0);
  const lastArtifact = workspace?.artifacts?.[0];

  const primary = approvals[0] ? {
    eyebrow: "Precisa de você",
    title: approvals.length === 1 ? "Há uma decisão esperando por você." : `Há ${approvals.length} decisões esperando por você.`,
    body: objective(approvals[0].payload),
    action: "Ver decisão",
    href: "#trabalho"
  } : blocked[0] ? {
    eyebrow: "Travado",
    title: "Há trabalho que precisa ser destravado.",
    body: assignmentObjective(blocked[0]),
    action: "Ver trabalho",
    href: "#trabalho"
  } : running ? {
    eyebrow: "AGESOMA trabalhando",
    title: "Estou resolvendo trabalho da empresa agora.",
    body: objective(running.payload),
    action: "Acompanhar",
    href: "#trabalho"
  } : {
    eyebrow: "AGESOMA",
    title: "O que precisa andar na empresa hoje?",
    body: "Eu organizo responsáveis, acompanho o trabalho e assumo o que puder ser resolvido digitalmente.",
    action: "Organizar agora",
    href: "/onboarding"
  };

  const next = approvals.length
    ? { title: "Resolver a decisão pendente", body: "Você só entra quando uma decisão realmente precisa ser sua.", href: "#trabalho", label: "Revisar" }
    : blocked.length
      ? { title: "Destravar o que parou", body: "Veja quem está responsável e o que falta para o trabalho avançar.", href: "#trabalho", label: "Abrir" }
      : team.length === 0
        ? { title: "Cadastrar a equipe", body: "Para organizar a empresa, preciso saber quem faz o quê.", href: "/onboarding", label: "Começar" }
        : { title: "Definir a próxima prioridade", body: "Diga o que precisa acontecer e eu organizo quem deve assumir.", href: "/onboarding", label: "Pedir" };

  return (
    <main className="productShell" id="inicio">
      <header className="topbar">
        <a className="agesomaBrandLink" href="#inicio" aria-label="AGESOMA"><BrandWordmark /></a>
        <a className="primaryCta" href="/onboarding">Organizar trabalho</a>
      </header>

      <nav className="nav" aria-label="Navegação principal">
        <a className="navItem active" href="#inicio">Início</a>
        <a className="navItem" href="#equipe">Equipe</a>
        <a className="navItem" href="#trabalho">Trabalho</a>
        <a className="navItem" href="#resultados">Resultados</a>
      </nav>

      <section className="r3ActionHero">
        <div className="r3ActionHeroCopy">
          <div className="eyebrow">{primary.eyebrow}</div>
          <h1>{primary.title}</h1>
          <p className="heroLead">{primary.body}</p>
          <div className="heroActions">
            <a className="primaryCta" href={primary.href}>{primary.action}</a>
            <span className="heroTruth">Você vê responsáveis, bloqueios e resultados. O restante fica nos bastidores.</span>
          </div>
        </div>

        {running ? (
          <aside className="r3LiveIntelligence">
            <IntelligenceOrb />
            <div>
              <span className="monoLabel">TRABALHANDO</span>
              <strong>{objective(running.payload)}</strong>
              <p>Há execução digital real em andamento.</p>
            </div>
          </aside>
        ) : (
          <aside className="r3QuietMaterial">
            <div>
              <span className="monoLabel">AGORA</span>
              <strong>{workspace ? "Empresa acompanhada." : "Pronto para organizar."}</strong>
              <p>{workspace ? "Nenhuma execução digital ativa neste momento." : "Comece dizendo quem está na equipe e o que precisa avançar."}</p>
            </div>
          </aside>
        )}
      </section>

      <section className="r3NextBestAction">
        <span className="workspaceLabel">Próximo passo</span>
        <div><strong>{next.title}</strong><p>{next.body}</p></div>
        <a href={next.href}>{next.label} →</a>
      </section>

      <section className="r3MetricStrip" aria-label="Resumo da empresa">
        <div><span>Equipe</span><strong>{team.length}</strong></div>
        <div><span>Trabalho ativo</span><strong>{assignments.length}</strong></div>
        <div><span>Precisa de você</span><strong>{approvals.length + blocked.length}</strong></div>
      </section>

      <section className="workspaceSection" id="equipe">
        <div className="sectionIntro">
          <div className="eyebrow">Equipe</div>
          <h2>Quem faz o quê na empresa.</h2>
          <p>A AGESOMA usa funções e responsabilidades para distribuir trabalho sem transformar a empresa em um painel de tarefas.</p>
        </div>
        <div className="workspaceStack">
          {team.length ? team.map((member) => {
            const memberWork = assignments.filter((assignment) => assignment.team_member_name === member.name).length;
            return (
              <article className="workspaceRow" key={member.id}>
                <span className="workspaceLabel">{member.department ?? "Equipe"}</span>
                <div><strong>{member.name}</strong><p>{member.role_title} · {memberWork ? `${memberWork} trabalho${memberWork === 1 ? "" : "s"} ativo${memberWork === 1 ? "" : "s"}` : "Sem trabalho ativo"}</p></div>
                <span className="quietStatus">{memberWork || "—"}</span>
              </article>
            );
          }) : (
            <article className="workspaceRow">
              <span className="workspaceLabel">Equipe</span>
              <div><strong>Ainda não conheço sua equipe.</strong><p>Cadastre nomes, funções e responsabilidades para eu começar a organizar o trabalho.</p></div>
              <a href="/onboarding">Configurar →</a>
            </article>
          )}
        </div>
      </section>

      <section className="workspaceSection" id="trabalho">
        <div className="sectionIntro">
          <div className="eyebrow">Trabalho</div>
          <h2>Um responsável para cada coisa.</h2>
          <p>Quando precisa de uma pessoa, o trabalho fica com a pessoa certa. Quando não precisa, a AGESOMA assume digitalmente.</p>
        </div>
        <div className="workspaceStack">
          {assignments.length ? assignments.map((assignment) => (
            <article className="workspaceRow" key={assignment.id}>
              <span className="workspaceLabel">{statusLabel(assignment.status)}</span>
              <div>
                <strong>{assignmentObjective(assignment)}</strong>
                <p>Responsável: {assignment.executor_type === "human" ? assignment.team_member_name ?? "Equipe" : "AGESOMA"}{assignment.role_title ? ` · ${assignment.role_title}` : ""}</p>
              </div>
              <span className="quietStatus">{assignment.status === "blocked" ? "!" : "→"}</span>
            </article>
          )) : (
            <article className="workspaceRow">
              <span className="workspaceLabel">Trabalho</span>
              <div><strong>Nada atribuído agora.</strong><p>Diga o que precisa acontecer e eu organizo o responsável.</p></div>
              <a href="/onboarding">Pedir →</a>
            </article>
          )}
          {approvals[0] ? (
            <article className="workspaceRow">
              <span className="workspaceLabel">Sua decisão</span>
              <div><strong>{objective(approvals[0].payload)}</strong><p>Este trabalho não avança sem uma decisão sua.</p></div>
              <span className="quietStatus">!</span>
            </article>
          ) : null}
        </div>
      </section>

      <section className="resultSection" id="resultados">
        <div className="sectionIntro">
          <div className="eyebrow">Resultados</div>
          <h2>{verifiedCount ? `${money(workspace?.outcomes?.net_value_cents)} de impacto confirmado.` : "O que foi concluído de verdade."}</h2>
          <p>{verifiedCount ? `${verifiedCount} resultado${verifiedCount === 1 ? "" : "s"} comprovado${verifiedCount === 1 ? "" : "s"}.` : "Sem atividade vazia: resultado só aparece quando há evidência."}</p>
        </div>
        <div className="workspaceCard">
          <span className="workspaceLabel">Última entrega</span>
          <strong>{lastArtifact?.title ?? "Ainda não há uma entrega concluída."}</strong>
          <p>{lastArtifact ? "A entrega continua ligada ao trabalho e ao responsável que a produziu." : "Quando algo for concluído, você verá aqui."}</p>
        </div>
      </section>
    </main>
  );
}
