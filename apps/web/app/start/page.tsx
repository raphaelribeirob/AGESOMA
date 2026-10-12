import Link from "next/link";

export const metadata = { title:"AGESOMA — Atendimento pronto para sua empresa",description:"Configure seu atendimento em minutos com respostas aprovadas, controle humano e assinatura simples." };
const shell:React.CSSProperties={maxWidth:1024,margin:"0 auto",padding:"36px 20px 96px",fontFamily:"Arial, sans-serif",color:"#15191d"};
const card:React.CSSProperties={border:"1px solid #dfe4e9",borderRadius:16,padding:22,background:"#fff"};
export default function StartPage(){
 return <main style={shell}>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <strong style={{fontSize:23,letterSpacing:"-.05em"}}>AGESOMA</strong>
   <Link href="/sign-in" style={{fontSize:14,textDecoration:"underline"}}>Entrar ou criar conta</Link>
  </header>
  <section style={{padding:"74px 0 48px"}}>
   <div style={{fontSize:12,letterSpacing:2,color:"#64748b",fontWeight:700}}>SEU PRIMEIRO AGENTE</div>
   <h1 style={{fontSize:"clamp(38px,6vw,76px)",letterSpacing:"-.06em",lineHeight:1.05,maxWidth:780,margin:"18px 0"}}>Atendimento pronto para trabalhar.</h1>
   <p style={{fontSize:19,color:"#475569",maxWidth:710,lineHeight:1.5}}>Cadastre as respostas da sua empresa, teste cada pergunta e compartilhe um link de atendimento com seus clientes. Respostas sem fundamento são encaminhadas para revisão humana.</p>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:28}}>
    <Link href="/sign-in" style={{background:"#111827",color:"#fff",borderRadius:10,padding:"14px 22px",fontWeight:650}}>Começar configuração</Link>
    <Link href="/console/support" style={{border:"1px solid #cbd5e1",borderRadius:10,padding:"14px 22px"}}>Abrir meu painel</Link>
   </div>
   <p style={{fontSize:12,marginTop:22}}>O teste privado da base funciona antes da assinatura. O canal público exige pagamento confirmado.</p>
  </section>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
   <article style={card}><strong>1. Ensine</strong><p>Cadastre perguntas e respostas aprovadas pelo seu negócio. Sem treinar um modelo.</p></article>
   <article style={card}><strong>2. Teste</strong><p>Experimente respostas e veja quando é necessário atendimento humano.</p></article>
   <article style={card}><strong>3. Ative</strong><p>Após a confirmação da assinatura, publique o atendimento e acompanhe dúvidas.</p></article>
  </section>
  <section style={{marginTop:44,...card}}>
   <h2 style={{fontSize:24,margin:"0 0 8px"}}>O que está disponível no primeiro plano</h2>
   <p>Atendimento por link hospedado, até 200 interações por dia, até 200 respostas cadastradas, prévia privada, histórico básico e bloqueio automático de perguntas sem correspondência.</p>
   <p style={{fontSize:13}}>Preço e moeda são apresentados pelo checkout Paddle configurado. Envio automático de e-mail, WhatsApp e voz não estão incluídos no primeiro produto.</p>
  </section>
 </main>;
}
