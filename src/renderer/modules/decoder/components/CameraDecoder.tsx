import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, CameraOff, RefreshCw, Copy, Check, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { useCamera } from '../hooks/useCamera'
import { useScanStore } from '@/stores/scan-store'
import { copyText } from '@/lib/clipboard'
import { decodeSingleFromImageData, type DecodeResult } from '../utils/decode'

export function CameraDecoder(): JSX.Element {
  const { stream, error, cameras, activeCameraId, startCamera, stopCamera, switchCamera } =
    useCamera()
  const [results, setResults] = useState<DecodeResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const addEntry = useScanStore((s) => s.addEntry)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanningRef = useRef(false)
  const resultsRef = useRef(results)
  resultsRef.current = results

  // Wire stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Open camera
  const handleOpenCamera = useCallback(async () => {
    try {
      await startCamera()
    } catch {
      // error displayed from hook
    }
  }, [startCamera])

  // Start/stop scanning
  const handleToggleScan = useCallback(() => {
    if (scanning) {
      scanningRef.current = false
      setScanning(false)
    } else {
      if (!stream) return
      scanningRef.current = true
      setScanning(true)
    }
  }, [scanning, stream])

  // Scanning loop — simple setInterval, robust
  useEffect(() => {
    if (!scanning || !stream) return

    const SCAN_INTERVAL = 500 // ms

    const interval = setInterval(async () => {
      if (!scanningRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480

      canvas.width = vw
      canvas.height = vh

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, vw, vh)
      const imageData = ctx.getImageData(0, 0, vw, vh)

      try {
        const result = await decodeSingleFromImageData(imageData)
        if (result && scanningRef.current) {
          const currentResults = resultsRef.current
          if (!currentResults.some((r) => r.text === result.text)) {
            setResults((prev) => [result, ...prev].slice(0, 50))
            addEntry(result.text, result.format, 'camera')
            toast({ type: 'success', title: `识别: ${result.text.substring(0, 30)}` })
          }
        }
      } catch {
        // No code found
      }
    }, SCAN_INTERVAL)

    return () => clearInterval(interval)
  }, [scanning, stream, addEntry])

  const copyToClipboard = useCallback(async (text: string, idx: number) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Camera View */}
      <div className="relative rounded-xl overflow-hidden bg-black min-h-[360px] flex items-center justify-center border border-brand-border">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[480px] object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
            {scanning && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-success/20 border border-brand-success/40 text-xs text-brand-success">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                扫描中
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-brand-text-muted">
            <Camera className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm mb-3">{error || '点击下方按钮打开摄像头'}</p>
            <Button onClick={handleOpenCamera} variant="outline" size="sm">
              <Play className="w-4 h-4 mr-1" /> 打开摄像头
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      {stream && (
        <div className="flex items-center gap-3">
          <Button onClick={handleToggleScan} variant={scanning ? 'destructive' : 'default'}>
            {scanning ? (
              <><Square className="w-4 h-4 mr-2" /> 停止扫描</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> 开始扫描</>
            )}
          </Button>

          {cameras.length > 1 && (
            <Button variant="outline" onClick={() => switchCamera(cameras.find((c) => c.deviceId !== activeCameraId)?.deviceId || cameras[0]!.deviceId)}>
              <RefreshCw className="w-4 h-4 mr-2" /> 切换摄像头
            </Button>
          )}

          <Button variant="ghost" onClick={stopCamera}>
            <CameraOff className="w-4 h-4 mr-2" /> 关闭摄像头
          </Button>
        </div>
      )}

      {/* Camera selector */}
      {cameras.length > 1 && stream && (
        <div className="flex gap-2 flex-wrap">
          {cameras.map((cam) => (
            <button
              key={cam.deviceId}
              onClick={() => switchCamera(cam.deviceId)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                activeCameraId === cam.deviceId
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border text-brand-text-secondary hover:border-brand-border-hover'
              }`}
            >
              {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {results.map((result, idx) => (
                <div
                  key={`${result.timestamp}-${idx}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-brand-border last:border-0 hover:bg-brand-hover transition-colors"
                >
                  <span className="text-xs text-brand-text-muted font-mono w-8">
                    #{results.length - idx}
                  </span>
                  <span className="flex-1 text-sm font-mono text-brand-text-primary truncate">
                    {result.text}
                  </span>
                  <span className="text-xs text-brand-text-muted">{result.format}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(result.text, idx)}
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3 h-3 text-brand-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
