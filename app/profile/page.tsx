'use client';

import { useState } from 'react';
import { User, Mail, Camera, Shield, Edit3, Check, X, Calendar, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || '');
    const [savingName, setSavingName] = useState(false);

    const handleSaveName = async () => {
        if (!editedName.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        
        if (editedName.trim() === user?.name) {
            setIsEditing(false);
            return;
        }

        setSavingName(true);
        try {
            const response = await userApi.updateName(editedName.trim());
            if (response.success) {
                // Update user in context
                updateUser({ ...user!, name: editedName.trim() });
                toast.success('Name updated successfully!');
                setIsEditing(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update name');
        } finally {
            setSavingName(false);
        }
    };

    // Format the member since date
    const formatMemberSince = (dateString?: string) => {
        if (!dateString) return 'Unknown';
        try {
            return format(new Date(dateString), 'MMMM yyyy');
        } catch {
            return 'Unknown';
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-[#111111] rounded-2xl border border-white/10">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5"></div>
                
                {/* Decorative grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }}></div>
                
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-violet-500/10 rounded-full blur-[80px]"></div>
                
                <div className="relative p-8 md:p-10">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative group mb-6">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-[3px] shadow-xl shadow-violet-500/20">
                                <div className="w-full h-full rounded-full bg-[#111111] flex items-center justify-center text-white text-4xl font-bold">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-[#111111]">
                                <Camera className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-3">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                                            disabled={savingName}
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleSaveName} 
                                            disabled={savingName}
                                            className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                        >
                                            {savingName ? (
                                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                                            ) : (
                                                <Check className="h-5 w-5 text-white" />
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => setIsEditing(false)} 
                                            disabled={savingName}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                                        >
                                            <X className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{user.name}</h1>
                                        <button 
                                            onClick={() => {
                                                setEditedName(user.name);
                                                setIsEditing(true);
                                            }}
                                            className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                                        >
                                            <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <p className="text-gray-400">{user.email}</p>
                            
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                <span className={`
                                    px-3 py-1 rounded-lg text-xs font-medium capitalize inline-flex items-center gap-1.5
                                    ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    user.role === 'organizer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    user.role === 'photographer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-white/5 text-gray-400 border border-white/10'}
                                `}>
                                    <Sparkles className="h-3 w-3" />
                                    {user.role}
                                </span>
                                {user.faceRegistered && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                                        <Shield className="h-3 w-3" /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Information */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Account Information</h2>
                        <p className="text-sm text-gray-400">Your personal details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/20 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email Address</p>
                            <p className="font-medium text-white mt-0.5">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/20 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Member Since</p>
                            <p className="font-medium text-white mt-0.5">{formatMemberSince(user.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Face Registration */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Face Recognition</h2>
                        <p className="text-sm text-gray-400">Automatically find photos you appear in</p>
                    </div>
                </div>

                {user.faceRegistered ? (
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Shield className="h-7 w-7 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-emerald-300 text-lg">Face Registered Successfully</p>
                                    <p className="text-gray-400 mt-1">
                                        Your face is registered. Photos where you appear will be automatically identified and shown in your gallery.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/register-face"
                                className="shrink-0 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-colors border border-emerald-500/20"
                            >
                                Update Face
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Camera className="h-7 w-7 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-300 text-lg">Face Not Registered</p>
                                    <p className="text-gray-400 mt-1">
                                        Register your face to automatically find and access photos where you appear in events.
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href="/register-face" 
                                className="shrink-0 btn-gradient px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
                            >
                                <Camera className="h-5 w-5" />
                                Register Now
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
