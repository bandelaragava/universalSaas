/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { quickActionMap, type QuickActionId } from '@/config/quick-actions'
interface DashboardActionContextValue {
  activeAction: QuickActionId | null
  openAction: (id: QuickActionId) => void
  closeAction: () => void
  runQuickAction: (id: QuickActionId) => void
}

const DashboardActionContext = createContext<DashboardActionContextValue | null>(null)

export function DashboardActionProvider({ children }: { children: ReactNode }) {
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null)
  const navigate = useNavigate()
  const { info } = useToast()

  const closeAction = useCallback(() => setActiveAction(null), [])

  const openAction = useCallback((id: QuickActionId) => setActiveAction(id), [])

  const runQuickAction = useCallback(
    (id: QuickActionId) => {
      const actionDef = quickActionMap[id]
      if (actionDef?.navigateTo) {
        info(actionDef.label, `Redirecting to ${actionDef.label}…`)
        navigate(actionDef.navigateTo)
      } else {
        openAction(id)
      }
    },
    [navigate, openAction, info]
  )

  const value = useMemo(
    () => ({ activeAction, openAction, closeAction, runQuickAction }),
    [activeAction, openAction, closeAction, runQuickAction]
  )

  return (
    <DashboardActionContext.Provider value={value}>{children}</DashboardActionContext.Provider>
  )
}

export function useDashboardActions() {
  const ctx = useContext(DashboardActionContext)
  if (!ctx) throw new Error('useDashboardActions must be used within DashboardActionProvider')
  return ctx
}


