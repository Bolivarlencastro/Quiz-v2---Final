# Regras Claras para Implementacao - Versao Central IT

Fonte: `/Users/bolivaralencastro/Desktop/Apresentacao-1Lg7Pcm2HnVYjZADktNZNs2k_ubm38QvsxMIg_VNQ2Xo.pptx`

Este documento traduz os 11 slides da apresentacao em regras objetivas do que deve ser feito no produto. As imagens do `.pptx` servem como referencia visual do layout e do fluxo esperado em cada tela.

## Objetivo da entrega

Entregar uma versao curta do Quiz V2 para a Central IT, aproveitando o que ja existe hoje e evitando refacao desnecessaria nesta etapa.

## Diretriz principal

- Manter o que ja esta funcionando e so alterar o que foi explicitamente pedido.
- Aproximar a interface do modelo visual atual apresentado nas referencias.
- Entregar apenas o escopo necessario para a Central IT.
- Tudo o que nao estiver nessa lista deve ser tratado como fora de escopo desta entrega.

## Prioridades da entrega

### Prioritaria

- Permitir criar mais questoes do que o necessario em um quiz.
- Permitir definir quantas questoes devem aparecer em cada execucao do quiz.

### Intermediaria

- Permitir incluir questoes no banco de questoes.
- Permitir buscar e reutilizar questoes do banco com pesquisa simples.

### Golden plate

- Importacao de questoes via planilha.

## O que deve permanecer igual

- Manter igual o que ja existe hoje quando o slide disser para nao alterar.
- Continuar permitindo editar quizzes como ja acontece hoje.
- Continuar com as regras atuais de alternativas:
- Pode haver 2 ou mais alternativas por pergunta.
- Pode haver 1 ou mais alternativas corretas.
- As alternativas continuam sendo textuais simples, sem formatacao.
- Exclusao de perguntas e alternativas continua permitida apenas durante a criacao do quiz.
- Depois que o quiz estiver criado, nao permitir excluir perguntas ou alternativas, como ja ocorre hoje.
- Continuar sem permitir exclusao e edicao de questoes ou quizzes ja publicados.

## Ajustes de fluxo e interface

### 1. Home e entrada no quiz

- Aproximar a tela inicial do modelo ja existente mostrado nas referencias.
- Evitar recriar componentes ou fluxos que ja estejam adequados hoje.
- Ao clicar no quiz, o usuario deve cair direto na tela de configuracao/edicao correspondente.
- Nao exibir o nome do quiz nesse clique inicial.
- O nome sera inserido em outro momento, conforme o novo prototipo citado na apresentacao.

### 2. Botoes e recursos indisponiveis nesta versao

- Todo botao indicado nas referencias como nao implementado deve ficar desabilitado.
- O botao desabilitado deve exibir a mensagem: `Em desenvolvimento`.
- Nao incluir recurso de IA nesta primeira entrega.

### 3. Tela de criacao/edicao de pergunta

- Atualizar a tela para ficar visualmente igual ao modelo original mostrado na referencia.
- Remover a imagem de apoio exibida na tela atual.
- O enunciado deve aceitar formatacao.
- Nao permitir inclusao de imagens no enunciado nesta entrega.
- As alternativas continuam sem formatacao.

## Configuracoes do quiz

- Remover os parametros extras apontados nas referencias.
- Manter apenas a randomizacao da ordem das perguntas, que ja existe hoje.
- Adicionar apenas a configuracao de quantidade de perguntas que devem aparecer no quiz.
- Essa quantidade deve ser selecionada a partir do total de perguntas cadastradas naquele quiz.
- A versao final do produto podera ter opcao para randomizar ou nao, mas isso nao entra agora.
- Parametros adicionais ficam para a entrega futura do Quiz V2.

## Banco de questoes

### 1. Inclusao e remocao

- Adicionar botao para remover uma questao do banco de questoes.
- `Remover` significa tirar do banco de questoes, nao apagar a questao dos quizzes em que ela ja estiver vinculada.
- A implementacao deve ser simples: usar uma flag booleana na tabela `questions` para indicar se a questao esta disponivel no banco.
- Exemplo esperado:
- `true`: disponivel no banco de questoes.
- `false`: indisponivel no banco de questoes.
- Qualquer usuario com permissao para criar conteudo pode remover do banco, mesmo que nao tenha criado a questao.
- Perfis considerados no material: super admin, admin e conteudista podem criar e adicionar ao banco.

### 2. Busca

- Implementar busca simples no banco de questoes usando Postgres.
- A busca deve funcionar pelo titulo/enunciado da pergunta.
- Se for simples viabilizar, incluir busca tambem nas alternativas.
- Nao e obrigatorio usar Elastic nesta versao.
- Nao enviar nada para Elastic nesta entrega.

### 3. Comportamento da selecao

- O usuario deve conseguir pesquisar uma questao, selecionar, mudar a pesquisa e selecionar outra.
- Isso deve permitir montar uma lista com varias questoes a partir de multiplas pesquisas textuais.

### 4. Regras complementares

- Toda pergunta criada pode ser adicionada ao banco por meio da flag booleana.
- Se uma pergunta for excluida durante a criacao e ela estiver marcada para o banco, ela tambem deve ser removida do banco.
- Nao considerar pulses nesta entrega.

## Importacao via planilha

### 1. Modelo de importacao

- A importacao deve seguir o modelo de planilha definido nas referencias.
- Nao usar modelo com alternativas em colunas fixas.
- O modelo em colunas fixas nao atende porque:
- Uma pergunta pode ter apenas 1 enunciado.
- Pode ter multiplas alternativas.
- O minimo de alternativas e 2.
- Nao ha maximo definido para alternativas.
- Pode haver 1 ou mais alternativas corretas.

### 2. Fluxo da importacao

- O admin deve importar a planilha e visualizar os dados no front antes de salvar.
- A importacao nao pode salvar diretamente no banco.
- Deve existir uma etapa de conferencia pelo admin antes da confirmacao.
- O admin deve poder escolher, no front, quais questoes farao parte do banco de questoes.
- Adicionar acao para selecionar todas ou adicionar todas ao banco.

### 3. Restricoes do fluxo

- A importacao so funciona com a tela limpa.
- Se houver ao menos 1 questao ja cadastrada no formulario atual, o botao de importar deve ficar desabilitado.
- Cada processo de importacao pode ser executado apenas 1 vez por formulario carregado.
- Como as questoes ainda nao estao na base nesse momento, o admin pode limpar o formulario do quiz apos a importacao.
- Depois de importar, o admin ainda pode criar novas perguntas manualmente.

## Validacoes da importacao

Essas regras foram explicitadas nos slides de validacao da planilha.

### Casos aceitos

- Se faltar o enunciado, mas o ID estiver preenchido, cadastrar sem erro.
- Nesse caso, usar o ID como chave de identificacao da questao.

### Casos com erro obrigatorio

- Se faltar o ID, mesmo com enunciado completo, gerar erro informando que o ID e obrigatorio.
- Se faltar a marcacao de correta ou nao correta, gerar erro informando que esse campo e obrigatorio.
- Se faltar alternativas, mesmo havendo ID, enunciado e marcacao de correta, nao cadastrar e informar inconsistencia de preenchimento.

### Regra geral de processamento

- Tirando o primeiro caso aceito acima, qualquer erro invalida a importacao inteira.
- Nao deve haver cadastro parcial.
- Se existir 1 erro que seja, nao processar a planilha.
- Apresentar uma lista de erros em tela para o admin.

## Itens fora de escopo nesta entrega

- Geracao de quizzes por IA a partir de transcricao de conteudos.
- Search semantico com tags e Elastic.
- Novo tipo de quiz de pesquisa.
- Parametrizacoes de randomizacao avancada.
- Parametrizacoes de tentativas maximas.
- Parametrizacoes de tempo.
- Feedback com resposta da pergunta, alternativa correta e resposta textual.
- Inclusao de imagens nas perguntas.

## Checklist objetivo para implementacao

- Ajustar telas para seguir o visual das referencias sem recriar o que ja esta bom.
- Fazer o clique no quiz cair direto na tela correta, sem nome do quiz nesse momento.
- Desabilitar botoes fora de escopo com a mensagem `Em desenvolvimento`.
- Remover IA desta versao.
- Atualizar tela de pergunta para aceitar formatacao no enunciado e remover imagem de apoio.
- Nao permitir imagens no enunciado.
- Manter alternativas simples, sem formatacao.
- Remover configuracoes extras do quiz e manter somente randomizacao atual e quantidade de perguntas exibidas.
- Implementar flag booleana para disponibilidade da questao no banco.
- Implementar remocao do banco sem apagar vinculos existentes em quizzes.
- Implementar busca simples no Postgres por enunciado e, se viavel sem custo alto, tambem por alternativas.
- Permitir selecao acumulada de questoes em pesquisas sucessivas.
- Implementar importacao por planilha com preview antes de salvar.
- Bloquear importacao se o formulario nao estiver limpo.
- Garantir validacoes de planilha e lista de erros sem cadastro parcial.

## Observacao final

O material indica claramente que esta entrega e uma versao reduzida, com foco em velocidade e reaproveitamento. Sempre que houver duvida entre uma implementacao mais sofisticada e uma mais simples, a decisao correta nesta etapa e a mais simples que atenda as regras acima.
