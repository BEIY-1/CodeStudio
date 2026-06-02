export type ExportFormat = 'PNG' | 'SVG' | 'PDF'

/**
 * Download via browser native mechanism — no IPC needed.
 */
function downloadFile(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadFile(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Export QR code canvas.
 */
export function exportQRCode(
  canvas: HTMLCanvasElement | null,
  format: ExportFormat,
  filename: string,
): void {
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/png')

  if (format === 'PNG') {
    downloadFile(dataUrl, `${filename}.png`)
  } else if (format === 'SVG') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`
      + `<image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>`
      + `</svg>`
    downloadText(svg, `${filename}.svg`, 'image/svg+xml')
  } else if (format === 'PDF') {
    // PDF via jsPDF — uses its own save mechanism
    import('jspdf').then(({ default: jsPDF }) => {
      const dataUrl2 = canvas.toDataURL('image/png')
      const img = new Image()
      img.onload = () => {
        const pdf = new jsPDF({ unit: 'px', format: [img.width + 20, img.height + 20] })
        pdf.addImage(dataUrl2, 'PNG', 10, 10, img.width, img.height)
        pdf.save(`${filename}.pdf`)
      }
      img.src = dataUrl2
    })
  }
}

/**
 * Export barcode SVG.
 */
export function exportBarcode(
  svgElement: SVGSVGElement | null,
  format: ExportFormat,
  filename: string,
): void {
  if (!svgElement) return

  const svgText = new XMLSerializer().serializeToString(svgElement)

  if (format === 'SVG') {
    downloadText(svgText, `${filename}.svg`, 'image/svg+xml')
    return
  }

  // SVG → Canvas → PNG / PDF
  const img = new Image()
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const c = document.createElement('canvas')
    c.width = img.width || 400
    c.height = img.height || 200
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0)
    }
    const dataUrl = c.toDataURL('image/png')

    if (format === 'PNG') {
      downloadFile(dataUrl, `${filename}.png`)
    } else if (format === 'PDF') {
      import('jspdf').then(({ default: jsPDF }) => {
        const pdf = new jsPDF({ unit: 'px', format: [c.width + 20, c.height + 20] })
        pdf.addImage(dataUrl, 'PNG', 10, 10, c.width, c.height)
        pdf.save(`${filename}.pdf`)
      })
    }
  }
  img.onerror = () => URL.revokeObjectURL(url)
  img.src = url
}
