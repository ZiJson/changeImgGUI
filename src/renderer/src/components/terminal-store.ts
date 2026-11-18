import { create } from 'zustand'

interface TerminalStore {
  open: boolean
  actions: {
    toggleOpen: () => void
    onOpenChange: (open: boolean) => void
  }
}

const useTerminalStore = create<TerminalStore>()((set) => ({
  open: false,
  actions: {
    toggleOpen: () => set((state) => ({ open: !state.open })),
    onOpenChange: (open) => set({ open })
  }
}))

export const useTerminalOpen = (): boolean => useTerminalStore((state) => state.open)

export const useTerminalActions = (): TerminalStore['actions'] =>
  useTerminalStore((state) => state.actions)
