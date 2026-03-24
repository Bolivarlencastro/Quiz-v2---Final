import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentType } from '../../types';

type ContentCreationStage = 'root' | 'file' | 'link';

@Component({
  selector: 'app-content-creation-dialog',
  imports: [CommonModule],
  templateUrl: './content-creation-dialog.component.html',
  styleUrl: './content-creation-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentCreationDialogComponent {
  close = output<void>();
  contentSelected = output<ContentType>();

  stage = signal<ContentCreationStage>('root');

  selectRootOption(option: 'file' | 'quiz' | 'link' | 'authoring'): void {
    if (option === 'quiz') {
      this.contentSelected.emit('quiz');
      return;
    }

    if (option === 'authoring') {
      this.contentSelected.emit('scorm');
      return;
    }

    this.stage.set(option);
  }

  selectContent(type: ContentType): void {
    this.contentSelected.emit(type);
  }

  goBack(): void {
    this.stage.set('root');
  }
}
