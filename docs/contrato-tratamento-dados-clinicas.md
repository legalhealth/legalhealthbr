# Contrato de Tratamento de Dados Pessoais (LGPD) — Legal Health e Clínicas

> Minuta para revisão do advogado. Não é documento assinado nem parecer jurídico.
> Versão 1 — 14/09/2026.

## 1. Partes e papéis

- **Controlador:** a clínica ou o profissional de saúde titular da conta, que decide quais dados de pacientes insere na plataforma e para quê.
- **Operador:** Legal Health, que trata os dados exclusivamente conforme as instruções do Controlador e para as finalidades deste contrato.

## 2. Objeto

Tratamento de dados pessoais e de dados pessoais sensíveis de saúde, inseridos pelo Controlador na plataforma Legal Health, para: cadastro de pacientes, histórico documental e procedimental, triagem administrativa por voz ou formulário, geração de minutas e registro de acessos.

## 3. Natureza dos dados e titulares

- Titulares: pacientes, responsáveis legais e integrantes da equipe da clínica.
- Categorias: identificação e contato, convênio, responsável legal, observações, relatos de triagem, transcrição e gravação de áudio (quando autorizada pelo titular), documentos gerados e anexados.
- Dados sensíveis de saúde estão incluídos; a base legal é indicada pelo Controlador (em regra, tutela da saúde por profissional de saúde ou consentimento do titular).

## 4. Obrigações do Operador

1. Tratar os dados apenas conforme instruções documentadas do Controlador.
2. Manter controle de acesso por conta: somente o profissional titular e assistentes com vínculo ativo acessam os dados daquela conta.
3. Registrar acessos, edições, exportações e exclusões, com autor e data, em registro imutável no lado do servidor.
4. Guardar gravações de áudio em repositório privado, acessível apenas por link temporário emitido pelo servidor.
5. Manter sigilo da equipe própria e exigir sigilo equivalente de suboperadores.
6. Apoiar o Controlador no atendimento a pedidos de titulares (acesso, cópia, correção e eliminação) por meio das funções de exportação e exclusão definitiva disponíveis na ficha do paciente.
7. Comunicar o Controlador sem demora injustificada em caso de incidente de segurança, conforme o Plano de Resposta a Incidentes.
8. Eliminar ou devolver os dados ao fim do contrato, na forma da cláusula 8.

## 5. Obrigações do Controlador

1. Definir a base legal, informar os titulares e colher os consentimentos exigidos, inclusive para gravação de áudio.
2. Inserir apenas os dados necessários à finalidade.
3. Gerenciar os acessos da própria equipe (convites, vínculos ativos e inativos).
4. Revisar todo documento e toda triagem produzidos com apoio de inteligência artificial antes de qualquer uso — a decisão clínica e jurídica é sempre humana.

## 6. Subtratamento

O Operador utiliza subtratadores de infraestrutura em nuvem e de processamento por inteligência artificial, listados no Anexo A. O Operador responde pelos atos dos subtratadores e exige deles obrigações equivalentes às deste contrato, incluindo vedação ao uso dos dados para treinamento de modelos.

## 7. Segurança

Medidas mínimas: criptografia em trânsito e em repouso, autenticação individual, segregação de dados por conta, regras de acesso no banco de dados, registro de acessos, repositório privado de arquivos, princípio do menor privilégio e revisão periódica de acessos.

## 8. Retenção e eliminação

- Os dados permanecem enquanto o Controlador os mantiver na plataforma. Não há expiração automática.
- A exclusão definitiva pela ficha do paciente remove ficha, atendimentos, triagens, avaliações, gravações e vínculos de documentos.
- Cópias de segurança da infraestrutura expiram dentro da janela de retenção do provedor de nuvem, informada no Anexo A.
- Encerrado o contrato, o Operador elimina os dados após o prazo de resgate informado ao Controlador, salvo obrigação legal de guarda.

## 9. Anexo A — Subtratadores

| Subtratador | Finalidade | País |
| --- | --- | --- |
| Provedor de nuvem e banco de dados | Hospedagem, banco de dados e armazenamento de arquivos | a confirmar |
| Provedor de inteligência artificial | Transcrição de áudio e organização de texto | a confirmar |
| Provedor de e-mail transacional | Envio de convites e notificações | a confirmar |

> Preencher países, prazos de retenção de backup e denominação social antes da assinatura.
