import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import BaselineLogo from './BaselineLogo';
import { parseBlastCSV, parseHitTraxCSV } from '../utils/csvParser';

const FileDropZone = ({ title, files, onFilesAdd, onFileRemove, type, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = [...e.dataTransfer.files].filter(f => f.name.endsWith('.csv'));
    if (droppedFiles.length > 0) {
      onFilesAdd(droppedFiles);
    }
  }, [onFilesAdd]);

  const handleFileInput = (e) => {
    const selectedFiles = [...e.target.files].filter(f => f.name.endsWith('.csv'));
    if (selectedFiles.length > 0) {
      onFilesAdd(selectedFiles);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-1">
      <h3 className="text-lg font-semibold mb-3 text-cream">{title}</h3>
      <div
        className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id={`file-input-${type}`}
        />
        <label
          htmlFor={`file-input-${type}`}
          className="flex flex-col items-center cursor-pointer"
        >
          <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-muted'}`} />
          <span className="text-sm text-light text-center">
            Drag & drop CSV files here or click to browse
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-bg-elevated rounded-lg px-3 py-2 animate-fade-in"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {file.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-cream truncate block">
                    {file.playerName || file.file.name}
                  </span>
                  {file.error && (
                    <span className="text-xs text-red-400">{file.error}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onFileRemove(idx)}
                className="p-1 hover:bg-border rounded transition-colors ml-2"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 text-muted hover:text-cream" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UploadView = ({ onDataReady }) => {
  const [blastFiles, setBlastFiles] = useState([]);
  const [hittraxFiles, setHittraxFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleBlastFilesAdd = async (newFiles) => {
    const fileEntries = newFiles.map(f => ({ file: f, status: 'pending', playerName: null }));
    setBlastFiles(prev => [...prev, ...fileEntries]);

    for (let i = 0; i < fileEntries.length; i++) {
      try {
        const result = await parseBlastCSV(fileEntries[i].file);
        setBlastFiles(prev => prev.map((f) =>
          f.file === fileEntries[i].file
            ? { ...f, status: 'success', playerName: result.playerName, data: result }
            : f
        ));
      } catch (err) {
        setBlastFiles(prev => prev.map((f) =>
          f.file === fileEntries[i].file
            ? { ...f, status: 'error', error: err.message }
            : f
        ));
      }
    }
  };

  const handleHittraxFilesAdd = async (newFiles) => {
    const fileEntries = newFiles.map(f => ({ file: f, status: 'pending', playerName: null }));
    setHittraxFiles(prev => [...prev, ...fileEntries]);

    for (let i = 0; i < fileEntries.length; i++) {
      try {
        const result = await parseHitTraxCSV(fileEntries[i].file);
        setHittraxFiles(prev => prev.map((f) =>
          f.file === fileEntries[i].file
            ? { ...f, status: 'success', playerName: result.playerName, data: result }
            : f
        ));
      } catch (err) {
        setHittraxFiles(prev => prev.map((f) =>
          f.file === fileEntries[i].file
            ? { ...f, status: 'error', error: err.message }
            : f
        ));
      }
    }
  };

  const handleBlastRemove = (idx) => {
    setBlastFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleHittraxRemove = (idx) => {
    setHittraxFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = () => {
    const successfulBlast = blastFiles.filter(f => f.status === 'success').map(f => f.data);
    const successfulHittrax = hittraxFiles.filter(f => f.status === 'success').map(f => f.data);

    if (successfulBlast.length === 0 && successfulHittrax.length === 0) {
      setError('Please upload at least one valid CSV file');
      return;
    }

    onDataReady({ blast: successfulBlast, hittrax: successfulHittrax });
  };

  const totalSuccessful = blastFiles.filter(f => f.status === 'success').length +
                          hittraxFiles.filter(f => f.status === 'success').length;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <BaselineLogo size="w-24 h-24" />
          <h1 className="text-3xl font-bold text-cream mt-4">Player Data Visualization</h1>
          <p className="text-muted mt-2">Upload Blast Motion and HitTrax CSV files to analyze player performance</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <FileDropZone
              title="Blast Motion Files"
              files={blastFiles}
              onFilesAdd={handleBlastFilesAdd}
              onFileRemove={handleBlastRemove}
              type="blast"
              isProcessing={isProcessing}
            />
            <div className="hidden md:block w-px bg-border" />
            <FileDropZone
              title="HitTrax Files"
              files={hittraxFiles}
              onFilesAdd={handleHittraxFilesAdd}
              onFileRemove={handleHittraxRemove}
              type="hittrax"
              isProcessing={isProcessing}
            />
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={totalSuccessful === 0 || isProcessing}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                totalSuccessful > 0 && !isProcessing
                  ? 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/30'
                  : 'bg-border text-muted cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : `Analyze Data (${totalSuccessful} files)`}
            </button>
          </div>
        </div>

        <p className="text-center text-muted text-sm mt-6">
          Your data is processed locally and never leaves your browser
        </p>
      </div>
    </div>
  );
};

export default UploadView;
