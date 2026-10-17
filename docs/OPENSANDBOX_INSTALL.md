# AGESOMA OpenSandbox: instalação local Linux (piloto)

**Status:** scripts versionados no Git; ainda **não instalado em servidor AGESOMA**, não integrado ao dispatcher de agentes e sem validação real de Docker neste PR.

Projeto de referência: https://github.com/opensandbox-group/OpenSandbox (Apache-2.0).
Instalador fixado em OpenSandbox Server / SDK **1.1.1** (verifique advisories antes de usar).

## Requisitos
- Host Linux de desenvolvimento, com Docker Engine e daemon funcionando;
- Python 3.10+, `curl`, `uv` e `uvx` no PATH;
- conta do Linux autorizada a administrar Docker, **sem rodar o instalador como root**;
- Internet do host para baixar dependências e imagens;
- acesso ao repositório AGESOMA na branch `feat/agesoma-workforce-computers-20261016`.

O executor Linux *não* pode ser hospedado diretamente em funções Vercel. O serviço e o Docker ficam em host dedicado ou VM/VPS controlada.

## Começar (em host Linux autorizado)
```bash
git checkout feat/agesoma-workforce-computers-20261016
bash scripts/opensandbox/install.sh check
bash scripts/opensandbox/install.sh start
```
Em um **segundo terminal no mesmo host**:
```bash
bash scripts/opensandbox/smoke.sh
```

Esperado: `PASS: OpenSandbox created an isolated test sandbox...` e `CLEANUP: sandbox destroyed.`. Se Docker, uv ou rede não existirem, pare: o instalador falha explicitamente. O script não instala Docker automaticamente, não abre firewall e não gera deploy.

## O que o instalador faz
- Gera segredo aleatório em `~/.config/agesoma/opensandbox.env` (permissões 0600). **Nunca** versionar esse arquivo.
- Cria `~/.config/agesoma/opensandbox.toml` (0600), com `server.host = "127.0.0.1"`, `docker.publish_host = "127.0.0.1"` e tempo máximo de criação de 1800s.
- Restringe diretórios montáveis do host a `~/.local/share/agesoma/opensandbox`.
- Usa API-key obrigatória e Docker bridge; sem endpoint público nem VNC aberto para a internet.
- Executa o servidor **em primeiro plano**. Ctrl+C encerra o servidor; sandboxes remotas devem ser limpas pela API/TTL.
- O `smoke` sobe 1 sandbox `alpine:3.20`, executa um echo e destrói o sandbox ao final.

**Atenção:** admin do Docker tem privilégios elevados sobre o host. Docker bridge não é isolamento forte entre clientes adversariais; esta instalação é apenas para uso *interno e descartável*. Não inserir dados de clientes, chaves reais, navegação autenticada ou código de agentes não confiáveis nesse piloto.

## UX de computadores individuais — próxima etapa, não implementada
O OpenSandbox possui imagem desktop com XFCE, Xvfb, x11vnc e noVNC:
https://github.com/opensandbox-group/OpenSandbox/blob/main/docs/examples/desktop.md

Para a UI do AGESOMA, devemos:
1. Criar 1 sandbox por `tenant_id + worker_id + task_id` somente através do worker autenticado (nunca chamada direta do navegador).
2. Vincular o sandbox a uma concessão temporal com persistência no banco, limites de CPU/RAM e TTL.
3. Validar isolamento multi-tenant e de computadores (Kata/gVisor/VM quando apropriado); negar ações externas sem Sentinel.
4. Servir vídeo/VNC por proxy autenticado independente, com TLS + WebSocket e token curto revogável, nunca colocar senha de VNC/API em URL nem enviar a key do OpenSandbox ao cliente.
5. Testar controle humano exclusivo, bloqueio de capturas de segredos, egress deny-by-default e revogação.
6. Integrar execução aprovada ao dispatcher pg-boss, HERMES, Browser Safety e ProofTree já existentes.

**Importante:** o exemplo oficial de noVNC em modo single-tenant pode ficar acessível sem cabeçalhos autenticados. Não copie diretamente o proxy da documentação para um SaaS multi-tenant.

## Manutenção e custos
Licença do OpenSandbox: **US$0**. Você continua pagando eventual VPS/VM, armazenamento e APIs de modelos. Em hospedagem gratuita, confira RAM, CPU, disponibilidade de Docker e limites do provedor.

Para atualização, compare versão do servidor, imagens execd/egress e SDK no release upstream; valide assinatura/digest para ambiente de produção. Não usar `latest` em produção. Não usar a chave de teste como credencial global de clientes.

## Verificação desta PR
Scripts incluídos **não comprovam instalação remota**. O smoke real precisa ser executado no Linux com Docker; o sandbox não foi provisionado durante a edição do GitHub.

## CI descartável
A workflow [`.github/workflows/opensandbox-pilot.yml`](../.github/workflows/opensandbox-pilot.yml) define um teste estático e um teste com Docker em runner Ubuntu temporário. Não é instalação permanente nem prova de funcionamento no servidor de produção. Conferir resultados no painel Actions do GitHub.
