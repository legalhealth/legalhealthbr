# Base própria de conhecimento, painel do advogado e comprovante público

Quatro frentes, na ordem de execução. O relatório técnico já entregue no chat continua valendo como diagnóstico.

## 1. Base própria de perguntas e respostas jurídicas (com busca semântica)

O chatbot passa a responder primeiro com conteúdo próprio, curado, e só recorre ao modelo externo quando não há correspondência boa.

- Nova tabela `legal_qa`: pergunta, variações de pergunta, resposta completa, fundamentação (normas/artigos), pilar relacionado, categoria (`juridico | suporte | comercial`), tags, `status` (publicado/rascunho), embedding vetorial e contador de uso. Leitura pública apenas dos itens publicados; escrita só para papel de administrador.
- Extensão de vetores habilitada + função de busca por similaridade (`match_legal_qa`) para encontrar a Q&A mais próxima da pergunta do usuário.
- Conteúdo inicial: cerca de 50 perguntas e respostas de Direito Médico redigidas por mim, cobrindo prontuário e TCLE, publicidade médica e resoluções do CFM, LGPD em clínicas, responsabilidade civil e ônus da prova, glosas e ANS, telemedicina, sindicância no CRM, e questões trabalhistas/contratuais do consultório. Cada resposta segue o padrão da plataforma (resposta direta, fundamentação, riscos, conduta) e traz o aviso de revisão por advogado.
- Fluxo de resposta do chatbot: busca na base → se a similaridade for alta, responde com o conteúdo próprio (marcado como "Base Legal Health", com as normas citadas) e oferece aprofundar com a IA; se for média, usa a Q&A como contexto para a IA; se não houver nada, segue o comportamento atual.
- Efeito prático: com créditos de IA esgotados, o chatbot ainda responde as perguntas cobertas pela base, em vez de exibir erro.
- Painel de curadoria em `/admin/base-juridica` (só administrador): criar, editar, publicar/despublicar Q&A, ver quantas vezes cada uma foi usada e quais perguntas ficaram sem resposta (registro de lacunas para você preencher).

## 2. Painel do advogado

- Papéis em tabela dedicada (`user_roles` com `medico | advogado | admin`) e função de verificação no banco — nunca no perfil, para evitar escalonamento de privilégio.
- Convite: ao enviar uma revisão, o advogado recebe o e-mail atual e, junto, um convite para criar conta com papel de advogado vinculado ao e-mail informado. Ao se cadastrar com aquele e-mail, ele passa a ver todas as revisões enviadas a ele.
- Nova área `/advogado`: lista das revisões recebidas (médico, protocolo, data, status), com filtros por situação.
- Detalhe da revisão: dados do caso, mensagem do médico, anexos abríveis por link assinado, comprovante de envio visível/baixável, Juriscore e pilares em risco do médico, e campo de parecer.
- O advogado responde no app: parecer gravado em `revisao_comentarios` com papel `advogado`, mudança de status (em análise, ajustes solicitados, concluída) e notificação por e-mail ao médico. O médico vê o parecer em `/ia/revisoes`.
- Isolamento: o advogado só acessa revisões endereçadas a ele; nunca a base de documentos do médico como um todo.

## 3. Comprovante público por link seguro (sem login)

- Cada revisão ganha um token público de acesso, com validade configurável (padrão 7 dias) e possibilidade de revogar.
- O e-mail e o comprovante passam a apontar para `/revisao/<token>`: página sem login mostrando o comprovante, a intimação/documentos anexados (visualização por link assinado gerado no servidor a cada abertura) e o resumo do Juriscore do médico (score, nível e pilares em risco — sem dados de outros pacientes ou documentos alheios ao caso).
- Registro de abertura: data/hora do primeiro acesso, exibido ao médico como confirmação de leitura.
- Na página pública, botão para o advogado criar conta e responder pelo painel.

## 4. Publicar e validar logado

- Publicar o app e testar em sessão autenticada: abrir o chatbot com uma pergunta real coberta pela base (por exemplo, prazo de guarda de prontuário), confirmar que a resposta vem da base própria sem consumir créditos, e verificar que o cartão do Juriscore e o histórico carregam.
- Observação: respostas geradas pelo modelo externo continuam dependendo de créditos de IA no workspace; as perguntas cobertas pela base funcionam independentemente disso.

## Detalhes técnicos

- Migrações: `legal_qa` (+ extensão vetorial, índice de similaridade, função `match_legal_qa`), `user_roles` + `has_role` como função security definer, `revisao_tokens` (token, expiração, revogação, primeiro acesso), coluna de parecer/status em `revisoes`. Toda tabela nova com GRANTs explícitos e RLS: `legal_qa` com leitura `anon` apenas de itens publicados; `user_roles` e tokens sem acesso direto de `anon`.
- Embeddings gerados no servidor via gateway de IA no momento de salvar a Q&A (custo pontual, não por pergunta do usuário); busca em tempo de execução é só consulta ao banco.
- Novas rotas de servidor: busca na base para o chatbot logado e público, geração/renovação de token, leitura pública da revisão por token (em `api/public/*`, validando o token e nunca expondo dados além do caso).
- Reaproveitamento: `src/lib/chatbot.ts` e `src/components/chatbot/*` ganham a etapa de base própria antes da chamada ao modelo; `src/lib/ia-revisoes.ts` e `src/lib/revisoes.functions.ts` passam a emitir o link com token no comprovante e no e-mail.
- Correção de um aviso de hidratação já presente no preview (cabeçalho renderizado de forma diferente no servidor e no cliente na rota de autenticação), feita junto da frente 1.
- Sem mudanças de identidade visual: mesmas cores, tipografia e componentes já usados.