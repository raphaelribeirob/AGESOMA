const nav = ["Início", "Pedir", "Oportunidades", "Trabalhos", "Resultados", "Aprovações", "Conexões"];

const workspaceState = [
  {
    label: "Oportunidades",
    title: "Nenhuma oportunidade detectada ainda",
    detail: "Conecte uma fonte autorizada para o InstantWork começar a observar sinais reais do negócio."
  },
  {
    label: "Trabalhos",
    title: "Nenhum trabalho em andamento",
    detail: "Quando uma operação começar, o progresso aparece aqui sem fabricar etapas ou resultados."
  },
  {
    label: "Aprovações",
    title: "Nada esperando sua decisão",
    detail: "Ações sensíveis aparecem somente quando uma tarefa real exigir sua autorização."
  }
];

function IntelligenceOrb() {
  return (
    <aside className="orbStage" aria-label="Operador InstantWork disponível e em repouso">
      <div className="orbMaterial" aria-hidden="true">
        <span className="orbLobe orbLobeA" />
        <span className="orbLobe orbLobeB" />
        <span className="orbGrain" />
      </div>
      <div className="orbMeta">
        <span className="monoLabel">OPERADOR · IDLE</span>
        <strong>Disponível</strong>
        <p>Em repouso até você conectar a empresa ou pedir um trabalho.</p>
      </div>
    </aside>
  );
}

export default function Home() {
  return (
    <main className="productShell">
      <header className="topbar">
        <div className="brand">InstantWork</div>
        <div className="pill">MODO ROI</div>
      </header>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map((item, index) => (
          <span className={index === 0 ? "navItem active" : "navItem"} key={item}>{item}</span>
        ))}
      </nav>

      <section className="hero heroIntent">
        <div className="heroCopy">
          <div className="eyebrow">Operação empresarial com inteligência</div>
          <h1>Sua próxima operação começa por um resultado.</h1>
          <p className="heroLead">Configure a empresa, conecte os sistemas autorizados e diga o que precisa acontecer. O InstantWork observa, trabalha e só mostra ROI quando houver evidência real.</p>
          <div className="heroActions">
            <a className="primaryCta" href="/onboarding">Configurar minha empresa</a>
            <span className="heroTruth">Nenhum resultado comprovado ainda.</span>
          </div>
        </div>
        <IntelligenceOrb />
      </section>

      <section className="workspaceSection">
        <div className="sectionIntro">
          <div className="eyebrow">Agora</div>
          <h2>O que importa neste momento.</h2>
          <p>Sem dados inventados. Esta área passa a ganhar prioridade conforme a operação real da empresa cria contexto.</p>
        </div>

        <div className="workspaceStack">
          {workspaceState.map((item) => (
            <article className="workspaceRow" key={item.label}>
              <span className="workspaceLabel">{item.label}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="quietStatus">Vazio</span>
            </article>
          ))}
        </div>
      </section>

      <section className="roiBand">
        <div>
          <span className="eyebrow">Modo ROI</span>
          <h2>Valor só aparece quando puder ser provado.</h2>
        </div>
        <div className="roiTruth">
          <span className="monoLabel">RESULTADO VERIFICADO</span>
          <strong>—</strong>
          <p>A primeira venda, reunião, economia ou mudança confirmada cria o primeiro registro econômico.</p>
        </div>
      </section>

      <section className="resultSection">
        <div>
          <div className="eyebrow">Resultado</div>
          <h2>Trabalho concluído vira prova, não uma mensagem perdida no chat.</h2>
        </div>
        <div className="artifactCard workspaceCard">
          <span className="workspaceLabel">Último artifact</span>
          <strong>Nenhum resultado comprovado ainda</strong>
          <p>Quando houver execução real, esta visão reúne evidência, custo, impacto e próximo passo.</p>
        </div>
      </section>
    </main>
  );
}
