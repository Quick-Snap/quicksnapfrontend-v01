'use client';

import { useState } from 'react';
import RoleGuard from '@/app/components/RoleGuard';
import OrganizerRequestsPanel from '@/app/components/admin/OrganizerRequestsPanel';
import AIEngineControlCard from '@/app/components/admin/AIEngineControlCard';
import CouponsControlCard from '@/app/components/admin/CouponsControlCard';
import CustomPlanBuilderCard from '@/app/components/admin/CustomPlanBuilderCard';
import { Cpu, Users, Tag, Sparkles } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'custom_plans' | 'coupons' | 'ai'>('requests');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'requests'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Organizer Requests
          </button>
          <button
            onClick={() => setActiveTab('custom_plans')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'custom_plans'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Custom Plans & AI Pricing
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'coupons'
                ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Tag className="h-4 w-4" />
            Discount Coupons
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
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
        {activeTab === 'requests' && <OrganizerRequestsPanel />}
        {activeTab === 'custom_plans' && <CustomPlanBuilderCard />}
        {activeTab === 'coupons' && <CouponsControlCard />}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <AIEngineControlCard />
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
