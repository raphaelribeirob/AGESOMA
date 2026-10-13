import Link from "next/link";
import SupportDemo from "./support-demo";
import SupportPricing from "./support-pricing";
import {SUPPORT_OFFER} from "@agesoma/core";

export const dynamic="force-dynamic";
export const metadata={
 title:"AGESOMA Atendimento — configure, teste e contrate online",
 description:"Responda dúvidas comuns com conhecimento aprovado e encaminhe exceções a um responsável humano. Experimente o atendimento antes de contratar."
};
const shell:React.CSSProperties={maxWidth:1040,margin:"0 auto",padding:"32px 20px 96px",fontFamily:"Arial,sans-serif",color:"#15191d"};
const card:React.CSSProperties={border:"1px solid #dfe4e9",borderRadius:16,padding:22,background:"#fff"};
export default function StartPage(){
 const token=process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN??"";
 const priceId=process.env.PADDLE_SUPPORT_PRICE_ID??"";
 const sandbox=process.env.PADDLE_ENV==="sandbox";
 return <main style={shell}>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <strong style={{fontSize:23,letterSpacing:"-.05em"}}>AGESOMA</strong>
   <nav aria-label="Navegação" style={{display:"flex",gap:18,fontSize:14,flexWrap:"wrap"}}>
    <a href="#demonstracao" style={{color:"#475569"}}>Demonstração</a>
    <a href="#plano" style={{color:"#475569"}}>Plano</a>
    <Link href="/sign-in" style={{textDecoration:"underline"}}>Entrar</Link>
   </nav>
  </header>
  <section style={{padding:"65px 0 35px"}}>
   <span style={{fontSize:12,letterSpacing:2,color:"#64748b",fontWeight:700}}>AGESOMA ATENDIMENTO · PRIMEIRO SERVIÇO</span>
   <h1 style={{fontSize:"clamp(36px,6vw,72px)",letterSpacing:"-.06em",lineHeight:1.04,maxWidth:850,margin:"18px 0"}}>Responda dúvidas comuns. Encaminhe o que exige uma pessoa.</h1>
   <p style={{fontSize:19,color:"#475569",maxWidth:770,lineHeight:1.55}}>{SUPPORT_OFFER.promise} Configure sua própria base, teste antes de contratar e publique um atendimento por link hospedado quando a assinatura e as avaliações forem aprovadas.</p>
   <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:28}}>
    <a href="#demonstracao" style={{background:"#111827",color:"#fff",borderRadius:10,padding:"14px 22px",fontWeight:650,textDecoration:"none"}}>Experimentar uma demonstração</a>
    <Link href="/sign-in" style={{border:"1px solid #cbd5e1",borderRadius:10,padding:"14px 22px",textDecoration:"none"}}>Configurar minha empresa</Link>
   </div>
   <p style={{fontSize:12,marginTop:18,color:"#64748b"}}>Primeira versão: perguntas e respostas aprovadas e fila humana. Não executa pedidos, reembolsos nem ações em CRM/ERP.</p>
  </section>
  <SupportDemo/>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:30}}>
   <article style={card}><strong>1. Configure</strong><p>Cadastre ou importe o conhecimento aprovado. Não precisa treinar um modelo nem compartilhar credenciais de terceiros.</p></article>
   <article style={card}><strong>2. Valide</strong><p>Teste respostas e recusas. Alterações na base exigem uma nova avaliação antes da publicação.</p></article>
   <article style={card}><strong>3. Opere</strong><p>Após pagamento confirmado, habilite o link; dúvidas não respondidas entram na fila humana com protocolo privado.</p></article>
  </section>
  <section id="plano" style={{marginTop:36,...card,display:"grid",gap:14}}>
   <div>
    <span style={{fontSize:12,fontWeight:700,letterSpacing:1.4,color:"#64748b"}}>UM PRODUTO. UMA PROMESSA VERIFICÁVEL.</span>
    <h2 style={{fontSize:26,margin:"7px 0"}}>AGESOMA Atendimento · Web</h2>
   </div>
   <SupportPricing token={token} priceId={priceId} sandbox={sandbox}/>
   <p style={{margin:0,lineHeight:1.55}}>Inclui link de chat hospedado, até {SUPPORT_OFFER.quotas.maxDailyMessages} interações por dia e {SUPPORT_OFFER.quotas.maxFaqs} respostas cadastradas. Limites adicionais: {SUPPORT_OFFER.quotas.maxHourlyMessages} interações por hora por empresa e {SUPPORT_OFFER.quotas.maxDailyMessagesPerVisitor} por visitante/dia.</p>
   <p style={{margin:0,color:"#64748b",fontSize:13}}>As conversas seguem regras da base aprovada e casos sem resposta são encaminhados à equipe do próprio cliente empresarial. Não há atendimento humano prestado pelo AGESOMA, envio automático por WhatsApp/e-mail, integração CRM, voz ou garantia de resolução nesta versão.</p>
   <Link href="/sign-in" style={{justifySelf:"start",padding:"13px 20px",borderRadius:10,background:"#111827",color:"#fff",textDecoration:"none",fontWeight:650}}>Criar minha conta e testar</Link>
   <p style={{fontSize:12,margin:0,color:"#64748b"}}>É possível configurar e testar sem comprar. A operação pública depende de assinatura ativa, confirmação do provedor e avaliação de qualidade.</p>
  </section>
 </main>;
}
