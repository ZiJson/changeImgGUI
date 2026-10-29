import { create } from 'zustand'

interface TerminalState {
  open: boolean
  toggleOpen: () => void
  onOpenChange: (open: boolean) => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
  open: false,
  toggleOpen: () => set((state) => ({ open: !state.open })),
  onOpenChange: (open) => set({ open })
}))
