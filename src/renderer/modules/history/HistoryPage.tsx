import { Card, CardContent } from '@/components/ui/card'
import { Search, Star, Tag } from 'lucide-react'

export default function HistoryPage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">历史记录</h1>
      <p className="text-brand-text-secondary mb-8">生成记录 · 扫描记录 · 批量任务</p>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-hover text-sm text-brand-text-secondary">
          <Search className="w-4 h-4" />
          搜索记录...
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Star className="w-4 h-4" /> 收藏
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Tag className="w-4 h-4" /> 标签
        </div>
      </div>
      <Card className="bg-brand-surface/50 border-dashed">
        <CardContent className="p-12 text-center text-brand-text-muted text-sm">
          暂无历史记录
        </CardContent>
      </Card>
    </div>
  )
}
