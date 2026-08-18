



import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

import { CourseWizardComponent } from './components/course-wizard/course-wizard.component';
import { CoursePlayerComponent } from './components/course-player/course-player.component';
import { StoryMappingModalComponent } from './components/story-mapping/story-mapping-modal.component';
import { parseStoryMap } from './components/story-mapping/utils';
import { StoryMapData } from './components/story-mapping/types';

import { Course } from './types';
import { EMPTY_COURSE } from './mock-data';

type ViewState = 'courseWizard' | 'coursePlayer';

const STORY_MAP_MARKDOWN = `## QUIZ V2 - CENTRAL IT

### Entrega e prioridade
#### Entrega parcial
##### Prioritaria
**Como time de produto, quero entregar o menor escopo necessario para a Central IT sem refacao desnecessaria**
- [x] Permitir criar mais questoes do que o necessario em um quiz.
- [x] Permitir definir quantas questoes devem aparecer em cada execucao do quiz.
- [x] Manter o modelo atual do quiz e alterar somente o que foi pedido.

##### Intermediaria
**Como time de produto, quero viabilizar reutilizacao simples de questoes**
- [x] Permitir incluir questoes em um banco global.
- [x] Permitir buscar e reutilizar questoes do banco com busca simples.

##### Golden plate
**Como admin, quero importar questoes por planilha com validacao completa e conferencia antes do salvamento**
- [x] Implementar importacao via planilha somente depois das prioridades anteriores.
  - [Navegar para componente](app://quiz-import)

### Fora de escopo desta entrega
#### Nao entregar agora
##### Base obrigatoria
**Como time de produto, quero registrar explicitamente o que nao entra nesta versao**
- [ ] Nao incluir quiz do tipo Pesquisa nesta entrega.
- [ ] Nao incluir geracao de questoes por IA.
- [ ] Nao incluir busca semantica nem integracao com Elastic.
- [ ] Nao incluir parametrizacao de tentativas maximas e tempo por quiz.
- [ ] Nao incluir feedback com alternativa correta e texto explicativo.
- [ ] Nao incluir imagens nas perguntas.
- [ ] Nao incluir randomizacao das alternativas como configuracao independente.

### Ajustes de UX
#### Tela de conteudos do curso
##### Base obrigatoria
**Como usuario, quero entrar no fluxo novo do quiz sem refazer o restante da tela**
- [x] Manter o botao Adicionar Conteudo igual ao atual.
- [x] Remover o botao Gerar Quiz Rapido desta versao.

#### Fluxo de criacao do quiz
##### Base obrigatoria
**Como usuario, quero seguir pelo fluxo novo do quiz sem etapa intermediaria desnecessaria**
- [x] Ao clicar em Quiz no menu de conteudo, ir direto para o modal Selecione o tipo de quiz.
- [x] Nao exibir etapa intermediaria para definir o nome antes desse modal.
- [x] Inserir o nome do quiz em outro momento, conforme o novo prototipo.
- [x] No modal Selecione o tipo de quiz, manter Avaliativo habilitado e funcional.
- [x] No modal Selecione o tipo de quiz, manter Pesquisa desabilitado com a mensagem Em desenvolvimento.
- [x] No modal Como voce quer criar o quiz?, manter Criacao manual habilitada e funcional.
- [x] No modal Como voce quer criar o quiz?, manter Usar assistente de IA desabilitado com a mensagem Em desenvolvimento.

### Botoes e recursos indisponiveis
#### Sinalizacao de indisponibilidade
##### Base obrigatoria
**Como usuario, quero entender claramente o que ainda nao foi entregue**
- [x] Todo botao indicado como nao implementado deve ficar desabilitado.
- [x] Todo botao desabilitado deve exibir a mensagem Em desenvolvimento.

### Criacao e edicao de perguntas
#### Tela da pergunta
##### Base obrigatoria
**Como conteudista, quero editar a pergunta com o visual correto e sem recursos fora do escopo**
- [x] Atualizar a tela para ficar visualmente mais proxima da referencia original.
- [x] Remover o campo Imagem de Apoio (Opcional) do formulario de perguntas.
- [x] Manter o restante do formulario igual ao atual.
- [x] Permitir formatacao no enunciado.
- [x] Nao permitir inclusao de imagens no enunciado nesta entrega.
- [x] Manter alternativas textuais simples, sem formatacao.
- [x] Manter regra atual de 2 ou mais alternativas por pergunta.
- [x] Manter regra atual de 1 ou mais alternativas corretas.
- [x] Permitir excluir perguntas e alternativas apenas durante a criacao do quiz.
- [x] Depois de criado, nao permitir excluir perguntas ou alternativas.

### Configuracoes do quiz
#### Parametros disponiveis
##### Base obrigatoria
**Como editor, quero manter apenas as configuracoes necessarias para esta entrega**
- [x] Manter o toggle Randomizar Ordem das Perguntas.
  - [Navegar para componente](app://quiz-setting-randomize)
- [x] Manter o campo Exibir quantas questoes? para selecionar o total a ser sorteado.
- [x] Selecionar essa quantidade a partir do total de perguntas cadastradas no quiz.
- [x] Aceitar apenas valores entre 1 e o total de perguntas cadastradas no quiz.
- [x] Deixar o campo em branco para exibir todas as perguntas, preservando o comportamento atual.
- [x] Bloquear salvamento ou publicacao quando a quantidade selecionada for maior do que o total de perguntas.

##### Fora de escopo
**Como time de produto, quero deixar claro o que fica para depois**
- [ ] Remover desta entrega o parametro Randomizar Ordem das Alternativas.
- [ ] Remover desta entrega o parametro Exibir Feedback Imediato.
  - [Navegar para componente](app://quiz-setting-feedback)
- [ ] Remover desta entrega o parametro Numero de Tentativas do Quiz.
  - [Navegar para componente](app://quiz-setting-attempts)
- [ ] Remover desta entrega o parametro Tempo Maximo (min).
  - [Navegar para componente](app://quiz-setting-time-limit)

### Banco global de questoes
#### Inclusao, remocao e busca
##### Intermediaria
**Como conteudista, quero adicionar, remover e reaproveitar questoes do banco de forma simples**
- [x] Toda pergunta criada pode ser adicionada ao banco por meio de uma flag booleana \u0060in_question_bank\u0060.
- [x] A flag pode ser marcada durante a criacao da pergunta ou posteriormente.
- [x] Remover do banco significa alterar apenas a flag para false, sem apagar a pergunta nem remover vinculos existentes.
- [x] Qualquer usuario com permissao para criar conteudo pode adicionar ou remover perguntas do banco, independentemente de quem criou a pergunta.
- [x] Buscar no banco pelo enunciado da pergunta usando Postgres simples.
- [x] Exibir apenas perguntas com \u0060in_question_bank = true\u0060.
- [x] Nao usar Elastic nesta entrega.
- [x] Permitir selecao acumulada em pesquisas sucessivas ate a confirmacao.
  - [Navegar para componente](app://quiz-question-bank)
- [ ] Se for simples, incluir busca tambem nas alternativas como melhoria nao obrigatoria.

### Importacao por planilha
#### Fluxo e restricoes
##### Golden plate
**Como admin, quero importar varias questoes com revisao no front antes de salvar**
- [x] Restringir a importacao por planilha ao perfil admin.
- [x] Bloquear o botao de importacao quando houver ao menos 1 questao ja carregada no formulario atual.
- [x] Fazer upload e validacao do arquivo inteiro antes de qualquer salvamento.
- [x] Exibir o lote em tela para revisao quando a planilha for valida.
- [x] Permitir que o admin escolha individualmente quais questoes do lote vao para o banco global.
- [x] Adicionar acao para selecionar todas as questoes do lote para o banco global.
- [x] Confirmar o lote antes de persistir as perguntas com as flags escolhidas.
- [x] Permitir limpar o formulario antes da confirmacao final.
- [x] Depois de importar com sucesso, ainda permitir criar novas perguntas manualmente no mesmo quiz.

#### Modelo da planilha
##### Golden plate
**Como admin, quero seguir um modelo simples de importacao**
- [x] Utilizar as colunas ID, ENUNCIADO, ALTERNATIVA e CORRETA.
- [x] Tratar ID como obrigatorio.
- [x] Tratar ALTERNATIVA como obrigatoria.
- [x] Tratar CORRETA como obrigatoria, aceitando Sim ou Nao.
- [x] Permitir ENUNCIADO ausente quando houver ID, cadastrando a pergunta assim mesmo.

### Validacoes da importacao
#### Regras obrigatorias
##### Golden plate
**Como admin, quero receber erros claros e evitar cadastro parcial**
- [x] Se faltar ENUNCIADO, mas o ID estiver preenchido, cadastrar sem erro usando o ID como chave da pergunta.
- [x] Se faltar ID, gerar erro informando que o ID e obrigatorio.
- [x] Se faltar a marcacao de CORRETA em alguma alternativa, gerar erro obrigatorio.
- [x] Se faltar ALTERNATIVA com os demais campos preenchidos, gerar erro de inconsistencia de preenchimento.
- [x] Se houver ao menos 1 erro no lote, invalidar a importacao inteira.
- [x] Nao permitir cadastro parcial.
- [x] Exibir os erros em portugues, detalhados por linha ou pergunta afetada.
- [x] Invalidar o lote temporario apos o salvamento para evitar duplo processamento.
`;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CourseWizardComponent,
    CoursePlayerComponent,
    StoryMappingModalComponent,
  ],
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);

  readonly primaryRailItems = [
    { icon: 'home', label: 'Home', active: false },
    { icon: 'radio_button_checked', label: 'Pulses', active: false },
    { icon: 'school', label: 'Matriculas', active: false },
    { icon: 'bar_chart', label: 'Ranking', active: false },
    { icon: 'groups', label: 'Painel do Lider', active: false },
  ] as const;

  readonly secondaryRailItems = [
    { icon: 'settings', label: 'Admin', active: false },
    { icon: 'help', label: 'Ajuda', active: false },
  ] as const;

  viewState = signal<ViewState>('courseWizard');
  courseData = signal<Course | null>(JSON.parse(JSON.stringify(EMPTY_COURSE)));
  wizardStartStep = signal<number>(4);
  
  isFullScreen = signal<boolean>(!!this.document.fullscreenElement);
  theme = signal<'light' | 'dark'>('light');

  // Story Map state
  showStoryMap = signal<boolean>(false);
  storyMapData = signal<StoryMapData | null>(null);
  highlightRequest = signal<{ target: string; timestamp: number } | null>(null);

  constructor() {
    this.document.addEventListener('fullscreenchange', () => {
        this.isFullScreen.set(!!this.document.fullscreenElement);
    });
    
    // Keydown listener for global shortcuts
    this.document.addEventListener('keydown', (event: KeyboardEvent) => {
        // Ignore shortcuts if the user is typing in an input, textarea, or contenteditable element.
        if ((event.target as HTMLElement).matches('input, textarea, [contenteditable="true"]')) {
            return;
        }

        switch (event.key.toLowerCase()) {
            case 's':
                event.preventDefault();
                this.toggleStoryMap();
                break;
            case 'f':
                event.preventDefault();
                this.toggleFullScreen();
                break;
        }
    });

    // Effect to apply theme class to the document root
    effect(() => {
      if (this.theme() === 'dark') {
        this.document.documentElement.classList.add('dark');
      } else {
        this.document.documentElement.classList.remove('dark');
      }
    });

    // Effect to handle body scroll when story map is open
    effect(() => {
        if (this.showStoryMap()) {
            this.document.body.style.overflow = 'hidden';
        } else {
            this.document.body.style.overflow = 'auto';
        }
    });
  }
  
  toggleStoryMap(): void {
    const isShowing = this.showStoryMap();
    if (!isShowing && !this.storyMapData()) {
        // First time opening, parse data directly from the constant
        try {
            this.storyMapData.set(parseStoryMap(STORY_MAP_MARKDOWN));
            this.showStoryMap.set(true);
        } catch (err) {
            console.error("Failed to parse story map", err);
            // Optionally handle the error, maybe show a message
        }
    } else {
        this.showStoryMap.set(!isShowing);
    }
  }
  
  handleInternalLink(target: string): void {
    this.toggleStoryMap(); // Close the modal
    // Set a request to highlight the feature. The timestamp ensures the effect triggers even if the target is the same.
    this.highlightRequest.set({ target, timestamp: Date.now() });
  }

  toggleTheme(): void {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }

  toggleFullScreen(): void {
    if (!this.document.fullscreenElement) {
      this.document.documentElement.requestFullscreen();
    } else if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    }
  }

  // --- Exit Wizard ---
  exitWizard(): void {
      // Reset to a new, empty course to start the creation process over.
      this.courseData.set(JSON.parse(JSON.stringify(EMPTY_COURSE)));
      this.wizardStartStep.set(1);
      this.viewState.set('courseWizard');
  }

  handleCoursePreview(course: Course): void {
    this.courseData.set(course);
    this.viewState.set('coursePlayer');
  }

  exitCoursePlayer(): void {
    // Return to the content editing step (Step 4)
    this.wizardStartStep.set(4);
    this.viewState.set('courseWizard');
  }
}
