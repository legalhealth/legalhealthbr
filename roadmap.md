# Roadmap — Legal Health

## Em andamento
- [ ] Base própria de Q&A jurídico (`legal_qa`) + busca no banco usada pelo chatbot antes da IA externa
- [ ] Painel de curadoria da base em `/admin/base-juridica` (papel admin)
- [ ] Papéis de usuário (`user_roles`: medico | advogado | admin) + `has_role`
- [ ] Painel do advogado em `/advogado` (revisões recebidas, anexos, comprovante, parecer, status)
- [ ] Comprovante público por token em `/revisao/$token` (intimação anexada + Juriscore, sem login)
- [ ] Publicar e validar logado (chatbot responde pela base sem créditos, Juriscore e histórico carregam)
- [ ] Corrigir aviso de hidratação do cabeçalho no preview

## Pendências conhecidas (fora do escopo atual)
- Checkout/pagamento dos planos (hoje só grava `profiles.plano`)
- Service worker (offline) e Web Push reais
- Cron + e-mail dos lembretes de prazo (`plan_reminders`, TODO no hook)

## Progresso (base própria + link seguro)
- [x] Base `legal_qa` com 41 Q&A (jurídico, suporte, comercial), busca `match_legal_qa`, registro de usos e lacunas
- [x] Chatbot logado e público respondem primeiro pela base própria (sem consumir créditos de IA)
- [x] Token seguro de 7 dias por revisão + link no e-mail do advogado
- [x] Página pública `/revisao/<token>` com intimação anexada, peça e Juriscore, sem login
- [ ] Painel do advogado (`/advogado`) com parecer e resposta direta + e-mail ao médico (template `revisao-parecer` já criado)
- [ ] Painel admin da base jurídica (`/admin/base-juridica`) usando `src/lib/legal-qa.ts`
- [ ] Publicar e validar logado com pergunta coberta pela base
