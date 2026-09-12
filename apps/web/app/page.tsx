import { tenantSql } from "@agesoma/db";
import { instantWorkPackage } from "../lib/riverthree-product";

export const dynamic = "force-dynamic";

const nav = [
  ["Início", "#inicio"],
  ["Pedir", "/onboarding"],
  ["Oportunidades", "#oportunidades"],
  ["Trabalhos", "#trabalhos"],
  ["Resultados", "#resultados"],
  ["Aprovações", "#aprovacoes"],
  ["Conexões", "/onboarding"]
] as const;

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

function IntelligenceOrb() {
  return (
    <div className="orbMaterial r3OrbCompact" aria-label="InstantWork trabalhando">
      <span className="orbLobe orbLobeA" />
      <span className="orbLobe orbLobeB" />
      <span className="orbGrain" />
    </div>
  );
}

export default async function Home() {
  const workspace = await loadWorkspace();
  const activeTasks = workspace?.tasks ?? [];
  const approvals = workspace?.approvals ?? [];
  const opportunities = workspace?.opportunities ?? [];
  const lastArtifact = workspace?.artifacts?.[0];
  const outcomes = workspace?.outcomes;
  const running = activeTasks.find((task) => task.status === "running");
  const firstApproval = approvals[0];
  const firstOpportunity = opportunities[0];
  const verifiedCount = Number(outcomes?.verified_count ?? 0);

  const primaryState = firstApproval
    ? {
        eyebrow: "Precisa de você",
        title: `${approvals.length} decisão${approvals.length === 1 ? "" : "ões"} pronta${approvals.length === 1 ? "" : "s"} para revisar`,
        body: objective(firstApproval.payload),
        action: "Revisar decisão",
        href: "#aprovacoes"
      }
    : running
      ? {
          eyebrow: "Trabalhando agora",
          title: "O InstantWork está executando um trabalho.",
          body: objective(running.payload),
          action: "Ver andamento",
          href: "#trabalhos"
        }
      : firstOpportunity
        ? {
            eyebrow: "Oportunidade encontrada",
            title: firstOpportunity.title,
            body: firstOpportunity.summary,
            action: "Ver oportunidade",
            href: "#oportunidades"
          }
        : verifiedCount
          ? {
              eyebrow: "Resultado confirmado",
              title: `${money(outcomes?.net_value_cents)} de impacto líquido comprovado`,
              body: "O valor exibido vem apenas de resultados com evidência verificada.",
              action: "Ver resultados",
              href: "#resultados"
            }
          : {
              eyebrow: "Pronto para trabalhar",
              title: "O que precisa mudar no seu negócio?",
              body: "Peça como pediria a alguém da sua equipe. Sem agentes, prompts ou configurações técnicas.",
              action: "Pedir um trabalho",
              href: "/onboarding"
            };

  return (
    <main className="productShell" id="inicio" data-r3-package={instantWorkPackage.product.onboardingMode}>
      <header className="topbar">
        <div className="brand">InstantWork</div>
        <span className="r3SystemMark">RIVERTHREE</span>
      </header>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map(([label, href], index) => <a className={index === 0 ? "navItem active" : "navItem"} href={href} key={label}>{label}</a>)}
      </nav>

      <section className="r3ActionHero">
        <div className="r3ActionHeroCopy">
          <div className="eyebrow">{primaryState.eyebrow}</div>
          <h1>{primaryState.title}</h1>
          <p className="heroLead">{primaryState.body}</p>
          <div className="heroActions">
            <a className="primaryCta" href={primaryState.href}>{primaryState.action}</a>
            <span className="heroTruth">O InstantWork executa o reversível e pede sua decisão apenas quando há consequência real.</span>
          </div>
        </div>
        {running ? (
          <aside className="r3LiveIntelligence">
            <IntelligenceOrb />
            <div>
              <span className="monoLabel">INTELIGÊNCIA ATIVA</span>
              <strong>Trabalhando</strong>
              <p>O Orb aparece porque há execução real em andamento.</p>
            </div>
          </aside>
        ) : (
          <aside className="r3QuietMaterial" aria-label="Estado do InstantWork">
            <span className="monoLabel">ESTADO</span>
            <strong>{workspace ? "Observando o negócio" : "Alpha ainda não ligada a um Work Cell"}</strong>
            <p>{workspace ? "Sem animação de IA quando nenhuma inteligência está ativa." : "A interface permanece vazia em vez de inventar atividade."}</p>
          </aside>
        )}
      </section>

      <section className="r3NextBestAction">
        <span className="workspaceLabel">Próxima melhor ação</span>
        <div>
          <strong>{firstApproval ? "Revisar a ação externa já resolvida" : firstOpportunity ? "Transformar a oportunidade em trabalho" : running ? "Acompanhar o trabalho sem interromper" : "Descrever o primeiro resultado que precisa"}</strong>
          <p>{firstApproval ? "Destino, operação, recurso e parâmetros já foram resolvidos antes da aprovação." : firstOpportunity ? "A oportunidade tem evidência; você decide se deve virar execução." : running ? "O trabalho segue em segundo plano. Você só será interrompido se surgir uma decisão consequencial." : "Comece pelo resultado, não pela configuração de uma automação."}</p>
        </div>
        <a href={firstApproval ? "#aprovacoes" : firstOpportunity ? "#oportunidades" : running ? "#trabalhos" : "/onboarding"}>Abrir →</a>
      </section>

      <section className="r3MetricStrip" aria-label="Estado resumido">
        <div><span>Trabalhando</span><strong>{activeTasks.length}</strong></div>
        <div><span>Precisa de você</span><strong>{approvals.length}</strong></div>
        <div><span>Oportunidades</span><strong>{opportunities.length}</strong></div>
      </section>

      <section className="workspaceSection" id="trabalhos">
        <div className="sectionIntro">
          <div className="eyebrow">Atividade</div>
          <h2>O trabalho fica legível.</h2>
          <p>{workspace ? "Estado real do Work Cell, sem números demonstrativos." : "Configure o tenant da alpha para carregar o estado real."}</p>
        </div>
        <div className="workspaceStack">
          <article className="workspaceRow">
            <span className="workspaceLabel">Trabalhos</span>
            <div><strong>{activeTasks.length ? `${activeTasks.length} ativo${activeTasks.length === 1 ? "" : "s"}` : "Nada em andamento"}</strong><p>{activeTasks[0] ? objective(activeTasks[0].payload) : "Um pedido aparece aqui quando entra na fila."}</p></div>
            <span className="quietStatus">{activeTasks[0]?.status ?? "—"}</span>
          </article>
          <article className="workspaceRow" id="aprovacoes">
            <span className="workspaceLabel">Aprovações</span>
            <div><strong>{approvals.length ? `${approvals.length} pendente${approvals.length === 1 ? "" : "s"}` : "Nenhuma decisão pendente"}</strong><p>{firstApproval ? objective(firstApproval.payload) : "Aprovações só aparecem depois que a ação externa foi resolvida em escopo concreto."}</p></div>
            <span className="quietStatus">{approvals.length || "—"}</span>
          </article>
          <article className="workspaceRow" id="oportunidades">
            <span className="workspaceLabel">Oportunidades</span>
            <div><strong>{firstOpportunity?.title ?? "Nenhuma oportunidade confirmada"}</strong><p>{firstOpportunity?.summary ?? "Watchers colocam aqui somente oportunidades acompanhadas de evidência."}</p></div>
            <span className="quietStatus">{opportunities.length || "—"}</span>
          </article>
        </div>
      </section>

      <section className="resultSection" id="resultados">
        <div>
          <div className="eyebrow">Impacto comprovado</div>
          <h2>{verifiedCount ? `${money(outcomes?.net_value_cents)} líquidos confirmados` : "Ainda sem resultado econômico verificado."}</h2>
          <p>Receita atribuída: {money(outcomes?.attributed_revenue_cents)} · custo registrado: {money(outcomes?.total_cost_cents)}.</p>
        </div>
        <div className="artifactCard workspaceCard">
          <span className="workspaceLabel">Último resultado</span>
          <strong>{lastArtifact?.title ?? "Nenhum trabalho concluído ainda"}</strong>
          <p>{lastArtifact ? "O resultado permanece ligado à tarefa e à evidência que o produziu." : "Quando houver execução real, o entregável aparece aqui."}</p>
        </div>
      </section>
    </main>
  );
}
