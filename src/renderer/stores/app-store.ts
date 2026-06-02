import { create } from 'zustand'

interface AppState {
  sidebarExpanded: boolean
  detailPanelOpen: boolean
  detailPanelType: string | null
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  togglePanel: (type?: string) => void
  closePanel: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarExpanded: false,
  detailPanelOpen: false,
  detailPanelType: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  togglePanel: (type) =>
    set((state) => {
      if (type && state.detailPanelType === type) {
        return { detailPanelOpen: !state.detailPanelOpen }
      }
      return {
        detailPanelOpen: type ? true : !state.detailPanelOpen,
        detailPanelType: type ?? state.detailPanelType,
      }
    }),

  closePanel: () => set({ detailPanelOpen: false, detailPanelType: null }),
}))
