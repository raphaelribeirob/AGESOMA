import {redirect} from "next/navigation";
import {resolveAuthenticatedWorkspace} from "../../../lib/auth-workspace";
import SupportConsole from "./support-console";
export const dynamic="force-dynamic";
export default async function ConsolePage(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)redirect("/sign-in");
 return <SupportConsole/>;
}
