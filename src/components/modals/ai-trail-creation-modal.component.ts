import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trail } from '../../types';
import { MOCK_TRAIL_TEMPLATE } from '../../mock-data';

@Component({
  selector: 'app-ai-trail-creation-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-trail-creation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiTrailCreationModalComponent {
  close = output<void>();
  back = output<void>();
  trailGenerated = output<Trail>();

  prompt = signal<string>('');
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');

  presetPrompts = [
    'Uma trilha de integração para novos vendedores',
    'Trilha sobre liderança para gerentes de primeira viagem',
    'Trilha de produtividade com ferramentas de IA',
    'Trilha sobre comunicação não-violenta no ambiente de trabalho'
  ];

  usePresetPrompt(preset: string): void {
    this.prompt.set(preset);
  }

  generateTrail(): void {
    if (!this.prompt().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const messages = [
        "Analisando seu pedido...",
        "Estruturando as missões da trilha...",
        "Gerando os pulses de reforço...",
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
      const newTrail: Trail = {
        ...JSON.parse(JSON.stringify(MOCK_TRAIL_TEMPLATE)),
        name: `Trilha de IA: ${this.prompt()}`,
        description: `Esta trilha foi gerada por IA com base no seguinte prompt: "${this.prompt()}". ${MOCK_TRAIL_TEMPLATE.description}`,
      };
      
      this.isLoading.set(false);
      this.trailGenerated.emit(newTrail);
    }, 5000); // Simulate a 5-second generation time
  }
}
