import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import toast from 'react-hot-toast';

interface UploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
}

export default function UploadZone({ onFilesSelected, maxFiles = 100 }: UploadZoneProps) {
    const { isPhotographerOrOrganizer } = useRole();
    const [previews, setPreviews] = useState<{ file: File; start: string | ArrayBuffer | null }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null);

        // Role check
        if (!isPhotographerOrOrganizer) {
            toast.error('Only organizers and photographers can upload photos directly.');
            return;
        }

        if (acceptedFiles.length > maxFiles) {
            setError(`You can only upload up to ${maxFiles} files at a time.`);
            return;
        }

        const newPreviews = acceptedFiles.map(file => {
            return {
                file,
                start: URL.createObjectURL(file)
            };
        });

        setPreviews(newPreviews);
        onFilesSelected(acceptedFiles);
    }, [maxFiles, onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles
    });

    const removeFile = (index: number) => {
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index].start as string);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
        onFilesSelected(newPreviews.map(p => p.file));
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary-50 rounded-full text-primary-600">
                        <Upload size={32} />
                    </div>
                    <div>
                        <p className="font-medium text-lg">
                            {isDragActive ? 'Drop the photos here' : 'Drag & drop photos here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to select files (max {maxFiles})
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {previews.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-medium mb-4">Selected Photos ({previews.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                {typeof preview.start === 'string' ? (
                                    <Image
                                        src={preview.start}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <FileImage className="text-gray-400" />
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
