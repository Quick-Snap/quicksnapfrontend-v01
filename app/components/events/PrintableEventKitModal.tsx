'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, QrCode, Layers, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface PrintableEventKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export default function PrintableEventKitModal({
  isOpen,
  onClose,
  event,
}: PrintableEventKitModalProps) {
  const [template, setTemplate] = useState<'standee' | 'tentCard'>('standee');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  const eventUrl =
    typeof window !== 'undefined' && event?._id
      ? `${window.location.origin}/events/${event._id}`
      : `https://roopixo.com/events/${event?._id || ''}`;

  const accessCode = event?.accessCode || '';
  const eventName = event?.name || 'Event Gallery';
  const venue = event?.venue || event?.location || 'Venue TBA';
  const dateStr = event?.startDate
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  useEffect(() => {
    if (isOpen && eventUrl) {
      QRCode.toDataURL(eventUrl, {
        width: 1024,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: any) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, eventUrl]);

  if (!isOpen || !event) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success('Event link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = async () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      if (template === 'standee') {
        canvas.width = 1200;
        canvas.height = 1697; // A4 ratio @ ~150 DPI

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1697);
        bgGrad.addColorStop(0, '#faf5ff');
        bgGrad.addColorStop(0.3, '#ffffff');
        bgGrad.addColorStop(1, '#f5f3ff');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1697);

        // Header Brand Banner
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(100, 80, 1000, 70, 35);
        } else {
          ctx.rect(100, 80, 1000, 70);
        }
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ ROOPIXO LIVE EVENT GALLERY', 600, 124);

        // Event Name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 54px sans-serif';
        ctx.textAlign = 'center';
        const maxNameWidth = 1000;
        let displayName = eventName;
        if (ctx.measureText(displayName).width > maxNameWidth) {
          displayName = displayName.slice(0, 32) + '...';
        }
        ctx.fillText(displayName, 600, 240);

        // Date and Venue
        ctx.fillStyle = '#64748b';
        ctx.font = '500 28px sans-serif';
        ctx.fillText((dateStr ? dateStr + ' • ' : '') + venue, 600, 290);

        // Call to action
        ctx.fillStyle = '#4338ca';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Find Your Photos Instantly with AI', 600, 370);

        ctx.fillStyle = '#6b7280';
        ctx.font = '24px sans-serif';
        ctx.fillText('Point your phone camera at the QR code below', 600, 415);

        // QR Code Card Frame
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(79, 70, 229, 0.15)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(250, 470, 700, 700, 40);
        } else {
          ctx.rect(250, 470, 700, 700);
        }
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Border around QR
        ctx.strokeStyle = '#e0e7ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(250, 470, 700, 700, 40);
        } else {
          ctx.rect(250, 470, 700, 700);
        }
        ctx.stroke();

        // Draw QR Image
        if (qrDataUrl) {
          const img = new Image();
          img.src = qrDataUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          ctx.drawImage(img, 290, 510, 620, 620);
        }

        // Access Code Pill
        if (accessCode) {
          ctx.fillStyle = '#eef2ff';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(320, 1205, 560, 80, 24);
          } else {
            ctx.rect(320, 1205, 560, 80);
          }
          ctx.fill();
          ctx.strokeStyle = '#c7d2fe';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#3730a3';
          ctx.font = 'bold 32px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('EVENT CODE: ' + accessCode, 600, 1256);
        }

        // 3 Simple Steps
        const stepsY = accessCode ? 1340 : 1260;
        const colWidth = 320;
        const steps = [
          { num: '1', title: 'Scan QR', desc: 'Open camera & scan' },
          { num: '2', title: 'Take Selfie', desc: 'Let AI learn your face' },
          { num: '3', title: 'Get Photos', desc: 'View & download yours' },
        ];

        steps.forEach((s, i) => {
          const x = 120 + i * (colWidth + 40);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(x, stepsY, colWidth, 190, 24);
          } else {
            ctx.rect(x, stepsY, colWidth, 190);
          }
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Step circle
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(x + colWidth / 2, stepsY + 45, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(s.num, x + colWidth / 2, stepsY + 54);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(s.title, x + colWidth / 2, stepsY + 115);

          ctx.fillStyle = '#64748b';
          ctx.font = '18px sans-serif';
          ctx.fillText(s.desc, x + colWidth / 2, stepsY + 150);
        });

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Powered by Roopixo • Real-time AI Face Recognition', 600, 1630);
      } else {
        // Tent Card Horizontal Fold layout (1600 x 1130)
        canvas.width = 1600;
        canvas.height = 1130;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1600, 1130);

        // Fold line down middle
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(800, 0);
        ctx.lineTo(800, 1130);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render Panel Function
        const renderPanel = async (startX: number, panelWidth: number) => {
          const centerX = startX + panelWidth / 2;

          // Header Badge
          ctx.fillStyle = '#e0e7ff';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(centerX - 180, 70, 360, 48, 24);
          } else {
            ctx.rect(centerX - 180, 70, 360, 48);
          }
          ctx.fill();
          ctx.fillStyle = '#3730a3';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✨ ROOPIXO LIVE GALLERY', centerX, 101);

          // Title
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 34px sans-serif';
          ctx.fillText(eventName.length > 25 ? eventName.slice(0, 25) + '...' : eventName, centerX, 175);

          ctx.fillStyle = '#64748b';
          ctx.font = '20px sans-serif';
          ctx.fillText('Scan QR to get your photos', centerX, 215);

          // QR Box
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(centerX - 240, 260, 480, 480, 32);
          } else {
            ctx.rect(centerX - 240, 260, 480, 480);
          }
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (qrDataUrl) {
            const img = new Image();
            img.src = qrDataUrl;
            await new Promise((resolve) => {
              img.onload = resolve;
            });
            ctx.drawImage(img, centerX - 210, 290, 420, 420);
          }

          // Code Pill
          if (accessCode) {
            ctx.fillStyle = '#ede9fe';
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(centerX - 200, 770, 400, 60, 18);
            } else {
              ctx.rect(centerX - 200, 770, 400, 60);
            }
            ctx.fill();
            ctx.fillStyle = '#5b21b6';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CODE: ' + accessCode, centerX, 808);
          }

          // Instructions
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('1. Scan QR  •  2. Selfie  •  3. Get Photos', centerX, 880);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '16px sans-serif';
          ctx.fillText('roopixo.com', centerX, 930);
        };

        await renderPanel(0, 800);
        await renderPanel(800, 800);

        // Fold instruction indicator
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✂️ Cut & Fold in Middle to stand on table', 800, 1100);
      }

      // Download trigger
      const link = document.createElement('a');
      const safeTitle = eventName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
      link.download = `roopixo-${template}-${safeTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('High-resolution print PNG downloaded!');
    } catch (err) {
      console.error('Failed to generate image:', err);
      toast.error('Failed to download image. Try printing instead.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <>
      {/* SCREEN MODAL */}
      <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121020] overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  1-Click Printable Event Kit & Standee
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ready-to-print posters & tent cards for your venue tables & entrance
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-6 py-3 dark:border-white/5 dark:bg-white/[0.02] shrink-0">
            {/* Format selector */}
            <div className="flex items-center rounded-xl bg-zinc-200/70 p-1 dark:bg-white/10">
              <button
                type="button"
                onClick={() => setTemplate('standee')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  template === 'standee'
                    ? 'bg-white text-violet-700 shadow-sm dark:bg-violet-600 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                A4 Entrance Standee (Vertical)
              </button>
              <button
                type="button"
                onClick={() => setTemplate('tentCard')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  template === 'tentCard'
                    ? 'bg-white text-violet-700 shadow-sm dark:bg-violet-600 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                A5 Table Tent Card (Foldable)
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>

              <button
                type="button"
                disabled={isGeneratingPng}
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
              >
                <Download size={14} />
                {isGeneratingPng ? 'Generating...' : 'Download High-Res PNG'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/25 hover:brightness-105"
              >
                <Printer size={14} />
                Print / Save as PDF
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-100/70 dark:bg-[#0b0a14] flex justify-center items-start">
            {template === 'standee' ? (
              /* A4 Vertical Preview */
              <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl border border-zinc-200 text-zinc-900 transition-all">
                {/* Brand header */}
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-violet-800">
                  <Sparkles size={13} />
                  Roopixo Live Event Gallery
                </div>

                {/* Event Name */}
                <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                  {eventName}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {dateStr && <span>{dateStr} • </span>}
                  <span>{venue}</span>
                </p>

                {/* Subtitle */}
                <div className="mt-5 rounded-xl bg-violet-50/70 py-2 px-3 border border-violet-100">
                  <p className="text-sm font-bold text-violet-900">
                    Find Your Photos Instantly with AI
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Scan the QR code below using your phone camera
                  </p>
                </div>

                {/* QR Code */}
                <div className="mt-5 mx-auto flex h-60 w-60 items-center justify-center rounded-2xl border-2 border-indigo-100 bg-white p-3 shadow-inner">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Event QR Code" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-zinc-100 rounded-xl" />
                  )}
                </div>

                {/* Join Code */}
                {accessCode && (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 py-2 px-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                      Join / Access Code
                    </p>
                    <p className="font-mono text-xl font-extrabold tracking-widest text-violet-950">
                      {accessCode}
                    </p>
                  </div>
                )}

                {/* 3 Steps */}
                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-5 text-center">
                  <div className="rounded-xl bg-zinc-50 p-2.5">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white mb-1.5">
                      1
                    </div>
                    <p className="text-xs font-bold text-zinc-900">Scan QR</p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">With phone camera</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-2.5">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white mb-1.5">
                      2
                    </div>
                    <p className="text-xs font-bold text-zinc-900">Take Selfie</p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">AI learns face</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-2.5">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white mb-1.5">
                      3
                    </div>
                    <p className="text-xs font-bold text-zinc-900">Get Photos</p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">Instantly curated</p>
                  </div>
                </div>

                <p className="mt-4 text-[10px] text-zinc-400">
                  Powered by Roopixo • Real-time AI Face Recognition
                </p>
              </div>
            ) : (
              /* A5 Tent Card Horizontal Preview */
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-zinc-200 text-zinc-900">
                <div className="grid grid-cols-2 gap-6 relative">
                  {/* Fold line marker */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-zinc-300 flex flex-col items-center justify-center">
                    <span className="rotate-90 text-[10px] font-medium text-zinc-400 bg-white px-2 py-0.5 rounded">
                      ✂️ Fold Here
                    </span>
                  </div>

                  {/* Left Side */}
                  <div className="text-center pr-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800">
                      <Sparkles size={11} />
                      Roopixo
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-zinc-900 truncate">{eventName}</h3>
                    <p className="text-[11px] text-zinc-500">Scan to get your photos</p>
                    <div className="mt-3 mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-indigo-100 bg-white p-2">
                      {qrDataUrl && <img src={qrDataUrl} alt="QR" className="h-full w-full object-contain" />}
                    </div>
                    {accessCode && (
                      <p className="mt-2 font-mono text-xs font-bold text-violet-900">
                        Code: {accessCode}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-zinc-400">1. Scan • 2. Selfie • 3. Photos</p>
                  </div>

                  {/* Right Side */}
                  <div className="text-center pl-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800">
                      <Sparkles size={11} />
                      Roopixo
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-zinc-900 truncate">{eventName}</h3>
                    <p className="text-[11px] text-zinc-500">Scan to get your photos</p>
                    <div className="mt-3 mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-indigo-100 bg-white p-2">
                      {qrDataUrl && <img src={qrDataUrl} alt="QR" className="h-full w-full object-contain" />}
                    </div>
                    {accessCode && (
                      <p className="mt-2 font-mono text-xs font-bold text-violet-900">
                        Code: {accessCode}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-zinc-400">1. Scan • 2. Selfie • 3. Photos</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS CONTAINER (Clean 1-page output when user clicks Print / Save as PDF) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @page {
            size: ${template === 'standee' ? 'A4 portrait' : 'A5 landscape'};
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
        `,
          }}
        />

        {template === 'standee' ? (
          <div className="h-full flex flex-col justify-between items-center text-center p-6 border-4 border-indigo-600 rounded-3xl">
            <div>
              <div className="inline-block bg-indigo-600 text-white font-bold text-sm tracking-widest px-6 py-2 rounded-full uppercase mb-4">
                ✨ ROOPIXO LIVE EVENT GALLERY
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                {eventName}
              </h1>
              <p className="text-base text-gray-600 font-medium">
                {dateStr && <span>{dateStr} • </span>}
                <span>{venue}</span>
              </p>
            </div>

            <div className="my-6 flex flex-col items-center">
              <div className="bg-indigo-50 border border-indigo-200 px-6 py-2 rounded-xl mb-4">
                <p className="text-lg font-bold text-indigo-900">Find Your Photos Instantly with AI</p>
                <p className="text-xs text-gray-600">Scan with your phone camera</p>
              </div>

              <div className="w-72 h-72 border-2 border-gray-300 p-3 rounded-2xl bg-white shadow-md">
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />}
              </div>

              {accessCode && (
                <div className="mt-4 bg-gray-100 border border-gray-300 px-6 py-2 rounded-xl">
                  <span className="text-xs uppercase font-semibold text-gray-500 mr-2">Access Code:</span>
                  <span className="font-mono text-2xl font-black text-gray-900 tracking-widest">{accessCode}</span>
                </div>
              )}
            </div>

            <div className="w-full">
              <div className="grid grid-cols-3 gap-4 border-t-2 border-gray-200 pt-4 mb-4 text-center">
                <div className="border border-gray-200 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs mx-auto mb-1 flex items-center justify-center">
                    1
                  </div>
                  <p className="font-bold text-xs">Scan QR</p>
                  <p className="text-[10px] text-gray-500">Open phone camera</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs mx-auto mb-1 flex items-center justify-center">
                    2
                  </div>
                  <p className="font-bold text-xs">Take Selfie</p>
                  <p className="text-[10px] text-gray-500">One-time face scan</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs mx-auto mb-1 flex items-center justify-center">
                    3
                  </div>
                  <p className="font-bold text-xs">Get Photos</p>
                  <p className="text-[10px] text-gray-500">Curated in seconds</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Powered by Roopixo • roopixo.com</p>
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-2 gap-8 border-4 border-indigo-600 rounded-3xl p-6 relative">
            <div className="absolute top-0 bottom-0 left-1/2 border-r-2 border-dashed border-gray-300" />

            {/* Left Tent */}
            <div className="flex flex-col justify-between items-center text-center pr-4">
              <div>
                <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase">✨ ROOPIXO</p>
                <h2 className="text-2xl font-black text-gray-900">{eventName}</h2>
                <p className="text-xs text-gray-500">Scan to get your photos</p>
              </div>
              <div className="w-48 h-48 border border-gray-300 p-2 rounded-xl bg-white my-3">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
              </div>
              {accessCode && (
                <p className="font-mono text-sm font-bold text-indigo-900">Code: {accessCode}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2">1. Scan • 2. Selfie • 3. Photos</p>
            </div>

            {/* Right Tent */}
            <div className="flex flex-col justify-between items-center text-center pl-4">
              <div>
                <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase">✨ ROOPIXO</p>
                <h2 className="text-2xl font-black text-gray-900">{eventName}</h2>
                <p className="text-xs text-gray-500">Scan to get your photos</p>
              </div>
              <div className="w-48 h-48 border border-gray-300 p-2 rounded-xl bg-white my-3">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />}
              </div>
              {accessCode && (
                <p className="font-mono text-sm font-bold text-indigo-900">Code: {accessCode}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2">1. Scan • 2. Selfie • 3. Photos</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
