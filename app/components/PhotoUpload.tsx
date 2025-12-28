'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { photoApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface PhotoUploadProps {
  eventId: string;
  onUploadComplete?: () => void;
}

interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function PhotoUpload({ eventId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newStates: FileUploadState[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFileStates((prev) => [...prev, ...newStates]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const pendingFiles = fileStates.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setUploading(true);
    
    try {
      // Get presigned URLs for all pending files
      const fileRequests = pendingFiles.map(f => ({
        fileName: f.file.name,
        fileType: f.file.type || 'application/octet-stream',
      }));

      // Mark files as uploading
      setFileStates(prev => prev.map(f => 
        f.status === 'pending' || f.status === 'error'
          ? { ...f, status: 'uploading' as const, progress: 0, error: undefined }
          : f
      ));

      const urlResponse = await photoApi.getUploadUrls(eventId, fileRequests);
      const urls = urlResponse.data.urls;

      // Upload files in parallel (with limit)
      let successCount = 0;
      let errorCount = 0;
      const CONCURRENCY_LIMIT = 5;
      let currentIndex = 0;

      const uploadFile = async (pendingIndex: number) => {
        const fileState = pendingFiles[pendingIndex];
        const urlData = urls[pendingIndex];
        const actualIndex = fileStates.findIndex(f => f.file === fileState.file);

        try {
          await photoApi.uploadToS3(urlData.uploadUrl, fileState.file, (progress) => {
            setFileStates(prev => {
              const newStates = [...prev];
              if (newStates[actualIndex]) {
                newStates[actualIndex] = { ...newStates[actualIndex], progress: progress.percent };
              }
              return newStates;
            });
          });

          setFileStates(prev => {
            const newStates = [...prev];
            if (newStates[actualIndex]) {
              newStates[actualIndex] = { ...newStates[actualIndex], status: 'success', progress: 100 };
            }
            return newStates;
          });

          successCount++;
        } catch (error: any) {
          setFileStates(prev => {
            const newStates = [...prev];
            if (newStates[actualIndex]) {
              newStates[actualIndex] = {
                ...newStates[actualIndex],
                status: 'error',
                error: error.message || 'Upload failed'
              };
            }
            return newStates;
          });
          errorCount++;
        }
      };

      // Worker pool for concurrent uploads
      const workers = Array(Math.min(CONCURRENCY_LIMIT, pendingFiles.length))
        .fill(null)
        .map(async () => {
          while (currentIndex < pendingFiles.length) {
            const index = currentIndex++;
            await uploadFile(index);
          }
        });

      await Promise.all(workers);

      if (successCount > 0) {
        toast.success(`${successCount} photo(s) uploaded successfully!`);
        onUploadComplete?.();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} photo(s) failed to upload`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get upload URLs');
      // Mark all pending files as errored
      setFileStates(prev => prev.map(f =>
        f.status === 'uploading'
          ? { ...f, status: 'error' as const, error: 'Failed to get upload URLs' }
          : f
      ));
    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setFileStates(prev => prev.filter(f => f.status !== 'success'));
  };

  const successCount = fileStates.filter(f => f.status === 'success').length;
  const pendingCount = fileStates.filter(f => f.status === 'pending' || f.status === 'error').length;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-primary-600">Drop the photos here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop photos here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, GIF, WEBP (max 10MB per file)
            </p>
          </div>
        )}
      </div>

      {fileStates.length > 0 && (
        <div className="space-y-4">
          {/* Upload Stats */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">{fileStates.length} file(s)</span>
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {successCount} uploaded
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {successCount > 0 && (
                <button
                  onClick={clearCompleted}
                  disabled={uploading}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fileStates.map((fileState, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                  <img
                    src={URL.createObjectURL(fileState.file)}
                    alt={fileState.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlays */}
                  {fileState.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-1" />
                        <p className="text-sm font-medium">{fileState.progress}%</p>
                      </div>
                    </div>
                  )}
                  
                  {fileState.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                  )}
                  
                  {fileState.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                  )}
                </div>
                
                {!uploading && fileState.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                <p className="text-xs text-gray-600 mt-1 truncate">{fileState.file.name}</p>
                {fileState.error && (
                  <p className="text-xs text-red-600 truncate">{fileState.error}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {pendingCount} photo(s)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

