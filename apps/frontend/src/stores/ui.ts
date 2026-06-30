import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface UiState {
  agentMode: boolean;
  setAgentMode: (agentMode: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      agentMode: false,
      setAgentMode: (agentMode) => set({ agentMode }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'devdocs-ui', partialize: (state) => ({ theme: state.theme }) },
  ),
);

// Keep the document theme class in sync app-wide (dark is the CSS default; `.light` overrides).
function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
}

applyTheme(useUiStore.getState().theme);
useUiStore.subscribe((state) => applyTheme(state.theme));
