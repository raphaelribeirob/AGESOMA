"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import styles from "./workforce-preview.module.css";
import { WORKFORCE_PROFILES } from "./workforce-profiles";

type Section = "missao" | "computador" | "acessos";
const BUSINESS_SOURCES = [
  ["Site da empresa", "Oferta e posicionamento"],
  ["Conhecimento interno", "Políticas e processos"],
  ["CRM e atendimento", "Clientes e relacionamento"],
  ["Dados financeiros", "Receitas, custos e indicadores"]
] as const;

function WorkerAvatar({ tone, size = "regular" }: { tone: string; size?: "regular" | "large" }) {
  return (
    <span
      className={size === "large" ? styles.avatarLarge : styles.avatar}
      style={{ "--worker-tone": tone } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.eye} />
      <span className={styles.eye} />
    </span>
  );
}

export default function WorkforcePreview({ workspaceName }: { workspaceName: string }) {
  const [workerId, setWorkerId] = useState(WORKFORCE_PROFILES[0].id);
  const [section, setSection] = useState<Section>("missao");
  const [companyOpen, setCompanyOpen] = useState(true);
  const selected = WORKFORCE_PROFILES.find((worker) => worker.id === workerId) ?? WORKFORCE_PROFILES[0];

  return (
    <div className={styles.shell}>
      <div className={styles.globalNotice} role="status">
        Prévia de produto — 4 agentes para 7 cargos executivos. Nenhum computador ou integração está ativo nesta tela.
      </div>
      <div className={styles.workspace}>
        <aside className={styles.sidebar} aria-label="Equipe do AGESOMA">
          <div className={styles.brand}>
            <div className={styles.brandGlyph} aria-hidden="true">A</div>
            <div>
              <strong>AGESOMA</strong>
              <span>Workforce OS</span>
            </div>
          </div>

          <div className={styles.workspaceBadge}>
            <span className={styles.workspaceSymbol} aria-hidden="true">⌂</span>
            <div>
              <strong>{workspaceName}</strong>
              <span>Área empresarial</span>
            </div>
          </div>

          <div className={styles.sidebarLabel}>SUA EQUIPE</div>
          <nav className={styles.roster} aria-label="Selecionar agente">
            {WORKFORCE_PROFILES.map((worker) => (
              <button
                type="button"
                key={worker.id}
                onClick={() => { setWorkerId(worker.id); setSection("missao"); }}
                className={worker.id === selected.id ? styles.workerSelected : styles.workerButton}
                aria-current={worker.id === selected.id ? "true" : undefined}
              >
                <WorkerAvatar tone={worker.tone} />
                <span className={styles.workerInfo}>
                  <strong>{worker.title}</strong>
                  <small>{worker.role}</small>
                </span>
                <span className={styles.plannedDot} aria-label="Ainda não provisionado" />
              </button>
            ))}
          </nav>

          <div className={styles.sidebarFoot}>
            <div className={styles.footNote}>Identidade de agente persistente. Computador isolado e sob demanda, a implementar.</div>
            <Link href="/" className={styles.backLink}>← Voltar ao AGESOMA</Link>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div>
              <div className={styles.eyebrow}>SUA EMPRESA, EM CONTEXTO</div>
              <h1>Uma equipe que entende seu negócio.</h1>
            </div>
            <span className={styles.previewTag}>Conceito funcional de navegação</span>
          </header>

          <section className={styles.companySection} aria-label="Compreensão da empresa">
            <button
              type="button"
              className={styles.companyHeader}
              aria-expanded={companyOpen}
              onClick={() => setCompanyOpen((value) => !value)}
            >
              <span>
                <span className={styles.eyebrow}>ETAPA 01 · APRENDER ANTES DE AGIR</span>
                <strong>Conhecimento da empresa</strong>
                <small>Conexões, evidências e validação humana. Nenhuma fonte foi conectada nesta prévia.</small>
              </span>
              <span aria-hidden="true">{companyOpen ? "−" : "+"}</span>
            </button>
            {companyOpen && (
              <div className={styles.sourceGrid}>
                {BUSINESS_SOURCES.map(([label, description]) => (
                  <div key={label} className={styles.sourceCard}>
                    <span className={styles.sourceIcon} aria-hidden="true">○</span>
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                      <em>Não conectado</em>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.agentPanel} aria-label="Agente selecionado">
            <div className={styles.agentIntro}>
              <WorkerAvatar tone={selected.tone} size="large" />
              <div className={styles.agentTitle}>
                <span className={styles.eyebrow}>AGENTE · {selected.role.toUpperCase()}</span>
                <h2>{selected.title}</h2>
                <span className={styles.statusText}><span className={styles.plannedDot} /> Planejado · sem tarefas em execução</span>
              </div>
            </div>
            <div className={styles.tabs} role="group" aria-label="Detalhes do agente">
              <button type="button" aria-pressed={section === "missao"} className={section === "missao" ? styles.tabSelected : styles.tab} onClick={() => setSection("missao")}>Missão</button>
              <button type="button" aria-pressed={section === "computador"} className={section === "computador" ? styles.tabSelected : styles.tab} onClick={() => setSection("computador")}>Computador</button>
              <button type="button" aria-pressed={section === "acessos"} className={section === "acessos" ? styles.tabSelected : styles.tab} onClick={() => setSection("acessos")}>Acessos</button>
            </div>

            {section === "missao" && (
              <div className={styles.detailContent}>
                <p className={styles.mission}>{selected.mission}</p>
                <h3>Cargos deste agente</h3>
                <div className={styles.chips}>{selected.positions.map((position) => <span key={position}>{position}</span>)}</div>
                <h3 style={{ marginTop: 24 }}>Trabalho que poderá executar</h3>
                <div className={styles.chips}>{selected.tasks.map((item) => <span key={item}>{item}</span>)}</div>
                <div className={styles.emptyActivity}>
                  <span className={styles.emptyIcon} aria-hidden="true">↗</span>
                  <strong>Nenhuma atividade registrada</strong>
                  <p>A primeira tarefa aparecerá aqui depois que o acesso aos sistemas e a execução forem implementados.</p>
                </div>
              </div>
            )}

            {section === "computador" && (
              <div className={styles.detailContent}>
                <div className={styles.desktop} role="img" aria-label="Espaço reservado para a transmissão segura do computador isolado deste agente; nenhum computador foi provisionado">
                  <div className={styles.desktopToolbar}>
                    <div className={styles.desktopDots}><i /><i /><i /></div>
                    <span>agesoma://computer/{selected.id}</span>
                    <span className={styles.desktopLock}>ISOLADO</span>
                  </div>
                  <div className={styles.desktopCenter}>
                    <div className={styles.monitorSymbol} aria-hidden="true">▣</div>
                    <strong>Computador não provisionado</strong>
                    <p>Futuramente: sessão isolada por agente, visão ao vivo, pausa e tomada de controle mediante autorização.</p>
                  </div>
                </div>
                <p className={styles.caution}>Isolamento, armazenamento, rede, sessões e orçamento precisam ser validados no backend antes de habilitar este painel.</p>
              </div>
            )}

            {section === "acessos" && (
              <div className={styles.detailContent}>
                <h3>Fontes previstas para esta função</h3>
                <div className={styles.accessList}>
                  {selected.sources.map((source) => (
                    <div key={source}><span>{source}</span><small>Sem autorização concedida</small></div>
                  ))}
                </div>
                <h3 style={{ marginTop: 22 }}>Limites de atuação</h3>
                <div className={styles.accessList}>{selected.boundaries.map((boundary) => (
                  <div key={boundary}><span>{boundary}</span></div>
                ))}</div>
                <p className={styles.caution}>Acessos não são herdados automaticamente. Cada agente precisará de autorização individual, escopo mínimo, revogação e auditoria.</p>
              </div>
            )}
          </section>
        </main>

        <aside className={styles.activity} aria-label="Painel de execução">
          <div className={styles.sideHeading}><strong>Centro de execução</strong><span>AGORA</span></div>
          <div className={styles.metricGroup}>
            <div><strong>0</strong><span>Em execução nesta prévia</span></div>
            <div><strong>0</strong><span>Computadores provisionados</span></div>
          </div>
          <div className={styles.activityBox}>
            <div className={styles.placeholderIcon} aria-hidden="true">◷</div>
            <strong>Sem trabalho iniciado</strong>
            <p>Ordens de trabalho, aprovações, passos auditados e resultados verificados aparecerão nesta coluna.</p>
          </div>
          <div className={styles.trust}>
            <strong>Controle do proprietário</strong>
            <p>Pagamentos, publicações, exclusões e mudanças sensíveis devem exigir limites explícitos e aprovação adequada.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
