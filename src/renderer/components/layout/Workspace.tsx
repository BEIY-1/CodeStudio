import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export function Workspace(): JSX.Element {
  const location = useLocation()

  return (
    <main className="flex-1 overflow-auto bg-brand-bg">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        <Outlet />
      </motion.div>
    </main>
  )
}
