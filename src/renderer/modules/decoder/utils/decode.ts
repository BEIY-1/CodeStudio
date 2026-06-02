import jsQR from 'jsqr'

export interface DecodeResult {
  text: string
  format: string
  timestamp: number
}

/**
 * Decode a single QR or barcode from raw image data.
 * Uses jsQR for QR codes (fast, pure JS), ZXing for barcodes.
 */
export async function decodeSingleFromImageData(imageData: ImageData): Promise<DecodeResult | null> {
  // ── Try jsQR first (QR codes) ──────────────────────
  try {
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (qr) {
      return { text: qr.data, format: 'QR Code', timestamp: Date.now() }
    }
  } catch {
    // jsQR failed, continue to ZXing
  }

  // ── Try ZXing for barcodes ──────────────────────────
  try {
    return await decodeZxing(imageData)
  } catch {
    // No code detected
  }

  return null
}

/**
 * Decode multiple codes from a single image.
 */
export async function decodeFromImageData(imageData: ImageData): Promise<DecodeResult[]> {
  const results: DecodeResult[] = []

  // jsQR can only find one QR code per image
  try {
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (qr) {
      results.push({ text: qr.data, format: 'QR Code', timestamp: Date.now() })
    }
  } catch { /* ok */ }

  // ZXing for multi-barcode
  try {
    const zxingResults = await decodeZxingMulti(imageData)
    results.push(...zxingResults)
  } catch { /* ok */ }

  return results
}

// ─── ZXing fallback ───────────────────────────────────────────────

let ZXING_MODULE: typeof import('@zxing/library') | null = null

async function getZxing(): Promise<typeof import('@zxing/library')> {
  if (!ZXING_MODULE) {
    ZXING_MODULE = await import('@zxing/library')
  }
  return ZXING_MODULE
}

async function decodeZxing(imageData: ImageData): Promise<DecodeResult | null> {
  try {
    const zx = await getZxing()
    const hints = new Map()
    hints.set(zx.DecodeHintType.TRY_HARDER, true)
    hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, [
      zx.BarcodeFormat.CODE_128, zx.BarcodeFormat.CODE_39,
      zx.BarcodeFormat.EAN_13, zx.BarcodeFormat.EAN_8,
      zx.BarcodeFormat.UPC_A, zx.BarcodeFormat.UPC_E,
      zx.BarcodeFormat.DATA_MATRIX, zx.BarcodeFormat.PDF_417,
      zx.BarcodeFormat.AZTEC, zx.BarcodeFormat.ITF,
      zx.BarcodeFormat.CODABAR,
    ])

    const source = new zx.RGBLuminanceSource(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    )
    const bitmap = new zx.BinaryBitmap(new zx.HybridBinarizer(source))
    const reader = new zx.MultiFormatReader()
    reader.setHints(hints as any)

    const result = reader.decode(bitmap)
    if (result) {
      const map: Record<number, string> = {
        [zx.BarcodeFormat.CODE_128]: 'Code128', [zx.BarcodeFormat.CODE_39]: 'Code39',
        [zx.BarcodeFormat.EAN_13]: 'EAN-13', [zx.BarcodeFormat.EAN_8]: 'EAN-8',
        [zx.BarcodeFormat.UPC_A]: 'UPC-A', [zx.BarcodeFormat.UPC_E]: 'UPC-E',
        [zx.BarcodeFormat.DATA_MATRIX]: 'DataMatrix', [zx.BarcodeFormat.PDF_417]: 'PDF417',
        [zx.BarcodeFormat.AZTEC]: 'Aztec', [zx.BarcodeFormat.ITF]: 'ITF',
        [zx.BarcodeFormat.CODABAR]: 'Codabar',
      }
      return { text: result.getText(), format: map[result.getBarcodeFormat()] ?? 'Barcode', timestamp: Date.now() }
    }
  } catch {
    // Not found or error
  }
  return null
}

async function decodeZxingMulti(imageData: ImageData): Promise<DecodeResult[]> {
  // ZXing multi-code via iterative decode+erase — simplified
  const results: DecodeResult[] = []
  let maxAttempts = 30
  while (maxAttempts > 0) {
    try {
      const zx = await getZxing()
      const hints = new Map()
      hints.set(zx.DecodeHintType.TRY_HARDER, true)

      const source = new zx.RGBLuminanceSource(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height,
      )
      const bitmap = new zx.BinaryBitmap(new zx.HybridBinarizer(source))
      const reader = new zx.MultiFormatReader()
      reader.setHints(hints as any)
      const result = reader.decode(bitmap)
      if (result) {
        const text = result.getText()
        if (!results.some((r) => r.text === text)) {
          results.push({ text, format: 'Barcode', timestamp: Date.now() })
        }
      } else {
        break
      }
    } catch {
      break
    }
    maxAttempts--
  }
  return results
}
