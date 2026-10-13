import {NextResponse} from "next/server";
import {tenantSql} from "@agesoma/db";
import {resolveAuthenticatedWorkspace} from "../../../../lib/auth-workspace";

type Flow={
 total_count:number;automatic_count:number;escalated_count:number;
 avg_decision_ms:number|null;p95_decision_ms:number|null;
};
type Tickets={
 opened_count:number;operator_resolved_count:number;open_count:number;
 awaiting_over_24h:number;p95_operator_hours:number|null;
};
type Feedback={responses:number;confirmed:number;not_resolved:number};
export async function GET(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return NextResponse.json({error:"Autenticação necessária."},{status:401});
 if(!["owner","admin"].includes(actor.role))
  return NextResponse.json({error:"Somente o responsável pelo negócio."},{status:403});
 const [flows,tickets,outcomes]=await Promise.all([
  tenantSql<Flow>(actor.tenantId,[
   "select count(*)::int as total_count,",
   "count(*) filter (where status='answered')::int as automatic_count,",
   "count(*) filter (where status='needs_human')::int as escalated_count,",
   "round(avg(decision_latency_ms)::numeric,1)::float8 as avg_decision_ms,",
   "round((percentile_cont(0.95) within group (order by decision_latency_ms))::numeric,1)::float8 as p95_decision_ms",
   "from support_messages where tenant_id=$1 and created_at>=now()-interval '30 days'"
  ].join(" "),[actor.tenantId]),
  tenantSql<Tickets>(actor.tenantId,[
   "select count(*)::int as opened_count,",
   "count(*) filter (where status='resolved')::int as operator_resolved_count,",
   "count(*) filter (where status='open')::int as open_count,",
   "count(*) filter (where status='open' and created_at < now()-interval '24 hours')::int as awaiting_over_24h,",
   "round((percentile_cont(0.95) within group",
   "(order by extract(epoch from (resolved_at-created_at))/3600)",
   "filter (where status='resolved'))::numeric,2)::float8 as p95_operator_hours",
   "from support_tickets where tenant_id=$1 and created_at>=now()-interval '30 days'"
  ].join(" "),[actor.tenantId]),
  tenantSql<Feedback>(actor.tenantId,[
   "select count(*)::int as responses,",
   "count(*) filter(where verdict='resolved')::int as confirmed,",
   "count(*) filter(where verdict='not_resolved')::int as not_resolved",
   "from support_customer_outcomes where tenant_id=$1 and created_at>=now()-interval '30 days'"
  ].join(" "),[actor.tenantId])
 ]);
 return NextResponse.json({
  periodDays:30,flows:flows[0],tickets:tickets[0],customerFeedback:outcomes[0],
  limitations:[
   "Respostas automáticas não são casos resolvidos comprovadamente.",
   "Ticket respondido por humano não equivale a satisfação confirmada.",
   "Feedback é voluntário e não cobre todas as solicitações.",
   "Tempo de decisão exclui latência de rede, banco e renderização.",
   "Custos completos de infraestrutura e SLA contratual ainda não medidos."
  ]
 },{headers:{"cache-control":"private,no-store"}});
}
