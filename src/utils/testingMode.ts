import { logger } from './logger';

export interface TestingModeConfig {
  enabled: boolean;
  bypassTimeRestrictions: boolean;
  unlockAllDays: boolean;
  skipWeek1Requirements: boolean;
  simulateTimeProgression: boolean;
}

class TestingModeManager {
  private config: TestingModeConfig = {
    enabled: false,
    bypassTimeRestrictions: false,
    unlockAllDays: false,
    skipWeek1Requirements: false,
    simulateTimeProgression: false,
  };

  private storageKey = 'leap-testing-mode';

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Check URL parameter first
      const urlParams = new URLSearchParams(window.location.search);
      const urlTestingMode = urlParams.get('testingMode');
      
      if (urlTestingMode === 'true') {
        this.enableTestingMode();
        return;
      }

      // Check localStorage
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }

      // Only enable in development
      if (this.config.enabled && !this.isDevelopment()) {
        this.config.enabled = false;
        this.saveConfig();
      }
    } catch (error) {
      logger.error('Failed to load testing mode config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      logger.error('Failed to save testing mode config:', error);
    }
  }

  private isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  public isEnabled(): boolean {
    return this.config.enabled && this.isDevelopment();
  }

  public enableTestingMode(): void {
    if (!this.isDevelopment()) {
      logger.warn('Testing mode can only be enabled in development environment');
      return;
    }
    
    this.config = {
      enabled: true,
      bypassTimeRestrictions: true,
      unlockAllDays: true,
      skipWeek1Requirements: true,
      simulateTimeProgression: false,
    };
    
    this.saveConfig();
    logger.info('Testing mode enabled');
  }

  public disableTestingMode(): void {
    this.config = {
      enabled: false,
      bypassTimeRestrictions: false,
      unlockAllDays: false,
      skipWeek1Requirements: false,
      simulateTimeProgression: false,
    };
    
    this.saveConfig();
    logger.info('Testing mode disabled');
  }

  public toggleTestingMode(): void {
    if (this.isEnabled()) {
      this.disableTestingMode();
    } else {
      this.enableTestingMode();
    }
  }

  public getConfig(): TestingModeConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<TestingModeConfig>): void {
    if (!this.isDevelopment()) {
      return;
    }
    
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public shouldBypassTimeRestrictions(): boolean {
    return this.isEnabled() && this.config.bypassTimeRestrictions;
  }

  public shouldUnlockAllDays(): boolean {
    return this.isEnabled() && this.config.unlockAllDays;
  }

  public shouldSkipWeek1Requirements(): boolean {
    return this.isEnabled() && this.config.skipWeek1Requirements;
  }

  public shouldSimulateTimeProgression(): boolean {
    return this.isEnabled() && this.config.simulateTimeProgression;
  }
}

export const testingMode = new TestingModeManager();