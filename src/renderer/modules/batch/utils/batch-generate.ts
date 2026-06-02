import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { encrypt } from '@/utils/crypto'

export type BatchType = 'qr' | 'barcode'
export type BatchStatus = 'idle' | 'running' | 'done' | 'error'

export interface BatchRow {
  [key: string]: string
}

export interface BatchResult {
  index: number
  row: BatchRow
  type: BatchType
  content: string
  dataUrl: string | null
  status: 'success' | 'failed'
  error?: string
}

export function parseTemplate(template: string, row: BatchRow): string {
  return template.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    return row[key] ?? `{${key}}`
  })
}

export async function generateQRDataUrl(
  content: string,
  size = 256,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
): Promise<string> {
  const canvas = document.createElement('canvas')
  await toCanvas(canvas, content, {
    width: size,
    errorCorrectionLevel,
    color: { dark: '#F1F5F9', light: '#0B0F14' },
    margin: 1,
  })
  return canvas.toDataURL('image/png')
}

export function generateBarcodeSvg(
  content: string,
  format: string,
): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, content, {
    format,
    width: 1.5,
    height: 60,
    displayValue: true,
    background: '#0B0F14',
    lineColor: '#F1F5F9',
    textColor: '#94A3B8',
    fontSize: 12,
    margin: 8,
  })
  const svgData = new XMLSerializer().serializeToString(svg)
  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svgData)}`
}

export async function generateBatch(
  rows: BatchRow[],
  template: string,
  type: BatchType,
  barcodeFormat: string,
  onProgress: (current: number, total: number) => void,
  password?: string,
): Promise<BatchResult[]> {
  const results: BatchResult[] = []
  const encrypting = !!password

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    let content = parseTemplate(template, row)
    try {
      let dataUrl: string | null = null
      if (encrypting) {
        content = await encrypt(content, password!)
        dataUrl = await generateQRDataUrl(content, 256, 'H')
      } else if (type === 'qr') {
        dataUrl = await generateQRDataUrl(content)
      } else {
        dataUrl = generateBarcodeSvg(content, barcodeFormat)
      }
      results.push({ index: i, row, type, content, dataUrl, status: 'success' })
    } catch (err) {
      results.push({
        index: i,
        row,
        type,
        content,
        dataUrl: null,
        status: 'failed',
        error: String(err),
      })
    }
    onProgress(i + 1, rows.length)
  }

  return results
}
