'use client';

import { useState } from 'react';
import { Bell, Eye, Smartphone, Shield, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';

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
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="spinner h-8 w-8 rounded-full border-4 border-zinc-200 border-t-violet-600 dark:border-white/20 dark:border-t-violet-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/90 via-white to-zinc-50 p-8 shadow-xl shadow-zinc-900/5 dark:border-white/5 dark:bg-gradient-to-r dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi02cy0yLTQtMi02IDItNCAyLTYtMi00LTItNmwyIDJjMCAyLTIgNC0yIDZzMiA0IDIgNi0yIDQtMiA2IDIgNCAyIDZsLTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi02cy0yLTQtMi02IDItNCAyLTYtMi00LTItNmwyIDJjMCAyLTIgNC0yIDZzMiA0IDIgNi0yIDQtMiA2IDIgNCAyIDZsLTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] dark:opacity-30"></div>
                <div className="relative">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-white/10">
                            <Shield className="h-5 w-5 text-violet-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm font-medium text-zinc-600 dark:text-slate-300">Account Settings</span>
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Settings</h1>
                    <p className="text-zinc-600 dark:text-slate-300">Manage your preferences, notifications, and privacy</p>
                </div>
            </div>

            {/* Appearance */}
            <div className="card">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                        <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Appearance</h2>
                        <p className="text-sm text-zinc-500 dark:text-gray-400">Choose light or dark interface</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-medium text-zinc-900 dark:text-white">Theme</p>
                        <p className="text-sm text-zinc-500 dark:text-gray-500">Applies across the signed-in app</p>
                    </div>
                    <ThemeToggle showLabel />
                </div>
            </div>

            {/* Notifications Section */}
            <div className="card">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                        <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Notifications</h2>
                        <p className="text-sm text-zinc-500 dark:text-gray-400">Choose what updates you want to receive</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 transition-all hover:bg-zinc-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/15 dark:group-hover:bg-blue-500/20">
                                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-white">Email Notifications</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-500">Get notified about new photos and events via email</p>
                            </div>
                        </div>
                        <div className="relative shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="toggle-track" />
                        </div>
                    </label>

                    <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 transition-all hover:bg-zinc-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-500/20">
                                <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-white">Push Notifications</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-500">Receive real-time push notifications on your device</p>
                            </div>
                        </div>
                        <div className="relative shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.pushNotifications}
                                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="toggle-track" />
                        </div>
                    </label>

                    <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 transition-all hover:bg-zinc-100 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/15 dark:group-hover:bg-amber-500/20">
                                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-white">Photo Alerts</p>
                                <p className="text-sm text-zinc-500 dark:text-gray-500">Get notified when you appear in new photos</p>
                            </div>
                        </div>
                        <div className="relative shrink-0">
                            <input
                                type="checkbox"
                                checked={settings.photoAlerts}
                                onChange={(e) => setSettings({ ...settings, photoAlerts: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="toggle-track" />
                        </div>
                    </label>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-red-200 dark:border-red-500/20">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                        <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Danger Zone</h2>
                        <p className="text-sm text-zinc-500 dark:text-gray-400">Irreversible actions for your account</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-xl border border-red-200/90 bg-red-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/10 dark:bg-red-500/5">
                        <div>
                            <p className="font-medium text-zinc-900 dark:text-white">Log out of your account</p>
                            <p className="text-sm text-zinc-500 dark:text-gray-500">You&apos;ll need to sign in again to access your account</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-xl border border-red-200 bg-white px-5 py-2.5 font-medium text-red-700 transition-all hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-red-200/90 bg-red-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/10 dark:bg-red-500/5">
                        <div>
                            <p className="font-medium text-zinc-900 dark:text-white">Delete your account</p>
                            <p className="text-sm text-zinc-500 dark:text-gray-500">Permanently remove your account and all data</p>
                        </div>
                        <button
                            type="button"
                            className="rounded-xl bg-red-600 px-5 py-2.5 font-medium text-white transition-all hover:bg-red-500"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}


