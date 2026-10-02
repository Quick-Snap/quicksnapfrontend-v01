'use client';

import React, { useState, useEffect } from 'react';
import { X, Hash, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi } from '@/lib/api';

interface CustomizeAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onCodeUpdated: (newCode: string) => void;
}

export default function CustomizeAccessCodeModal({
  isOpen,
  onClose,
  event,
  onCodeUpdated,
}: CustomizeAccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (event?.accessCode) {
      setCode(event.accessCode);
      setIsAvailable(null);
      setValidationMessage(null);
    }
  }, [event, isOpen]);

  // Debounced live check
  useEffect(() => {
    if (!isOpen || !code) {
      setIsAvailable(null);
      setValidationMessage(null);
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    // If unchanged from current event's code
    if (cleanCode === event?.accessCode?.toUpperCase()) {
      setIsAvailable(true);
      setValidationMessage('Current event access code');
      return;
    }

    // Client-side quick validation
    if (cleanCode.length < 3 || cleanCode.length > 16) {
      setIsAvailable(false);
      setValidationMessage('Code length must be between 3 and 16 characters.');
      return;
    }

    const codeRegex = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;
    if (!codeRegex.test(cleanCode)) {
      setIsAvailable(false);
      setValidationMessage('Only uppercase letters, numbers, and hyphens (cannot start or end with a hyphen).');
      return;
    }

    let isMounted = true;
    setChecking(true);
    setValidationMessage(null);

    const timer = setTimeout(async () => {
      try {
        const res = await eventApi.checkAccessCode(cleanCode, event?._id);
        if (isMounted) {
          if (res.success && res.data) {
            setIsAvailable(res.data.available);
            setValidationMessage(res.data.message || (res.data.available ? 'Code is available!' : 'Code is taken'));
          } else {
            setIsAvailable(false);
            setValidationMessage(res.message || 'Error checking availability');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setIsAvailable(false);
          setValidationMessage(err.response?.data?.message || 'Error validating code');
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [code, event?._id, event?.accessCode, isOpen]);

  if (!isOpen || !event) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically uppercase and strip disallowed characters
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(upper);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) return;
    if (cleanCode === event.accessCode) {
      onClose();
      return;
    }

    if (isAvailable === false) {
      toast.error(validationMessage || 'Please choose a valid and available access code');
      return;
    }

    setSaving(true);
    try {
      const res = await eventApi.update(event._id, { accessCode: cleanCode });
      if (res.success) {
        toast.success(`Access code changed to "${cleanCode}" successfully!`);
        onCodeUpdated(cleanCode);
        onClose();
      } else {
        toast.error(res.message || 'Failed to update access code');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update access code';
      toast.error(msg);
      setValidationMessage(msg);
      setIsAvailable(false);
    } finally {
      setSaving(false);
    }
  };

  const isCurrentCode = code.trim().toUpperCase() === event.accessCode?.toUpperCase();
  const canSave = !checking && !saving && code.trim().length >= 3 && isAvailable === true && !isCurrentCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f0c18] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
              <Hash size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Customize Access Code</h3>
              <p className="text-xs text-zinc-500 dark:text-gray-400">Set a memorable event join code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-gray-300 mb-1.5">
              Access Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                maxLength={16}
                placeholder="e.g. BWAI-26 or TANVI-WEDDING"
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-4 py-3 font-mono text-base font-semibold tracking-wider text-zinc-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-violet-400"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {checking && <Loader2 size={16} className="animate-spin text-zinc-400" />}
                {!checking && isAvailable === true && (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                )}
                {!checking && isAvailable === false && (
                  <AlertCircle size={18} className="text-red-500" />
                )}
              </div>
            </div>

            {/* Validation Message */}
            {validationMessage && (
              <p className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${
                isAvailable === true 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : isAvailable === false 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-zinc-500 dark:text-gray-400'
              }`}>
                {validationMessage}
              </p>
            )}
          </div>

          {/* Guidelines Box */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3.5 text-xs text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
              Guidelines:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-600 dark:text-gray-300">
              <li>Length between 3 and 16 characters</li>
              <li>Only uppercase letters, digits, and single hyphens (e.g. <code>BWAI-26</code>, <code>TANVI-WEDDING</code>)</li>
              <li>Must be unique across active events</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Access Code'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
