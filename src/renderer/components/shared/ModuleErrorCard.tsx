import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ModuleErrorCardProps {
  error: Error | null
  moduleName?: string
  onRetry: () => void
}

export function ModuleErrorCard({
  error,
  moduleName,
  onRetry,
}: ModuleErrorCardProps): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <AlertTriangle className="w-12 h-12 text-brand-danger mx-auto mb-2" />
          <CardTitle className="text-lg">
            {moduleName ? `${moduleName} 出现异常` : '页面出现异常'}
          </CardTitle>
          <CardDescription>
            {error?.message || '未知错误，请重试'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重新加载
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
