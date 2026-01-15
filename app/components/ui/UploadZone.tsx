import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, AlertCircle, ImageIcon, Sparkles } from 'lucide-react';
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
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
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
                url: URL.createObjectURL(file)
            };
        });

        setPreviews(newPreviews);
        onFilesSelected(acceptedFiles);
    }, [maxFiles, onFilesSelected, isPhotographerOrOrganizer]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles
    });

    const removeFile = (index: number) => {
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index].url);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
        onFilesSelected(newPreviews.map(p => p.file));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`
                    relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                    ${isDragActive 
                        ? 'border-violet-500 bg-violet-500/10 scale-[1.02]' 
                        : 'border-white/20 hover:border-violet-500/50 hover:bg-white/5'
                    }
                `}
            >
                {/* Background Gradient on Drag */}
                {isDragActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10" />
                )}
                
                <input {...getInputProps()} />
                
                <div className="relative flex flex-col items-center gap-4">
                    {/* Icon Container */}
                    <div className={`
                        p-5 rounded-2xl transition-all duration-300
                        ${isDragActive 
                            ? 'bg-violet-500/20 scale-110' 
                            : 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10'
                        }
                    `}>
                        <Upload 
                            size={36} 
                            className={`transition-colors duration-300 ${isDragActive ? 'text-violet-400' : 'text-violet-500'}`} 
                        />
                    </div>
                    
                    {/* Text Content */}
                    <div className="space-y-2">
                        <p className="font-semibold text-lg text-white">
                            {isDragActive ? 'Drop your photos here' : 'Drag & drop photos here'}
                        </p>
                        <p className="text-sm text-gray-400">
                            or <span className="text-violet-400 hover:text-violet-300 transition-colors">browse files</span> from your computer
                        </p>
                    </div>

                    {/* File Types Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <ImageIcon size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB each</span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={16} className="text-red-400" />
                    </div>
                    <span className="text-red-300">{error}</span>
                </div>
            )}

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="mt-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-violet-400" />
                            <h3 className="font-semibold text-white">Selected Photos</h3>
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium">
                                {previews.length}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {previews.map((preview, index) => (
                            <div 
                                key={index} 
                                className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all duration-300"
                            >
                                {preview.url ? (
                                    <Image
                                        src={preview.url}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <FileImage className="text-gray-500" size={24} />
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* File Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-xs text-white truncate">{preview.file.name}</p>
                                    <p className="text-xs text-gray-300">{formatFileSize(preview.file.size)}</p>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:scale-110"
                                >
                                    <X size={14} />
                                </button>

                                {/* Index Badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                                    <span className="text-xs text-white font-medium">{index + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
