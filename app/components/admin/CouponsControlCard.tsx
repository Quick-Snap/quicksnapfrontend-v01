'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Percent,
  IndianRupee,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCouponsApi, CouponInfo } from '@/lib/api';

export default function CouponsControlCard() {
  const [coupons, setCoupons] = useState<CouponInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for new coupon
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [validDays, setValidDays] = useState<number>(30);
  const [usageLimit, setUsageLimit] = useState<string>('50');
  const [creating, setCreating] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await adminCouponsApi.getAll();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    setCreating(true);
    try {
      const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await adminCouponsApi.create({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        validUntil,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        applicableTiers: ['all']
      });

      if (res.success) {
        toast.success(`Coupon "${code.toUpperCase()}" created!`);
        setShowCreateModal(false);
        setCode('');
        setDescription('');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await adminCouponsApi.toggle(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string, codeStr: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${codeStr}"?`)) return;
    try {
      const res = await adminCouponsApi.delete(id);
      if (res.success) {
        toast.success('Coupon deleted');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                Discount Coupons
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Generate promotional discount codes (percentage or flat amount) applicable at checkout.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          Create New Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
            <Tag className="h-8 w-8 text-zinc-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No active coupons created yet</p>
            <p className="text-xs text-zinc-500 mt-1">Click "Create New Coupon" above to generate your first promotional code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Discount</th>
                  <th className="py-3 px-4 font-semibold">Redemptions</th>
                  <th className="py-3 px-4 font-semibold">Valid Until</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {coupons.map((c) => {
                  const isExpired = new Date(c.validUntil).getTime() < Date.now();
                  const isLimitReached = c.usageLimit ? c.usageCount >= c.usageLimit : false;

                  return (
                    <tr key={c._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-600 dark:text-violet-400">
                        {c.code}
                        {c.description && (
                          <p className="text-[11px] font-sans font-normal text-zinc-400">{c.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {c.discountType === 'percentage' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            <Percent className="h-3 w-3" />
                            {c.discountValue}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <IndianRupee className="h-3 w-3" />
                            ₹{c.discountValue} OFF
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                        {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(c.validUntil).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="text-red-500 text-xs font-semibold">Expired</span>
                        ) : isLimitReached ? (
                          <span className="text-amber-500 text-xs font-semibold">Limit Reached</span>
                        ) : c.isActive ? (
                          <span className="text-emerald-500 text-xs font-semibold">Active</span>
                        ) : (
                          <span className="text-zinc-400 text-xs font-semibold">Disabled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(c._id)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                            title={c.isActive ? 'Disable coupon' : 'Enable coupon'}
                          >
                            {c.isActive ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-zinc-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, c.code)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 transition"
                            title="Delete coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900 text-zinc-900 dark:text-white">
            <h3 className="text-lg font-bold">Create Discount Coupon</h3>
            <p className="text-xs text-zinc-500 mt-1">Create a promotional code to distribute to photographers.</p>

            <form onSubmit={handleCreateCoupon} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. WEDDING20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-mono uppercase font-bold dark:border-white/10 dark:bg-white/5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Description (Internal memo)</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount for Delhi Wedding Expo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Flat Cash (₹ INR)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    min="1"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Valid For (Days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    min="1"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
