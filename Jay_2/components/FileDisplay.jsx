import React, { useState } from 'react';

/**
 * FileDisplay - Component to display uploaded files in form submissions
 */
export default function FileDisplay({ files, fieldName, label }) {
  const [previewFile, setPreviewFile] = useState(null);

  if (!files || (Array.isArray(files) && files.length === 0)) {
    return null;
  }

  const fileList = Array.isArray(files) ? files : [files];

  const handleDownload = (file) => {
    if (file.data) {
      // Create download link for base64 data
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.url) {
      // Download from URL
      window.open(file.url, '_blank');
    }
  };

  const handlePreview = (file) => {
    if (file.data && file.type.startsWith('image/')) {
      setPreviewFile(file);
    } else if (file.url && file.type.startsWith('image/')) {
      setPreviewFile(file);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('text')) return '📄';
    return '📁';
  };

  return (
    <div className="file-display">
      {label && (
        <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
      )}
      
      <div className="space-y-2">
        {fileList.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.type}
                  {file.processed === false && file.error && (
                    <span className="text-red-500 ml-2">• {file.error}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {file.data && file.type.startsWith('image/') && (
                <button
                  onClick={() => handlePreview(file)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => handleDownload(file)}
                disabled={file.processed === false}
                className="text-green-600 hover:text-green-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{previewFile.name}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto">
              <img
                src={previewFile.data || previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
