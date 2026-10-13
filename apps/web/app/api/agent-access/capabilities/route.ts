import {NextResponse} from "next/server";
import {AGESOMA_AGENT_DISCOVERY} from "@agesoma/core";

/** Public catalog only: no guest or tenant data, no delegated agent access. */
export function GET(){
 return NextResponse.json(AGESOMA_AGENT_DISCOVERY,{
  headers:{"cache-control":"public, max-age=300","x-robots-tag":"noindex"}
 });
}
