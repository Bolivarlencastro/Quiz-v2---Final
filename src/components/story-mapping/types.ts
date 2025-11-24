export interface StoryLink {
  text: string;
  url: string;
  type: 'clickup' | 'internal' | 'generic';
}

export interface StoryDetail {
  text: string;
  checked: boolean;
  links: StoryLink[];
}

export interface UserStoryCardData {
  title: string;
  details: StoryDetail[];
}

export interface ActivityColumnData {
  activity: string;
  subActivity?: string;
  versions: Record<string, UserStoryCardData[]>; // e.g., { "v1.0": [ ...stories... ] }
}

export interface StoryMapData {
  epic: string;
  activities: ActivityColumnData[];
}
