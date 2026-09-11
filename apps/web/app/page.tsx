const work = [
  {
    title: "Recuperar vendas paradas",
    detail: "23 contatos qualificados ficaram sem resposta. 8 podem ser retomados dentro das regras que você já aprovou.",
    status: "Trabalhando"
  },
  {
    title: "Preciso da sua decisão",
    detail: "2 propostas só continuam se você autorizar uma mudança nas condições comerciais.",
    status: "Aguardando você"
  },
  {
    title: "Dinheiro deixado na mesa",
    detail: "12 clientes faltaram à reunião e podem ser reativados sem mudar sua política comercial.",
    status: "Oportunidade"
  }
];

export default function Home() {
  return (
    <main>
      <div className="topbar">
        <div className="brand">AGESOMA</div>
        <div className="pill">MODO ROI</div>
      </div>

      <div className="eyebrow">Resultado da semana</div>
      <h1>O que a AGESOMA fez — e quanto isso valeu para o seu negócio.</h1>

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

      <section className="section">
        <div className="eyebrow">Trabalho em andamento</div>
        {work.map((item) => (
          <div className="row" key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
            <span className="status">{item.status}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
