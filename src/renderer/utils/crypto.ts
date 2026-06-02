/**
 * AES-256-GCM encryption/decryption using Web Crypto API.
 * NEVER implement custom cryptography — always use the platform API.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const PBKDF2_ALGORITHM = 'PBKDF2'
const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 32
const IV_LENGTH = 12

export interface EncryptedPayload {
  /** Version for future compatibility */
  v: 1
  /** Base64-encoded salt */
  s: string
  /** Base64-encoded IV */
  i: string
  /** Base64-encoded ciphertext */
  d: string
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    PBKDF2_ALGORITHM,
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGORITHM,
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(
  plaintext: string,
  password: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )

  const payload: EncryptedPayload = {
    v: 1,
    s: bufferToBase64(salt),
    i: bufferToBase64(iv),
    d: bufferToBase64(new Uint8Array(ciphertext)),
  }

  return JSON.stringify(payload)
}

export async function decrypt(
  encryptedJson: string,
  password: string,
): Promise<string> {
  const decoder = new TextDecoder()

  let payload: EncryptedPayload
  try {
    payload = JSON.parse(encryptedJson) as EncryptedPayload
  } catch {
    throw new Error('无效的加密数据格式')
  }

  if (payload.v !== 1) {
    throw new Error(`不支持的加密版本: ${payload.v}`)
  }

  const salt = base64ToBuffer(payload.s)
  const iv = base64ToBuffer(payload.i)
  const ciphertext = base64ToBuffer(payload.d)
  const key = await deriveKey(password, salt)

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext,
    )
    return decoder.decode(plaintext)
  } catch {
    throw new Error('密码错误或数据已损坏')
  }
}

export function isEncryptedPayload(data: string): boolean {
  try {
    const parsed = JSON.parse(data) as EncryptedPayload
    return parsed.v === 1 && typeof parsed.s === 'string' && typeof parsed.i === 'string' && typeof parsed.d === 'string'
  } catch {
    return false
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
