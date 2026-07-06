/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (input: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/80',
  error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/80',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/80',
}

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (input: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { ...input, id }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (title: string, description?: string) => push({ title, description, variant: 'success' }),
      error: (title: string, description?: string) => push({ title, description, variant: 'error' }),
      info: (title: string, description?: string) => push({ title, description, variant: 'info' }),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = variantIcons[t.variant]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                className={cn(
                  'pointer-events-auto flex gap-3 rounded-lg border p-4 shadow-lg',
                  variantStyles[t.variant]
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    t.variant === 'success' && 'text-emerald-600',
                    t.variant === 'error' && 'text-red-600',
                    t.variant === 'info' && 'text-blue-600'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded p-0.5 hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}




