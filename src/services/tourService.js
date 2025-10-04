// Tour service for managing onboarding checklist state
// This is a simplified version that only handles checklist functionality
import React from 'react';

class TourService {
  constructor() {
    this.storageKey = 'msp_checklist_state';
    this.defaultState = {
      checklist: {
        uploadSample: false,
        addRenewal: false,
        inviteTeammate: false,
        enableReminders: false
      }
    };
    this.state = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.defaultState;
    } catch (error) {
      console.error('Error loading checklist state:', error);
      return this.defaultState;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving checklist state:', error);
    }
  }

  updateChecklistItem(item, completed) {
    this.state = {
      ...this.state,
      checklist: {
        ...this.state.checklist,
        [item]: completed
      }
    };
    this.saveState();
  }

  getChecklistProgress() {
    const totalItems = Object.keys(this.state.checklist).length;
    const completedItems = Object.values(this.state.checklist).filter(Boolean).length;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }

  getChecklistState() {
    return this.state.checklist;
  }

  resetChecklist() {
    this.state = { ...this.defaultState };
    this.saveState();
  }
}

// Create singleton instance
const tourService = new TourService();

// React hook for using checklist state
export const useTour = () => {
  const [checklistState, setChecklistState] = React.useState(() => tourService.getChecklistState());
  const [progress, setProgress] = React.useState(() => tourService.getChecklistProgress());

  const updateChecklistItem = React.useCallback((item, completed) => {
    tourService.updateChecklistItem(item, completed);
    const newState = tourService.getChecklistState();
    const newProgress = tourService.getChecklistProgress();
    setChecklistState(newState);
    setProgress(newProgress);
  }, []);

  const getChecklistProgress = React.useCallback(() => {
    return tourService.getChecklistProgress();
  }, []);

  return {
    tourState: { checklist: checklistState },
    updateChecklistItem,
    getChecklistProgress
  };
};

export default tourService;
