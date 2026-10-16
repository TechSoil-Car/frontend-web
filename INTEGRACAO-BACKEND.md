# Guia de telas, formulários e integração com o backend

> **Guia histórico de agosto; não descreve o estado atual.** Organizações,
> convites protegidos, sensores, mapas e notificações já foram implementados.
> Consulte `docs/organizations.md`, `../backend-web/docs/organizations.md` e
> `../pendencias.md` para o contrato e as pendências atuais (16/10/2026).

> Última atualização: 16/08/2026  
> Frontend: Next.js em `http://localhost:3000`  
> Backend Web: NestJS em `http://localhost:3001`

Este documento é o contrato de referência para implementar as telas da aplicação autenticada. Ele informa quais rotas já existem, quais campos cada formulário deve possuir, permissões, respostas esperadas e funcionalidades que ainda dependem do backend.

## Legenda

- ✅ Backend implementado e testado.
- ⚠️ Backend existente, mas com ajuste de segurança pendente.
- 🔲 Backend ainda não implementado.
- `OWNER`: pode administrar a plantação.
- `MEMBER`: pode visualizar os dados permitidos da plantação.

## Regras gerais de integração

### Autenticação

- Enviar o access token nas rotas protegidas:

```http
Authorization: Bearer ACCESS_TOKEN
```

- O refresh token fica em cookie `httpOnly` e nunca deve ser lido ou armazenado pelo JavaScript.
- Requisições de login, refresh e logout devem permitir cookies:

```ts
fetch(url, {
  credentials: "include",
});
```

- O access token deve permanecer apenas na memória da aplicação. Não armazenar tokens no `localStorage`.
- Quando uma requisição protegida retornar `401`, tentar `POST /auth/refresh` uma vez e repetir a requisição original. Se o refresh falhar, limpar a sessão e redirecionar para `/login`.

### Validação

- O backend aceita JSON.
- Campos não documentados são rejeitados com `400 Bad Request`.
- O frontend deve validar antes de enviar, mas as mensagens do backend continuam sendo a fonte final de verdade.
- Datas são recebidas como strings ISO 8601.
- IDs de usuário e plantação são UUIDs.

### Códigos HTTP importantes

| Código | Significado na interface |
|---|---|
| `200` | Consulta ou atualização concluída |
| `201` | Recurso criado |
| `204` | Exclusão ou logout concluído, sem corpo |
| `400` | Formulário ou identificador inválido |
| `401` | Sessão ausente, inválida ou expirada |
| `403` | Usuário autenticado sem acesso à plantação ou operação |
| `404` | Recurso não encontrado |
| `409` | Regra de integridade impediu a operação |
| `410` | Convite expirado, usado ou indisponível |
| `429` | Muitas tentativas; aguardar antes de repetir |

## Estrutura sugerida de rotas do frontend

```text
/
/login
/accept-invite
/app/plantations
/app/plantations/[plantationId]
/app/plantations/[plantationId]/members
/app/plantations/[plantationId]/settings
/app/profile
```

Rotas futuras:

```text
/app/plantations/[plantationId]/devices
/app/plantations/[plantationId]/sensors
/app/plantations/[plantationId]/cart
/app/plantations/[plantationId]/cart/route
```

---

## 1. Landing page — `/`

### Estado

Landing page concluída. A solicitação de orçamento ainda não possui endpoint no backend.

### Formulário de orçamento sugerido

Campos recomendados para a interface:

| Campo | Tipo | Obrigatório | Validação sugerida |
|---|---|---:|---|
| Nome | texto | Sim | 2 a 120 caracteres |
| E-mail | e-mail | Sim | E-mail válido, até 254 caracteres |
| Telefone | telefone | Sim | Formato brasileiro e DDD |
| Nome da propriedade | texto | Não | Até 120 caracteres |
| Cidade/UF | texto | Não | Até 120 caracteres |
| Tamanho aproximado | texto/número | Não | Informar unidade, por exemplo hectares |
| Mensagem | textarea | Não | Até 2.000 caracteres |
| Consentimento | checkbox | Sim | Aceite da política de privacidade |

### Backend

🔲 Não existe `POST /budget-requests`.

Não apresentar mensagem de “enviado com sucesso” enquanto não houver envio real. Até o endpoint existir, o formulário deve ficar desabilitado, usar um serviço externo aprovado ou indicar claramente outro canal de contato.

---

## 2. Login — `/login`

### Rota utilizada

✅ `POST /auth/login`

### Formulário

| Campo | Tipo | Obrigatório | Regras do backend |
|---|---|---:|---|
| E-mail | `email` | Sim | E-mail válido, máximo de 254 caracteres |
| Senha | `password` | Sim | 8 a 128 caracteres |

Payload:

```json
{
  "email": "arthur@example.com",
  "password": "senha-segura"
}
```

Resposta `200`:

```json
{
  "access_token": "jwt",
  "user": {
    "id": "uuid",
    "name": "Arthur",
    "email": "arthur@example.com"
  }
}
```

### Comportamento da tela

- Desabilitar o botão durante o envio.
- Exibir mensagem genérica para `401`: “E-mail ou senha inválidos”.
- Em `429`, informar que houve muitas tentativas e pedir para aguardar.
- Após sucesso, carregar `GET /plantations`.
- Se não houver plantação, abrir o estado vazio com ação “Criar plantação”.
- Se houver uma plantação, entrar diretamente nela.
- Se houver várias, mostrar a tela de seleção.

### Sessão

✅ `POST /auth/refresh`

- Não possui campos.
- Depende do cookie `httpOnly`.
- Retorna o mesmo formato público do login e rotaciona o cookie.

✅ `POST /auth/logout`

- Não possui campos.
- Retorna `204`.
- Após sucesso ou falha por sessão ausente, limpar o estado local e redirecionar para `/login`.

---

## 3. Aceitar convite — `/accept-invite`

### Rota utilizada

✅ `POST /invites/accept`

### Origem do token

O link recebido por e-mail terá o formato:

```text
/accept-invite?token=TOKEN
```

O token deve ser lido da URL e não deve ser exibido em um campo editável.

### Formulário

| Campo | Tipo | Obrigatório | Regras |
|---|---|---:|---|
| Nova senha | `password` | Sim | 8 a 72 caracteres |
| Confirmar senha | `password` | Sim | Deve ser igual à nova senha; campo somente do frontend |

Payload enviado ao backend:

```json
{
  "token": "token-com-pelo-menos-32-caracteres",
  "password": "SenhaDeTeste123!"
}
```

Não enviar `confirmPassword`.

Resposta `200`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do usuário",
    "email": "usuario@example.com"
  }
}
```

### Estados necessários

- Token ausente na URL.
- Convite não encontrado (`404`).
- Convite expirado ou já utilizado (`410`).
- E-mail já pertence a uma conta ativa (`409`).
- Ativação concluída, com botão “Ir para o login”.

Não existe endpoint de validação prévia do token. A validade é confirmada somente ao enviar a senha.

---

## 4. Estrutura da aplicação autenticada

Todas as páginas sob `/app` devem exigir sessão.

### Dados globais

✅ `GET /users/me`

Resposta:

```json
{
  "id": "uuid",
  "name": "Arthur",
  "email": "arthur@example.com",
  "createdAt": "2026-08-01T12:00:00.000Z"
}
```

✅ `GET /plantations`

Usado no seletor global de plantação e na decisão de redirecionamento após login.

### Elementos do layout

- Nome do usuário.
- Plantação selecionada.
- Alternador de plantação quando houver mais de uma.
- Papel do usuário na plantação (`OWNER` ou `MEMBER`).
- Navegação principal.
- Acesso ao perfil.
- Logout.

### Estados transversais obrigatórios

- Carregando.
- Lista vazia.
- Erro de rede.
- Sessão expirada (`401`).
- Acesso negado (`403`).
- Recurso não encontrado (`404`).
- Página não encontrada.

---

## 5. Seleção e criação de plantação — `/app/plantations`

### Listagem

✅ `GET /plantations`

Resposta:

```json
[
  {
    "id": "uuid",
    "name": "Fazenda TechSoil",
    "location": "Paraná",
    "createdAt": "2026-08-16T12:00:00.000Z",
    "role": "OWNER"
  }
]
```

O backend retorna somente plantações vinculadas ao usuário.

### Criar plantação

✅ `POST /plantations`

| Campo | Tipo | Obrigatório | Regras do backend |
|---|---|---:|---|
| Nome | texto | Sim | 2 a 120 caracteres |
| Localização | texto | Não | Até 240 caracteres |

Payload:

```json
{
  "name": "Fazenda TechSoil",
  "location": "Londrina, Paraná"
}
```

- Espaços nas extremidades são removidos.
- Localização vazia é armazenada como `null`.
- O criador recebe automaticamente o papel `OWNER`.
- Após sucesso, selecionar a nova plantação e navegar para sua página.

---

## 6. Página inicial da plantação — `/app/plantations/[plantationId]`

### Rota utilizada

✅ `GET /plantations/:id`

Resposta:

```json
{
  "id": "uuid",
  "name": "Fazenda TechSoil",
  "location": "Londrina, Paraná",
  "createdAt": "2026-08-16T12:00:00.000Z",
  "role": "OWNER"
}
```

### Conteúdo disponível agora

- Nome e localização.
- Papel do usuário.
- Atalho para membros.
- Atalho para configurações quando `role === "OWNER"`.
- Estado informativo para sensores e carrinho ainda não integrados.

Não criar gráficos falsos como se fossem dados reais. Usar um estado de “Integração em desenvolvimento” até os módulos de sensores e carrinho existirem.

---

## 7. Perfil — `/app/profile`

### Consultar perfil

✅ `GET /users/me`

### Editar perfil

✅ `PATCH /users/me`

| Campo | Tipo | Obrigatório | Regras do backend |
|---|---|---:|---|
| Nome | texto | Sim | 2 a 120 caracteres |

Payload:

```json
{
  "name": "Arthur Atualizado"
}
```

O endpoint não permite alterar e-mail, senha ou papel. Não mostrar esses campos como editáveis nesta versão.

---

## 8. Configurações da plantação — `/app/plantations/[plantationId]/settings`

Somente `OWNER` deve visualizar controles administrativos. O backend também aplica essa proteção.

### Editar plantação

✅ `PATCH /plantations/:id`

| Campo | Tipo | Obrigatório | Regras do backend |
|---|---|---:|---|
| Nome | texto | Não | 2 a 120 caracteres quando enviado |
| Localização | texto | Não | Até 240 caracteres; `null` remove a localização |

É obrigatório enviar pelo menos um campo.

Exemplos:

```json
{
  "name": "Fazenda Atualizada"
}
```

```json
{
  "location": null
}
```

### Excluir plantação

✅ `DELETE /plantations/:id`

- Retorna `204` quando concluído.
- Retorna `409` quando há dispositivos ou expedições vinculadas.
- Exigir confirmação explícita, mostrando o nome da plantação.
- Não fazer remoção otimista: aguardar a resposta do backend.
- Após sucesso, invalidar a lista de plantações e redirecionar para `/app/plantations`.

---

## 9. Membros — `/app/plantations/[plantationId]/members`

### Listar membros

✅ `GET /plantations/:id/members`

Resposta:

```json
[
  {
    "id": "uuid-do-vinculo",
    "role": "OWNER",
    "joinedAt": "2026-08-16T12:00:00.000Z",
    "user": {
      "id": "uuid-do-usuario",
      "name": "Arthur",
      "email": "arthur@example.com"
    }
  }
]
```

### Remover membro

✅ `DELETE /plantations/:id/members/:userId`

- Somente `OWNER`.
- Usar `user.id`, não o ID do vínculo, no parâmetro `:userId`.
- Retorna `204` quando concluído.
- Retorna `409` se a remoção deixaria a plantação sem owner.
- Exigir confirmação mostrando nome e e-mail do membro.

### Convidar membro

⚠️ `POST /invites` existe, mas ainda precisa ser protegido pelo RBAC de `OWNER` antes de ser conectado à interface.

Formulário previsto:

| Campo | Tipo | Obrigatório | Regras do backend |
|---|---|---:|---|
| Nome | texto | Sim | 2 a 120 caracteres |
| E-mail | e-mail | Sim | E-mail válido, até 254 caracteres |
| Papel | select | Não | `MEMBER` ou `OWNER`; padrão `MEMBER` |
| Plantação | oculto/contexto | Sim nesta tela | UUID da plantação atual |

Payload previsto:

```json
{
  "name": "Maria",
  "email": "maria@example.com",
  "role": "MEMBER",
  "plantationId": "uuid-da-plantacao"
}
```

Não habilitar o envio deste formulário até o backend exigir que o remetente seja `OWNER` da plantação. Inicialmente, recomenda-se permitir convite somente como `MEMBER`; promover outro owner deve ser uma decisão explícita de produto.

---

## 10. Permissões da interface

| Operação | MEMBER | OWNER | Backend |
|---|:---:|:---:|---|
| Ver plantação | ✅ | ✅ | Implementado |
| Ver membros | ✅ | ✅ | Implementado |
| Editar plantação | ❌ | ✅ | Implementado |
| Excluir plantação | ❌ | ✅ | Implementado |
| Remover membro | ❌ | ✅ | Implementado |
| Convidar membro | ❌ | Futuro | Ajuste de RBAC pendente |
| Criar plantação | ✅ | ✅ | Qualquer usuário autenticado e ativo |

Esconder ou desabilitar ações proibidas melhora a experiência, mas nunca substitui a autorização do backend.

---

## 11. Telas e integrações futuras

### Dispositivos

🔲 Backend ainda não implementado.

Rotas planejadas:

- `POST /plantations/:id/devices` — somente `OWNER`.
- `GET /plantations/:id/devices` — `OWNER` e `MEMBER`.
- `DELETE /plantations/:id/devices/:deviceId` — somente `OWNER`.

Formulário previsto:

| Campo | Tipo | Obrigatório | Valores/regras previstos |
|---|---|---:|---|
| Identificador do dispositivo | texto | Sim | `deviceId`, globalmente único |
| Nome | texto | Sim | Nome amigável para o usuário |
| Tipo | select | Sim | `SENSOR` ou `CART` |

### Sensores

🔲 Backend Web ainda não implementado.

Rotas planejadas:

- `GET /plantations/:id/sensors/latest`
- `GET /plantations/:id/sensors?from=&to=`

Telas previstas:

- Dashboard com última leitura.
- Histórico com filtros de período.
- Gráficos de umidade, temperatura, pH, condutividade elétrica, nitrogênio, fósforo e potássio.

### Carrinho

🔲 Backend Web ainda não implementado.

Rotas planejadas:

- `GET /plantations/:id/cart/latest`
- `GET /plantations/:id/cart?from=&to=`
- `POST /plantations/:id/cart/route`

Telas previstas:

- Mapa da plantação.
- Posição atual do carrinho.
- Galeria de capturas.
- Resultado de análise das imagens.
- Configuração e envio de rota.

---

## 12. Checklist antes de concluir cada tela

- [ ] Usa somente rotas marcadas como implementadas.
- [ ] Envia `Authorization: Bearer` nas rotas protegidas.
- [ ] Usa `credentials: "include"` nos fluxos de sessão.
- [ ] Não armazena refresh token no JavaScript.
- [ ] Valida os campos e limites documentados.
- [ ] Não envia campos extras.
- [ ] Trata `400`, `401`, `403`, `404`, `409`, `410` e `429` quando aplicáveis.
- [ ] Possui estados de carregamento, vazio, sucesso e erro.
- [ ] Respeita visualmente `OWNER` e `MEMBER`.
- [ ] Invalida ou atualiza os dados após mutações.
- [ ] Não exibe sucesso antes da confirmação do backend.
- [ ] Funciona em desktop e dispositivos móveis.

## Próxima implementação recomendada no frontend

1. Cliente HTTP e gerenciamento de sessão.
2. Tela de login.
3. Tela de aceite de convite.
4. Layout autenticado.
5. Seleção e criação de plantação.
6. Página inicial da plantação.
7. Perfil.
8. Configurações e membros, mantendo o convite desabilitado até a correção do RBAC no backend.
