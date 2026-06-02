import { create } from 'zustand'

export interface LabelElement {
  id: string
  type: 'image' | 'qr' | 'text' | 'barcode'
  x: number
  y: number
  width: number
  height: number
  rotation: 0 | 90 | 180 | 270
  zIndex: number
  // type-specific
  imageDataUrl?: string
  qrContent?: string
  textContent?: string
  barcodeContent?: string
  barcodeFormat?: string
  // style
  fontSize?: number
  fontColor?: string
}

interface LabelDesignerState {
  elements: LabelElement[]
  selectedId: string | null
  canvasWidth: number  // px
  canvasHeight: number // px
  nextZ: number

  // actions
  addElement: (el: Omit<LabelElement, 'id' | 'zIndex'>) => void
  updateElement: (id: string, patch: Partial<LabelElement>) => void
  removeElement: (id: string) => void
  selectElement: (id: string | null) => void
  setCanvasSize: (w: number, h: number) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  clearAll: () => void
}

let nextId = 1
function genId(): string {
  return `el-${nextId++}-${Date.now()}`
}

export const useLabelStore = create<LabelDesignerState>((set, get) => ({
  elements: [],
  selectedId: null,
  canvasWidth: 400,
  canvasHeight: 300,
  nextZ: 1,

  addElement: (el) => {
    const { nextZ } = get()
    const id = genId()
    set((s) => ({
      elements: [...s.elements, { ...el, id, zIndex: nextZ }],
      nextZ: nextZ + 1,
      selectedId: id,
    }))
  },

  updateElement: (id, patch) => {
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }))
  },

  removeElement: (id) => {
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  selectElement: (id) => {
    set({ selectedId: id })
  },

  setCanvasSize: (w, h) => {
    set({ canvasWidth: w, canvasHeight: h })
  },

  bringForward: (id) => {
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return s
      return {
        elements: s.elements.map((e) =>
          e.id === id ? { ...e, zIndex: s.nextZ } : e,
        ),
        nextZ: s.nextZ + 1,
      }
    })
  },

  sendBackward: (id) => {
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el || el.zIndex <= 1) return s
      return {
        elements: s.elements.map((e) =>
          e.id === id ? { ...e, zIndex: Math.max(0, el.zIndex - 2) } : e,
        ),
      }
    })
  },

  clearAll: () => {
    set({ elements: [], selectedId: null, nextZ: 1 })
  },
}))
