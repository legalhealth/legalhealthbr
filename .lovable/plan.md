# Onboarding guiado no celular, com voz e minuta pronta

A trilha de primeiros passos passa a ter quatro passos, funciona confortavelmente na tela do celular e termina com o documento de minuta aberto na tela, pronto para copiar, salvar e enviar.

## A trilha no celular

1. Calcular o Juriscore®
2. Ver os três riscos
3. Gravar uma triagem por voz (novo)
4. Gerar a primeira minuta — a tela abre o documento pronto

Ajustes de tela pequena:

- Cartão "Seus primeiros passos" no Início: botão do próximo passo em largura cheia abaixo do texto no celular, passos em lista vertical com toque confortável, textos que não quebram nem estouram.
- Tela de boas-vindas: os quatro cartões empilham no celular, com os botões grandes e fixos ao alcance do dedo.
- Rodapé de "próximo passo" nas telas de Juriscore, Plano, ficha do paciente e Biblioteca, sempre acima do menu inferior, sem cobrir botões.
- Triagem por voz: botão de gravar grande e centralizado, medidor de voz e cronômetro visíveis sem rolar, e a lista de próximos passos logo abaixo.

## Passo de voz

- Do cartão da trilha, "Gravar uma triagem por voz" leva direto à triagem por voz. Se ainda não houver paciente cadastrado, a tela abre primeiro o cadastro rápido (nome e contato) e segue para a gravação.
- A gravação usa o microfone real do aparelho, como já está hoje: consentimento, gravação com medidor de voz, transcrição durante a fala e resumo organizado ao final. Nada muda no funcionamento do microfone.
- Quando o microfone é negado ou não capta som, a tela mostra a mensagem de erro clara que já existe e oferece continuar por escrito, sem travar a trilha.
- Ao final, entre as sugestões da triagem, um botão "Gerar esta minuta" leva ao passo 4 já com o modelo, o paciente e o contexto do atendimento preenchidos.

## Minuta pronta ao final

- O passo 4 gera o documento e, ao terminar, a tela rola até ele e o documento fica em destaque, com Copiar texto, Enviar no meu WhatsApp e enviar para revisão do advogado — como já existe hoje.
- Acima do documento aparece uma faixa de conclusão: "Primeiros passos concluídos — este é o seu primeiro documento", com link para o Início.
- O cartão do Início vira o resumo de conquista assim que os quatro passos estiverem feitos.

## Detalhes técnicos

- `src/lib/onboarding.ts`: acrescentar o passo `voz` a `TRILHA` (destino `/biblioteca` com `cat: "pacientes"`, ou a ficha do paciente quando já houver um). `useProgressoTrilha` passa a consultar `patient_triages` (status confirmada, ou qualquer registro do usuário) para marcar o passo como concluído; `ProgressoTrilha` ganha o campo `voz`.
- `src/components/onboarding/trilha-progresso.tsx`: layout responsivo (`w-full sm:w-auto` no botão, `flex-col sm:flex-row` no cabeçalho), e `TrilhaRodape` aceita `depoisDe: "juriscore" | "riscos" | "voz"`.
- `src/routes/_authenticated/bem-vindo.tsx`: grade `sm:grid-cols-2 lg:grid-cols-4`, ícone novo (`Mic`) para o passo de voz.
- `src/components/pacientes/triagem-voz.tsx`: hierarquia visual do bloco de gravação em telas pequenas; nas minutas sugeridas, link para `/biblioteca` com `cat`, `doc`, `pac` e o resumo da triagem como contexto (o campo `contexto` já é aceito por `streamBibliotecaDoc` e por `/api/ai-biblioteca`).
- `src/routes/_authenticated/biblioteca.tsx`: faixa de conclusão da trilha acima do bloco do documento quando o progresso fecha, e ajuste do bloco de ações para empilhar no celular.
- Sem mudanças de banco de dados e sem mexer no funcionamento do microfone.

## Verificação

- Checagem de tipos e formatação.
- Percurso completo simulado em tela de celular (384x702): trilha no Início, boas-vindas, ida à triagem, tela de gravação com o consentimento, e geração da minuta com o documento visível ao final.
- A captação real do microfone só você pode confirmar no seu aparelho; a tela mostra o medidor de voz durante a gravação para isso ficar evidente.
