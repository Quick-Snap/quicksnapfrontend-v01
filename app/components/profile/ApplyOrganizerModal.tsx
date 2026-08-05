'use client';

import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { X, Building2, Mail, Phone, FileText } from 'lucide-react';
import { organizerRequestApi } from '@/lib/api';
import { SubmitOrganizerRequestDto } from '@/types';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

interface ApplyOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  initialValues?: Partial<SubmitOrganizerRequestDto>;
}

const emptyForm: SubmitOrganizerRequestDto = {
  reason: '',
  organizationName: '',
  organizationEmail: '',
  phone: '',
};

export default function ApplyOrganizerModal({
  isOpen,
  onClose,
  onSubmitted,
  initialValues,
}: ApplyOrganizerModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubmitOrganizerRequestDto>({
    ...emptyForm,
    ...initialValues,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof SubmitOrganizerRequestDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.reason.trim()) {
      toast.error('Please tell us why you want to become an organizer');
      return;
    }

    setLoading(true);
    try {
      const payload: SubmitOrganizerRequestDto = {
        reason: form.reason.trim(),
        organizationName: form.organizationName?.trim() || undefined,
        organizationEmail: form.organizationEmail?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };

      const res = await organizerRequestApi.submit(payload);
      if (res.success) {
        toast.success(
          res.message ||
            'Your organizer request has been submitted. We\'ll notify you once an admin reviews it.'
        );
        queryClient.invalidateQueries('organizerRequestStats');
        queryClient.invalidateQueries('organizerRequestStatsNav');
        onSubmitted();
        onClose();
        setForm(emptyForm);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit organizer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#141414]">
        <div className="flex items-start justify-between border-b border-zinc-200 p-6 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Apply to become an organizer</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400">
              Submit your application for admin review
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-gray-300">
              <Building2 size={16} className="text-zinc-400" />
              Organization name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Snap Studio"
              value={form.organizationName || ''}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-gray-300">
              <Mail size={16} className="text-zinc-400" />
              Organization email
            </label>
            <input
              type="email"
              className="input"
              placeholder="studio@example.com"
              value={form.organizationEmail || ''}
              onChange={(e) => handleChange('organizationEmail', e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-gray-300">
              <Phone size={16} className="text-zinc-400" />
              Phone number
            </label>
            <input
              type="tel"
              className="input"
              placeholder="+919876543210"
              value={form.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-gray-300">
              <FileText size={16} className="text-zinc-400" />
              Why do you want to become an organizer? <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="I run a wedding photography business and want to host events on Roopixo…"
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Submit application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
