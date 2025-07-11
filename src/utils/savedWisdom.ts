export interface SavedWisdomEntry {
  id: string;
  messageId: number;
  text: string;
  timestamp: string;
  category?: 'affirmation' | 'guidance' | 'story' | 'tool-suggestion';
  username: string;
}

export class SavedWisdomManager {
  private static readonly STORAGE_KEY = 'leap-saved-wisdom';

  static getSavedWisdom(username: string): SavedWisdomEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const allWisdom: SavedWisdomEntry[] = JSON.parse(stored);
      return allWisdom.filter(entry => entry.username === username);
    } catch (error) {
      console.error('Failed to load saved wisdom:', error);
      return [];
    }
  }

  static saveWisdom(entry: Omit<SavedWisdomEntry, 'id' | 'timestamp'>): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const allWisdom: SavedWisdomEntry[] = stored ? JSON.parse(stored) : [];
      
      const newEntry: SavedWisdomEntry = {
        ...entry,
        id: `wisdom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      allWisdom.unshift(newEntry); // Add to beginning
      
      // Keep only the most recent 100 entries per user
      const userEntries = allWisdom.filter(e => e.username === entry.username);
      const otherEntries = allWisdom.filter(e => e.username !== entry.username);
      const limitedUserEntries = userEntries.slice(0, 100);
      
      const finalWisdom = [...limitedUserEntries, ...otherEntries];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalWisdom));
      
      return true;
    } catch (error) {
      console.error('Failed to save wisdom:', error);
      return false;
    }
  }

  static removeWisdom(id: string): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const allWisdom: SavedWisdomEntry[] = JSON.parse(stored);
      const filtered = allWisdom.filter(entry => entry.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to remove wisdom:', error);
      return false;
    }
  }

  static getRecentWisdom(username: string, limit: number = 3): SavedWisdomEntry[] {
    const allWisdom = this.getSavedWisdom(username);
    return allWisdom.slice(0, limit);
  }

  static categorizeMessage(text: string): SavedWisdomEntry['category'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('story') || lowerText.includes('worked a job') || lowerText.includes('had a guy')) {
      return 'story';
    }
    if (lowerText.includes('tool') || lowerText.includes('breathing') || lowerText.includes('tracker')) {
      return 'tool-suggestion';
    }
    if (lowerText.includes('strength') || lowerText.includes('you\'re') || lowerText.includes('that counts')) {
      return 'affirmation';
    }
    
    return 'guidance';
  }
}
