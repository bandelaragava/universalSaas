import { useCallback, useMemo, useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import {
  DEFAULT_REPORT_DISPLAY_CONFIG,
  REPORT_DISPLAY_STORAGE_KEY,
  computeReportSummary,
  generatedReportsSeed,
  monthlyTrendData,
} from '@/config/reports-data'
import {
  exportExcelCsv,
  exportFullReportJson,
  exportReportJson,
  exportTrendCsv,
  printReportPdf,
} from '@/lib/report-export'
import type {
  GeneratedReport,
  ReportDisplayConfig,
  ReportFilters,
  ReportMetric,
} from '@/types/reports'
import rolesApi from '@/services/rolesApi'
import { revenueService } from '@/services/revenue'

function loadDisplayConfig(): ReportDisplayConfig {
  try {
    const raw = localStorage.getItem(REPORT_DISPLAY_STORAGE_KEY)
    if (raw) return { ...DEFAULT_REPORT_DISPLAY_CONFIG, ...JSON.parse(raw) }
  } catch {
    /* use defaults */
  }
  return DEFAULT_REPORT_DISPLAY_CONFIG
}

const defaultFilters: ReportFilters = {
  dateFrom: '2026-01-01',
  dateTo: '2026-06-30',
  branchId: 'branch_hq',
  reportType: 'all',
  metrics: ['users', 'revenue'],
}

export function useReports(isAdmin: boolean) {
  const { success, info, error } = useToast()
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters)

  const patchFilters = useCallback((patch: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])
  const [displayConfig, setDisplayConfig] = useState<ReportDisplayConfig>(loadDisplayConfig)
  const [reports, setReports] = useState<GeneratedReport[]>(generatedReportsSeed)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [realSummary, setRealSummary] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    loaded: boolean;
    usersList: any[];
    confirmedLeads: any[];
  }>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    loaded: false,
    usersList: [],
    confirmedLeads: [],
  })

  useEffect(() => {
    // Fetch Users independently
    rolesApi.get('/users').then((usersRes) => {
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      const activeCount = usersList.filter((u: any) => u.active).length;
      
      setRealSummary(prev => ({
        ...prev,
        totalUsers: usersList.length || 0,
        activeUsers: activeCount || 0,
        usersList: usersList,
        loaded: prev.confirmedLeads ? true : prev.loaded, // Ensure loaded triggers update if needed
      }));
    }).catch(() => {
      setRealSummary(prev => ({ ...prev, loaded: true }));
    });

    // Fetch Revenue independently
    revenueService.getRevenueOverview().then((revenueRes) => {
      const confirmedLeads = revenueRes.data?.confirmed_leads || [];
      setRealSummary(prev => ({
        ...prev,
        totalRevenue: revenueRes.data?.confirmed_revenue || 0,
        confirmedLeads: confirmedLeads,
        loaded: true,
      }));
    }).catch(() => {
      setRealSummary(prev => ({ ...prev, loaded: true }));
    });
  }, [])

  // Generate dynamic trend data based on real backend totals and dates
  const dynamicTrendData = useMemo(() => {
    if (!realSummary.loaded) return monthlyTrendData

    const { usersList, confirmedLeads } = realSummary
    const trend: typeof monthlyTrendData = []
    const now = new Date()
    
    // Create a 6-month array based on REAL data grouping
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const labelStr = d.toLocaleString('default', { month: 'short' })

      // Calculate how many users joined BEFORE or DURING this month
      const currentUsers = usersList.filter((u: any) => {
        if (!u.created_at && !u.createdAt && !u.joiningDate) return true; // Assume old user
        const uDate = new Date(u.created_at || u.createdAt || u.joiningDate);
        return uDate.getFullYear() < d.getFullYear() || 
               (uDate.getFullYear() === d.getFullYear() && uDate.getMonth() <= d.getMonth());
      }).length;

      // Calculate how many users joined exactly IN this month
      const newUsers = usersList.filter((u: any) => {
        if (!u.created_at && !u.createdAt && !u.joiningDate) return false;
        const uDate = new Date(u.created_at || u.createdAt || u.joiningDate);
        return uDate.getFullYear() === d.getFullYear() && uDate.getMonth() === d.getMonth();
      }).length;

      // Calculate cumulative revenue BEFORE or DURING this month
      const currentRevenue = confirmedLeads.filter((l: any) => {
        if (!l.updated_at && !l.payment_date && !l.created_at) return true;
        const lDate = new Date(l.updated_at || l.payment_date || l.created_at);
        return lDate.getFullYear() < d.getFullYear() || 
               (lDate.getFullYear() === d.getFullYear() && lDate.getMonth() <= d.getMonth());
      }).reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);
      
      const previousUsers = currentUsers - newUsers;
      const growth = previousUsers > 0 ? (newUsers / previousUsers) * 100 : 0;

      trend.push({
        month: monthStr,
        label: labelStr,
        users: currentUsers,
        newUsers: Math.max(0, newUsers),
        revenue: currentRevenue,
        growth: Math.max(0, growth),
      })
    }

    return trend
  }, [realSummary])

  const filteredTrend = useMemo(() => {
    return dynamicTrendData.filter(
      (p) => p.month >= filters.dateFrom.slice(0, 7) && p.month <= filters.dateTo.slice(0, 7)
    )
  }, [filters.dateFrom, filters.dateTo, dynamicTrendData])

  const trendData = filteredTrend.length > 0 ? filteredTrend : dynamicTrendData

  const summary = useMemo(() => {
    const base = computeReportSummary(trendData, filters.dateFrom, filters.dateTo)
    if (realSummary.loaded) {
      return {
        ...base,
        totalUsers: realSummary.totalUsers,
        activeUsers: realSummary.activeUsers,
        totalRevenue: realSummary.totalRevenue,
        avgRevenuePerUser: realSummary.totalUsers > 0 ? Math.round(realSummary.totalRevenue / realSummary.totalUsers) : 0,
      }
    }
    return base
  }, [filters.dateFrom, filters.dateTo, realSummary, trendData])

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filters.reportType !== 'all') {
        const typeMap: Record<string, string> = {
          analytics: 'Analytics',
          users: 'Users',
          revenue: 'Revenue',
        }
        if (r.type !== typeMap[filters.reportType]) return false
      }
      if (
        filters.branchId !== 'all' &&
        r.branchId !== 'all' &&
        r.branchId !== filters.branchId
      ) {
        return false
      }
      if (filters.metrics.length) {
        const hasOverlap = filters.metrics.some((m) => r.metrics.includes(m))
        if (!hasOverlap) return false
      }
      return true
    })
  }, [reports, filters])

  const updateDisplayConfig = useCallback(
    (key: keyof ReportDisplayConfig, patch: Partial<ReportDisplayConfig[keyof ReportDisplayConfig]>) => {
      if (!isAdmin) {
        error('Permission denied', 'Only admins can change chart display settings.')
        return
      }
      setDisplayConfig((prev) => {
        const next = { ...prev, [key]: { ...prev[key], ...patch } }
        localStorage.setItem(REPORT_DISPLAY_STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    [isAdmin, error]
  )

  const resetDisplayConfig = useCallback(() => {
    if (!isAdmin) return
    setDisplayConfig(DEFAULT_REPORT_DISPLAY_CONFIG)
    localStorage.setItem(REPORT_DISPLAY_STORAGE_KEY, JSON.stringify(DEFAULT_REPORT_DISPLAY_CONFIG))
    success('Settings reset', 'Chart display restored to platform defaults.')
  }, [isAdmin, success])

  const saveDisplayConfig = useCallback(() => {
    if (!isAdmin) return
    localStorage.setItem(REPORT_DISPLAY_STORAGE_KEY, JSON.stringify(displayConfig))
    setSettingsOpen(false)
    success('Chart settings saved', 'Visualization preferences updated for all users.')
  }, [isAdmin, displayConfig, success])

  const toggleMetric = useCallback((metric: ReportMetric) => {
    setFilters((prev) => {
      const has = prev.metrics.includes(metric)
      const metrics = has
        ? prev.metrics.filter((m) => m !== metric)
        : [...prev.metrics, metric]
      return { ...prev, metrics: metrics.length ? metrics : [metric] }
    })
  }, [])

  const generateReport = useCallback(async () => {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 600))

    const id = `RPT-${String(reports.length + 1).padStart(3, '0')}`
    const name =
      filters.metrics.length === 2
        ? `Users & Revenue — ${new Date().toLocaleDateString('en-IN')}`
        : filters.metrics[0] === 'users'
          ? `User Report — ${new Date().toLocaleDateString('en-IN')}`
          : `Revenue Report — ${new Date().toLocaleDateString('en-IN')}`

    const newReport: GeneratedReport = {
      id,
      name,
      type:
        filters.metrics.length === 2
          ? 'Analytics'
          : filters.metrics[0] === 'users'
            ? 'Users'
            : 'Revenue',
      metrics: [...filters.metrics],
      date: new Date().toISOString().slice(0, 10),
      status: 'Ready',
      branchId: filters.branchId,
    }
    setReports((prev) => [newReport, ...prev])
    setGenerating(false)
    success('Report generated', `${id} is ready to download.`)
  }, [reports.length, filters, success])

  const downloadReport = useCallback(
    (report: GeneratedReport, format: 'json' | 'csv' | 'pdf') => {
      if (report.status === 'Processing') {
        info('Report processing', 'This report is still being generated. Try again shortly.')
        return
      }
      if (report.status === 'Failed') {
        error('Download failed', 'This report failed to generate. Please regenerate it.')
        return
      }

      switch (format) {
        case 'json':
          exportReportJson(report, summary, trendData, filters)
          success('Download started', `${report.id}.json`)
          break
        case 'csv':
          exportTrendCsv(trendData, `${report.id}.csv`)
          success('Download started', `${report.id}.csv`)
          break
        case 'pdf':
          printReportPdf(report, summary, trendData, filters)
          info('Opening print dialog', 'Save as PDF from the print dialog.')
          break
      }
    },
    [summary, trendData, filters, success, info, error]
  )

  const exportData = useCallback(
    (format: 'csv' | 'json' | 'excel' | 'pdf') => {
      switch (format) {
        case 'json':
          exportFullReportJson(filters, summary, trendData)
          success('Export complete', 'Full report JSON downloaded.')
          break
        case 'csv':
          exportTrendCsv(trendData, `report-export-${Date.now()}.csv`)
          success('Export complete', 'Trend data CSV downloaded.')
          break
        case 'excel':
          exportExcelCsv(trendData, `report-export-${Date.now()}.csv`)
          success('Export complete', 'Excel-compatible CSV downloaded.')
          break
        case 'pdf':
          printReportPdf(null, summary, trendData, filters)
          info('Print / PDF', 'Use Save as PDF in the print dialog.')
          break
      }
    },
    [filters, summary, trendData, success, info]
  )

  return {
    filters,
    setFilters,
    patchFilters,
    displayConfig,
    updateDisplayConfig,
    resetDisplayConfig,
    saveDisplayConfig,
    settingsOpen,
    setSettingsOpen,
    summary,
    trendData,
    filteredReports,
    toggleMetric,
    generateReport,
    generating,
    downloadReport,
    exportData,
    showUsers: filters.metrics.includes('users'),
    showRevenue: filters.metrics.includes('revenue'),
  }
}


