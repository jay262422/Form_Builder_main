import React, { useState, useEffect } from 'react';
import formSubmissionService from '../services/formSubmissionService';

/**
 * SubmissionManager - Component to manage form submissions
 * Displays submissions, allows deletion, and export functionality
 */
export default function SubmissionManager({
  formSchema,
  onSubmissionSelect,
  className = ''
}) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [stats, setStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [searchTerm, setSearchTerm] = useState('');

  // Load submissions on component mount
  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, []);

  // Load submissions
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const result = await formSubmissionService.getSubmissions({
        limit: 100,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      });
      
      if (result.success) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = () => {
    const stats = formSubmissionService.getSubmissionStats();
    setStats(stats);
  };

  // Filter submissions based on current filter
  const getFilteredSubmissions = () => {
    let filtered = submissions;

    // Apply date filter
    if (filter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(submission => 
        new Date(submission.submittedAt) >= filterDate
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(submission => {
        // Search in submission ID
        if (submission.submissionId.toLowerCase().includes(term)) return true;
        
        // Search in form data values
        const formDataValues = Object.values(submission.formData || {});
        return formDataValues.some(value => 
          String(value).toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  };

  // Handle submission selection
  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    onSubmissionSelect?.(submission);
  };

  // Handle submission deletion
  const handleDeleteSubmission = async (submissionId) => {
    try {
      const result = await formSubmissionService.deleteSubmission(submissionId);
      if (result.success) {
        // Remove from local state
        setSubmissions(prev => prev.filter(s => s.submissionId !== submissionId));
        setSelectedSubmission(null);
        loadStats();
        setShowDeleteConfirm(false);
        setSubmissionToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  // Handle export to CSV
  const handleExportCSV = async () => {
    try {
      // Use API export for better performance with large datasets
      const blob = await formSubmissionService.exportSubmissionsViaAPI({
        format: 'csv',
        search: searchTerm,
        filter: filter
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_submissions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to frontend export
      const filteredSubmissions = getFilteredSubmissions();
      const csv = formSubmissionService.exportSubmissionsAsCSV(filteredSubmissions);
      
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form_submissions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }
  };

  // Handle clear all submissions
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all submissions? This action cannot be undone.')) {
      formSubmissionService.clearAllSubmissions();
      setSubmissions([]);
      setSelectedSubmission(null);
      loadStats();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get field value for display
  const getFieldDisplayValue = (submission, fieldName) => {
    const value = submission.formData[fieldName];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || '';
  };

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className={`submission-manager ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Form Submissions</h2>
            <p className="text-sm text-gray-500">
              {stats && `${stats.total} total submissions`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredSubmissions.length === 0}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search submissions..."
              className="text-sm border border-gray-300 rounded px-2 py-1 w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-96">
        {/* Submissions List */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No submissions found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedSubmission?.submissionId === submission.submissionId
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : ''
                  }`}
                  onClick={() => handleSubmissionSelect(submission)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {submission.submissionId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubmissionToDelete(submission);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {/* Preview of form data */}
                  <div className="mt-2 text-xs text-gray-600">
                    {Object.entries(submission.formData || {}).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {String(value).substring(0, 20)}
                        {String(value).length > 20 ? '...' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission Details */}
        <div className="w-1/2 p-4 overflow-y-auto">
          {selectedSubmission ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Submission Details
                </h3>
                <span className="text-sm text-gray-500">
                  {formatDate(selectedSubmission.submittedAt)}
                </span>
              </div>

              {/* Form Data */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Form Data</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSubmission.formData || {}).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(value) ? value.join(', ') : String(value || '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                {selectedSubmission.metadata && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Form Name: {selectedSubmission.metadata.formName}</div>
                      <div>Form Type: {selectedSubmission.metadata.formType}</div>
                      <div>Field Count: {selectedSubmission.metadata.fieldCount}</div>
                      <div>Submission Mode: {selectedSubmission.metadata.submissionMode}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a submission to view details
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && submissionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Submission
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSubmissionToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubmission(submissionToDelete.submissionId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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