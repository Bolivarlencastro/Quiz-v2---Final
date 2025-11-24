import { StoryLink, StoryMapData, ActivityColumnData, UserStoryCardData } from './types';

export const getLinkType = (text: string, url: string): StoryLink['type'] => {
    if (url.startsWith('app://')) return 'internal';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('clickup')) return 'clickup';
    return 'generic';
};

export const parseStoryMap = (markdown: string): StoryMapData => {
    const lines = markdown.split('\n');
    const storyMap: StoryMapData = { epic: '', activities: [] };
    let currentActivity: ActivityColumnData | null = null;
    let currentVersion: string | null = null;
    let currentStory: UserStoryCardData | null = null;
    const taskListRegex = /^- \[([x ])\] (.*)/;
    const linkRegex = /^\s*- \[([^\]]+)\]\(([^)]+)\)/; // Handles indented links

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('## ')) {
            storyMap.epic = trimmedLine.substring(3).trim();
            currentActivity = null;
            currentVersion = null;
            currentStory = null;
        } else if (trimmedLine.startsWith('### ')) {
            currentActivity = {
                activity: trimmedLine.substring(4).trim(),
                versions: {},
            };
            storyMap.activities.push(currentActivity);
            currentVersion = null;
            currentStory = null;
        } else if (trimmedLine.startsWith('#### ') && currentActivity) {
            currentActivity.subActivity = trimmedLine.substring(5).trim();
        } else if (trimmedLine.startsWith('##### ') && currentActivity) {
            currentVersion = trimmedLine.substring(6).trim();
            if (!currentActivity.versions[currentVersion]) {
                currentActivity.versions[currentVersion] = [];
            }
            currentStory = null;
        } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && currentActivity && currentVersion) {
            currentStory = {
                title: trimmedLine.substring(2, trimmedLine.length - 2).trim(),
                details: [],
            };
            currentActivity.versions[currentVersion].push(currentStory);
        } else if (currentStory) {
            const taskMatch = trimmedLine.match(taskListRegex);
            const linkMatch = line.match(linkRegex); // Use original line to detect indentation

            if (taskMatch) {
                const checked = taskMatch[1].trim() === 'x';
                const text = taskMatch[2].trim();
                currentStory.details.push({ text, checked, links: [] });
            } else if (linkMatch && currentStory.details.length > 0) {
                const lastDetail = currentStory.details[currentStory.details.length - 1];
                if (lastDetail) {
                    const text = linkMatch[1].trim();
                    const url = linkMatch[2].trim();
                    const type = getLinkType(text, url);
                    const finalUrl = type === 'internal' ? url.replace('app://', '') : url;
                    lastDetail.links.push({ text, url: finalUrl, type });
                }
            }
        }
    }
    return storyMap;
};
