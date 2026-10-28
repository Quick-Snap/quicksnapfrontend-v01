'use client';

import { useState } from 'react';
import RoleGuard from '@/app/components/RoleGuard';
import OrganizerRequestsPanel from '@/app/components/admin/OrganizerRequestsPanel';
import AIEngineControlCard from '@/app/components/admin/AIEngineControlCard';
import { Cpu, Users } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'ai'>('requests');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Organizer Requests
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'ai'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Cpu className="h-4 w-4" />
            AI Face Engine & Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' ? (
          <OrganizerRequestsPanel />
        ) : (
          <div className="space-y-6">
            <AIEngineControlCard />
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
