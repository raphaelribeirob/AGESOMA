import CheckoutClient from "./checkout-client";
export const dynamic="force-dynamic";
export default function CheckoutPage(){
 const token=process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN??"";
 const sandbox=process.env.PADDLE_ENV==="sandbox";
 return <CheckoutClient token={token} sandbox={sandbox}/>;
}
