const nav = ["Início", "Pedir", "Trabalhos", "Conta"];

const now = [
  {
    label: "Agora",
    title: "Nenhum trabalho em andamento",
    detail: "Quando você pedir algo, o progresso aparece aqui."
  },
  {
    label: "Precisa de você",
    title: "Nada esperando sua decisão",
    detail: "Só interrompo quando uma decisão sua for realmente necessária."
  },
  {
    label: "Desde sua última visita",
    title: "Nenhuma mudança confirmada ainda",
    detail: "Resultados, oportunidades e mudanças aparecem aqui quando houver evidência."
  }
];

function IntelligenceOrb() {
  return (
    <aside className="orbStage" aria-label="InstantWork disponível">
      <div className="orbMaterial" aria-hidden="true">
        <span className="orbLobe orbLobeA" />
        <span className="orbLobe orbLobeB" />
        <span className="orbGrain" />
      </div>
      <div className="orbMeta">
        <span className="monoLabel">DISPONÍVEL</span>
        <strong>Pronto para trabalhar</strong>
        <p>Você explica o problema. O InstantWork decide como executar e só pede ajuda quando necessário.</p>
      </div>
    </aside>
  );
}

export default function Home() {
  return (
    <main className="productShell">
      <header className="topbar">
        <div className="brand">InstantWork</div>
      </header>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map((item, index) => (
          <span className={index === 0 ? "navItem active" : "navItem"} key={item}>{item}</span>
        ))}
      </nav>

      <section className="hero heroIntent">
        <div className="heroCopy">
          <div className="eyebrow">Seu trabalho, resolvido</div>
          <h1>O que você precisa resolver?</h1>
          <p className="heroLead">Explique como explicaria para alguém da sua equipe. Sem prompts, agentes ou configurações técnicas.</p>
          <div className="heroActions">
            <a className="primaryCta" href="/onboarding">Pedir um trabalho</a>
            <span className="heroTruth">Você decide consequências. O InstantWork cuida da implementação.</span>
          </div>
        </div>
        <IntelligenceOrb />
      </section>

      <section className="workspaceSection">
        <div className="sectionIntro">
          <div className="eyebrow">Início</div>
          <h2>Só o que importa agora.</h2>
          <p>Oportunidades, aprovações, conexões e resultados aparecem no contexto certo, sem virar menus para configurar.</p>
        </div>

        <div className="workspaceStack">
          {now.map((item) => (
            <article className="workspaceRow" key={item.label}>
              <span className="workspaceLabel">{item.label}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="quietStatus">—</span>
            </article>
          ))}
        </div>
      </section>

      <section className="resultSection">
        <div>
          <div className="eyebrow">Trabalho concluído</div>
          <h2>Resultado vira uma visão útil, não uma mensagem perdida.</h2>
        </div>
        <div className="artifactCard workspaceCard">
          <span className="workspaceLabel">Último resultado</span>
          <strong>Nenhum resultado confirmado ainda</strong>
          <p>Quando houver execução real, o InstantWork transforma a saída em um artefato adequado ao trabalho e mantém a evidência junto dele.</p>
        </div>
      </section>
    </main>
  );
}
