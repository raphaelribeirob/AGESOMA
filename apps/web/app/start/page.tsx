import Link from "next/link";
import SupportDemo from "./support-demo";
import SupportPricing from "./support-pricing";
import { SUPPORT_OFFER } from "@agesoma/core";
import styles from "./start-age.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "AGESOMA Atendimento — demonstração e configuração",
  description: "Teste o atendimento web com base aprovada e encaminhamento humano, sem prometer automações não implementadas."
};

const STEPS = [
  { no: "01", title: "Conecte o conhecimento", body: "Cadastre ou importe respostas aprovadas sem compartilhar credenciais de terceiros." },
  { no: "02", title: "Valide as respostas", body: "Teste os acertos e as recusas. Mudanças na base exigem nova avaliação." },
  { no: "03", title: "Ative com controle", body: "Com pagamento confirmado e qualidade validada, publique o link. Casos desconhecidos vão para a fila humana." }
] as const;
const EXECUTIVES = ["CEO + COO", "CFO", "CMO + CRO", "CTO + CPO"] as const;

export default function StartPage() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
  const priceId = process.env.PADDLE_SUPPORT_PRICE_ID ?? "";
  const sandbox = process.env.PADDLE_ENV === "sandbox";

  return (
    <main className={`${styles.page} ageTheme`}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/start" aria-label="AGESOMA, início" className={styles.brandLink}>
            <img src="/agesoma-wordmark-age.svg" alt="AGESOMA" width={197} height={13} />
          </Link>
          <nav aria-label="Navegação principal" className={styles.navigation}>
            <a href="#demonstracao">Demonstração</a>
            <a href="#plano">Plano</a>
            <Link href="/sign-in">Entrar</Link>
          </nav>
        </header>

        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.kicker}>AGESOMA / ATENDIMENTO WEB</div>
          <h1 id="hero-title">Respostas confiáveis. Controle em cada etapa.</h1>
          <p className={styles.lead}>{SUPPORT_OFFER.promise} Configure sua base e teste a experiência antes de contratar.</p>
          <div className={styles.heroActions}>
            <a className="ageButton ageButtonPrimary" href="#demonstracao">Testar demonstração</a>
            <Link className="ageButton ageButtonSecondary" href="/sign-in">Configurar minha empresa</Link>
          </div>
          <p className={styles.disclaimer}>Disponível nesta oferta: respostas de FAQ aprovadas e encaminhamento para sua equipe. Não executa pedidos, reembolsos nem ações em CRM/ERP.</p>
          <div className={styles.productPreview} aria-label="Resumo das etapas do produto">
            <span className={styles.productPreviewLabel}>FLUXO DO PRODUTO · REPRESENTAÇÃO CONCEITUAL</span>
            <div className={styles.productFlow}>
              <span>Conhecimento aprovado</span>
              <span aria-hidden="true">→</span>
              <span>Resposta ou recusa</span>
              <span aria-hidden="true">→</span>
              <span>Equipe humana</span>
            </div>
            <p>O funcionamento demonstrável está na seção interativa abaixo; este diagrama não representa dados ou operações reais.</p>
          </div>
        </section>

        <section className={styles.demoSection} aria-label="Produto demonstrável">
          <SupportDemo/>
        </section>

        <section className={styles.steps} aria-label="Como começar">
          {STEPS.map((step) => (
            <article className={styles.step} key={step.no}>
              <span>{step.no}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className={styles.productVision} aria-label="Visão da futura equipe de agentes">
          <p className={styles.kicker}>PRÓXIMA ETAPA DO PRODUTO</p>
          <h2>Quatro agentes. Sete funções executivas.</h2>
          <p>Este é o desenho futuro do AGESOMA Workforce OS. Os computadores por agente e a execução autônoma ainda estão em desenvolvimento.</p>
          <div className={styles.executiveGrid}>
            {EXECUTIVES.map((role) => <span key={role}>{role}<small>Em desenvolvimento</small></span>)}
          </div>
        </section>

        <section id="plano" className={styles.plan}>
          <span className={styles.kicker}>UM PRODUTO. UMA OFERTA VERIFICÁVEL.</span>
          <h2>AGESOMA Atendimento · Web</h2>
          <SupportPricing token={token} priceId={priceId} sandbox={sandbox} />
          <p>Link de chat hospedado, até {SUPPORT_OFFER.quotas.maxDailyMessages} interações/dia, {SUPPORT_OFFER.quotas.maxFaqs} respostas cadastradas, {SUPPORT_OFFER.quotas.maxHourlyMessages} interações/hora/empresa e {SUPPORT_OFFER.quotas.maxDailyMessagesPerVisitor} por visitante/dia.</p>
          <p>Casos sem resposta são encaminhados à equipe do próprio cliente. Não há atendimento humano prestado pelo AGESOMA, envio automático por WhatsApp/e-mail, voz, integração CRM nem garantia de resolução.</p>
          <Link href="/sign-in" className="ageButton ageButtonPrimary">Criar conta e testar</Link>
          <small>É possível configurar e testar sem comprar. A operação pública depende de assinatura ativa e validação das avaliações de qualidade.</small>
        </section>
      </div>
    </main>
  );
}
