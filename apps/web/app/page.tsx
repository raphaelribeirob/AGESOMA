const work = [
  { title: "Recuperação comercial", detail: "23 leads sem resposta foram identificados; 8 estão prontos para a sequência aprovada.", status: "Em execução" },
  { title: "Aprovação necessária", detail: "2 propostas exigem autorização antes de alterar condições comerciais.", status: "Precisa de você" },
  { title: "Nova oportunidade", detail: "12 no-shows podem ser reativados usando a política atual.", status: "Encontrada" }
];

export default function Home() {
  return (
    <main>
      <div className="topbar"><div className="brand">AGESOMA</div><div className="pill">ROI MODE</div></div>
      <div className="eyebrow">Esta semana</div>
      <h1>O que o seu negócio ganhou enquanto o AGESOMA trabalhou.</h1>
      <section className="grid">
        <div className="card"><div className="label">Valor atribuído</div><div className="metric">R$ 0</div><div className="label">aguardando primeiro outcome verificado</div></div>
        <div className="card"><div className="label">Custo de execução</div><div className="metric">R$ 0</div><div className="label">modelos + APIs + canais + browser</div></div>
        <div className="card"><div className="label">ROI líquido</div><div className="metric">—</div><div className="label">calculado somente com atribuição verificável</div></div>
        <div className="card"><div className="label">Aprovações</div><div className="metric">2</div><div className="label">ações consequenciais aguardando o dono</div></div>
      </section>
      <section className="section">
        <div className="eyebrow">Trabalho</div>
        {work.map((item) => <div className="row" key={item.title}><strong>{item.title}</strong><span>{item.detail}</span><span className="status">{item.status}</span></div>)}
      </section>
    </main>
  );
}
