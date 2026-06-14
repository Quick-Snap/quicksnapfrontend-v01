'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import {
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  X,
  Eye,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminOrganizerRequestApi } from '@/lib/api';
import {
  OrganizerRequest,
  OrganizerRequestStats,
  OrganizerRequestStatus,
  OrganizerRequestUser,
} from '@/types';
import { Button } from '@/app/components/ui/Button';
import Pagination from '@/app/components/ui/Pagination';

type StatusFilter = OrganizerRequestStatus | 'all';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const ITEMS_PER_PAGE = 20;

function getRequestUser(request: OrganizerRequest): OrganizerRequestUser | null {
  if (typeof request.userId === 'object' && request.userId !== null) {
    return request.userId;
  }
  return null;
}

function truncate(text: string, max = 60) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function StatusBadge({ status }: { status: OrganizerRequestStatus }) {
  const styles: Record<OrganizerRequestStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
    cancelled: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/25',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

interface ApproveModalProps {
  request: OrganizerRequest;
  onClose: () => void;
  onConfirm: (reviewNote: string, createOrganization: boolean) => Promise<void>;
  loading: boolean;
}

function ApproveModal({ request, onClose, onConfirm, loading }: ApproveModalProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [createOrganization, setCreateOrganization] = useState(
    !!(request.organizationName && request.organizationEmail)
  );
  const user = getRequestUser(request);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#141414]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Approve request</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400">
              Promote {user?.name || 'this user'} to organizer
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-gray-300">
              Review note (optional)
            </label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Welcome to QuickSnap organizers!"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>

          {request.organizationName && request.organizationEmail && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-white/10">
              <input
                type="checkbox"
                checked={createOrganization}
                onChange={(e) => setCreateOrganization(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Auto-create organization
                </p>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  {request.organizationName} ({request.organizationEmail})
                </p>
              </div>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={loading}
              onClick={() => onConfirm(reviewNote, createOrganization)}
            >
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RejectModalProps {
  request: OrganizerRequest;
  onClose: () => void;
  onConfirm: (reviewNote: string) => Promise<void>;
  loading: boolean;
}

function RejectModal({ request, onClose, onConfirm, loading }: RejectModalProps) {
  const [reviewNote, setReviewNote] = useState('');
  const user = getRequestUser(request);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#141414]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Reject request</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400">
              Reject {user?.name || 'this user'}&apos;s organizer application
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-gray-300">
              Reason for rejection
            </label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Please provide more business details…"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              loading={loading}
              onClick={() => onConfirm(reviewNote)}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailDrawerProps {
  request: OrganizerRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function DetailDrawer({ request, onClose, onApprove, onReject }: DetailDrawerProps) {
  const user = getRequestUser(request);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#141414]">
        <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-white/10">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Request details</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-white/10">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={24} className="text-zinc-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-zinc-500 dark:text-gray-400">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Roles: {user.roles?.join(', ') || 'guest'}
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Status</p>
            <StatusBadge status={request.status} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Reason</p>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-gray-300">{request.reason}</p>
          </div>

          {(request.organizationName || request.organizationEmail || request.phone) && (
            <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-white/10">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Organization details</p>
              {request.organizationName && (
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-gray-300">
                  <Building2 size={16} className="text-zinc-400" />
                  {request.organizationName}
                </div>
              )}
              {request.organizationEmail && (
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-gray-300">
                  <Mail size={16} className="text-zinc-400" />
                  {request.organizationEmail}
                </div>
              )}
              {request.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-gray-300">
                  <Phone size={16} className="text-zinc-400" />
                  {request.phone}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Submitted</p>
            <p className="text-sm text-zinc-700 dark:text-gray-300">
              {format(new Date(request.createdAt), 'PPP p')}
            </p>
          </div>

          {request.reviewNote && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Review note</p>
              <p className="text-sm text-zinc-700 dark:text-gray-300">{request.reviewNote}</p>
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <div className="flex gap-3 border-t border-zinc-200 p-5 dark:border-white/10">
            <Button variant="destructive" className="flex-1" onClick={onReject}>
              Reject
            </Button>
            <Button className="flex-1" onClick={onApprove}>
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function OrganizerRequestsPanel() {
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [stats, setStats] = useState<OrganizerRequestStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [approveTarget, setApproveTarget] = useState<OrganizerRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrganizerRequest | null>(null);
  const [detailTarget, setDetailTarget] = useState<OrganizerRequest | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminOrganizerRequestApi.stats();
      if (res.data) setStats(res.data);
    } catch {
      // Stats are supplementary; list errors are surfaced separately
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: ITEMS_PER_PAGE };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminOrganizerRequestApi.list(params);
      setRequests(res.data?.requests || []);
      setPagination({
        total: res.data?.pagination?.total || 0,
        pages: res.data?.pagination?.pages || 1,
      });
    } catch {
      toast.error('Failed to load organizer requests');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleTabChange = (tab: StatusFilter) => {
    setStatusFilter(tab);
    setPage(1);
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchRequests(),
      queryClient.invalidateQueries('organizerRequestStats'),
      queryClient.invalidateQueries('organizerRequestStatsNav'),
    ]);
  };

  const handleApprove = async (reviewNote: string, createOrganization: boolean) => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await adminOrganizerRequestApi.approve(approveTarget._id, {
        reviewNote: reviewNote || undefined,
        createOrganization,
      });
      toast.success('Organizer request approved. User can now create events.');
      setApproveTarget(null);
      setDetailTarget(null);
      await refreshAll();
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reviewNote: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await adminOrganizerRequestApi.reject(rejectTarget._id, {
        reviewNote: reviewNote || undefined,
      });
      toast.success('Request rejected.');
      setRejectTarget(null);
      setDetailTarget(null);
      await refreshAll();
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-200" />
            <span className="text-sm font-medium text-violet-200">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Organizer Requests</h1>
          <p className="mt-1 text-violet-100">
            Review and approve users who want to become event organizers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          accent="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          accent="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          accent="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard
          title="Total"
          value={stats.total}
          icon={User}
          accent="bg-gradient-to-br from-violet-500 to-purple-600"
        />
      </div>

      {/* Table card */}
      <div className="card">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && stats.pending > 0 && (
                  <span className="ml-2 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-xs font-bold text-amber-950">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              className="input pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-white/5">
                <th className="p-4 text-sm font-medium text-zinc-500">User</th>
                <th className="p-4 text-sm font-medium text-zinc-500">Org name</th>
                <th className="p-4 text-sm font-medium text-zinc-500">Reason</th>
                <th className="p-4 text-sm font-medium text-zinc-500">Requested</th>
                <th className="p-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="p-4 text-right text-sm font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    Loading requests…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    {statusFilter === 'pending'
                      ? 'No pending organizer requests'
                      : 'No requests found'}
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const user = getRequestUser(request);
                  return (
                    <tr
                      key={request._id}
                      className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User size={18} className="text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">
                              {user?.name || 'Unknown user'}
                            </p>
                            <p className="text-sm text-zinc-500">{user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-zinc-700 dark:text-gray-300">
                        {request.organizationName || '—'}
                      </td>
                      <td className="max-w-[200px] p-4 text-sm text-zinc-600 dark:text-gray-400">
                        {truncate(request.reason)}
                      </td>
                      <td className="p-4 text-sm text-zinc-500">
                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailTarget(request)}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                onClick={() => setApproveTarget(request)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                onClick={() => setRejectTarget(request)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={pagination.pages}
          onPageChange={setPage}
          totalItems={pagination.total}
          itemsPerPage={ITEMS_PER_PAGE}
          showInfo={false}
        />
      </div>

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          loading={actionLoading}
        />
      )}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}

      {detailTarget && (
        <DetailDrawer
          request={detailTarget}
          onClose={() => setDetailTarget(null)}
          onApprove={() => {
            setApproveTarget(detailTarget);
          }}
          onReject={() => {
            setRejectTarget(detailTarget);
          }}
        />
      )}
    </div>
  );
}
