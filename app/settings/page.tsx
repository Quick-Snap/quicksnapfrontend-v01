'use client';

import { useState } from 'react';
import { Bell, Eye, Smartphone, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Settings state
    const [settings, setSettings] = useState({
        emailNotifications: user?.settings?.notifications ?? true,
        pushNotifications: true,
        photoAlerts: true,
        eventReminders: true,
    });

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi02cy0yLTQtMi02IDItNCAyLTYtMi00LTItNmwyIDJjMCAyLTIgNC0yIDZzMiA0IDIgNi0yIDQtMiA2IDIgNCAyIDZsLTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-slate-300" />
                        </div>
                        <span className="text-slate-300 text-sm font-medium">Account Settings</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-300">Manage your preferences, notifications, and privacy</p>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                        <p className="text-sm text-gray-400">Choose what updates you want to receive</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all border border-white/5 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Bell className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Email Notifications</p>
                                <p className="text-sm text-gray-500">Get notified about new photos and events via email</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all border border-white/5 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Smartphone className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive real-time push notifications on your device</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.pushNotifications}
                                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all border border-white/5 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Eye className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">Photo Alerts</p>
                                <p className="text-sm text-gray-500">Get notified when you appear in new photos</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.photoAlerts}
                                onChange={(e) => setSettings({ ...settings, photoAlerts: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-red-500/20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
                        <p className="text-sm text-gray-400">Irreversible actions for your account</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <p className="font-medium text-white">Log out of your account</p>
                            <p className="text-sm text-gray-500">You'll need to sign in again to access your account</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium transition-all border border-red-500/20 hover:border-red-500/30"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <p className="font-medium text-white">Delete your account</p>
                            <p className="text-sm text-gray-500">Permanently remove your account and all data</p>
                        </div>
                        <button
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-all"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}


