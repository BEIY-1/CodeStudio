import { Sidebar } from './Sidebar'
import { Workspace } from './Workspace'
import { DetailPanel } from './DetailPanel'
import { ToastContainer } from '@/components/ui/toast-container'
import { ParticleBackground } from '@/components/shared/ParticleBackground'

export function AppShell(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg relative">
      <ParticleBackground />
      <Sidebar />
      <Workspace />
      <DetailPanel />
      <ToastContainer />
    </div>
  )
}
