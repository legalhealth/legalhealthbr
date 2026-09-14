# Plano de Resposta a Incidentes de Segurança — Legal Health

> Minuta para revisão do advogado e do responsável técnico. Versão 1 — 14/09/2026.

## 1. O que é incidente

Qualquer evento que comprometa a confidencialidade, a integridade ou a disponibilidade de dados pessoais: acesso indevido a fichas de pacientes, vazamento de gravações, perda de dados, sequestro de conta, falha de regra de acesso no banco de dados, exposição de chave secreta.

## 2. Papéis

| Papel | Responsabilidade |
| --- | --- |
| Responsável técnico | Contenção, investigação técnica, correção e evidências |
| Encarregado de dados (DPO) | Avaliação de risco aos titulares, comunicação à ANPD e aos titulares |
| Responsável jurídico | Análise de obrigações contratuais e regulatórias |
| Responsável de produto | Comunicação às clínicas e aos usuários |

> Preencher nomes, e-mails e telefones antes de publicar.

## 3. Fluxo

1. **Registro (imediato):** quem detectou, o que observou, hora, sistemas afetados.
2. **Contenção (até 4 horas):** revogar sessões e chaves, bloquear acessos suspeitos, corrigir regra de acesso, isolar recursos.
3. **Investigação (até 48 horas):** determinar causa raiz, dados e titulares afetados, janela temporal, usando o registro de acessos por conta e os registros do provedor.
4. **Avaliação de risco:** natureza dos dados (saúde = risco elevado), volume, facilidade de identificação, consequências prováveis.
5. **Comunicação:**
   - Clínicas controladoras afetadas: sem demora injustificada, com fatos conhecidos e medidas tomadas.
   - ANPD e titulares: quando houver risco ou dano relevante, em prazo razoável, com descrição dos dados, riscos, medidas adotadas e contato do encarregado.
6. **Correção e fechamento:** corrigir a causa raiz, validar com teste, registrar lições e ações preventivas.
7. **Registro final:** manter o dossiê do incidente por, no mínimo, cinco anos.

## 4. Modelo de comunicação à clínica

> Identificamos em [data/hora] um incidente que afetou [descrição]. Dados envolvidos: [categorias]. Pacientes potencialmente afetados: [quantidade]. Medidas já adotadas: [contenção]. Medidas recomendadas a você: [ações]. Contato do encarregado: [e-mail].

## 5. Prevenção contínua

- Revisão trimestral das regras de acesso do banco e das políticas do repositório de arquivos.
- Revisão semestral dos vínculos ativos de assistentes em cada conta.
- Alerta sobre falhas de gravação no registro de acessos (erros deixaram de ser silenciosos).
- Rotação de chaves e segredos ao menor sinal de exposição.
- Teste de restauração de cópia de segurança ao menos uma vez por ano.
