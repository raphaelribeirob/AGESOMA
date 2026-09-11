"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Choice = { label: string; value: string; detail?: string };
type Step = { eyebrow: string; title: string; body?: string; choices?: Choice[]; multi?: boolean };

const steps: Step[] = [
  {
    eyebrow: "InstantWork",
    title: "Diga o resultado. O InstantWork faz o trabalho.",
    body: "Configure sua empresa em poucos minutos. No final, você recebe um plano de operação personalizado — com o que o InstantWork pode observar, fazer sozinho e quando precisa de você."
  },
  {
    eyebrow: "Como funciona",
    title: "Você não ganha mais um software. Você ganha trabalho feito.",
    body: "Exemplo: o InstantWork encontra vendas esquecidas, entra nos sistemas autorizados, retoma os contatos, agenda reuniões e mostra o retorno comprovado."
  },
  {
    eyebrow: "Seu objetivo",
    title: "Qual resultado faria mais diferença agora?",
    choices: [
      { label: "Vender mais", value: "sales", detail: "Recuperar oportunidades, responder leads e marcar reuniões." },
      { label: "Atender melhor", value: "service", detail: "Responder clientes, organizar solicitações e reduzir atrasos." },
      { label: "Organizar a operação", value: "operations", detail: "Tirar tarefas repetitivas do caminho e acompanhar pendências." },
      { label: "Cuidar do dinheiro", value: "finance", detail: "Acompanhar cobranças, custos, pagamentos e oportunidades de economia." }
    ]
  },
  {
    eyebrow: "Seu negócio",
    title: "Como sua empresa trabalha hoje?",
    choices: [
      { label: "Principalmente WhatsApp", value: "whatsapp" },
      { label: "WhatsApp + planilhas", value: "sheets" },
      { label: "CRM / ERP", value: "crm" },
      { label: "Vários sistemas", value: "multi" }
    ]
  },
  {
    eyebrow: "O gargalo",
    title: "O que mais se perde no dia a dia?",
    choices: [
      { label: "Leads e vendas sem resposta", value: "lost-sales" },
      { label: "Clientes esperando retorno", value: "slow-service" },
      { label: "Tarefas que ninguém acompanha", value: "tasks" },
      { label: "Informação espalhada", value: "fragmented" }
    ]
  },
  {
    eyebrow: "Autonomia",
    title: "Até onde o InstantWork pode agir sem te interromper?",
    choices: [
      { label: "Observar e me recomendar", value: "observe", detail: "Lê, analisa e propõe. Não altera nada fora do InstantWork." },
      { label: "Fazer trabalho reversível", value: "work", detail: "Organiza, prepara, atualiza e executa tarefas de baixo risco." },
      { label: "Agir dentro das minhas regras", value: "act", detail: "Pode enviar, atualizar e marcar quando a política já permitir." }
    ]
  },
  {
    eyebrow: "Conexões",
    title: "Onde o InstantWork precisa poder trabalhar?",
    body: "Você conecta as contas depois. Agora escolha os lugares que fazem parte da sua operação.",
    multi: true,
    choices: [
      { label: "WhatsApp", value: "whatsapp" },
      { label: "E-mail", value: "email" },
      { label: "Calendário", value: "calendar" },
      { label: "CRM / ERP", value: "crm" },
      { label: "Site / painel web", value: "web" },
      { label: "Planilhas / arquivos", value: "files" }
    ]
  },
  {
    eyebrow: "Montando sua operação",
    title: "O InstantWork está definindo onde observar, quando agir e como provar resultado.",
    body: "Seu plano combina objetivo, contexto, autonomia e sistemas. A regra é simples: liberdade operacional dentro do que sua empresa autorizou; decisões sensíveis continuam com você."
  },
  {
    eyebrow: "Seu plano",
    title: "Sua primeira operação está pronta para ser conectada.",
    body: "O InstantWork começa por um resultado mensurável, observa a operação, encontra oportunidades, executa o trabalho autorizado e mede ROI."
  },
  {
    eyebrow: "InstantWork Core",
    title: "Um operador para sua empresa. Sem cobrar por assento.",
    body: "Acesso à operação, Modo ROI, oportunidades proativas e execução em sistemas autorizados. Começamos pelo primeiro fluxo e ampliamos conforme o valor aparece."
  }
];

const goalCopy: Record<string, { title: string; work: string }> = {
  sales: { title: "Recuperação e crescimento comercial", work: "Encontrar oportunidades paradas, retomar contatos e levar até reunião ou venda." },
  service: { title: "Atendimento e resolução", work: "Encontrar clientes esperando, organizar demandas e conduzir cada caso até resolução." },
  operations: { title: "Operação contínua", work: "Observar pendências, executar rotinas autorizadas e entregar trabalho concluído." },
  finance: { title: "Operação financeira", work: "Observar cobranças e custos, preparar ações e provar economia ou receita recuperada." }
};

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const step = steps[index];
  const selected = answers[index] ?? [];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  const plan = useMemo(() => {
    const goal = answers[2]?.[0] ?? "sales";
    return goalCopy[goal] ?? goalCopy.sales;
  }, [answers]);

  function toggle(value: string) {
    setAnswers((current) => {
      const active = current[index] ?? [];
      const next = step.multi ? active.includes(value) ? active.filter((item) => item !== value) : [...active, value] : [value];
      return { ...current, [index]: next };
    });
  }

  function canContinue() {
    if (!step.choices) return true;
    return selected.length > 0;
  }

  function next() {
    if (!canContinue()) return;
    if (index === steps.length - 1) {
      router.push("/");
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <main className="onboardingShell">
      <div className="onboardingTop">
        <button className="backButton" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} aria-label="Voltar">←</button>
        <div className="progressTrack" aria-label={`Progresso ${progress}%`}><div className="progressFill" style={{ width: `${progress}%` }} /></div>
        <span className="progressText">{index + 1}/{steps.length}</span>
      </div>

      <section className="onboardingCard">
        <div className="onboardingCopy">
          <div className="eyebrow">{step.eyebrow}</div>
          <h1 className="onboardingTitle">{step.title}</h1>
          {step.body ? <p className="onboardingBody">{step.body}</p> : null}
        </div>

        {index === 1 ? <div className="magicDemo"><div><span>Encontrado</span><strong>23 leads parados</strong></div><div><span>Trabalho</span><strong>8 retomados</strong></div><div><span>Resultado</span><strong>3 reuniões</strong></div><div><span>ROI</span><strong>Comprovado</strong></div></div> : null}

        {step.choices ? (
          <div className={step.multi ? "choiceGrid multi" : "choiceGrid"}>
            {step.choices.map((choice) => {
              const active = selected.includes(choice.value);
              return <button key={choice.value} className={active ? "choice active" : "choice"} onClick={() => toggle(choice.value)}><span className="choiceCheck">{active ? "✓" : ""}</span><span><strong>{choice.label}</strong>{choice.detail ? <small>{choice.detail}</small> : null}</span></button>;
            })}
          </div>
        ) : null}

        {index === 7 ? <div className="buildingPlan"><span>Objetivo definido</span><span>Autonomia calibrada</span><span>Conexões selecionadas</span><span>ROI configurado</span></div> : null}

        {index === 8 ? <div className="planReveal"><div className="planHeader"><span>PRIMEIRO FLUXO</span><strong>{plan.title}</strong></div><div className="planLine"><span>Observar</span><p>Seus sistemas autorizados e sinais de oportunidade.</p></div><div className="planLine"><span>Trabalhar</span><p>{plan.work}</p></div><div className="planLine"><span>Provar</span><p>Resultado, custo do trabalho e retorno líquido no Modo ROI.</p></div></div> : null}

        {index === 9 ? <div className="offerCard"><div><span className="label">INSTANTWORK CORE</span><strong>US$ 29 <small>/ mês</small></strong></div><ul><li>Operação em background</li><li>Oportunidades proativas</li><li>Conexões com sistemas autorizados</li><li>Aprovação para decisões sensíveis</li><li>Resultado + custo + ROI comprovado</li></ul><p>O checkout ainda não está ativo nesta versão. Ao continuar, você entra no produto sem cobrança.</p></div> : null}

        <div className="onboardingActions">
          <button className="primaryButton" onClick={next} disabled={!canContinue()}>{index === 0 ? "Começar" : index === steps.length - 1 ? "Entrar no InstantWork" : "Continuar"}</button>
          {index === 6 ? <span className="privacyNote">Você só conecta contas quando decidir. Nenhuma senha é solicitada aqui.</span> : null}
        </div>
      </section>
    </main>
  );
}
