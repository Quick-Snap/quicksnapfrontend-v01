'use client';

import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { X, Building2, Phone, Mail, Globe, Users, HeartHandshake, FileText, User } from 'lucide-react';
import { organizerRequestApi } from '@/lib/api';
import { SubmitOrganizerRequestDto } from '@/types';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ApplyCommunityGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

interface CommunityGrantFormState {
  organizationName: string;
  organizationEmail: string;
  spocName: string;
  phone: string;
  website: string;
  expectedAttendees: string;
  reason: string;
}

const emptyForm: CommunityGrantFormState = {
  organizationName: '',
  organizationEmail: '',
  spocName: '',
  phone: '',
  website: '',
  expectedAttendees: '',
  reason: '',
};

export default function ApplyCommunityGrantModal({
  isOpen,
  onClose,
  onSubmitted,
}: ApplyCommunityGrantModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CommunityGrantFormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof CommunityGrantFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast('Please sign in or create an account to apply for a Community Grant', { icon: '🔒' });
      router.push('/login?redirect=/pricing');
      return;
    }

    if (!form.organizationName.trim()) {
      toast.error('Please enter your community or student club name');
      return;
    }

    if (!form.spocName.trim()) {
      toast.error('Please enter the designated SPOC / lead organizer name');
      return;
    }

    if (!form.organizationEmail.trim()) {
      toast.error('Please provide an official contact email');
      return;
    }

    if (!form.phone.trim()) {
      toast.error('Please provide a contact phone / WhatsApp number');
      return;
    }

    if (!form.website.trim()) {
      toast.error('Please provide your community website or social profile link');
      return;
    }

    if (!form.reason.trim()) {
      toast.error('Please describe your community and upcoming events');
      return;
    }

    setLoading(true);
    try {
      const payload: SubmitOrganizerRequestDto = {
        requestType: 'community_grant',
        organizationName: form.organizationName.trim(),
        organizationEmail: form.organizationEmail.trim(),
        spocName: form.spocName.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        expectedAttendees: form.expectedAttendees ? parseInt(form.expectedAttendees, 10) : undefined,
        reason: form.reason.trim(),
      };

      const res = await organizerRequestApi.submit(payload);
      if (res.success) {
        toast.success(
          res.message ||
            'Community grant application submitted! Our team will review and approve your community within 24 hours.'
        );
        queryClient.invalidateQueries('organizerRequestStats');
        queryClient.invalidateQueries('organizerRequestStatsNav');
        if (onSubmitted) onSubmitted();
        onClose();
        setForm(emptyForm);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit community grant application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#121217] text-white shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              <HeartHandshake className="h-3.5 w-3.5" />
              Community Grant Program
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Apply for Community Grant
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              ₹0 event creation for non-profit student clubs, developer chapters & non-profits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Building2 size={15} className="text-violet-400" />
                Community / Club Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="e.g. GDG New Delhi / Rotaract"
                value={form.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <User size={15} className="text-violet-400" />
                Designated SPOC / Lead Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="e.g. Anurag Mishra (President / Lead)"
                value={form.spocName}
                onChange={(e) => handleChange('spocName', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Mail size={15} className="text-violet-400" />
                Official Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="community@org.org"
                value={form.organizationEmail}
                onChange={(e) => handleChange('organizationEmail', e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Phone size={15} className="text-violet-400" />
                Phone / WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Globe size={15} className="text-violet-400" />
                Website or Social Profile <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="https://instagram.com/yourclub"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Users size={15} className="text-violet-400" />
                Expected Attendees / Event
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="e.g. 350"
                value={form.expectedAttendees}
                onChange={(e) => handleChange('expectedAttendees', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <FileText size={15} className="text-violet-400" />
              About Your Community & Upcoming Events <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
              placeholder="Tell us about your community mission, upcoming meetups or conferences, and why you want to use Roopixo..."
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300 leading-relaxed">
            💡 <strong>Community Grant:</strong> Approved communities can host their events directly on Roopixo without any charges, with full AI face-matching, interactive Live Wall, and instant photo discovery.
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
