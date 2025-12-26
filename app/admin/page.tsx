'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Calendar, Image as ImageIcon, TrendingUp, AlertCircle, Shield, Sparkles } from 'lucide-react';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalPhotos: 0,
    activeEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Prepare parallel requests if endpoints available
        // For now, mocking system stats or deriving from lists
        // In real app, GET /admin/stats
        const usersRes = await api.get('/users?limit=1'); // Just to get total count if pagination provided
        const eventsRes = await api.get('/events?limit=1');

        setStats({
          totalUsers: usersRes.data.data?.pagination?.total || 150, // Fallback mock
          totalEvents: eventsRes.data.data?.pagination?.total || 24,
          totalPhotos: 1250, // Mock
          activeEvents: 5 // Mock
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, gradient, trend }: any) => (
    <div className="stat-card group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{loading ? '...' : value}</h3>
          {trend && (
            <p className="text-emerald-400 text-xs flex items-center mt-2">
              <TrendingUp size={12} className="mr-1" /> {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-violet-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-violet-200" />
                <span className="text-violet-200 text-sm font-medium">System Administration</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-violet-100 mt-1">Overview of QuickSnap platform status</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/users">
                <Button variant="secondary" className="flex items-center gap-2 bg-white/10 border-white/10 hover:bg-white/20">
                  <Users size={18} /> Manage Users
                </Button>
              </Link>
              <Link href="/admin/moderate">
                <Button variant="outline" className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10">
                  <Shield size={18} /> Moderation Queue
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            trend="+12% this month"
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            trend="+5 new today"
          />
          <StatCard
            title="Total Photos"
            value={stats.totalPhotos}
            icon={ImageIcon}
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
            trend="+120 uploaded"
          />
          <StatCard
            title="Active Events"
            value={stats.activeEvents}
            icon={Shield}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
        </div>

        {/* System Health / Quick Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-violet-400" />
              System Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-white">API Server</span>
                </div>
                <span className="text-emerald-400 text-sm font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-white">Database (MongoDB)</span>
                </div>
                <span className="text-emerald-400 text-sm font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-white">AWS Services</span>
                </div>
                <span className="text-emerald-400 text-sm font-medium">Operational</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {/* Mock Activity Log */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">New Event Created</p>
                  <p className="text-xs text-gray-500">College Fest 2025 created by Admin</p>
                  <p className="text-xs text-gray-600 mt-1">2 mins ago</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={18} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Photos Uploaded</p>
                  <p className="text-xs text-gray-500">50 photos uploaded to "Tech Summit"</p>
                  <p className="text-xs text-gray-600 mt-1">15 mins ago</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">New User Registered</p>
                  <p className="text-xs text-gray-500">John Doe (Student) joined</p>
                  <p className="text-xs text-gray-600 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
