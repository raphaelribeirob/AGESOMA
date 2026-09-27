"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ApprovalCard = {
  taskId:string; title:string; summary:string; actionType:string; riskClass:string;
  destination:string|null; operation:string|null; resource:string|null; amountCents:number|null;
  parameters:Record<string,unknown>;
};
type InitialState = {
  greeting:string; brief:string; statusText:string; activeWork:number;
  verifiedResults:number; verifiedValue:string; approval:ApprovalCard|null;
};
type Message = { id:string; role:"user"|"assistant"; text:string; approval?:ApprovalCard|null };
type Thread = {
  id:string; kind:"main"|"side"; title:string; last_message_at:string|null;
  source_artifact_id:string|null;
};
type Goal = {
  id:string; title:string; description:string|null; status:"active"|"paused"|"completed";
  priority:"low"|"normal"|"high"; progress:string|number; due_at:string|null;
};
type Idea = {
  id:string; source:string; title:string; summary:string; confidence:number|string;
  status:string; prompt:string; created_at?:string;
};
type Artifact = {
  id:string; task_id:string|null; kind:string; title:string; content:unknown; evidence:unknown;
  created_at:string; objective:string|null; action_type:string|null;
};
type Activity = {
  id:string; task_id:string|null; goal_id:string|null; event_type:string; title:string;
  summary:string|null; status:string; metadata:Record<string,unknown>; created_at:string;
};
type MemoryEntry = { id:string; kind:string; value:string; source_type:string };
type Connection = {
  id:string; provider:string; display_name:string|null; permissions:Record<string,boolean>; status:string;
};
type SpeechRecognitionLike = {
  lang:string; interimResults:boolean; continuous:boolean; start:()=>void; stop:()=>void;
  onresult:((event:{results:ArrayLike<{0:{transcript:string};isFinal:boolean}>})=>void)|null;
  onend:(()=>void)|null; onerror:(()=>void)|null;
};
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike;
type View = "chat"|"goals"|"ideas"|"artifacts";

function recognitionConstructor(){
  if(typeof window==="undefined") return null;
  const candidate=window as typeof window & {
    SpeechRecognition?:SpeechRecognitionConstructor;
    webkitSpeechRecognition?:SpeechRecognitionConstructor;
  };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

function money(cents:number|null){
  if(cents==null) return null;
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(cents/100);
}

function dateLabel(value:string){
  const date=new Date(value);
  const today=new Date();
  return date.toDateString()===today.toDateString()
    ? date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})
    : date.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
}

function stringifyContent(value:unknown){
  if(typeof value==="string") return value;
  if(value==null) return "";
  try{return JSON.stringify(value,null,2);}catch{return String(value);}
}

function providerLabel(provider:string){
  const labels:Record<string,string>={
    gmail:"Gmail",google_calendar:"Google Calendar",google_drive:"Google Drive",
    google_contacts:"Google Contacts",meta_ads:"Meta Ads",google_ads:"Google Ads",whatsapp:"WhatsApp"
  };
  return labels[provider] ?? provider;
}

export default function AgesomaClient({initial}:{initial:InitialState}){
  const [view,setView]=useState<View>("chat");
  const [messages,setMessages]=useState<Message[]>([{
    id:"initial",role:"assistant",text:initial.greeting+"\\n\\n"+initial.brief,approval:initial.approval
  }]);
  const [threads,setThreads]=useState<Thread[]>([]);
  const [mainThreadId,setMainThreadId]=useState<string|null>(null);
  const [threadId,setThreadId]=useState<string|null>(null);
  const [input,setInput]=useState("");
  const [pendingCount,setPendingCount]=useState(0);
  const [approval,setApproval]=useState<ApprovalCard|null>(initial.approval);
  const [approvalPending,setApprovalPending]=useState(false);
  const [listening,setListening]=useState(false);
  const [activityOpen,setActivityOpen]=useState(false);
  const [activity,setActivity]=useState<Activity[]>([]);
  const [memory,setMemory]=useState<MemoryEntry[]>([]);
  const [connections,setConnections]=useState<Connection[]>([]);
  const [goals,setGoals]=useState<Goal[]>([]);
  const [goalTitle,setGoalTitle]=useState("");
  const [ideas,setIdeas]=useState<Idea[]>([]);
  const [artifacts,setArtifacts]=useState<Artifact[]>([]);
  const [selectedArtifact,setSelectedArtifact]=useState<Artifact|null>(null);
  const [surfaceBusy,setSurfaceBusy]=useState(false);
  const recognitionRef=useRef<SpeechRecognitionLike|null>(null);
  const voiceAvailable=useMemo(()=>Boolean(recognitionConstructor()),[]);
  const pending=pendingCount>0;

  async function loadThreads(target?:string|null){
    const query=target ? "?threadId="+encodeURIComponent(target) : "";
    const response=await fetch("/api/threads"+query,{cache:"no-store"});
    if(!response.ok) return;
    const body=await response.json();
    setThreads(body.threads ?? []);
    setMainThreadId(body.mainThreadId ?? null);
    setThreadId(body.selectedThreadId ?? body.mainThreadId ?? null);
    const persisted=(body.messages ?? []) as Array<{
      id:string; role:"user"|"assistant"; content:string; metadata?:Record<string,unknown>;
    }>;
    if(persisted.length){
      setMessages(persisted.map((item)=>({
        id:item.id, role:item.role, text:item.content,
        approval:(item.metadata?.approval as ApprovalCard|null|undefined) ?? null
      })));
    }else{
      setMessages([{
        id:"initial",role:"assistant",text:initial.greeting+"\\n\\n"+initial.brief,approval:initial.approval
      }]);
    }
  }

  async function loadGoals(){
    const response=await fetch("/api/goals",{cache:"no-store"});
    if(response.ok) setGoals((await response.json()).goals ?? []);
  }

  async function loadIdeas(){
    const response=await fetch("/api/ideas",{cache:"no-store"});
    if(response.ok) setIdeas((await response.json()).ideas ?? []);
  }

  async function loadArtifacts(){
    const response=await fetch("/api/artifacts",{cache:"no-store"});
    if(!response.ok) return;
    const items=(await response.json()).artifacts ?? [];
    setArtifacts(items);
    setSelectedArtifact((current)=>current ?? items[0] ?? null);
  }

  async function loadActivityPanel(){
    const results=await Promise.all([
      fetch("/api/activity?limit=80",{cache:"no-store"}),
      fetch("/api/personal-context",{cache:"no-store"}),
      fetch("/api/connections",{cache:"no-store"})
    ]);
    if(results[0].ok) setActivity((await results[0].json()).activity ?? []);
    if(results[1].ok) setMemory((await results[1].json()).entries ?? []);
    if(results[2].ok) setConnections((await results[2].json()).services ?? []);
  }

  async function refreshApproval(){
    const query=threadId ? "?threadId="+encodeURIComponent(threadId) : "";
    const response=await fetch("/api/agesoma"+query,{cache:"no-store"});
    if(response.ok) setApproval((await response.json()).approval ?? null);
  }

  useEffect(()=>{ void loadThreads(); },[]);
  useEffect(()=>{
    const timer=window.setInterval(()=>void refreshApproval(),8000);
    return()=>window.clearInterval(timer);
  },[threadId]);
  useEffect(()=>{
    if(!threadId) return;
    const timer=window.setInterval(()=>void loadThreads(threadId),6000);
    return()=>window.clearInterval(timer);
  },[threadId]);
  useEffect(()=>{
    if(view==="goals") void loadGoals();
    if(view==="ideas") void loadIdeas();
    if(view==="artifacts") void loadArtifacts();
  },[view]);
  useEffect(()=>{ if(activityOpen) void loadActivityPanel(); },[activityOpen]);

  async function autoTitleThread(clean:string){
    const current=threads.find((item)=>item.id===threadId);
    if(!current || current.kind!=="side" || current.title!=="Novo assunto") return;
    const title=clean.length>52 ? clean.slice(0,49)+"…" : clean;
    await fetch("/api/threads",{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({id:current.id,title})
    }).catch(()=>null);
  }

  async function send(text:string){
    const clean=text.trim();
    if(!clean) return;
    setMessages((current)=>[...current,{id:crypto.randomUUID(),role:"user",text:clean}]);
    setInput("");
    setPendingCount((count)=>count+1);
    void autoTitleThread(clean);

    try{
      const response=await fetch("/api/agesoma",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"message",message:clean,threadId:threadId ?? undefined})
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.error ?? "Não consegui concluir isso agora.");
      setMessages((current)=>[...current,{
        id:crypto.randomUUID(),role:"assistant",text:body.reply,approval:body.approval ?? null
      }]);
      if(body.threadId && !threadId) setThreadId(body.threadId);
      if(body.approval) setApproval(body.approval);
      window.setTimeout(()=>{
        void refreshApproval();
        void loadThreads(body.threadId ?? threadId);
      },1200);
    }catch(error){
      setMessages((current)=>[...current,{
        id:crypto.randomUUID(),role:"assistant",
        text:error instanceof Error ? error.message : "Não consegui concluir isso agora."
      }]);
    }finally{
      setPendingCount((count)=>Math.max(0,count-1));
    }
  }

  async function decideApproval(decision:"approve"|"deny",card:ApprovalCard){
    if(approvalPending) return;
    setApprovalPending(true);
    try{
      const response=await fetch("/api/agesoma",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:decision,taskId:card.taskId,threadId:threadId ?? undefined})
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.error ?? "Não foi possível registrar sua decisão.");
      setApproval(null);
      await loadThreads(threadId);
      await loadActivityPanel();
    }catch(error){
      setMessages((current)=>[...current,{
        id:crypto.randomUUID(),role:"assistant",
        text:error instanceof Error ? error.message : "Não foi possível registrar sua decisão."
      }]);
    }finally{
      setApprovalPending(false);
    }
  }

  async function createSideChat(source?:Artifact|null){
    setSurfaceBusy(true);
    try{
      const response=await fetch("/api/threads",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({
          title:source?.title ?? "Novo assunto",
          parentThreadId:mainThreadId ?? undefined,
          sourceArtifactId:source?.id,
          sourceTaskId:source?.task_id ?? undefined
        })
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.error ?? "Não foi possível abrir um side chat.");
      setView("chat");
      await loadThreads(body.id);
    }finally{
      setSurfaceBusy(false);
    }
  }

  async function createGoal(){
    if(goalTitle.trim().length<2) return;
    setSurfaceBusy(true);
    try{
      const response=await fetch("/api/goals",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({title:goalTitle.trim(),priority:"normal"})
      });
      if(response.ok){
        setGoalTitle("");
        await loadGoals();
      }
    }finally{
      setSurfaceBusy(false);
    }
  }

  async function setGoalStatus(id:string,status:"active"|"paused"|"completed"){
    await fetch("/api/goals",{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({id,status,...(status==="completed"?{progress:1}:{})})
    });
    await loadGoals();
  }

  async function useIdea(idea:Idea){
    if(/^[0-9a-f-]{36}$/i.test(idea.id)){
      await fetch("/api/ideas",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({id:idea.id,status:"accepted"})
      }).catch(()=>null);
    }
    setView("chat");
    window.setTimeout(()=>void send(idea.prompt || idea.title+". "+idea.summary),50);
  }

  function toggleVoice(){
    if(!voiceAvailable) return;
    if(listening){
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition=recognitionConstructor();
    if(!Recognition) return;
    const recognition=new Recognition();
    recognition.lang="pt-BR";
    recognition.interimResults=true;
    recognition.continuous=false;
    recognition.onresult=(event)=>{
      let transcript="";
      for(let index=0;index<event.results.length;index+=1){
        transcript+=event.results[index][0]?.transcript ?? "";
      }
      setInput(transcript.trim());
    };
    recognition.onend=()=>setListening(false);
    recognition.onerror=()=>setListening(false);
    recognitionRef.current=recognition;
    setListening(true);
    recognition.start();
  }

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    void send(input);
  }

  const status=pending
    ? String(pendingCount)+" pedido"+(pendingCount===1?"":"s")+" em andamento"
    : listening
      ? "Ouvindo…"
      : approval
        ? "Aguardando sua decisão"
        : initial.statusText;

  return (
    <main className="museShell">
      <header className="museTopbar">
        <button className="museIdentity" type="button" onClick={()=>setActivityOpen(true)} aria-label="Abrir status da AGESOMA">
          <span className={pending?"museAvatar isWorking":listening?"museAvatar isListening":"museAvatar"} aria-hidden="true">
            <i className="museAvatarLobe a"/><i className="museAvatarLobe b"/><i className="museAvatarGrain"/>
          </span>
          <span className="museIdentityCopy">
            <strong>AGESOMA</strong>
            <small>{status}</small>
          </span>
        </button>

        <nav className="museNav" aria-label="Navegação principal">
          {(["chat","goals","ideas","artifacts"] as View[]).map((item)=>(
            <button key={item} type="button" className={view===item?"active":""} onClick={()=>setView(item)}>
              {item==="chat"?"Chat":item==="goals"?"Goals":item==="ideas"?"Ideas":"Artifacts"}
            </button>
          ))}
        </nav>

        <Link href="/settings" className="museSettings">Memória & permissões</Link>
      </header>

      <div className="museWorkspace">
        <aside className="museThreadRail" aria-label="Conversas">
          <div className="museRailHeader">
            <span>Conversas</span>
            <button type="button" onClick={()=>void createSideChat(null)} disabled={surfaceBusy}>＋</button>
          </div>
          <button
            type="button"
            className={threadId===mainThreadId?"museThread active":"museThread"}
            onClick={()=>{setView("chat");void loadThreads(mainThreadId);}}
          >
            <span>Principal</span><small>Conversa contínua</small>
          </button>
          {threads.filter((thread)=>thread.kind==="side").map((thread)=>(
            <button
              type="button" key={thread.id}
              className={threadId===thread.id?"museThread active":"museThread"}
              onClick={()=>{setView("chat");void loadThreads(thread.id);}}
            >
              <span>{thread.title}</span>
              <small>{thread.last_message_at?dateLabel(thread.last_message_at):"Side chat"}</small>
            </button>
          ))}
        </aside>

        <section className="museMain">
          {view==="chat"?(
            <div className="museChatView">
              <div className="museConversation" aria-live="polite">
                {messages.map((message)=>(
                  <article key={message.id} className={"museBubbleRow "+message.role}>
                    {message.role==="assistant"?<span className="museMiniAvatar" aria-hidden="true"/>:null}
                    <div className="museBubble"><div className="museBubbleText">{message.text}</div></div>
                  </article>
                ))}

                {approval?(
                  <article className="museDecisionCard">
                    <div className="museDecisionEyebrow">Preciso da sua decisão</div>
                    <h3>{approval.title}</h3>
                    <p>{approval.summary}</p>
                    <dl className="museDecisionFacts">
                      {approval.destination?<><dt>Destino</dt><dd>{approval.destination}</dd></>:null}
                      {approval.resource?<><dt>Serviço</dt><dd>{approval.resource}</dd></>:null}
                      {approval.operation?<><dt>Ação</dt><dd>{approval.operation}</dd></>:null}
                      {money(approval.amountCents)?<><dt>Valor</dt><dd>{money(approval.amountCents)}</dd></>:null}
                      {Object.entries(approval.parameters ?? {}).slice(0,4).map(([key,value])=>(
                        <div className="museDecisionPair" key={key}>
                          <dt>{key}</dt><dd>{typeof value==="string"?value:JSON.stringify(value)}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="museDecisionActions">
                      <button className="secondary" type="button" disabled={approvalPending} onClick={()=>void decideApproval("deny",approval)}>Negar</button>
                      <button className="primary" type="button" disabled={approvalPending} onClick={()=>void decideApproval("approve",approval)}>Permitir</button>
                    </div>
                  </article>
                ):null}

                {pending?(
                  <article className="museBubbleRow assistant">
                    <span className="museMiniAvatar" aria-hidden="true"/>
                    <div className="museBubble museThinking"><i/><i/><i/></div>
                  </article>
                ):null}
              </div>

              <form className="museComposer" onSubmit={submit}>
                <button type="button" className={listening?"museVoice active":"museVoice"} onClick={toggleVoice} disabled={!voiceAvailable} aria-label="Falar com AGESOMA">●</button>
                <input value={input} onChange={(event)=>setInput(event.target.value)} placeholder="O que você quer que eu resolva?" autoComplete="off"/>
                <button className="museSend" type="submit" disabled={!input.trim()}>↑</button>
              </form>
            </div>
          ):null}

          {view==="goals"?(
            <div className="museCollectionView">
              <div className="museViewHeader">
                <div><span className="museKicker">GOALS</span><h1>O que estamos tentando alcançar.</h1></div>
                <span>{goals.filter((goal)=>goal.status==="active").length} ativas</span>
              </div>
              <div className="museInlineComposer">
                <input value={goalTitle} onChange={(event)=>setGoalTitle(event.target.value)} placeholder="Adicionar uma meta…"/>
                <button type="button" disabled={surfaceBusy||goalTitle.trim().length<2} onClick={()=>void createGoal()}>Adicionar</button>
              </div>
              <div className="museGoalList">
                {goals.length?goals.map((goal)=>(
                  <article className={"museGoal "+goal.status} key={goal.id}>
                    <button className="museGoalCheck" type="button" onClick={()=>void setGoalStatus(goal.id,goal.status==="completed"?"active":"completed")} aria-label="Alternar conclusão">
                      {goal.status==="completed"?"✓":""}
                    </button>
                    <div>
                      <strong>{goal.title}</strong>
                      {goal.description?<p>{goal.description}</p>:null}
                      <div className="museGoalProgress"><span style={{width:String(Math.round(Number(goal.progress)*100))+"%"}}/></div>
                    </div>
                    <button className="museGoalMore" type="button" onClick={()=>void setGoalStatus(goal.id,goal.status==="paused"?"active":"paused")}>{goal.status==="paused"?"Retomar":"•••"}</button>
                  </article>
                )):<div className="museEmpty">Nenhuma meta ainda. Adicione algo que você quer que a AGESOMA acompanhe no longo prazo.</div>}
              </div>
            </div>
          ):null}

          {view==="ideas"?(
            <div className="museCollectionView">
              <div className="museViewHeader">
                <div><span className="museKicker">IDEAS</span><h1>Coisas que eu posso tirar da sua cabeça.</h1></div>
                <span>Baseadas no seu contexto</span>
              </div>
              <div className="museIdeaGrid">
                {ideas.length?ideas.map((idea,index)=>(
                  <article className="museIdea" key={idea.id}>
                    <span className="museIdeaGlyph">{["✦","◌","↗","⌁","◇"][index%5]}</span>
                    <div><h3>{idea.title}</h3><p>{idea.summary}</p></div>
                    <button type="button" onClick={()=>void useIdea(idea)}>Fazer isso</button>
                  </article>
                )):<div className="museEmpty">As melhores ideias aparecem conforme metas, contexto e serviços conectados ganham histórico.</div>}
              </div>
            </div>
          ):null}

          {view==="artifacts"?(
            <div className="museArtifactView">
              <div className="museArtifactList">
                <div className="museViewHeader compact">
                  <div><span className="museKicker">ARTIFACTS</span><h1>Entregas.</h1></div>
                </div>
                {artifacts.length?artifacts.map((artifact)=>(
                  <button key={artifact.id} type="button" className={selectedArtifact?.id===artifact.id?"museArtifactItem active":"museArtifactItem"} onClick={()=>setSelectedArtifact(artifact)}>
                    <span>{artifact.kind}</span><strong>{artifact.title}</strong><small>{dateLabel(artifact.created_at)}</small>
                  </button>
                )):<div className="museEmpty">Os resultados concluídos aparecerão aqui como objetos, não só mensagens.</div>}
              </div>
              <div className="museArtifactDetail">
                {selectedArtifact?(
                  <>
                    <div className="museArtifactMeta"><span>{selectedArtifact.kind}</span><span>{dateLabel(selectedArtifact.created_at)}</span></div>
                    <h2>{selectedArtifact.title}</h2>
                    {selectedArtifact.objective?<p className="museArtifactObjective">{selectedArtifact.objective}</p>:null}
                    <pre>{stringifyContent(selectedArtifact.content)}</pre>
                    <button className="museArtifactChat" type="button" disabled={surfaceBusy} onClick={()=>void createSideChat(selectedArtifact)}>Conversar sobre isto</button>
                  </>
                ):<div className="museEmpty">Selecione uma entrega.</div>}
              </div>
            </div>
          ):null}
        </section>
      </div>

      {activityOpen?(
        <div className="museDrawerBackdrop" onClick={()=>setActivityOpen(false)}>
          <aside className="museDrawer" onClick={(event)=>event.stopPropagation()}>
            <header>
              <div className="museDrawerIdentity">
                <span className="museAvatar"/>
                <div><strong>AGESOMA</strong><small>{status}</small></div>
              </div>
              <button type="button" onClick={()=>setActivityOpen(false)}>×</button>
            </header>
            <section>
              <span className="museKicker">ATIVIDADE</span>
              <div className="museActivityList">
                {activity.slice(0,30).map((item)=>(
                  <article key={item.id}>
                    <i className={item.status}/>
                    <div><strong>{item.title}</strong>{item.summary?<p>{item.summary}</p>:null}<small>{dateLabel(item.created_at)}</small></div>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <span className="museKicker">MEMÓRIA</span>
              <div className="museQuietList">
                {memory.slice(0,5).map((item)=>(
                  <div key={item.id}><strong>{item.kind.replaceAll("_"," ")}</strong><p>{item.value}</p></div>
                ))}
                {!memory.length?<p className="museEmpty">Nenhum contexto pessoal salvo.</p>:null}
              </div>
            </section>
            <section>
              <span className="museKicker">PERMISSÕES</span>
              <div className="museQuietList">
                {connections.filter((item)=>item.status==="active").map((item)=>(
                  <div key={item.id}>
                    <strong>{providerLabel(item.provider)}</strong>
                    <p>{Object.entries(item.permissions ?? {}).filter(([,enabled])=>enabled).map(([key])=>key).join(" · ") || "Somente conectado"}</p>
                  </div>
                ))}
                {!connections.length?<p className="museEmpty">Nenhum serviço conectado.</p>:null}
              </div>
              <Link href="/settings" className="museDrawerSettings">Gerenciar memória e permissões →</Link>
            </section>
          </aside>
        </div>
      ):null}
    </main>
  );
}
