export interface ConversationSummary {
  id: string;
  username: string;
  lastConversationDate: string;
  mainTopics: string[];
  userEmotionalState: 'struggling' | 'hopeful' | 'frustrated' | 'neutral' | 'crisis';
  toolsRecommended: string[];
  toolsUsed: string[];
  keyMentions: string[];
  followUpItems: string[];
  conversationLength: number;
  significantMoments: string[];
}

export interface ConversationMemoryEntry {
  id: string;
  username: string;
  sessionDate: string;
  summary: ConversationSummary;
  lastMessages: Array<{
    sender: 'user' | 'foreman';
    text: string;
    timestamp: string;
  }>;
}

export class ConversationMemoryManager {
  private static readonly STORAGE_KEY = 'leap-conversation-memory';
  private static readonly MAX_ENTRIES_PER_USER = 10;

  static getConversationHistory(username: string): ConversationMemoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const allMemories: ConversationMemoryEntry[] = JSON.parse(stored);
      return allMemories
        .filter(entry => entry.username === username)
        .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  }

  static getLastConversationSummary(username: string): ConversationSummary | null {
    const history = this.getConversationHistory(username);
    return history.length > 0 ? history[0].summary : null;
  }

  static saveConversationSession(
    username: string,
    messages: Array<{ sender: 'user' | 'foreman'; text: string; time: string }>,
    toolsUsed: string[] = []
  ): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const allMemories: ConversationMemoryEntry[] = stored ? JSON.parse(stored) : [];
      
      // Generate conversation summary
      const summary = this.generateConversationSummary(messages, toolsUsed);
      
      const newEntry: ConversationMemoryEntry = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        sessionDate: new Date().toISOString(),
        summary: {
          ...summary,
          id: `summary_${Date.now()}`,
          username,
          lastConversationDate: new Date().toISOString()
        },
        lastMessages: messages.slice(-6).map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date().toISOString()
        }))
      };

      // Add to beginning and maintain limit per user
      allMemories.unshift(newEntry);
      
      const userEntries = allMemories.filter(e => e.username === username);
      const otherEntries = allMemories.filter(e => e.username !== username);
      const limitedUserEntries = userEntries.slice(0, this.MAX_ENTRIES_PER_USER);
      
      const finalMemories = [...limitedUserEntries, ...otherEntries];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalMemories));
      
      return true;
    } catch (error) {
      console.error('Failed to save conversation session:', error);
      return false;
    }
  }

  static generateConversationSummary(
    messages: Array<{ sender: 'user' | 'foreman'; text: string; time: string }>,
    toolsUsed: string[] = []
  ): Omit<ConversationSummary, 'id' | 'username' | 'lastConversationDate'> {
    const userMessages = messages.filter(m => m.sender === 'user');
    const foremanMessages = messages.filter(m => m.sender === 'foreman');
    
    // Analyze emotional state from user messages
    const emotionalState = this.analyzeEmotionalState(userMessages.map(m => m.text));
    
    // Extract main topics
    const mainTopics = this.extractMainTopics(userMessages.map(m => m.text));
    
    // Find tools recommended by foreman
    const toolsRecommended = this.extractToolsRecommended(foremanMessages.map(m => m.text));
    
    // Extract key mentions (triggers, concerns, victories)
    const keyMentions = this.extractKeyMentions(userMessages.map(m => m.text));
    
    // Generate follow-up items
    const followUpItems = this.generateFollowUpItems(userMessages.map(m => m.text), toolsRecommended);
    
    // Find significant moments
    const significantMoments = this.findSignificantMoments(messages);

    return {
      mainTopics,
      userEmotionalState: emotionalState,
      toolsRecommended,
      toolsUsed,
      keyMentions,
      followUpItems,
      conversationLength: messages.length,
      significantMoments
    };
  }

  private static analyzeEmotionalState(userMessages: string[]): ConversationSummary['userEmotionalState'] {
    const allText = userMessages.join(' ').toLowerCase();
    
    // Crisis indicators
    if (allText.includes('crisis') || allText.includes('emergency') || allText.includes('suicide') || 
        allText.includes('hurt myself') || allText.includes('can\'t take it')) {
      return 'crisis';
    }
    
    // Struggling indicators
    if (allText.includes('give up') || allText.includes('hopeless') || allText.includes('failed') || 
        allText.includes('can\'t do this') || allText.includes('overwhelming')) {
      return 'struggling';
    }
    
    // Hopeful indicators
    if (allText.includes('better') || allText.includes('good') || allText.includes('proud') || 
        allText.includes('progress') || allText.includes('strong') || allText.includes('grateful')) {
      return 'hopeful';
    }
    
    // Frustrated indicators
    if (allText.includes('angry') || allText.includes('frustrated') || allText.includes('mad') || 
        allText.includes('pissed') || allText.includes('annoyed')) {
      return 'frustrated';
    }
    
    return 'neutral';
  }

  private static extractMainTopics(userMessages: string[]): string[] {
    const topics: string[] = [];
    const allText = userMessages.join(' ').toLowerCase();
    
    const topicKeywords = {
      'work stress': ['work', 'job', 'boss', 'workplace', 'career'],
      'relationship issues': ['relationship', 'partner', 'spouse', 'family', 'marriage'],
      'urges and cravings': ['urge', 'craving', 'want to use', 'tempted', 'relapse'],
      'anxiety': ['anxious', 'anxiety', 'panic', 'worried', 'nervous'],
      'depression': ['depressed', 'sad', 'down', 'hopeless', 'empty'],
      'sleep issues': ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep'],
      'financial stress': ['money', 'bills', 'debt', 'financial', 'broke'],
      'isolation': ['alone', 'lonely', 'isolated', 'nobody', 'friends'],
      'recovery progress': ['recovery', 'sober', 'clean', 'progress', 'milestone'],
      'health concerns': ['health', 'doctor', 'medical', 'sick', 'pain']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.slice(0, 5); // Limit to top 5 topics
  }

  private static extractToolsRecommended(foremanMessages: string[]): string[] {
    const tools: string[] = [];
    const allText = foremanMessages.join(' ').toLowerCase();
    
    if (allText.includes('breathing')) tools.push('breathing');
    if (allText.includes('urge')) tools.push('urge');
    if (allText.includes('gratitude')) tools.push('gratitude');
    if (allText.includes('peer')) tools.push('peer');
    if (allText.includes('calendar')) tools.push('calendar');
    if (allText.includes('journey')) tools.push('journey');
    if (allText.includes('toolbox')) tools.push('toolbox');
    
    return Array.from(new Set(tools));
  }

  private static extractKeyMentions(userMessages: string[]): string[] {
    const mentions: string[] = [];
    const allText = userMessages.join(' ').toLowerCase();
    
    // Look for specific situations, triggers, or achievements
    const patterns = [
      { pattern: /(\w+\s+triggered?\s+me)/, type: 'trigger' },
      { pattern: /(feeling\s+\w+\s+about)/, type: 'emotion' },
      { pattern: /(struggling\s+with\s+\w+)/, type: 'struggle' },
      { pattern: /(proud\s+of\s+\w+)/, type: 'achievement' },
      { pattern: /(worried\s+about\s+\w+)/, type: 'concern' }
    ];
    
    patterns.forEach(({ pattern, type }) => {
      const matches = allText.match(pattern);
      if (matches) {
        mentions.push(`${type}: ${matches[0]}`);
      }
    });
    
    return mentions.slice(0, 3);
  }

  private static generateFollowUpItems(userMessages: string[], toolsRecommended: string[]): string[] {
    const followUps: string[] = [];
    const allText = userMessages.join(' ').toLowerCase();
    
    // Generate follow-ups based on tools recommended
    toolsRecommended.forEach(tool => {
      switch (tool) {
        case 'breathing':
          followUps.push('Check if breathing exercises helped with anxiety');
          break;
        case 'urge':
          followUps.push('Follow up on urge tracking results');
          break;
        case 'gratitude':
          followUps.push('See if gratitude practice improved mood');
          break;
        case 'peer':
          followUps.push('Check on peer support connection');
          break;
      }
    });
    
    // Generate follow-ups based on specific mentions
    if (allText.includes('meeting') || allText.includes('appointment')) {
      followUps.push('Ask about meeting/appointment outcome');
    }
    
    if (allText.includes('goal') || allText.includes('trying to')) {
      followUps.push('Check progress on mentioned goals');
    }
    
    return followUps.slice(0, 3);
  }

  private static findSignificantMoments(messages: Array<{ sender: 'user' | 'foreman'; text: string; time: string }>): string[] {
    const significant: string[] = [];
    
    messages.forEach(msg => {
      const text = msg.text.toLowerCase();
      
      // Look for breakthrough moments
      if (text.includes('breakthrough') || text.includes('realized') || text.includes('understand now')) {
        significant.push(`Breakthrough: ${msg.text.substring(0, 50)}...`);
      }
      
      // Look for commitments
      if (text.includes('going to') || text.includes('will try') || text.includes('promise')) {
        significant.push(`Commitment: ${msg.text.substring(0, 50)}...`);
      }
      
      // Look for victories
      if (text.includes('did it') || text.includes('succeeded') || text.includes('accomplished')) {
        significant.push(`Victory: ${msg.text.substring(0, 50)}...`);
      }
    });
    
    return significant.slice(0, 3);
  }

  static getTimeSinceLastConversation(username: string): string {
    const lastSummary = this.getLastConversationSummary(username);
    if (!lastSummary) return '';
    
    const lastDate = new Date(lastSummary.lastConversationDate);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  }

  static clearConversationHistory(username: string): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return true;
      
      const allMemories: ConversationMemoryEntry[] = JSON.parse(stored);
      const filtered = allMemories.filter(entry => entry.username !== username);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      return false;
    }
  }
}