/**
 * Digital signature using ECDSA with P-256 (Web Crypto API).
 * Used for anti-counterfeiting, tickets, certificates, asset tags.
 */

const ALGORITHM: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' }
const SIGN_ALGORITHM: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' }

export interface KeyPair {
  publicKey: JsonWebKey
  privateKey: JsonWebKey
}

export interface SignedPayload {
  v: 1
  data: string
  signature: string // Base64
  publicKey: JsonWebKey
}

/** Generate a new ECDSA P-256 key pair */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, ['sign', 'verify'])

  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey)

  return { publicKey, privateKey }
}

/** Sign data with a private key */
export async function sign(data: string, privateKeyJwk: JsonWebKey): Promise<string> {
  const encoder = new TextEncoder()

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    ALGORITHM,
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(SIGN_ALGORITHM, privateKey, encoder.encode(data))

  return bufferToBase64(new Uint8Array(signature))
}

/** Verify a signature against data and public key */
export async function verify(
  data: string,
  signatureBase64: string,
  publicKeyJwk: JsonWebKey,
): Promise<boolean> {
  const encoder = new TextEncoder()

  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      ALGORITHM,
      false,
      ['verify'],
    )

    return crypto.subtle.verify(
      SIGN_ALGORITHM,
      publicKey,
      base64ToBuffer(signatureBase64),
      encoder.encode(data),
    )
  } catch {
    return false
  }
}

/** Create a signed payload for embedding in QR codes */
export async function createSignedPayload(
  data: string,
  privateKeyJwk: JsonWebKey,
  publicKeyJwk: JsonWebKey,
): Promise<string> {
  const signature = await sign(data, privateKeyJwk)
  const payload: SignedPayload = {
    v: 1,
    data,
    signature,
    publicKey: publicKeyJwk,
  }
  return JSON.stringify(payload)
}

/** Verify a signed payload */
export async function verifySignedPayload(
  payloadJson: string,
): Promise<{ valid: boolean; data?: string; error?: string }> {
  try {
    const payload: SignedPayload = JSON.parse(payloadJson)
    if (payload.v !== 1) return { valid: false, error: '不支持的签名版本' }

    const valid = await verify(payload.data, payload.signature, payload.publicKey)
    return valid
      ? { valid: true, data: payload.data }
      : { valid: false, error: '签名验证失败 — 数据可能被篡改' }
  } catch {
    return { valid: false, error: '无效的签名格式' }
  }
}

function bufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]!)
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
