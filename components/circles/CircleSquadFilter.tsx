'use client';

import React from 'react';
import {
  Users,
  Lock,
  Check,
  Plus,
  Clock,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { CircleMember, EventCircleItem } from '@/lib/api';

interface CircleSquadFilterProps {
  circle: EventCircleItem;
  currentUserId: string;
  selectedMemberIds: string[];
  onToggleMember: (userId: string) => void;
  onOpenManageCircles: () => void;
  onExitCircle: () => void;
  totalPhotosCount: number;
}

export default function CircleSquadFilter({
  circle,
  currentUserId,
  selectedMemberIds,
  onToggleMember,
  onOpenManageCircles,
  onExitCircle,
  totalPhotosCount
}: CircleSquadFilterProps) {
  const acceptedMembers = circle.members.filter((m) => m.status === 'accepted');
  const pendingMembers = circle.members.filter((m) => m.status === 'pending');

  return (
    <div className="w-full rounded-2xl border border-violet-200/80 dark:border-violet-500/20 bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-purple-50/70 dark:from-violet-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 p-4 mb-6 shadow-sm">
      
      {/* Top row: Circle title and manage/exit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-violet-200/50 dark:border-violet-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/30 shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Circle: {circle.name}
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                {totalPhotosCount} {totalPhotosCount === 1 ? 'photo' : 'photos'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-gray-400">
              Toggle squad members below to filter group combinations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onOpenManageCircles}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-gray-200 border border-zinc-200/80 dark:border-white/10 shadow-2xs transition-colors"
          >
            Switch Circle
          </button>
          <button
            type="button"
            onClick={onExitCircle}
            title="Exit Circle gallery view"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-200/70 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-gray-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Member Toggle Pills */}
      <div className="pt-3 flex flex-wrap items-center gap-2">
        {/* Current user locked pill */}
        <div
          title="Your face is locked on for privacy protection"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-xs select-none cursor-default"
        >
          <Lock className="h-3 w-3 text-violet-200" />
          <span>You (Locked)</span>
        </div>

        {/* Accepted other members */}
        {acceptedMembers.map((member) => {
          const mUserId = (member.userId?._id || member.userId)?.toString();
          if (mUserId === currentUserId) return null; // already rendered as "You"

          const isSelected = selectedMemberIds.includes(mUserId);

          return (
            <button
              key={mUserId}
              type="button"
              onClick={() => onToggleMember(mUserId)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 select-none ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500'
                  : 'bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-gray-300 border border-zinc-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-400'
              }`}
            >
              {isSelected ? (
                <Check className="h-3 w-3 text-white" />
              ) : (
                <Plus className="h-3 w-3 text-zinc-400" />
              )}
              <span>{member.name}</span>
            </button>
          );
        })}

        {/* Pending members */}
        {pendingMembers.map((member, idx) => (
          <div
            key={idx}
            title="Invite sent - waiting for them to accept"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100/80 dark:bg-white/5 text-zinc-400 border border-dashed border-zinc-300 dark:border-white/10 select-none cursor-default"
          >
            <Clock className="h-3 w-3 text-amber-500" />
            <span>{member.name} (Pending)</span>
          </div>
        ))}
      </div>

      {/* Helpful zero photos hint */}
      {totalPhotosCount === 0 && selectedMemberIds.length > 0 && (
        <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            No photos found where everyone selected appears together yet. Try toggling off one member above to see smaller group shots!
          </span>
        </div>
      )}

    </div>
  );
}
