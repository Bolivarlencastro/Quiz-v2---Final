import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '../../types';
import { MOCK_COURSE_TEMPLATE } from '../../mock-data';

@Component({
  selector: 'app-ai-creation-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-creation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiCreationModalComponent {
  close = output<void>();
  back = output<void>();
  courseGenerated = output<Course>();

  prompt = signal<string>('');
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');

  presetPrompts = [
    'Um curso de integração para novos desenvolvedores de software',
    'Treinamento de atendimento ao cliente para uma equipe de varejo',
    'Noções básicas de segurança da informação para todos os funcionários',
    'Introdução à gestão de projetos ágeis com Scrum'
  ];

  usePresetPrompt(preset: string): void {
    this.prompt.set(preset);
  }

  generateCourse(): void {
    if (!this.prompt().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const messages = [
        "Analisando seu pedido...",
        "Estruturando os módulos do curso...",
        "Gerando o conteúdo inicial...",
        "Finalizando os detalhes..."
    ];
    let messageIndex = 0;
    this.loadingMessage.set(messages[messageIndex]);

    const interval = setInterval(() => {
        messageIndex++;
        if (messageIndex < messages.length) {
            this.loadingMessage.set(messages[messageIndex]);
        } else {
            clearInterval(interval);
        }
    }, 1200);


    setTimeout(() => {
      const newCourse: Course = {
        ...JSON.parse(JSON.stringify(MOCK_COURSE_TEMPLATE)),
        name: `Curso de IA: ${this.prompt()}`,
        description: `Este curso foi gerado por IA com base no seguinte prompt: "${this.prompt()}". ${MOCK_COURSE_TEMPLATE.description}`,
        internalCode: `AI-${Date.now()}`
      };
      
      this.isLoading.set(false);
      this.courseGenerated.emit(newCourse);
    }, 5000); // Simulate a 5-second generation time
  }
}
