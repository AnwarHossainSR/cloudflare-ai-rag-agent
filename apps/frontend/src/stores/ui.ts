import { create } from 'zustand';

interface UiState {
  agentMode: boolean;
  setAgentMode: (agentMode: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  agentMode: false,
  setAgentMode: (agentMode) => set({ agentMode }),
}));
