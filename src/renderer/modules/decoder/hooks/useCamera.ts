import { useState, useRef, useCallback, useEffect } from 'react'

interface UseCameraReturn {
  stream: MediaStream | null
  error: string | null
  cameras: MediaDeviceInfo[]
  activeCameraId: string | null
  startCamera: (deviceId?: string) => Promise<void>
  stopCamera: () => void
  switchCamera: (deviceId: string) => Promise<void>
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopCamera()
      setError(null)
      try {
        // Try environment-facing camera first, fall back to any
        let mediaStream: MediaStream
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment',
              ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            },
          }
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch {
          // Fallback: try without facingMode
          const constraints: MediaStreamConstraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            },
          }
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        }
        streamRef.current = mediaStream
        setStream(mediaStream)
        setActiveCameraId(deviceId ?? null)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(`摄像头访问失败: ${message}`)
        throw err
      }
    },
    [stopCamera],
  )

  const switchCamera = useCallback(
    async (deviceId: string) => {
      await startCamera(deviceId)
    },
    [startCamera],
  )

  // Enumerate devices after first stream is obtained
  useEffect(() => {
    let cancelled = false
    async function enumerate() {
      try {
        // Need active stream for device labels to be available
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) {
          setCameras(devices.filter((d) => d.kind === 'videoinput'))
        }
      } catch {
        // ok
      }
    }
    enumerate()
    const handler = () => enumerate()
    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () => {
      cancelled = true
      navigator.mediaDevices.removeEventListener('devicechange', handler)
    }
  }, [stream]) // re-enumerate when stream changes

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return { stream, error, cameras, activeCameraId, startCamera, stopCamera, switchCamera }
}
