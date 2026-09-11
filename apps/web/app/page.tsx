const opportunities = [
  {
    title: "23 vendas podem ser recuperadas",
    detail: "Esses contatos qualificados ficaram sem resposta e ainda têm potencial comercial.",
    value: "R$ 18,4 mil potencial",
    action: "Pronto para agir"
  },
  {
    title: "12 clientes faltaram à reunião",
    detail: "Posso tentar remarcar sem alterar suas condições comerciais.",
    value: "12 oportunidades",
    action: "Pode ser automático"
  }
];

const work = [
  {
    title: "Recuperar vendas paradas",
    detail: "8 contatos estão sendo retomados dentro das regras já aprovadas.",
    status: "Trabalhando"
  },
  {
    title: "Revisar propostas paradas",
    detail: "2 propostas precisam da sua decisão antes de continuar.",
    status: "Precisa de você"
  }
];

const nav = ["Início", "Pedir", "Oportunidades", "Trabalhos", "Resultados", "Aprovações", "Conexões"];

export default function Home() {
  return (
    <main>
      <div className="topbar">
        <div className="brand">AGESOMA</div>
        <div className="pill">MODO ROI</div>
      </div>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map((item, index) => (
          <span className={index === 0 ? "navItem active" : "navItem"} key={item}>{item}</span>
        ))}
      </nav>

      <section className="hero">
        <div className="eyebrow">Sua empresa, em movimento</div>
        <h1>O que mudou no seu negócio enquanto a AGESOMA trabalhou.</h1>
        <div className="askBox">
          <span>O que você precisa resolver?</span>
          <strong>Diga o resultado. Eu cuido do trabalho.</strong>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="label">Dinheiro recuperado</div>
          <div className="metric">R$ 0</div>
          <div className="label">entra aqui somente quando houver prova do resultado</div>
        </div>
        <div className="card">
          <div className="label">Custo do trabalho</div>
          <div className="metric">R$ 0</div>
          <div className="label">quanto custou realizar o trabalho desta semana</div>
        </div>
        <div className="card">
          <div className="label">Retorno líquido</div>
          <div className="metric">—</div>
          <div className="label">dinheiro recuperado menos o custo do trabalho</div>
        </div>
        <div className="card">
          <div className="label">Precisa de você</div>
          <div className="metric">2</div>
          <div className="label">decisões que a AGESOMA não toma sem sua autorização</div>
        </div>
      </section>

      <section className="section split">
        <div>
          <div className="eyebrow">Oportunidades encontradas</div>
          <h2>Eu encontrei trabalho que pode valer dinheiro.</h2>
        </div>
        <div className="stack">
          {opportunities.map((item) => (
            <article className="opportunity" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <div className="opportunityMeta">
                <span>{item.value}</span>
                <span className="status">{item.action}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Trabalho em andamento</div>
        <h2>Continuo trabalhando mesmo quando você fecha o app.</h2>
        {work.map((item) => (
          <div className="row" key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
            <span className="status">{item.status}</span>
          </div>
        ))}
      </section>

      <section className="section artifact">
        <div>
          <div className="eyebrow">Último resultado</div>
          <h2>Resultado pronto para abrir.</h2>
          <p>Quando um trabalho termina, a AGESOMA entrega o resultado em uma visão própria — com evidência, custo e próximo passo.</p>
        </div>
        <div className="artifactCard">
          <span className="label">Relatório de recuperação comercial</span>
          <strong>Nenhum resultado comprovado ainda</strong>
          <span>A primeira venda, reunião ou mudança confirmada aparecerá aqui.</span>
        </div>
      </section>
    </main>
  );
}
