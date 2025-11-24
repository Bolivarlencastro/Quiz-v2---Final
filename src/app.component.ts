



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

const STORY_MAP_MARKDOWN = `## GESTÃO DE QUIZZES

### NOVO TIPO DE QUIZ
#### Quizes de Pesquisa
##### v1.0
**Como criador, quero criar um quiz de pesquisa de opinião para coletar informações qualitativas e quantitativas dos usuários**
- [ ] Posso criar quizzes com perguntas abertas (Open-Ended Question) ou de múltipla escolha (Single-Select Multiple Choice).
  - [Navegar para componente](app://quiz-survey-type)
- [ ] Não há limite para a criação desse tipo de quiz.
- [ ] Perguntas abertas terão apenas o nome da lição e a pergunta.
- [ ] Perguntas de multipla escolha terão o nome da lição, a pergunta, e suas alternativas.
- [ ] Posso definir até 5 alternativas para cada pergunta.
- [ ] Não há a possibilidade de escolher qual é a alternativa correta.
- [ ] As respostas não irão interferir na performance dos usuários respondentes.

**Como usuário consumidor de conteúdos, quero responder as pesquisas de opinião dos cursos que estou consumindo**
- [ ] Posso escrever até 2000 caracteres nas perguntas abertas (Open-Ended Question).
- [ ] Posso selecionar apenas uma alternativa nas perguntas de multipla escolha (Single-Select Multiple Choice).
- [ ] Não há alternativa correta, portanto, não receberei feedback em nenhuma resposta.
- [ ] Não posso finalizar o curso sem responder as pesquisas.

### NOVAS MECÂNICAS PARA OS QUIZZES
#### Banco de questões geral da workspace
##### v1.1
**Durante a criação ou edição de um conteúdo do tipo quiz, quero ADICIONAR as questões a um banco para reutilizá-las em outros quizzes.**
- [ ] Ao criar uma questão dentro de um quiz, terei a opção de adicioná-la ao banco de questões da workspace.
- [ ] Posso adicionar uma quantidade ilimitada de questões no banco de questões da workspace.
- [ ] Ao reutilizar uma questão em outro quiz, terei automaticamente o enunciado da pergunta, suas alternativas e a resposta correta.

**Durante a exclusão ou edição de um conteúdo do tipo quiz, quero REMOVER as questões do banco para deixá-lo mais organizado sem conteúdos obsoletos.**
- [ ] Ao excluir um quiz de um curso, terei a opção de remover todas suas questões do banco de questões da workspace.
- [ ] Ao excluir uma questão de um quiz, terei a opção de removê-la do banco de questões da workspace.
- [ ] Serei impedido de excluir uma questão do banco de questões da workspace caso ela esteja vinculada a outro curso, independente do seu status de criação.

**Durante a criação ou edição de um conteúdo do tipo quiz, quero REAPROVEITAR as questões presentes no banco de questões da workspace para incluí-las no conteúdo.**
- [ ] Posso adicionar uma quantidade ilimitada de questões do banco da workspace em um curso.
  - [Navegar para componente](app://quiz-question-bank)
- [ ] Posso adicionar a mesma questão em uma quantidade ilimitada de cursos.
- [ ] Não posso adicionar a mesma questão do banco em um mesmo quiz.
- [ ] Posso adicionar diversas questões ao mesmo tempo em um mesmo quiz (ação em lote de adição).

### CONFIGURAÇÕES DO QUIZ
#### Comportamento e Regras
##### v1.1
**Durante a criação ou edição de um quiz, quero que todas as questões adicionadas formem um banco de questões específico, para que eu possa RANDOMIZÁ-LAS e selecionar a quantidade desejada para exibição aos usuários.**
- [ ] Todas as questões adicionadas ao quiz formarão o banco de questões do quiz.
  - [Navegar para componente](app://quiz-setting-randomize)
- [ ] Posso randomizar a ordem das perguntas desse banco, que serão exibidas ao usuário na plataforma durante a realização do quiz.
- [ ] Posso selecionar uma quantidade específica de questões dentro do banco para serem apresentadas ao usuário durante o consumo do quiz.
- [ ] Cada usuário que acessar o quiz verá um conjunto de questões aleatórias, com a quantidade definida, extraídas do banco de questões do quiz.
- [ ] Caso o usuário inicie o consumo do quiz e saia da classroom, a ordem das questões não será alterada.

**Durante a criação ou edição de um quiz, quero definir se o FEEDBACK DAS RESPOSTAS será exibido imediatamente após cada questão ou apenas ao final do quiz.**
- [ ] Posso definir se o feedback (certo, errado, parcial) da resposta do usuário será imediato ou no final do quiz.
  - [Navegar para componente](app://quiz-setting-feedback)
- [ ] O feedback imediato será enviado assim que o usuário submeter a resposta.
- [ ] O feedback ao final do quiz será enviado assim que o usuário submeter a resposta da última questão do quiz.
- [ ] O feedback ao final trará o total de erros e acertos.

**Durante a criação ou edição de um quiz, quero definir um número de TENTATIVAS máximo para que cada usuário possa responder todas as questões presentes no quiz.**
- [ ] Posso definir um número máximo de tentativas de resposta do quiz para o usuário. 
  - [Navegar para componente](app://quiz-setting-attempts)
- [ ] Após a ultima pergunta do quiz, o usuário terá a opção de refazer o quiz novamente.
- [ ] O usuário poderá responder todas as questões do quiz novamente até que o limite de vezes definida pelo admin seja atingido.
- [ ] O histórico das respostas não será salvo entre as tentativas.

**No editor de quizzes, posso definir um LIMITE DE TEMPO para que o participante finalize todo o conteúdo. Quando esse tempo expira, o quiz será automaticamente encerrado e o usuário seguirá para o próximo conteúdo.**
- [ ] Posso definir o total de minutos que o usuário terá para responder todo o quiz.
  - [Navegar para componente](app://quiz-setting-time-limit)
- [ ] O tempo não pode ser interrompido de forma alguma.
- [ ] Caso o usuário saia da página, o tempo deverá ser retomado de onde foi interrompido.
- [ ] Quando o tempo expirar, o usuário não poderá mais responder o quiz.
- [ ] Quando o tempo expirar, o sistema salvará as respostas do usuário até o momento.
- [ ] Caso hajam questões sem resposta, o sistema contará como resposta incorreta.

### IMPORTAÇÃO DE QUESTÕES
#### Criação em Lote
##### v1.2
**Durante a criação ou edição de um quiz, quero baixar uma planilha modelo fornecida pelo sistema para preencher e realizar o upload de múltiplas questões de forma rápida e padronizada durante a criação ou edição de um quiz**
- [ ] Posso realizar o download da planilha modelo durante a criação ou edição do quiz.
  - [Navegar para componente](app://quiz-import)
- [ ] Posso editar as questões dentro do quiz após a importação da tabela.
- [ ] Assim como as questões criadas manualmente, posso optar por adicionar as questões criadas via planilha no banco de questões da workspace.
- [ ] Não posso criar questões de pesquisa via planilha.

### QUIZZES COM IMAGENS
#### Enriquecimento Visual
##### v1.1
**Durante a criação ou edição de uma questão, quero adicionar uma imagem ao enunciado para fornecer apoio visual e melhorar a compreensão dos usuários.**
- [x] Posso fazer o upload de uma imagem no formulário de edição de questão.
  - [Navegar para componente](app://quiz-image)
- [x] Posso adicionar imagens em formato JPEG, PNG e WEBP.
- [x] A imagem deve ter um tamanho máximo de 2MB e será redimensionada para uma largura máxima de 640px.
- [x] Posso posicionar a imagem ANTES ou DEPOIS do texto do enunciado.
- [x] Posso remover a imagem a qualquer momento.
`;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
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

    // Initialize theme based on system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme.set(prefersDark ? 'dark' : 'light');

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