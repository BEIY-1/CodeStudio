import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import GeneratorPage from '@/modules/generator/GeneratorPage'
import DecoderPage from '@/modules/decoder/DecoderPage'
import BatchPage from '@/modules/batch/BatchPage'
import ScanWorkspacePage from '@/modules/scan-workspace/ScanWorkspacePage'
import HistoryPage from '@/modules/history/HistoryPage'
import SettingsPage from '@/modules/settings/SettingsPage'

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="generator"
          element={
            <ErrorBoundary>
              <GeneratorPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="decoder"
          element={
            <ErrorBoundary>
              <DecoderPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="batch"
          element={
            <ErrorBoundary>
              <BatchPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="scan-workspace"
          element={
            <ErrorBoundary>
              <ScanWorkspacePage />
            </ErrorBoundary>
          }
        />
        <Route
          path="history"
          element={
            <ErrorBoundary>
              <HistoryPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="settings"
          element={
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}
