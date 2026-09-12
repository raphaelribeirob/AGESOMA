import { tenantSql } from "@agesoma/db";

export const dynamic = "force-dynamic";

const nav = ["Início", "Pedir", "Oportunidades", "Trabalhos", "Resultados", "Aprovações", "Conexões"];

type Task = { id: string; status: string; action_type: string; payload: Record<string, unknown>; updated_at: string };
type Opportunity = { id: string; title: string; summary: string; confidence: string | number; created_at: string };
type Artifact = { id: string; title: string; kind: string; created_at: string };
type OutcomeSummary = { verified_count: string | number; attributed_revenue_cents: string | number; total_cost_cents: string | number; net_value_cents: string | number };

async function loadWorkspace() {
  const tenantId = process.env.INSTANTWORK_DEFAULT_TENANT_ID;
  if (!tenantId) return null;

  const [tasks, opportunities, approvals, artifacts, outcomeRows] = await Promise.all([
    tenantSql<Task>(tenantId, `select id, status, action_type, payload, updated_at from tasks where tenant_id=$1 and status in ('queued','running','failed') order by updated_at desc limit 6`, [tenantId]),
    tenantSql<Opportunity>(tenantId, `select id, title, summary, confidence, created_at from opportunities where tenant_id=$1 and status='open' order by created_at desc limit 6`, [tenantId]),
    tenantSql<Task>(tenantId, `select id, status, action_type, payload, updated_at from tasks where tenant_id=$1 and status='awaiting_approval' order by updated_at desc limit 6`, [tenantId]),
    tenantSql<Artifact>(tenantId, `select id, title, kind, created_at from artifacts where tenant_id=$1 order by created_at desc limit 1`, [tenantId]),
    tenantSql<OutcomeSummary>(tenantId, `select count(*) as verified_count, coalesce(sum(attributed_revenue_cents),0) as attributed_revenue_cents, coalesce(sum(total_cost_cents),0) as total_cost_cents, coalesce(sum(net_value_cents),0) as net_value_cents from outcome_events where tenant_id=$1`, [tenantId])
  ]);

  return { tasks, opportunities, approvals, artifacts, outcomes: outcomeRows[0] };
}

function money(value: string | number | undefined) {
  const cents = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

function objective(payload: Record<string, unknown>) {
  return typeof payload.objective === "string" ? payload.objective : "Trabalho em andamento";
}

function IntelligenceOrb({ active }: { active: boolean }) {
  return (
    <aside className="orbStage" aria-label="Estado do InstantWork">
      <div className="orbMaterial" aria-hidden="true">
        <span className="orbLobe orbLobeA" />
        <span className="orbLobe orbLobeB" />
        <span className="orbGrain" />
      </div>
      <div className="orbMeta">
        <span className="monoLabel">{active ? "TRABALHANDO" : "DISPONÍVEL"}</span>
        <strong>{active ? "Há trabalho em andamento" : "Pronto para trabalhar"}</strong>
        <p>Você explica o resultado. O InstantWork cuida da execução e pede sua decisão quando houver consequência externa.</p>
      </div>
    </aside>
  );
}

export default async function Home() {
  const workspace = await loadWorkspace();
  const activeTasks = workspace?.tasks ?? [];
  const approvals = workspace?.approvals ?? [];
  const opportunities = workspace?.opportunities ?? [];
  const lastArtifact = workspace?.artifacts?.[0];
  const outcomes = workspace?.outcomes;

  return (
    <main className="productShell">
      <header className="topbar"><div className="brand">InstantWork</div></header>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map((item, index) => <span className={index === 0 ? "navItem active" : "navItem"} key={item}>{item}</span>)}
      </nav>

      <section className="hero heroIntent">
        <div className="heroCopy">
          <div className="eyebrow">Seu trabalho, resolvido</div>
          <h1>O que precisa mudar no seu negócio?</h1>
          <p className="heroLead">Peça como pediria a alguém da sua equipe. O produto não expõe agentes, prompts ou infraestrutura.</p>
          <div className="heroActions">
            <a className="primaryCta" href="/onboarding">Pedir um trabalho</a>
            <span className="heroTruth">Ações externas são resolvidas primeiro e só depois aparecem para sua autorização.</span>
          </div>
        </div>
        <IntelligenceOrb active={activeTasks.some((task) => task.status === "running")} />
      </section>

      <section className="workspaceSection">
        <div className="sectionIntro">
          <div className="eyebrow">Agora</div>
          <h2>Só o que importa.</h2>
          <p>{workspace ? "Estado real do seu Work Cell." : "Configure INSTANTWORK_DEFAULT_TENANT_ID para ligar esta alpha a um Work Cell real."}</p>
        </div>

        <div className="workspaceStack">
          <article className="workspaceRow">
            <span className="workspaceLabel">Trabalhando</span>
            <div><strong>{activeTasks.length ? `${activeTasks.length} trabalho(s) ativo(s)` : "Nada em andamento"}</strong><p>{activeTasks[0] ? objective(activeTasks[0].payload) : "Um novo pedido aparece aqui quando entrar na fila."}</p></div>
            <span className="quietStatus">{activeTasks[0]?.status ?? "—"}</span>
          </article>
          <article className="workspaceRow">
            <span className="workspaceLabel">Precisa de você</span>
            <div><strong>{approvals.length ? `${approvals.length} decisão(ões)` : "Nenhuma decisão pendente"}</strong><p>{approvals[0] ? objective(approvals[0].payload) : "O InstantWork só interrompe quando uma consequência precisa da sua autorização."}</p></div>
            <span className="quietStatus">{approvals.length || "—"}</span>
          </article>
          <article className="workspaceRow">
            <span className="workspaceLabel">Oportunidades</span>
            <div><strong>{opportunities.length ? opportunities[0].title : "Nenhuma oportunidade confirmada"}</strong><p>{opportunities[0]?.summary ?? "Watchers colocam aqui apenas oportunidades acompanhadas de evidência."}</p></div>
            <span className="quietStatus">{opportunities.length || "—"}</span>
          </article>
        </div>
      </section>

      <section className="resultSection">
        <div>
          <div className="eyebrow">Valor comprovado</div>
          <h2>{Number(outcomes?.verified_count ?? 0) ? `${money(outcomes?.net_value_cents)} líquidos confirmados` : "Ainda sem resultado econômico verificado."}</h2>
          <p>Receita atribuída: {money(outcomes?.attributed_revenue_cents)} · custo registrado: {money(outcomes?.total_cost_cents)}.</p>
        </div>
        <div className="artifactCard workspaceCard">
          <span className="workspaceLabel">Último resultado</span>
          <strong>{lastArtifact?.title ?? "Nenhum resultado concluído ainda"}</strong>
          <p>{lastArtifact ? "O artefato permanece ligado à tarefa e à evidência que o produziu." : "Quando houver execução real, o trabalho concluído aparece aqui."}</p>
        </div>
      </section>
    </main>
  );
}
