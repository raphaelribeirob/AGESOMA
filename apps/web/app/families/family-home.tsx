import Link from "next/link";
import { PRODUCT_FAMILIES, productsForFamily, type ProductFamilyId } from "@agesoma/core/src/product-families";
import styles from "./family-home.module.css";

const familyDetails = {
  instant: {
    eyebrow: "FAMÍLIA INSTANT · PRIMEIRA ETAPA",
    headline: "Aprenda. Pratique. Evolua.",
    detail: "Cada aplicativo mantém sua proposta, seu design e seu ritmo de evolução. A infraestrutura compartilhada será conectada gradualmente, com autorização e medições verificadas.",
    launch: "Integração com a plataforma em planejamento"
  },
  dots: {
    eyebrow: "FAMÍLIA DOTS · SEGUNDA ETAPA",
    headline: "Companheiros que aprendem com você.",
    detail: "Identidades, interação e segurança específicas por produto. Dots não herdará automaticamente a identidade, os dados ou as assinaturas da família Instant.",
    launch: "Próxima família — integração ainda não iniciada"
  }
} as const;

export default function FamilyHome({ family }: { family: ProductFamilyId }) {
  const details = familyDetails[family];
  const info = PRODUCT_FAMILIES[family];
  const products = productsForFamily(family);
  return (
    <main className={`${styles.page} ${family === "instant" ? styles.instant : styles.dots}`} data-platform-family={family}>
      <div className={styles.container}>
        <nav className={styles.nav} aria-label="Famílias da plataforma">
          <Link href={family === "instant" ? "/instant" : "/dots"} className={styles.wordmark} aria-label={`${info.displayName}, início`}>{info.displayName}<span className={styles.mark}>.</span></Link>
          <div className={styles.navLinks}>
            <Link href="/instant" aria-current={family === "instant" ? "page" : undefined}>Instant</Link>
            <Link href="/dots" aria-current={family === "dots" ? "page" : undefined}>Dots</Link>
            <Link href="/start">Workforce legado</Link>
          </div>
        </nav>
        <header className={styles.hero}>
          <div className={styles.eyebrow}>{details.eyebrow}</div>
          <h1>{details.headline}</h1>
          <p className={styles.lead}>{details.detail}</p>
          <div className={styles.tag}><span className={styles.tagDot} aria-hidden="true"/> {details.launch}</div>
        </header>
        <section className={styles.products} aria-labelledby="family-products">
          <div className={styles.sectionHead}>
            <h2 id="family-products">Produtos da família {info.displayName}</h2>
            <p>Repositórios independentes. Disponibilidade comercial ainda não verificada por esta plataforma.</p>
          </div>
          <div className={styles.productList}>
            {products.map((product, index) => (
              <article className={styles.product} key={product.id} data-product-id={product.id}>
                <div className={styles.productIndex}>{String(index + 1).padStart(2,"0")} / {String(products.length).padStart(2,"0")}</div>
                <div className={styles.productInfo}>
                  <h3>{product.title}</h3>
                  <p>{product.promise}</p>
                  <span className={styles.status}>Repositório existente · app não integrado aqui</span>
                </div>
                <a href={`https://github.com/${product.repo}`} target="_blank" rel="noopener noreferrer"
                   className={styles.repoLink} aria-label={`Abrir repositório de ${product.title} no GitHub`}>
                  Ver repositório <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.architecture} aria-labelledby="family-platform">
          <div>
            <p className={styles.eyebrow}>BASE COMPARTILHADA</p>
            <h2 id="family-platform">Uma infraestrutura. Marcas independentes.</h2>
          </div>
          <div className={styles.principles}>
            <p><strong>Identidade por aplicativo.</strong> Os designs dos produtos continuam definidos nos respectivos <code>DESIGN.md</code>.</p>
            <p><strong>Dados e pagamentos isolados.</strong> Nenhum login, conteúdo ou assinatura é compartilhado sem uma integração explícita e autorizada.</p>
            <p><strong>Serviços sob demanda.</strong> Modelos, ferramentas, orçamento e observabilidade podem ser reutilizados por adaptadores versionados quando implementados.</p>
          </div>
        </section>
        <footer className={styles.footer}>
          <span>Plataforma em preparação · integração entre repositórios ainda não implantada</span>
          <Link href={family === "instant" ? "/dots" : "/instant"}>{family === "instant" ? "Conheça a futura família Dots →" : "Explorar a família Instant →"}</Link>
        </footer>
      </div>
    </main>
  );
}
