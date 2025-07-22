
import { realtimeSupabase } from '@/integrations/supabase/realtimeClient';
import { logger } from '@/utils/logger';

export interface RealtimeEventHandler {
  (payload: any): void;
}

export interface RealtimeSubscription {
  id: string;
  channel: any;
  handlers: Map<string, RealtimeEventHandler[]>;
  isActive: boolean;
}

class RealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 5;

  // Create or get existing subscription
  subscribe(
    channelName: string,
    eventType: 'postgres_changes' | 'presence' | 'broadcast',
    eventConfig: any,
    handler: RealtimeEventHandler
  ): string {
    const subscriptionId = `${channelName}-${eventType}-${JSON.stringify(eventConfig)}`;
    
    let subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      subscription = this.createSubscription(subscriptionId, channelName);
      this.subscriptions.set(subscriptionId, subscription);
    }

    // Add handler to subscription
    const eventKey = `${eventType}-${JSON.stringify(eventConfig)}`;
    if (!subscription.handlers.has(eventKey)) {
      subscription.handlers.set(eventKey, []);
    }
    subscription.handlers.get(eventKey)!.push(handler);

    // Set up event listener if not already done
    this.setupEventListener(subscription, eventType, eventConfig, eventKey);

    // Subscribe if not already active
    if (!subscription.isActive) {
      this.activateSubscription(subscription);
    }

    return subscriptionId;
  }

  private createSubscription(id: string, channelName: string): RealtimeSubscription {
    const channel = realtimeSupabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'user' }
      }
    });

    return {
      id,
      channel,
      handlers: new Map(),
      isActive: false
    };
  }

  private setupEventListener(
    subscription: RealtimeSubscription,
    eventType: string,
    eventConfig: any,
    eventKey: string
  ) {
    const { channel } = subscription;
    
    // Check if listener already exists
    const existingListeners = (channel as any)._listeners || [];
    const listenerExists = existingListeners.some((listener: any) => 
      listener.type === eventType && 
      JSON.stringify(listener.filter) === JSON.stringify(eventConfig)
    );

    if (listenerExists) {
      return;
    }

    channel.on(eventType, eventConfig, (payload: any) => {
      const handlers = subscription.handlers.get(eventKey);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(payload);
          } catch (error) {
            logger.error('Error in realtime event handler', error);
          }
        });
      }
    });
  }

  private activateSubscription(subscription: RealtimeSubscription) {
    const { channel, id } = subscription;

    channel.subscribe((status: string) => {
      logger.debug(`Subscription ${id} status: ${status}`);

      if (status === 'SUBSCRIBED') {
        subscription.isActive = true;
        this.reconnectAttempts.set(id, 0);
        logger.debug(`Subscription ${id} activated successfully`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        subscription.isActive = false;
        logger.warn(`Subscription ${id} failed with status: ${status}`);
        
        // Auto-retry with exponential backoff
        this.scheduleReconnect(subscription);
      }
    });
  }

  private scheduleReconnect(subscription: RealtimeSubscription) {
    const { id } = subscription;
    const attempts = this.reconnectAttempts.get(id) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts reached for subscription ${id}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    this.reconnectAttempts.set(id, attempts + 1);

    setTimeout(() => {
      if (this.subscriptions.has(id)) {
        logger.debug(`Attempting to reconnect subscription ${id} (attempt ${attempts + 1})`);
        this.activateSubscription(subscription);
      }
    }, delay);
  }

  // Remove handler from subscription
  unsubscribe(subscriptionId: string, handler: RealtimeEventHandler) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Remove handler from all event types
    for (const [eventKey, handlers] of subscription.handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        
        // If no more handlers for this event, we could clean up the listener
        if (handlers.length === 0) {
          subscription.handlers.delete(eventKey);
        }
      }
    }

    // If no more handlers, remove the entire subscription
    if (subscription.handlers.size === 0) {
      realtimeSupabase.removeChannel(subscription.channel);
      this.subscriptions.delete(subscriptionId);
      this.reconnectAttempts.delete(subscriptionId);
    }
  }

  // Force reconnect all subscriptions
  reconnectAll() {
    for (const subscription of this.subscriptions.values()) {
      subscription.isActive = false;
      this.reconnectAttempts.set(subscription.id, 0);
      this.activateSubscription(subscription);
    }
  }

  // Get connection status
  getConnectionStatus() {
    const totalSubscriptions = this.subscriptions.size;
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.isActive).length;
    
    return {
      totalSubscriptions,
      activeSubscriptions,
      isConnected: totalSubscriptions > 0 && activeSubscriptions === totalSubscriptions
    };
  }

  // Cleanup all subscriptions
  cleanup() {
    for (const subscription of this.subscriptions.values()) {
      realtimeSupabase.removeChannel(subscription.channel);
    }
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
  }
}

export const realtimeService = new RealtimeService();
