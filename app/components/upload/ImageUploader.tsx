'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { photoApi } from '@/lib/api';
import { Button } from '../ui/Button';

interface ImageUploaderProps {
    eventId: string;
    onUploadComplete?: (uploadedPhotos: any[]) => void;
    maxFiles?: number;
}

interface UploadFile {
    file: File;
    preview: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    photoId?: string;
}

export default function ImageUploader({
    eventId,
    onUploadComplete,
    maxFiles = 100
}: ImageUploaderProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadFile[] = acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            status: 'pending',
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles,
        disabled: isUploading
    });

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        const uploadedPhotos: any[] = [];
        const CONCURRENCY_LIMIT = 5;

        // Identify which files need uploading
        const pendingIndices = files
            .map((f, i) => (f.status === 'pending' || f.status === 'error' ? i : -1))
            .filter(i => i !== -1);

        if (pendingIndices.length === 0) {
            setIsUploading(false);
            return;
        }

        // Helper to upload a single file
        const processFile = async (index: number) => {
            const fileItem = files[index];
            try {
                // Update status to uploading
                setFiles(prev => {
                    const newFiles = [...prev];
                    if (newFiles[index]) {
                        newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 0, error: undefined };
                    }
                    return newFiles;
                });

                const formData = new FormData();
                formData.append('photos', fileItem.file);
                formData.append('eventId', eventId);

                const response = await photoApi.uploadEventPhoto(formData, (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;

                    setFiles(prev => {
                        const newFiles = [...prev];
                        if (newFiles[index]) {
                            newFiles[index] = { ...newFiles[index], progress };
                        }
                        return newFiles;
                    });
                });

                // Update status to success
                setFiles(prev => {
                    const newFiles = [...prev];
                    const data = response.data as any;

                    if (newFiles[index]) {
                        newFiles[index] = {
                            ...newFiles[index],
                            status: 'success',
                            progress: 100,
                            photoId: data?.uploads?.[0]?.imageId || data?.photo?._id
                        };
                    }
                    return newFiles;
                });

                const data = response.data as any;
                if (data?.uploads?.[0]) {
                    uploadedPhotos.push(data.uploads[0]);
                } else if (data?.photo) {
                    uploadedPhotos.push(data.photo);
                }

            } catch (error: any) {
                console.error(`Upload error for ${fileItem.file.name}:`, error);
                setFiles(prev => {
                    const newFiles = [...prev];
                    if (newFiles[index]) {
                        newFiles[index] = {
                            ...newFiles[index],
                            status: 'error',
                            error: error.response?.data?.message || 'Upload failed'
                        };
                    }
                    return newFiles;
                });
            }
        };

        // Worker pool logic
        let currentIndex = 0;
        const workers = Array(Math.min(CONCURRENCY_LIMIT, pendingIndices.length))
            .fill(null)
            .map(async () => {
                while (currentIndex < pendingIndices.length) {
                    const index = pendingIndices[currentIndex++];
                    await processFile(index);
                }
            });

        await Promise.all(workers);

        setIsUploading(false);

        if (onUploadComplete && uploadedPhotos.length > 0) {
            onUploadComplete(uploadedPhotos);
        }
    };

    const clearCompleted = () => {
        setFiles(prev => {
            const remaining = prev.filter(f => f.status !== 'success');
            const completed = prev.filter(f => f.status === 'success');
            completed.forEach(f => URL.revokeObjectURL(f.preview));
            return remaining;
        });
    };

    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const pendingCount = files.filter(f => f.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {isDragActive ? (
                    <p className="text-lg text-blue-600 font-medium">Drop images here...</p>
                ) : (
                    <>
                        <p className="text-lg text-gray-700 font-medium mb-2">
                            Drag & drop images here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                            Supports: JPG, PNG, WEBP • Max {maxFiles} files
                        </p>
                    </>
                )}
            </div>

            {/* Upload Stats */}
            {files.length > 0 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">{files.length} files</span>
                        </div>
                        {successCount > 0 && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>{successCount} uploaded</span>
                            </div>
                        )}
                        {errorCount > 0 && (
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errorCount} failed</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {successCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCompleted}
                                disabled={isUploading}
                            >
                                Clear Completed
                            </Button>
                        )}
                        <Button
                            onClick={uploadFiles}
                            disabled={isUploading || pendingCount === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload {pendingCount} {pendingCount === 1 ? 'Photo' : 'Photos'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((fileItem, index) => (
                        <div
                            key={index}
                            className="relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden"
                        >
                            {/* Image Preview */}
                            <div className="aspect-square bg-gray-100 relative">
                                <img
                                    src={fileItem.preview}
                                    alt={fileItem.file.name}
                                    className="w-full h-full object-cover"
                                />

                                {/* Status Overlay */}
                                {fileItem.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p className="text-sm font-medium">{fileItem.progress}%</p>
                                        </div>
                                    </div>
                                )}

                                {fileItem.status === 'success' && (
                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="h-12 w-12 text-green-600" />
                                    </div>
                                )}

                                {fileItem.status === 'error' && (
                                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                        <AlertCircle className="h-12 w-12 text-red-600" />
                                    </div>
                                )}

                                {/* Remove Button */}
                                {!isUploading && fileItem.status !== 'uploading' && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* File Info */}
                            <div className="p-2">
                                <p className="text-xs text-gray-600 truncate" title={fileItem.file.name}>
                                    {fileItem.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {fileItem.error && (
                                    <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Processing Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Automatic AI Processing</p>
                        <p className="text-blue-700">
                            After upload, images are automatically sent to AWS S3. A Lambda function will:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                            <li>Detect and recognize faces using AWS Rekognition</li>
                            <li>Match faces with registered users</li>
                            <li>Moderate content for safety</li>
                            <li>Organize photos by user and event</li>
                        </ul>
                        <p className="mt-2 text-blue-700">
                            Users will automatically see photos they appear in within minutes!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
