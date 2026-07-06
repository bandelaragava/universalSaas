import { useEffect, useState } from 'react'
import {
  RefreshCw,
  Link2,
  Unplug,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { IntegrationDetailsResponse } from '@/types/integrations-api'
import { OAUTH_INTEGRATIONS } from '@/config/integration-meta'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { IntegrationLogResponse, SyncHistoryResponse } from '@/types/integrations-api'
import { normalizeHealth } from '@/config/integration-meta'

interface IntegrationDetailPanelProps {
  details: IntegrationDetailsResponse | null
  logs: IntegrationLogResponse[]
  syncHistory: SyncHistoryResponse[]
  loading: boolean
  actionLoading: string | null
  logsPage: number
  logsTotalPages: number
  onConfigure: (payload: {
    apiKey?: string
    apiSecret?: string
    webhookUrl?: string
    environment?: string
  }) => void
  onTest: () => void
  onDisconnect: () => void
  onOAuth: () => void
  onRefresh: () => void
  onLogsPage: (page: number) => void
}

export function IntegrationDetailPanel({
  details,
  logs,
  syncHistory,
  loading,
  actionLoading,
  logsPage,
  logsTotalPages,
  onConfigure,
  onTest,
  onDisconnect,
  onOAuth,
  onRefresh,
  onLogsPage,
}: IntegrationDetailPanelProps) {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [environment, setEnvironment] = useState('production')

  useEffect(() => {
    if (!details) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebhookUrl(details.webhookUrl ?? '')
    setEnvironment(details.environment ?? 'production')
    setApiKey('')
    setApiSecret('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.code])

  if (!details && !loading) {
    return (
      <Card className="h-fit lg:sticky lg:top-24">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Select an integration to configure
        </CardContent>
      </Card>
    )
  }

  if (loading && !details) {
    return (
      <Card className="h-fit lg:sticky lg:top-24">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!details) return null

  const supportsOAuth = OAUTH_INTEGRATIONS.has(details.code?.toUpperCase() ?? '')
  const health = normalizeHealth(details.health)
  const busy = !!actionLoading

  return (
    <Card className="h-fit lg:sticky lg:top-24">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{details.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{details.code}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={busy}>
            <RefreshCw className={cnIcon(busy)} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={details.connected ? 'success' : 'secondary'}>
            {details.connected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge
            variant={
              health === 'healthy' ? 'success' : health === 'error' ? 'destructive' : 'warning'
            }
          >
            {details.health}
          </Badge>
          {details.lastSynced && (
            <span className="text-xs text-muted-foreground self-center">
              Last sync: {new Date(details.lastSynced).toLocaleString()}
            </span>
          )}
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onConfigure({ apiKey, apiSecret, webhookUrl, environment })
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              placeholder={details.apiKeyMasked ?? 'Enter API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Secret</label>
            <Input
              type="password"
              placeholder={details.apiSecretMasked ?? 'Enter API secret'}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment</label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {actionLoading === 'configure' ? 'Saving…' : 'Save configuration'}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {supportsOAuth && (
            <Button className="flex-1 gap-2" onClick={onOAuth} disabled={busy}>
              {actionLoading === 'oauth' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              OAuth Connect
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={onTest} disabled={busy}>
            {actionLoading === 'test' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test
          </Button>
          {details.connected && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-600"
              onClick={onDisconnect}
              disabled={busy}
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Sync history</p>
          {syncHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sync runs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-36 overflow-y-auto">
              {syncHistory.map((run) => (
                <li key={run.runId} className="border-b border-border/50 pb-2 last:border-0">
                  <div className="flex justify-between gap-2">
                    <Badge variant={run.status === 'SUCCESS' ? 'success' : 'warning'}>
                      {run.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.startTime).toLocaleString()}
                    </span>
                  </div>
                  {run.description && (
                    <p className="text-xs text-muted-foreground mt-1">{run.description}</p>
                  )}
                  {(run.recordsProcessed != null || run.recordsSuccess != null) && (
                    <p className="text-xs mt-0.5">
                      {run.recordsSuccess ?? 0}/{run.recordsProcessed ?? 0} records
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">Connection logs</p>
            {logsTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={logsPage <= 0 || busy}
                  onClick={() => onLogsPage(logsPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {logsPage + 1}/{logsTotalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={logsPage >= logsTotalPages - 1 || busy}
                  onClick={() => onLogsPage(logsPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No logs.</p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <li key={`${log.timestamp}-${i}`}>
                  <span className="text-muted-foreground">
                    [{log.level}] {new Date(log.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  {log.message}
                  {log.statusCode != null && (
                    <span className="text-muted-foreground"> ({log.statusCode})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function cnIcon(spin: boolean) {
  return spin ? 'h-4 w-4 animate-spin' : 'h-4 w-4'
}




