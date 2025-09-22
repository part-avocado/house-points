// Priority Manager for API request coordination across multiple instances
class PriorityManager {
  private static instance: PriorityManager;
  private isPriority: boolean = false;
  private priorityKey: string = 'house-points-priority-instance';
  private heartbeatKey: string = 'house-points-priority-heartbeat';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private callbacks: Array<(isPriority: boolean) => void> = [];

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): PriorityManager {
    if (!PriorityManager.instance) {
      PriorityManager.instance = new PriorityManager();
    }
    return PriorityManager.instance;
  }

  public enablePriorityMode(): void {
    this.isPriority = true;
    
    // Set priority flag in localStorage with timestamp
    const priorityData = {
      instanceId: this.generateInstanceId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem(this.priorityKey, JSON.stringify(priorityData));
    localStorage.setItem(this.heartbeatKey, Date.now().toString());
    
    this.startHeartbeat();
    this.notifyCallbacks();
    
    console.log('🚀 Priority mode enabled - this instance now has API priority');
  }

  public disablePriorityMode(): void {
    this.isPriority = false;
    this.stopHeartbeat();
    
    // Clear priority flags
    localStorage.removeItem(this.priorityKey);
    localStorage.removeItem(this.heartbeatKey);
    
    this.notifyCallbacks();
    
    console.log('⏸️ Priority mode disabled');
  }

  public isPriorityInstance(): boolean {
    return this.isPriority || this.checkIfCurrentInstanceIsPriority();
  }

  public canMakeAPIRequest(): boolean {
    // If this is the priority instance, always allow
    if (this.isPriorityInstance()) {
      return true;
    }

    // Check if there's an active priority instance
    const priorityData = localStorage.getItem(this.priorityKey);
    const lastHeartbeat = localStorage.getItem(this.heartbeatKey);

    if (!priorityData || !lastHeartbeat) {
      // No priority instance active, allow request
      return true;
    }

    // Check if priority instance is still alive (heartbeat within last 10 seconds)
    const heartbeatAge = Date.now() - parseInt(lastHeartbeat);
    if (heartbeatAge > 10000) {
      // Priority instance seems dead, clean up and allow request
      localStorage.removeItem(this.priorityKey);
      localStorage.removeItem(this.heartbeatKey);
      return true;
    }

    // Priority instance is active and alive, block this request
    return false;
  }

  public getBlockMessage(): string {
    const priorityData = localStorage.getItem(this.priorityKey);
    
    if (priorityData) {
      try {
        const data = JSON.parse(priorityData);
        const timeSince = Math.floor((Date.now() - data.timestamp) / 1000);
        return `This is not the primary instance. :( (Priority set ${timeSince}s ago)`;
      } catch (e) {
        return "This is not the primary instance. :(";
      }
    }
    
    return "This is not the primary instance. :(";
  }

  public onPriorityChange(callback: (isPriority: boolean) => void): void {
    this.callbacks.push(callback);
  }

  public removePriorityChangeListener(callback: (isPriority: boolean) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private generateInstanceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkIfCurrentInstanceIsPriority(): boolean {
    const priorityData = localStorage.getItem(this.priorityKey);
    
    if (!priorityData) return false;
    
    try {
      const data = JSON.parse(priorityData);
      // This is a simple check - in a more robust system, you might want to use 
      // more sophisticated instance identification
      return this.isPriority;
    } catch (e) {
      return false;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isPriority) {
        localStorage.setItem(this.heartbeatKey, Date.now().toString());
      }
    }, 2000); // Update heartbeat every 2 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startMonitoring(): void {
    // Monitor localStorage changes from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === this.priorityKey || e.key === this.heartbeatKey) {
        this.notifyCallbacks();
      }
    });

    // Periodic check for priority status changes
    this.checkInterval = setInterval(() => {
      this.notifyCallbacks();
    }, 5000);
  }

  private notifyCallbacks(): void {
    const canMakeRequests = this.canMakeAPIRequest();
    this.callbacks.forEach(callback => {
      try {
        callback(canMakeRequests);
      } catch (e) {
        console.error('Error in priority change callback:', e);
      }
    });
  }

  public cleanup(): void {
    this.stopHeartbeat();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.isPriority) {
      this.disablePriorityMode();
    }
  }
}

export default PriorityManager;
