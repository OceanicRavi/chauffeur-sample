// FILE: src/components/PDFConverter.tsx
import React, { useState, useCallback } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';

const PDFConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'processing';
    message: string;
  }>({ type: 'idle', message: '' });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const columnMapping = {
    'Booking #': 'Booking No',
    'Accept date': 'Accept date',
    'Ride date': 'Ride date',
    'Driver': 'Driver',
    'Licence plate': 'License plate',
    'Pickup address': 'Pickup',
    'Destination': 'Destination',
    'Net amount': 'Net amount',
    'Waiting time': 'Waiting charge',
    'Add. km': 'Added km',
    'VAT/sales tax': 'GST',
    'Gross total': 'Total'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus({ type: 'idle', message: `Selected: ${selectedFile.name}` });
      setProgress(0);
    } else {
      setStatus({ type: 'error', message: 'Please select a valid PDF file' });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setStatus({ type: 'idle', message: `Selected: ${droppedFile.name}` });
      setProgress(0);
    } else {
      setStatus({ type: 'error', message: 'Please drop a valid PDF file' });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleConvert = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setProgress(10);
    setStatus({ type: 'processing', message: 'Uploading PDF...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);
      setStatus({ type: 'processing', message: 'Processing PDF data...' });

      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      setProgress(90);
      setStatus({ type: 'processing', message: 'Generating Excel file...' });

      // Download the Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blacklane_converted_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProgress(100);
      setStatus({ 
        type: 'success', 
        message: 'Successfully converted! Excel file downloaded.' 
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setProgress(0);
      }, 3000);

    } catch (error: any) {
      console.error('Conversion error:', error);
      setStatus({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus({ type: 'idle', message: '' });
    setProgress(0);
  };

  return (
    <section id="pdf-converter" className="py-24 bg-slate-900/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Invoice <span className="text-teal-600 font-medium">Converter</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Convert Blacklane PDF invoices to Excel format with automatic grouping by license plate
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 shadow-2xl">
          
          {/* Upload Area */}
          <div 
            className="mb-6"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label 
              htmlFor="pdf-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-teal-500 transition-colors bg-gray-900/30 hover:bg-gray-900/50 relative"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="mb-2 text-lg text-gray-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">PDF files only (Blacklane invoices)</p>
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-teal-400 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        clearFile();
                      }}
                      className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <input 
                id="pdf-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && progress > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Processing...</span>
                <span className="text-sm text-teal-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {status.message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'error' ? 'bg-red-900/30 border border-red-700/50' :
              status.type === 'success' ? 'bg-green-900/30 border border-green-700/50' :
              status.type === 'processing' ? 'bg-blue-900/30 border border-blue-700/50' :
              'bg-gray-700/30 border border-gray-600/50'
            }`}>
              {status.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
              {status.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
              {status.type === 'processing' && <Loader className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />}
              {status.type === 'idle' && <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />}
              <p className={`text-sm ${
                status.type === 'error' ? 'text-red-300' :
                status.type === 'success' ? 'text-green-300' :
                status.type === 'processing' ? 'text-blue-300' :
                'text-gray-300'
              }`}>
                {status.message}
              </p>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!file || uploading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/25 mb-6"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Convert to Excel
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
            <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              How it works:
            </h4>
            <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Upload your Blacklane PDF invoice</li>
              <li>The system extracts all table data (skipping the title page)</li>
              <li>Data is automatically mapped to correct column names</li>
              <li>Excel file is created with:
                <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-gray-500">
                  <li><span className="text-gray-400">Sheet 1:</span> All data combined</li>
                  <li><span className="text-gray-400">Additional sheets:</span> Grouped by license plate</li>
                </ul>
              </li>
              <li>Excel file automatically downloads when ready</li>
            </ol>
          </div>

          {/* Column Mapping Reference */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 font-medium py-2">
              View Column Mapping
            </summary>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 bg-gray-900/30 rounded border border-gray-700/30">
              {Object.entries(columnMapping).map(([from, to]) => (
                <div key={from} className="text-gray-500">
                  <span className="text-gray-400">{from}</span> → <span className="text-teal-400">{to}</span>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>All processing happens securely on our server. Your files are not stored.</p>
        </div>
      </div>
    </section>
  );
};

export default PDFConverter;