import Link from "next/link";
import { buildCeoBrief, type OwnerProfile } from "./ceo-brief";
import styles from "./ceo-companion.module.css";

const ownerNames = {
  executive: "CEO + COO",
  finance: "CFO",
  growth: "CMO + CRO",
  product: "CTO + CPO"
} as const;

/**
 * The first honest step toward a JARVIS-like CEO.
 * All proposals derive from the owner-confirmed intake; this component does
 * NOT use an AI model, connect data sources or dispatch tasks on its own.
 */
export default function CeoCompanion({ profile }: { profile: OwnerProfile }) {
  const briefing = buildCeoBrief(profile, true);
  if (!briefing) return null;
  return (
    <section className={styles.panel} aria-label="Briefing executivo do CEO">
      <div className={styles.header}>
        <span className={styles.mark} aria-hidden="true">CEO</span>
        <div>
          <div className={styles.kicker}>ASSISTENTE EXECUTIVO · CONTEXTO CONFIRMADO</div>
          <h2>Seu CEO já conhece o ponto de partida.</h2>
        </div>
      </div>
      <div className={styles.conversation} role="status">
        <p>{briefing.greeting}</p>
        <p>{briefing.businessSummary}</p>
        <p><strong>Objetivo informado:</strong> {briefing.primaryObjective}</p>
        <p><strong>Desafio informado:</strong> {briefing.presentChallenge}</p>
      </div>
      <p className={styles.notice}>Este briefing é gerado a partir de informações declaradas e confirmadas por você. Não houve pesquisa, análise de IA, verificação externa ou execução de tarefas.</p>
      <div className={styles.grid}>
        <div>
          <h3>Trabalhos que posso preparar</h3>
          <p className={styles.small}>Sugestões de preparação; nenhum agente será acionado ao abrir um item.</p>
          <div className={styles.actions}>
            {briefing.proposals.map((proposal) => (
              <details key={proposal.id} className={styles.proposal}>
                <summary>
                  <span>{proposal.title}</span>
                  <small>{ownerNames[proposal.owner]}</small>
                </summary>
                <div className={styles.proposalDetail}>
                  <p>{proposal.description}</p>
                  <p><strong>Para começar:</strong> {proposal.needs}</p>
                  <p className={styles.pending}>Não iniciado · exige escopo e autorização</p>
                </div>
              </details>
            ))}
          </div>
        </div>
        <div className={styles.questions}>
          <h3>Preciso esclarecer três pontos</h3>
          <ol>{briefing.followUpQuestions.map((question) => <li key={question}>{question}</li>)}</ol>
          <Link href="/" className="ageButton ageButtonSecondary">Abrir conversa no AGESOMA</Link>
          <p className={styles.small}>O chat agora consulta as informações confirmadas para responder perguntas sobre sua empresa. Ainda não pesquisa o site nem conecta ERP ou CRM automaticamente.</p>
        </div>
      </div>
      <div className={styles.footer}>
        <span>Próximas funções: briefing diário, alertas com dados reais, voz e delegação supervisionada.</span>
        <span>Ainda não ativas</span>
      </div>
    </section>
  );
}
