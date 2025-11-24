import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoryMapData, StoryLink, UserStoryCardData } from './types';

@Component({
  selector: 'app-story-mapping-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './story-mapping-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMappingModalComponent {
  data = input<StoryMapData | null>();
  close = output<void>();
  internalLinkClick = output<string>();

  selectedVersion = signal<string>('all');

  availableVersions = computed<string[]>(() => {
    const storyMapData = this.data();
    if (!storyMapData) return [];
    const versions = new Set<string>();
    storyMapData.activities.forEach(activity => {
        Object.keys(activity.versions).forEach(version => versions.add(version));
    });
    return Array.from(versions).sort();
  });

  getFilteredVersions(versions: Record<string, UserStoryCardData[]>): { name: string, stories: UserStoryCardData[] }[] {
    const versionFilter = this.selectedVersion();
    const entries = Object.entries(versions);
    const filteredEntries = versionFilter === 'all' 
      ? entries 
      : entries.filter(([v]) => v === versionFilter);
    
    return filteredEntries.map(([name, stories]) => ({ name, stories }));
  }

  getLinkIcon(type: StoryLink['type']): string {
    switch (type) {
        case 'clickup': return 'fact_check';
        case 'internal': return 'gps_fixed';
        default: return 'link';
    }
  }
}
