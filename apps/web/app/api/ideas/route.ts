import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const patchSchema=z.object({
  id:z.string().uuid(),
  status:z.enum(["accepted","dismissed","completed"])
});

type Goal={id:string;title:string;description:string|null;priority:string;progress:string|number};
type Service={provider:string;display_name:string|null};

function providerIdea(service:Service){
  const names:Record<string,{title:string;summary:string}>={
    gmail:{title:"Posso revisar o que realmente precisa de resposta",summary:"Usar seu Gmail conectado para separar mensagens que exigem decisão ou acompanhamento."},
    google_calendar:{title:"Posso proteger sua agenda antes que ela fique apertada",summary:"Observar compromissos e sugerir ajustes quando houver conflito ou pouco espaço."},
    google_drive:{title:"Posso encontrar o documento certo sem você procurar",summary:"Usar o Drive conectado para localizar contexto e arquivos relevantes para suas tarefas."},
    meta_ads:{title:"Posso acompanhar desperdício no Meta Ads",summary:"Observar campanhas e trazer apenas mudanças que mereçam sua atenção."},
    google_ads:{title:"Posso acompanhar o Google Ads por você",summary:"Identificar mudanças relevantes e preparar decisões antes de qualquer ação consequencial."},
    whatsapp:{title:"Posso preparar mensagens que você ainda precisa decidir",summary:"Usar a conexão autorizada para organizar comunicação sem enviar nada além do que estiver permitido."}
  };
  return names[service.provider]??null;
}

export async function GET(){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});

  const [opportunities,goals,services]=await Promise.all([
    tenantSql(authenticated.tenantId,`
      select id,title,summary,proposed_action,evidence,confidence,status,source_task_id,goal_id,created_at
      from opportunities
      where tenant_id=$1 and status in ('open','accepted')
      order by confidence desc,created_at desc
      limit 40
    `,[authenticated.tenantId]),
    tenantSql<Goal>(authenticated.tenantId,`
      select id,title,description,priority,progress
      from goals
      where tenant_id=$1 and archived_at is null and status='active'
      order by case priority when 'high' then 0 when 'normal' then 1 else 2 end,updated_at desc
      limit 12
    `,[authenticated.tenantId]),
    tenantSql<Service>(authenticated.tenantId,`
      select provider,display_name
      from connected_services
      where tenant_id=$1 and status='active'
      order by provider
    `,[authenticated.tenantId])
  ]);

  const synthetic=[
    ...goals.slice(0,6).map((goal)=>({
      id:`goal:${goal.id}`,
      source:"goal",
      title:`Posso avançar “${goal.title}”`,
      summary:goal.description?.trim()||"Posso acompanhar esta meta e trazer a próxima ação útil quando houver progresso, bloqueio ou decisão.",
      confidence:Math.max(.55,Number(goal.progress)||0),
      status:"suggested",
      prompt:`Quero que você avance minha meta: ${goal.title}. Identifique a próxima ação útil e cuide da coordenação.`
    })),
    ...services.map((service)=>{
      const idea=providerIdea(service);
      return idea?{
        id:`connection:${service.provider}`,
        source:"connection",
        title:idea.title,
        summary:idea.summary,
        confidence:.6,
        status:"suggested",
        prompt:idea.title.replace(/^Posso\s+/,"Quero que você ")
      }:null;
    }).filter(Boolean)
  ];

  return NextResponse.json({ideas:[...opportunities.map((item:any)=>({
    ...item,
    source:"opportunity",
    prompt:`${item.title}. ${item.summary}`
  })),...synthetic]});
}

export async function PATCH(req:Request){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});
  const parsed=patchSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Idea inválida."},{status:400});
  const [idea]=await tenantSql(authenticated.tenantId,`
    update opportunities set status=$3,updated_at=now()
    where tenant_id=$1 and id=$2
    returning id,title,summary,status
  `,[authenticated.tenantId,parsed.data.id,parsed.data.status]);
  if(!idea) return NextResponse.json({error:"Idea não encontrada."},{status:404});
  return NextResponse.json(idea);
}
