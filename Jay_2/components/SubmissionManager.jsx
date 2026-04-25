import React, { useEffect, useMemo, useState } from 'react';
import formSubmissionService from '../services/formSubmissionService';
import FileDisplay from './FileDisplay';

const DEFAULT_PAGE_SIZE = 20;
const ANALYTICS_SAMPLE_LIMIT = 500;
const CORE_EXPORT_COLUMNS = [
  'submissionId',
  'submittedAt',
  'formName',
  'formType',
  'submissionMode',
  'submitter',
  'submitterEmail'
];

const isUploadedFileValue = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Boolean(value.name && value.type && (value.url || value.storageKey || value.data));
};

/**
 * SubmissionManager - Component to manage form submissions
 * Displays submissions, allows deletion, filtering, pagination, analytics, and export functionality
 */
export default function SubmissionManager({
  formSchema,
  onSubmissionSelect,
  className = '',
  contentHeightClass = 'h-96'
}) {
  const formId = formSchema?.id || formSchema?.formId || null;
  const [submissions, setSubmissions] = useState([]);
  const [analyticsSubmissions, setAnalyticsSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [stats, setStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showExportColumns, setShowExportColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(CORE_EXPORT_COLUMNS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const getPresetBoundary = (preset) => {
    if (preset === 'all') return { from: null, to: null };

    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);

    if (preset === 'today') {
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }

    if (preset === 'week') {
      from.setDate(now.getDate() - 7);
      return { from, to };
    }

    if (preset === 'month') {
      from.setDate(now.getDate() - 30);
      return { from, to };
    }

    return { from: null, to: null };
  };

  const dateRangeError = useMemo(() => {
    if (!dateFrom || !dateTo) return '';
    return new Date(dateFrom) > new Date(dateTo) ? 'Start date cannot be after end date.' : '';
  }, [dateFrom, dateTo]);

  const resolvedDateFilters = useMemo(() => {
    const presetBoundary = getPresetBoundary(filter);
    let from = presetBoundary.from;
    let to = presetBoundary.to;

    if (dateFrom) {
      const customFrom = new Date(dateFrom);
      customFrom.setHours(0, 0, 0, 0);
      from = !from || customFrom > from ? customFrom : from;
    }

    if (dateTo) {
      const customTo = new Date(dateTo);
      customTo.setHours(23, 59, 59, 999);
      to = !to || customTo < to ? customTo : to;
    }

    return {
      dateFrom: from ? from.toISOString() : undefined,
      dateTo: to ? to.toISOString() : undefined
    };
  }, [filter, dateFrom, dateTo]);

  const loadSubmissions = async () => {
    if (!formId || dateRangeError) return;

    setLoading(true);
    try {
      const result = await formSubmissionService.getSubmissionsByForm(formId, {
        limit: pageSize,
        page: currentPage,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        ...resolvedDateFilters
      });

      const nextSubmissions = result?.submissions || [];
      setSubmissions(nextSubmissions);
      setTotalPages(Math.max(result?.totalPages || 1, 1));
      setTotalRecords(result?.total || 0);
      setSelectedSubmission((currentSelection) => {
        if (!currentSelection) {
          return nextSubmissions[0] || null;
        }

        return nextSubmissions.find((submission) => submission.submissionId === currentSelection.submissionId) || nextSubmissions[0] || null;
      });
      setError('');
    } catch (loadError) {
      console.error('Error loading submissions:', loadError);
      setSubmissions([]);
      setSelectedSubmission(null);
      setTotalPages(1);
      setTotalRecords(0);
      setError(loadError?.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsSubmissions = async () => {
    if (!formId || dateRangeError) return;

    setAnalyticsLoading(true);
    try {
      const result = await formSubmissionService.getSubmissionsByForm(formId, {
        limit: ANALYTICS_SAMPLE_LIMIT,
        page: 1,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        ...resolvedDateFilters
      });
      setAnalyticsSubmissions(result?.submissions || []);
    } catch (analyticsError) {
      console.error('Error loading analytics submissions:', analyticsError);
      setAnalyticsSubmissions([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!formId) return;

    try {
      const result = await formSubmissionService.getSubmissionStats(formId);
      setStats(result || null);
    } catch (statsError) {
      console.error('Error loading submission stats:', statsError);
      setStats(null);
    }
  };

  useEffect(() => {
    if (!formId) {
      setSubmissions([]);
      setAnalyticsSubmissions([]);
      setStats(null);
      setSelectedSubmission(null);
      setLoading(false);
      setCurrentPage(1);
      return;
    }
    setCurrentPage(1);
  }, [formId, filter, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    if (!formId) return;

    if (dateRangeError) {
      setSubmissions([]);
      setAnalyticsSubmissions([]);
      setSelectedSubmission(null);
      setTotalPages(1);
      setTotalRecords(0);
      return;
    }

    loadSubmissions();
    loadAnalyticsSubmissions();
    loadStats();
  }, [formId, currentPage, pageSize, resolvedDateFilters, dateRangeError]);

  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) {
      return submissions;
    }

    const term = searchTerm.trim().toLowerCase();
    return submissions.filter((submission) => {
      if ((submission.submissionId || '').toLowerCase().includes(term)) return true;
      if ((submission.user?.name || '').toLowerCase().includes(term)) return true;
      if ((submission.user?.email || '').toLowerCase().includes(term)) return true;

      return Object.values(submission.formData || {}).some((value) =>
        formSubmissionService.normalizeExportValue(value).toLowerCase().includes(term)
      );
    });
  }, [submissions, searchTerm]);

  const filteredAnalyticsSubmissions = useMemo(() => {
    if (!searchTerm.trim()) {
      return analyticsSubmissions;
    }

    const term = searchTerm.trim().toLowerCase();
    return analyticsSubmissions.filter((submission) => {
      if ((submission.submissionId || '').toLowerCase().includes(term)) return true;
      if ((submission.user?.name || '').toLowerCase().includes(term)) return true;
      if ((submission.user?.email || '').toLowerCase().includes(term)) return true;

      return Object.values(submission.formData || {}).some((value) =>
        formSubmissionService.normalizeExportValue(value).toLowerCase().includes(term)
      );
    });
  }, [analyticsSubmissions, searchTerm]);

  const matchesSearchTerm = (submission, term) => {
    if (!term) {
      return true;
    }

    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      return true;
    }

    if ((submission.submissionId || '').toLowerCase().includes(normalizedTerm)) return true;
    if ((submission.user?.name || '').toLowerCase().includes(normalizedTerm)) return true;
    if ((submission.user?.email || '').toLowerCase().includes(normalizedTerm)) return true;
    if ((submission.metadata?.submittedBy || '').toLowerCase().includes(normalizedTerm)) return true;
    if ((submission.metadata?.submitterEmail || '').toLowerCase().includes(normalizedTerm)) return true;

    return Object.values(submission.formData || {}).some((value) =>
      formSubmissionService.normalizeExportValue(value).toLowerCase().includes(normalizedTerm)
    );
  };

  useEffect(() => {
    if (!filteredSubmissions.length) {
      setSelectedSubmission(null);
      return;
    }

    setSelectedSubmission((currentSelection) => {
      if (!currentSelection) {
        return filteredSubmissions[0];
      }

      return filteredSubmissions.find((submission) => submission.submissionId === currentSelection.submissionId) || filteredSubmissions[0];
    });
  }, [filteredSubmissions]);

  const availableExportColumns = useMemo(
    () => formSubmissionService.getAvailableExportColumns(filteredAnalyticsSubmissions),
    [filteredAnalyticsSubmissions]
  );

  useEffect(() => {
    if (!availableExportColumns.length) {
      setSelectedColumns(CORE_EXPORT_COLUMNS);
      return;
    }

    setSelectedColumns((currentColumns) => {
      const availableKeys = new Set(availableExportColumns.map((column) => column.key));
      const nextColumns = currentColumns.filter((column) => availableKeys.has(column));

      if (nextColumns.length > 0) {
        return nextColumns;
      }

      const defaultColumns = CORE_EXPORT_COLUMNS.filter((column) => availableKeys.has(column));
      return defaultColumns.length > 0
        ? defaultColumns
        : availableExportColumns.slice(0, 8).map((column) => column.key);
    });
  }, [availableExportColumns]);

  const analytics = useMemo(() => {
    const dayCounts = new Map();
    const weekdayCounts = new Map();
    const hourCounts = new Array(24).fill(0);

    filteredAnalyticsSubmissions.forEach((submission) => {
      const submittedAt = new Date(submission.submittedAt);
      const dayKey = submittedAt.toISOString().slice(0, 10);
      const weekdayKey = submittedAt.toLocaleDateString(undefined, { weekday: 'short' });
      dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
      weekdayCounts.set(weekdayKey, (weekdayCounts.get(weekdayKey) || 0) + 1);
      hourCounts[submittedAt.getHours()] += 1;
    });

    const dailyTrend = Array.from(dayCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, count]) => ({ date, count }));

    const weekdayTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      .map((day) => ({ day, count: weekdayCounts.get(day) || 0 }));

    const busiestHour = hourCounts.reduce((best, count, hour) => (
      count > best.count ? { hour, count } : best
    ), { hour: null, count: 0 });

    const averagePerDay = dailyTrend.length
      ? (dailyTrend.reduce((sum, item) => sum + item.count, 0) / dailyTrend.length).toFixed(1)
      : '0.0';

    return {
      dailyTrend,
      weekdayTrend,
      busiestHour,
      averagePerDay
    };
  }, [filteredAnalyticsSubmissions]);

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    onSubmissionSelect?.(submission);
  };

  const handleDeleteSubmission = async (submissionId) => {
    try {
      await formSubmissionService.deleteSubmission(submissionId);
      setShowDeleteConfirm(false);
      setSubmissionToDelete(null);
      await Promise.all([loadSubmissions(), loadAnalyticsSubmissions(), loadStats()]);
    } catch (deleteError) {
      console.error('Error deleting submission:', deleteError);
      setError(deleteError?.message || 'Failed to delete submission.');
    }
  };

  const getExportColumns = () => (
    selectedColumns.length > 0
      ? selectedColumns
      : availableExportColumns.map((column) => column.key)
  );

  const handleExportCSV = async () => {
    setIsExportingCsv(true);
    try {
      const exportSubmissions = await formSubmissionService.getAllSubmissionsByForm(formId, {
        limit: 200,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        ...resolvedDateFilters
      });
      const filteredExportSubmissions = exportSubmissions.filter((submission) => matchesSearchTerm(submission, searchTerm));
      const csv = formSubmissionService.exportSubmissionsAsCSV(filteredExportSubmissions, getExportColumns());
      if (!csv) return;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      formSubmissionService.downloadBlob(blob, `submissions_${formSchema?.name || formId}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (exportError) {
      console.error('CSV export error:', exportError);
      setError('Failed to export submissions as CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const exportSubmissions = await formSubmissionService.getAllSubmissionsByForm(formId, {
        limit: 200,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        ...resolvedDateFilters
      });
      const filteredExportSubmissions = exportSubmissions.filter((submission) => matchesSearchTerm(submission, searchTerm));
      const excelMarkup = formSubmissionService.exportSubmissionsAsExcel(filteredExportSubmissions, getExportColumns());
      if (!excelMarkup) return;

      const blob = new Blob([excelMarkup], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      formSubmissionService.downloadBlob(blob, `submissions_${formSchema?.name || formId}_${new Date().toISOString().split('T')[0]}.xls`);
    } catch (exportError) {
      console.error('Excel export error:', exportError);
      setError('Failed to export submissions as Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all submissions? This action cannot be undone.')) {
      setIsClearing(true);
      formSubmissionService.clearSubmissionsByForm(formId)
        .then(async () => {
          setError('');
          await Promise.all([loadSubmissions(), loadAnalyticsSubmissions(), loadStats()]);
        })
        .catch((clearError) => {
          console.error('Error clearing submissions:', clearError);
          setError(clearError?.message || 'Failed to clear submissions.');
        })
        .finally(() => {
          setIsClearing(false);
        });
    }
  };

  const resetDateRange = () => {
    setDateFrom('');
    setDateTo('');
  };

  const toggleColumn = (columnKey) => {
    setSelectedColumns((currentColumns) => (
      currentColumns.includes(columnKey)
        ? currentColumns.filter((key) => key !== columnKey)
        : [...currentColumns, columnKey]
    ));
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableExportColumns.map((column) => column.key));
  };

  const resetColumns = () => {
    const availableKeys = new Set(availableExportColumns.map((column) => column.key));
    const defaultColumns = CORE_EXPORT_COLUMNS.filter((column) => availableKeys.has(column));
    setSelectedColumns(defaultColumns.length > 0 ? defaultColumns : availableExportColumns.slice(0, 8).map((column) => column.key));
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();
  const safeFormName = formSchema?.name || formId || 'this form';
  const latestSubmissionLabel = stats?.lastSubmissionDate ? formatDate(stats.lastSubmissionDate) : 'No submissions yet';
  const rangeSummary = dateFrom || dateTo ? `${dateFrom || 'Any'} to ${dateTo || 'Any'}` : filter === 'all' ? 'All time' : `Preset: ${filter}`;
  const totalPageLabel = totalRecords === 0 ? '0 results' : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalRecords)} of ${totalRecords}`;
  const filterSummary = searchTerm ? `${filteredSubmissions.length} matches on this page` : totalPageLabel;
  const maxDailyCount = Math.max(...analytics.dailyTrend.map((item) => item.count), 1);
  const maxWeekdayCount = Math.max(...analytics.weekdayTrend.map((item) => item.count), 1);

  return (
    <div className={`submission-manager flex h-full flex-col ${className}`}>
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Form Submissions</h2>
            <p className="text-sm text-gray-500">
              {formId ? (stats ? `${stats.totalSubmissions || 0} total submissions recorded` : 'Loading submission stats...') : 'Select a saved form to view submissions'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowExportColumns((current) => !current)}
              disabled={availableExportColumns.length === 0}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Export Columns
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!formId || filteredAnalyticsSubmissions.length === 0 || isExportingCsv}
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isExportingCsv ? 'Exporting CSV...' : 'Download CSV'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!formId || filteredAnalyticsSubmissions.length === 0 || isExportingExcel}
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isExportingExcel ? 'Exporting Excel...' : 'Download Excel'}
            </button>
            <button
              onClick={handleClearAll}
              disabled={!formId || totalRecords === 0 || isClearing}
              className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>

        {showExportColumns && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Export Column Selection</h3>
                <p className="text-xs text-gray-500">Choose which columns appear in CSV and Excel downloads.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAllColumns} className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100">
                  Select All
                </button>
                <button onClick={resetColumns} className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100">
                  Reset Default
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {availableExportColumns.map((column) => (
                <label key={column.key} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {formId && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-500">Current Form</div>
              <div className="truncate text-sm font-semibold text-gray-900">{safeFormName}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-500">Current View</div>
              <div className="text-sm font-semibold text-gray-900">{filterSummary}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-500">Latest Submission</div>
              <div className="text-sm font-semibold text-gray-900">{latestSubmissionLabel}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-500">Date Range</div>
              <div className="text-sm font-semibold text-gray-900">{rangeSummary}</div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Volume Snapshot</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-900">{filteredAnalyticsSubmissions.length}</div>
                <div className="text-xs text-slate-500">Sampled Responses</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{analytics.averagePerDay}</div>
                <div className="text-xs text-slate-500">Avg / Day</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">
                  {analytics.busiestHour.hour === null ? 'N/A' : `${analytics.busiestHour.hour}:00`}
                </div>
                <div className="text-xs text-slate-500">Busiest Hour</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last 7 Days</div>
                <div className="text-sm text-gray-500">Daily submission trend</div>
              </div>
              {analyticsLoading && <span className="text-xs text-gray-400">Refreshing...</span>}
            </div>
            <div className="space-y-2">
              {analytics.dailyTrend.length === 0 ? (
                <div className="text-sm text-gray-500">No trend data yet.</div>
              ) : analytics.dailyTrend.map((item) => (
                <div key={item.date} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">{item.date.slice(5)}</div>
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(item.count / maxDailyCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-xs font-medium text-gray-700">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weekly Pattern</div>
              <div className="text-sm text-gray-500">Which weekdays receive more responses</div>
            </div>
            <div className="space-y-2">
              {analytics.weekdayTrend.map((item) => (
                <div key={item.day} className="flex items-center gap-3">
                  <div className="w-10 text-xs text-gray-500">{item.day}</div>
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(item.count / maxWeekdayCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-xs font-medium text-gray-700">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {dateRangeError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {dateRangeError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[auto_auto_auto_auto_auto_1fr]">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Preset</label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded border border-gray-300 px-2 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded border border-gray-300 px-2 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Page Size</label>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded border border-gray-300 px-2 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={resetDateRange}
            disabled={!dateFrom && !dateTo}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear Dates
          </button>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search this page by ID, submitter, or field values..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className={`flex min-h-0 ${contentHeightClass}`}>
        <div className="w-full overflow-y-auto border-r border-gray-200 lg:w-5/12 xl:w-2/5">
          {!formId ? (
            <div className="p-6 text-center text-gray-500">Submissions are available after a form has been saved.</div>
          ) : loading ? (
            <div className="p-6 text-center text-gray-500">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-base font-medium text-gray-700">No submissions found</div>
              <p className="mt-2 text-sm text-gray-500">
                Try a different date range, page, or search term for {safeFormName}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className={`cursor-pointer p-4 hover:bg-gray-50 ${
                    selectedSubmission?.submissionId === submission.submissionId ? 'border-r-2 border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleSubmissionSelect(submission)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{submission.submissionId}</p>
                      <p className="text-xs text-gray-500">{formatDate(submission.submittedAt)}</p>
                      {(submission.user?.name || submission.user?.email) && (
                        <p className="mt-1 text-xs text-gray-600">
                          {submission.user?.name || submission.user?.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSubmissionToDelete(submission);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    {Object.entries(submission.formData || {}).slice(0, 4).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-gray-100 px-2 py-1">
                        {key}: {formSubmissionService.normalizeExportValue(value).slice(0, 32)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">{filterSummary}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={currentPage <= 1 || loading}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {totalRecords === 0 ? 0 : currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={currentPage >= totalPages || loading}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden min-h-0 w-0 overflow-y-auto p-5 lg:block lg:w-7/12 xl:w-3/5">
          {selectedSubmission ? (
            <div>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  <p className="text-sm text-gray-500">{selectedSubmission.submissionId}</p>
                </div>
                <span className="text-sm text-gray-500">{formatDate(selectedSubmission.submittedAt)}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Response Data</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedSubmission.formData || {}).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <div className="font-medium text-gray-700">{key}</div>
                        <div className="mt-1 break-words text-gray-900">
                          {isUploadedFileValue(value) || (Array.isArray(value) && value.some(isUploadedFileValue)) ? (
                            <FileDisplay files={value} fieldName={key} />
                          ) : (
                            formSubmissionService.normalizeExportValue(value) || 'No value'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Metadata</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium text-gray-700">Form Name:</span> {selectedSubmission.metadata?.formName || safeFormName}</div>
                    <div><span className="font-medium text-gray-700">Form Type:</span> {selectedSubmission.metadata?.formType || 'N/A'}</div>
                    <div><span className="font-medium text-gray-700">Field Count:</span> {selectedSubmission.metadata?.fieldCount ?? 'N/A'}</div>
                    <div><span className="font-medium text-gray-700">Submission Mode:</span> {selectedSubmission.metadata?.submissionMode || 'N/A'}</div>
                    <div><span className="font-medium text-gray-700">Submitter:</span> {selectedSubmission.user?.name || selectedSubmission.user?.email || 'Anonymous'}</div>
                    <div><span className="font-medium text-gray-700">Email:</span> {selectedSubmission.user?.email || selectedSubmission.metadata?.submitterEmail || 'N/A'}</div>
                    <div><span className="font-medium text-gray-700">IP Address:</span> {selectedSubmission.metadata?.ipAddress || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center text-gray-500">Select a submission to view details.</div>
          )}
        </div>
      </div>

      {showDeleteConfirm && submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Delete Submission</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSubmissionToDelete(null);
                }}
                className="rounded bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubmission(submissionToDelete.submissionId)}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
