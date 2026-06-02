import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { encrypt } from '@/utils/crypto'
import type { LabelElement } from '../store'

export interface BatchRow {
  [key: string]: string
}

export interface BatchLabelResult {
  index: number
  row: BatchRow
  dataUrl: string | null
  status: 'success' | 'failed'
  error?: string
}

/**
 * Replace {ColumnName} placeholders in a string with row values.
 */
export function parseTemplate(template: string, row: BatchRow): string {
  return template.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    return row[key] ?? `{${key}}`
  })
}

/**
 * Column mapping type: elementId → columnName
 */
export type ColumnMap = Record<string, string>

/**
 * Resolve element content by:
 * 1. Column map (priority) — replace entire content with row[columnName]
 * 2. Template variables (fallback) — replace {col} with row[col]
 */
function resolveElement(el: LabelElement, row: BatchRow, colMap?: ColumnMap): LabelElement {
  const resolved = { ...el }

  // Priority 1: explicit column mapping
  const mappedCol = colMap?.[el.id]
  if (mappedCol && row[mappedCol] !== undefined) {
    const val = row[mappedCol]!
    if (el.type === 'qr') resolved.qrContent = val
    else if (el.type === 'barcode') resolved.barcodeContent = val
    else if (el.type === 'text') resolved.textContent = val
    else if (el.type === 'image') { /* images don't use column data */ }
    return resolved
  }

  // Priority 2: template variable substitution
  if (el.qrContent) resolved.qrContent = parseTemplate(el.qrContent, row)
  if (el.barcodeContent) resolved.barcodeContent = parseTemplate(el.barcodeContent, row)
  if (el.textContent) resolved.textContent = parseTemplate(el.textContent, row)
  return resolved
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function renderQrToCanvas(content: string, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  await toCanvas(canvas, content, {
    width: size,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
    margin: 0,
  })
  return canvas
}

async function renderBarcodeToCanvas(
  content: string,
  format: string,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, content, {
    format,
    width: 1,
    height: height > 0 ? height : 40,
    displayValue: false,
    background: '#FFFFFF',
    lineColor: '#000000',
    margin: 4,
  })
  const svgData = new XMLSerializer().serializeToString(svg)
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData)
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

/**
 * Render a single label from elements + data row onto an offscreen canvas.
 */
export async function renderLabel(
  elements: LabelElement[],
  row: BatchRow,
  canvasWidth: number,
  canvasHeight: number,
  colMap?: ColumnMap,
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
  for (const rawEl of sorted) {
    const el = resolveElement(rawEl, row, colMap)
    ctx.save()
    if (el.rotation) {
      const cx = el.x + el.width / 2
      const cy = el.y + el.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((el.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    try {
      if (el.type === 'image' && el.imageDataUrl) {
        const img = await loadImage(el.imageDataUrl)
        ctx.drawImage(img, el.x, el.y, el.width, el.height)
      } else if (el.type === 'qr' && el.qrContent) {
        let content = el.qrContent
        if (el.encrypted && el.encPassword) {
          content = await encrypt(content, el.encPassword)
        }
        const qrCanvas = await renderQrToCanvas(content, el.width)
        ctx.drawImage(qrCanvas, el.x, el.y, el.width, el.height)
      } else if (el.type === 'text') {
        ctx.fillStyle = el.fontColor ?? '#000000'
        const fontSize = el.fontSize ?? 14
        ctx.font = `${fontSize}px ${el.fontFamily ?? 'sans-serif'}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(el.textContent ?? '', el.x + el.width / 2, el.y + el.height / 2)
      } else if (el.type === 'barcode' && el.barcodeContent) {
        let content = el.barcodeContent
        let format = el.barcodeFormat ?? 'CODE128'
        if (el.encrypted && el.encPassword) {
          content = await encrypt(content, el.encPassword)
          format = 'CODE128'
        }
        const bcCanvas = await renderBarcodeToCanvas(content, format, el.width, el.height)
        ctx.drawImage(bcCanvas, el.x, el.y, el.width, el.height)
      }
    } catch {
      // Skip elements that fail to render
    }

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

/**
 * Generate labels for all data rows.
 */
export async function generateBatchLabels(
  elements: LabelElement[],
  rows: BatchRow[],
  canvasWidth: number,
  canvasHeight: number,
  onProgress: (current: number, total: number) => void,
  colMap?: ColumnMap,
): Promise<BatchLabelResult[]> {
  const results: BatchLabelResult[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    try {
      const dataUrl = await renderLabel(elements, row, canvasWidth, canvasHeight, colMap)
      results.push({ index: i, row, dataUrl, status: 'success' })
    } catch (err) {
      results.push({
        index: i,
        row,
        dataUrl: null,
        status: 'failed',
        error: String(err),
      })
    }
    onProgress(i + 1, rows.length)
  }

  return results
}
