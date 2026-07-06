import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, RotateCcw, X } from 'lucide-react'
import type { ReportDisplayConfig } from '@/types/reports'
import { chartTypeOptions, visualizationLabels } from '@/config/reports-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReportDisplaySettingsProps {
  open: boolean
  onClose: () => void
  config: ReportDisplayConfig
  onUpdate: (
    key: keyof ReportDisplayConfig,
    patch: Partial<ReportDisplayConfig[keyof ReportDisplayConfig]>
  ) => void
  onReset: () => void
  onSave: () => void
}

export function ReportDisplaySettings({
  open,
  onClose,
  config,
  onUpdate,
  onReset,
  onSave,
}: ReportDisplaySettingsProps) {
  const keys = Object.keys(visualizationLabels) as (keyof ReportDisplayConfig)[]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Chart Display Settings</h2>
                  <p className="text-xs text-muted-foreground">Admin - configure report visualizations</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">How it works</CardTitle>
                  <CardDescription className="text-xs">
                    Choose which charts appear and select bar, line, pie, area, or hide each widget.
                  </CardDescription>
                </CardHeader>
              </Card>

              {keys.map((key) => {
                const setting = config[key]
                return (
                  <Card key={key}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`${key}-enabled`}
                            checked={setting.enabled}
                            onCheckedChange={(checked) =>
                              onUpdate(key, { enabled: checked === true })
                            }
                          />
                          <label htmlFor={`${key}-enabled`} className="text-sm font-medium cursor-pointer">
                            {visualizationLabels[key]}
                          </label>
                        </div>
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={(enabled) => onUpdate(key, { enabled })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Chart type</label>
                        <Select
                          value={setting.chartType}
                          onValueChange={(chartType) =>
                            onUpdate(key, {
                              chartType: chartType as ReportDisplayConfig[typeof key]['chartType'],
                            })
                          }
                          disabled={!setting.enabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {chartTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="border-t border-border p-4 flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
                Reset defaults
              </Button>
              <Button className="flex-1" onClick={onSave}>
                Save & close
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}




