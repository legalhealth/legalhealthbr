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
