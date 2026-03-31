



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
#### Versao curta
##### Prioritaria
**Como time de produto, quero entregar o menor escopo necessario para a Central IT sem refacao desnecessaria**
- [x] Permitir criar mais questoes do que o necessario em um quiz.
- [x] Permitir definir quantas questoes devem aparecer em cada execucao do quiz.
- [x] Manter o que ja funciona e alterar somente o que foi pedido.

##### Intermediaria
**Como time de produto, quero viabilizar reutilizacao simples de questoes**
- [x] Permitir incluir questoes no banco de questoes.
- [x] Permitir buscar e reutilizar questoes do banco com pesquisa simples.

##### Golden plate
**Como admin, quero importar questoes por planilha com conferencia antes do salvamento**
- [x] Implementar importacao via planilha somente depois das prioridades anteriores.
  - [Navegar para componente](app://quiz-import)

### Home e entrada no quiz
#### Fluxo inicial
##### Base obrigatoria
**Como usuario, quero entrar no quiz pelo fluxo novo sem adicionar etapas desnecessarias**
- [x] Aproximar a tela inicial do modelo visual ja apresentado.
- [x] Ao clicar em Quiz, abrir a dialog de criacao, exibir a selecao do tipo de quiz e, depois, a forma de criacao antes de seguir para a tela de configuracao ou edicao correspondente.
- [x] Nao exibir o nome do quiz nesse clique inicial.
- [x] Inserir o nome do quiz em outro momento, conforme o novo prototipo.

### Botoes e recursos indisponiveis
#### Fora do escopo desta versao
##### Base obrigatoria
**Como usuario, quero entender claramente o que ainda nao foi entregue**
- [x] Todo botao indicado como nao implementado deve ficar desabilitado.
- [x] Todo botao desabilitado deve exibir a mensagem Em desenvolvimento.
- [x] Nao incluir recurso de IA nesta primeira entrega.

### Criacao e edicao de perguntas
#### Tela da pergunta
##### Base obrigatoria
**Como conteudista, quero editar a pergunta com o visual correto e sem recursos fora do escopo**
- [x] Atualizar a tela para ficar visualmente mais proxima da referencia original.
- [x] Remover a imagem de apoio exibida na tela atual.
  - [Navegar para componente](app://quiz-image)
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
- [x] Remover parametros extras apontados nas referencias.
- [x] Manter apenas a randomizacao da ordem das perguntas que ja existe hoje.
  - [Navegar para componente](app://quiz-setting-randomize)
- [x] Adicionar somente a configuracao de quantidade de perguntas exibidas no quiz.
- [x] Selecionar essa quantidade a partir do total de perguntas cadastradas no quiz.

##### Fora de escopo
**Como time de produto, quero deixar claro o que fica para depois**
- [ ] Nao entregar agora randomizacao avancada.
- [ ] Nao entregar agora tentativas maximas.
  - [Navegar para componente](app://quiz-setting-attempts)
- [ ] Nao entregar agora limite de tempo.
  - [Navegar para componente](app://quiz-setting-time-limit)
- [ ] Nao entregar agora feedback imediato ou ao final do quiz.
  - [Navegar para componente](app://quiz-setting-feedback)

### Banco de questoes
#### Inclusao, remocao e busca
##### Intermediaria
**Como conteudista, quero adicionar, remover e reaproveitar questoes do banco de forma simples**
- [x] Toda pergunta criada pode ser adicionada ao banco por meio de uma flag booleana.
- [x] Remover do banco significa tirar do banco, nao apagar a questao dos quizzes vinculados.
- [x] Implementar remocao com uma flag booleana na tabela questions para indicar disponibilidade no banco.
- [x] Qualquer usuario com permissao para criar conteudo pode remover do banco, mesmo sem ter criado a questao.
- [x] Buscar no banco por titulo ou enunciado usando Postgres.
- [x] Se for simples, incluir busca tambem nas alternativas.
- [x] Nao enviar nada para Elastic nesta entrega.
- [x] Permitir selecao acumulada em pesquisas sucessivas.
  - [Navegar para componente](app://quiz-question-bank)

### Importacao por planilha
#### Fluxo e restricoes
##### Golden plate
**Como admin, quero importar varias questoes com preview e conferencia antes de salvar**
- [x] Seguir o modelo de planilha mostrado na referencia.
- [x] Nao usar modelo com alternativas em colunas fixas.
- [x] Fazer upload e preview no front antes de salvar qualquer dado.
- [x] Permitir que o admin escolha quais questoes farao parte do banco.
- [x] Adicionar acao para selecionar todas ou adicionar todas ao banco.
- [x] Bloquear importacao quando houver ao menos 1 questao ja cadastrada no formulario atual.
- [x] Permitir apenas 1 processo de importacao por formulario carregado.
- [x] Depois de importar, ainda permitir criar novas perguntas manualmente.

### Validacoes da importacao
#### Regras obrigatorias
##### Golden plate
**Como admin, quero receber erros claros e evitar cadastro parcial**
- [x] Se faltar o enunciado, mas o ID estiver preenchido, cadastrar sem erro usando o ID como chave.
- [x] Se faltar o ID, gerar erro informando que o ID e obrigatorio.
- [x] Se faltar a marcacao de correta ou nao correta, gerar erro obrigatorio.
- [x] Se faltar alternativas, nao cadastrar e informar inconsistencia de preenchimento.
- [x] Tirando o caso aceito do ID sem enunciado, qualquer erro invalida a importacao inteira.
- [x] Nao permitir cadastro parcial.
- [x] Apresentar em tela a lista de erros para o admin.

### Fora de escopo
#### Nao entregar agora
##### Fora de escopo
**Como time de produto, quero registrar explicitamente o que nao entra na versao curta**
- [ ] Nao incluir geracao de quizzes por IA a partir de transcricao.
- [ ] Nao incluir search semantico com tags e Elastic.
- [ ] Nao incluir novo tipo de quiz de pesquisa.
- [ ] Nao incluir feedback com resposta da pergunta, alternativa correta e resposta textual.
- [ ] Nao incluir imagens nas perguntas nesta entrega.
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
