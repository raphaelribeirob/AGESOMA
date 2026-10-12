"use client";
import Script from "next/script";
import Link from "next/link";
import {useState} from "react";
type PaddleSdk={
 Environment:{set:(mode:"sandbox")=>void};
 Initialize:(options:{token:string;checkout:{settings:{displayMode:"overlay";theme:"light"}}})=>void;
 Checkout:{open:(options:{transactionId:string})=>void};
};
declare global { interface Window { Paddle?: PaddleSdk } }
export default function CheckoutClient({token,sandbox}:{token:string;sandbox:boolean}){
 const [status,setStatus]=useState("Carregando checkout seguro…");
 function init(){
  const transactionId=new URLSearchParams(window.location.search).get("_ptxn");
  if(!token||!transactionId||!/^txn_[a-z0-9]{16,36}$/.test(transactionId)){
   setStatus("Checkout não configurado ou transação inválida.");return;
  }
  const sdk=window.Paddle;
  if(!sdk){setStatus("Não foi possível carregar o provedor de pagamento.");return;}
  try{
   if(sandbox)sdk.Environment.set("sandbox");
   sdk.Initialize({token,checkout:{settings:{displayMode:"overlay",theme:"light"}}});
   sdk.Checkout.open({transactionId});
   setStatus("Finalize a assinatura no ambiente seguro do Paddle. A ativação ocorre após confirmação do provedor.");
  }catch{setStatus("Falha ao abrir checkout. Reinicie a contratação pelo painel.");}
 }
 return <main style={{maxWidth:650,padding:"65px 22px",margin:"0 auto",fontFamily:"Arial,sans-serif",color:"#111827"}}>
  <h1 style={{fontSize:32}}>Finalizar contratação</h1>
  <p role="status">{status}</p>
  <p>Não solicite dados de cartão nesta página; o pagamento ocorre diretamente no checkout do Paddle.</p>
  <Link href="/console/support" style={{textDecoration:"underline"}}>Voltar ao meu agente</Link>
  {token?<Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onReady={init} onError={()=>setStatus("Provedor de pagamentos indisponível.")}/>:null}
 </main>;
}
