import { tenantSql } from "@agesoma/db";

export const dynamic = "force-dynamic";

type Task = { id: string; status: string; payload: Record<string, unknown> };
type Opportunity = { id: string; title: string; summary: string };
type Artifact = { id: string; title: string };
type OutcomeSummary = { verified_count: string | number; attributed_revenue_cents: string | number; total_cost_cents: string | number; net_value_cents: string | number };

async function loadWorkspace() {
  const tenantId = process.env.INSTANTWORK_DEFAULT_TENANT_ID;
  if (!tenantId) return null;
  const [tasks, opportunities, approvals, artifacts, outcomeRows] = await Promise.all([
    tenantSql<Task>(tenantId, `select id,status,payload from tasks where tenant_id=$1 and status in ('queued','running','failed') order by updated_at desc limit 6`, [tenantId]),
    tenantSql<Opportunity>(tenantId, `select id,title,summary from opportunities where tenant_id=$1 and status='open' order by created_at desc limit 6`, [tenantId]),
    tenantSql<Task>(tenantId, `select id,status,payload from tasks where tenant_id=$1 and status='awaiting_approval' order by updated_at desc limit 6`, [tenantId]),
    tenantSql<Artifact>(tenantId, `select id,title from artifacts where tenant_id=$1 order by created_at desc limit 1`, [tenantId]),
    tenantSql<OutcomeSummary>(tenantId, `select count(*) as verified_count,coalesce(sum(attributed_revenue_cents),0) as attributed_revenue_cents,coalesce(sum(total_cost_cents),0) as total_cost_cents,coalesce(sum(net_value_cents),0) as net_value_cents from outcome_events where tenant_id=$1`, [tenantId])
  ]);
  return { tasks, opportunities, approvals, artifacts, outcomes: outcomeRows[0] };
}

function money(value: string | number | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value ?? 0) / 100);
}

function objective(payload: Record<string, unknown>) {
  return typeof payload.objective === "string" ? payload.objective : "Trabalho em andamento";
}

function IntelligenceOrb() {
  return <div className="intelligenceOrb" aria-label="InstantWork trabalhando"><span className="orbField orbFieldA" /><span className="orbField orbFieldB" /><span className="orbTexture" /></div>;
}

export default async function Home() {
  const workspace = await loadWorkspace();
  const activeTasks = workspace?.tasks ?? [];
  const approvals = workspace?.approvals ?? [];
  const opportunities = workspace?.opportunities ?? [];
  const outcomes = workspace?.outcomes;
  const running = activeTasks.find((task) => task.status === "running");
  const firstApproval = approvals[0];
  const firstOpportunity = opportunities[0];
  const lastArtifact = workspace?.artifacts?.[0];
  const verifiedCount = Number(outcomes?.verified_count ?? 0);

  const primary = firstApproval ? {
    eyebrow: "Precisa de você", title: approvals.length === 1 ? "Tenho uma decisão pronta para você." : `Tenho ${approvals.length} decisões prontas para você.`, body: objective(firstApproval.payload), action: "Revisar agora", href: "#decisoes"
  } : running ? {
    eyebrow: "Em andamento", title: "Estou cuidando disso agora.", body: objective(running.payload), action: "Ver andamento", href: "#atividade"
  } : firstOpportunity ? {
    eyebrow: "Encontrei algo", title: firstOpportunity.title, body: firstOpportunity.summary, action: "Ver oportunidade", href: "#oportunidades"
  } : verifiedCount ? {
    eyebrow: "Resultado confirmado", title: `${money(outcomes?.net_value_cents)} de impacto líquido comprovado.`, body: "Só entra aqui o que puder ser confirmado.", action: "Ver resultados", href: "#resultados"
  } : {
    eyebrow: "InstantWork", title: "O que você quer resolver hoje?", body: "Peça como pediria a alguém da sua equipe. O InstantWork organiza o trabalho e chama você somente quando uma decisão realmente importa.", action: "Pedir algo", href: "/onboarding"
  };

  const next = firstApproval ? { title: "Revisar a decisão pendente", body: "Veja o contexto e decida sem precisar administrar a tecnologia por trás.", href: "#decisoes", label: "Revisar" }
    : firstOpportunity ? { title: "Decidir se vale agir agora", body: "Veja o que foi encontrado e transforme em trabalho somente se fizer sentido.", href: "#oportunidades", label: "Abrir" }
    : running ? { title: "Deixar o trabalho seguir", body: "Você será chamado se surgir uma mudança relevante ou uma decisão sua.", href: "#atividade", label: "Acompanhar" }
    : { title: "Fazer o primeiro pedido", body: "Comece pelo resultado que quer ver, não pela configuração de uma ferramenta.", href: "/onboarding", label: "Começar" };

  return <main className="productShell" id="inicio">
    <header className="topbar"><a className="brand" href="#inicio">InstantWork</a><a className="topbarAction" href="/onboarding">Pedir algo</a></header>
    <nav className="nav" aria-label="Navegação principal"><a className="navItem active" href="#inicio">Início</a><a className="navItem" href="#atividade">Trabalho</a><a className="navItem" href="#resultados">Resultados</a><a className="navItem" href="#conexoes">Conexões</a></nav>

    <section className="homeHero">
      <div className="homeHeroCopy"><div className="eyebrow">{primary.eyebrow}</div><h1>{primary.title}</h1><p className="heroLead">{primary.body}</p><div className="heroActions"><a className="primaryCta" href={primary.href}>{primary.action}</a><span className="heroNote">Você acompanha o que importa sem administrar agentes, prompts ou automações.</span></div></div>
      {running ? <aside className="liveIntelligence"><IntelligenceOrb /><div className="liveCopy"><span className="monoLabel">TRABALHANDO</span><strong>{objective(running.payload)}</strong><p>Há trabalho real em andamento.</p></div></aside>
        : <aside className="quietState"><div className="quietGlyph" aria-hidden="true"><span /><span /><span /></div><div><span className="monoLabel">AGORA</span><strong>{workspace ? "Tudo sob controle." : "Pronto quando você estiver."}</strong><p>{workspace ? "Nenhuma execução ativa neste momento." : "Faça um pedido para começar."}</p></div></aside>}
    </section>

    <section className="nextBestAction"><span className="sectionKicker">Próximo passo</span><div><strong>{next.title}</strong><p>{next.body}</p></div><a href={next.href}>{next.label} →</a></section>
    <section className="metricStrip" aria-label="Resumo"><div><span>Trabalhando</span><strong>{activeTasks.length}</strong></div><div><span>Precisa de você</span><strong>{approvals.length}</strong></div><div><span>Encontrei</span><strong>{opportunities.length}</strong></div></section>

    <section className="activitySection" id="atividade"><div className="sectionIntro"><div className="eyebrow">Atividade</div><h2>Você vê o trabalho, não a complexidade.</h2><p>O que está acontecendo aparece em linguagem de negócio, com contexto suficiente para agir.</p></div><div className="activityList">
      <article className="activityRow"><span className="rowLabel">Agora</span><div><strong>{activeTasks.length ? `${activeTasks.length} trabalho${activeTasks.length === 1 ? "" : "s"} em andamento` : "Nada em andamento"}</strong><p>{activeTasks[0] ? objective(activeTasks[0].payload) : "Seu próximo pedido aparece aqui quando começar."}</p></div><span className="rowMeta">{activeTasks.length || "—"}</span></article>
      <article className="activityRow" id="decisoes"><span className="rowLabel">Decisões</span><div><strong>{approvals.length ? `${approvals.length} esperando por você` : "Nenhuma decisão pendente"}</strong><p>{firstApproval ? objective(firstApproval.payload) : "Você só será chamado quando uma escolha realmente precisar ser sua."}</p></div><span className="rowMeta">{approvals.length || "—"}</span></article>
      <article className="activityRow" id="oportunidades"><span className="rowLabel">Encontrei</span><div><strong>{firstOpportunity?.title ?? "Nada novo por enquanto"}</strong><p>{firstOpportunity?.summary ?? "Quando aparecer algo relevante para o negócio, você verá aqui."}</p></div><span className="rowMeta">{opportunities.length || "—"}</span></article>
    </div></section>

    <section className="resultsSection" id="resultados"><div className="resultHeadline"><div className="eyebrow">Resultados</div><h2>{verifiedCount ? `${money(outcomes?.net_value_cents)} de impacto líquido confirmado.` : "Resultados só aparecem quando podem ser comprovados."}</h2><p>{verifiedCount ? `Receita atribuída: ${money(outcomes?.attributed_revenue_cents)} · custo registrado: ${money(outcomes?.total_cost_cents)}.` : "Sem estimativas apresentadas como fato."}</p></div><div className="resultCard"><span className="sectionKicker">Última entrega</span><strong>{lastArtifact?.title ?? "Ainda não há uma entrega concluída."}</strong><p>{lastArtifact ? "A entrega permanece ligada ao trabalho que a produziu." : "Quando o primeiro trabalho terminar, o resultado fica disponível aqui."}</p></div></section>

    <section className="secondaryDestinations" id="conexoes"><a href="/onboarding"><span>Conexões</span><strong>Escolher onde o trabalho acontece →</strong></a><a href="#atividade"><span>Histórico</span><strong>Ver o que está acontecendo →</strong></a></section>
    <nav className="mobileNav" aria-label="Navegação móvel"><a className="active" href="#inicio">Início</a><a href="#atividade">Trabalho</a><a href="#resultados">Resultados</a><a href="/onboarding">Pedir</a></nav>
  </main>;
}
