'use client';

import PriorityManager from './priorityManager';

// Store reference to the component's state setter
let priorityStateSetter: ((value: boolean) => void) | null = null;

// This function will be called to set up console commands
export function setupConsoleCommands(setIsPriorityInstance?: (value: boolean) => void) {
  if (typeof window !== 'undefined') {
    // Store the state setter for later use
    if (setIsPriorityInstance) {
      priorityStateSetter = setIsPriorityInstance;
    }

    (window as any).initPriority = (key: string) => {
      if (key === '+9F3A7-1CDE4-B82F0-64A9C-5DBE1') {
        const manager = PriorityManager.getInstance();
        if (manager.isPriorityInstance()) {
          manager.disablePriorityMode();
          // Update React state
          if (priorityStateSetter) {
            priorityStateSetter(false);
          }
          return 'Priority mode disabled';
        } else {
          manager.enablePriorityMode();
          // Update React state
          if (priorityStateSetter) {
            priorityStateSetter(true);
          }
          return 'Priority mode enabled';
        }
      } else {
        return 'Invalid key';
      }
    };
    
    // Console commands loaded silently
  }
}

export function cleanupConsoleCommands() {
  if (typeof window !== 'undefined') {
    delete (window as any).initPriority;
    priorityStateSetter = null; // Clear the state setter reference
  }
}
