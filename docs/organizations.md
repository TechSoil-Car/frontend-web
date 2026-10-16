# Organizações no painel web

Atualização: 16/10/2026. Contrato de servidor: `../../backend-web/docs/organizations.md`.
Continuidade completa: `../../pendencias.md`.

## Fluxos

- `/dashboard/organizacoes`: criar/selecionar organização, renomear, excluir
  organização vazia e administrar equipe/convites. `/dashboard/equipe` abre
  a mesma tela, com escopo da organização inteira.
- O seletor do menu muda o cliente ativo. A preferência contém somente o ID,
  em chave local por usuário; a autorização é revalidada na API.
- `OrganizationProvider` fica dentro de `AuthProvider` e envolve
  `PlantationProvider`. A seleção filtra plantações por `organizationId`.
  A troca de cliente/conta reinicia o estado operacional, incluindo formulários.
- O carregamento de organizações precisa terminar antes do redirecionamento
  por falta de plantação. Uma organização sem atribuição deve conseguir abrir
  a própria tela e mostrar o estado vazio.
- Criar plantação exige owner e envia explicitamente a organização selecionada.
- Owner gerencia equipe e atribuições; operador pode editar regras de alerta;
  visualizador consulta. MEMBER legado aparece como visualizador.
- Remover participante encerra o acesso à organização inteira. A UI confirma
  remoção/promoção e apresenta conflitos do servidor, incluindo último owner.

## Arquivos

- `features/organizations/OrganizationContext.tsx`: carregamento, seleção,
  revalidação no foco, proteção contra respostas antigas e reset por conta.
- `features/organizations/OrganizationsScreen.tsx`: formulários e equipe.
- `features/organizations/types.ts`: contratos públicos e rótulos.
- `features/plantations/context/PlantationContext.tsx`: contexto operacional
  filtrado e bloqueio enquanto as permissões da organização carregam.
- `scripts/verify-organizations-browser.mjs`: ensaio com API interceptada.

## Verificação

```powershell
pnpm lint
node --test scripts/test-*.mjs
pnpm build
pnpm start --port 3300
```

Em outro terminal: `pnpm test:organizations:browser`, com Playwright e Chromium
instalados. Para usar uma instalação existente, configure
`TECHSOIL_PLAYWRIGHT_MODULE`; para Edge, `TECHSOIL_BROWSER_CHANNEL=msedge`.
O teste só permite frontend local, intercepta API localhost:3001 e bloqueia
outras origens. Testa papéis/atribuições, conflito do último owner, criação de
plantação no cliente certo, viewer, operator, organização vazia e viewport móvel.

Esse ensaio não valida email, banco, firmware nem a sessão nativa. A próxima
homologação deve usar as interfaces e backends reais em ambiente isolado.
Next e eslint-config-next foram atualizados de 16.3.0 para 16.3.8 para corrigir
os avisos encontrados na auditoria; mantenha os patches e o lockfile juntos.

Verificação em 16/10/2026: lint, 51 testes, build de produção e ensaio de
navegador no Edge headless aprovados; auditoria de produção sem vulnerabilidades
conhecidas. O teste inclui PATCH de alertas por operador, bloqueio do último
owner, viewer sem botão de gravação e viewport de 390 px sem overflow.
