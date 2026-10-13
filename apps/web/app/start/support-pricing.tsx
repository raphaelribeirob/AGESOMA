"use client";
import Script from "next/script";
import {useState} from "react";
type PreviewResult={
 data?:{details?:{lineItems?:{
  formattedTotals?:{subtotal?:string;total?:string};
  price?:{billingCycle?:{interval?:string;frequency?:number}}
 }[]}}};
type PaddlePreviewSdk={
 Environment:{set(mode:"sandbox"):void};
 Initialize(options:{token:string}):void;
 PricePreview(options:{items:{priceId:string;quantity:number}[]}):Promise<PreviewResult>;
};
const cycles:Record<string,string>={month:"mês",year:"ano",week:"semana",day:"dia"};
export default function SupportPricing({token,priceId,sandbox}:{token:string;priceId:string;sandbox:boolean}){
 const [label,setLabel]=useState("Verificando o preço do plano…"),[details,setDetails]=useState("");
 const configured=/^pri_[a-z0-9]{16,36}$/.test(priceId)&&token.length>0;
 async function preview(){
  const paddle=window.Paddle as unknown as PaddlePreviewSdk|undefined;
  if(!paddle){setLabel("Preço indisponível");setDetails("Não foi possível carregar o provedor.");return;}
  try{
   if(sandbox)paddle.Environment.set("sandbox");
   paddle.Initialize({token});
   const response=await paddle.PricePreview({items:[{priceId,quantity:1}]});
   const line=response.data?.details?.lineItems?.[0];
   const displayed=line?.formattedTotals?.total??line?.formattedTotals?.subtotal;
   if(!displayed)throw new Error("provider preview missing");
   const billing=line?.price?.billingCycle;
   const cycle=billing?.interval?cycles[billing.interval]??billing.interval:null;
   setLabel(displayed+(cycle?(" / "+(billing?.frequency && billing.frequency>1?billing.frequency+" ":"")+cycle):""));
   setDetails("Preço localizado estimado pelo Paddle; impostos e total final são confirmados antes do pagamento.");
  }catch{
   setLabel("Preço indisponível");
   setDetails("O valor será apresentado no checkout quando o provedor estiver configurado.");
  }
 }
 return <div aria-live="polite" style={{display:"grid",gap:8}}>
  <strong style={{fontSize:23,letterSpacing:"-.035em"}}>{configured?label:"Preço ainda não publicado"}</strong>
  <p style={{margin:0,color:"#64748b",fontSize:12}}>{configured?details:"A configuração comercial do Paddle ainda precisa ser concluída. Nenhum valor de assinatura é anunciado sem confirmação do provedor."}</p>
  {configured?<Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" onReady={()=>void preview()} onError={()=>{setLabel("Preço indisponível");setDetails("Provedor temporariamente indisponível.");}}/>:null}
 </div>;
}
