'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  Layers,
  Wand2,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  ArrowRight,
  Eye,
  ShieldCheck,
  Download,
  AlertCircle,
  RefreshCw,
  Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Preset {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  previewBg: string;
}

const PRESETS: Preset[] = [
  {
    id: 'royal_golden',
    name: 'Royal Golden Hour',
    tagline: 'Warm candlelight highlights, rich skin tones, and deep contrast.',
    accentColor: 'from-amber-500 to-yellow-600',
    previewBg: 'bg-gradient-to-br from-amber-900/40 via-yellow-950/20 to-zinc-950'
  },
  {
    id: 'haldi_glow',
    name: 'Vibrant Haldi Glow',
    tagline: 'Turmeric yellows & warm marigolds with clean, unclipped whites.',
    accentColor: 'from-yellow-400 to-amber-500',
    previewBg: 'bg-gradient-to-br from-yellow-900/40 via-amber-950/20 to-zinc-950'
  },
  {
    id: 'pastel_reception',
    name: 'Pastel Reception',
    tagline: 'Editorial fine-art tone with soft highlights and cool teal shadows.',
    accentColor: 'from-rose-400 to-teal-400',
    previewBg: 'bg-gradient-to-br from-rose-950/30 via-slate-900/30 to-teal-950/30'
  },
  {
    id: 'timeless_bw',
    name: 'Timeless B&W',
    tagline: 'Velvety monochrome with rich midtones and glowing portraits.',
    accentColor: 'from-zinc-300 to-zinc-600',
    previewBg: 'bg-gradient-to-br from-zinc-800/40 via-zinc-900/30 to-black'
  }
];

export default function StudioFixerPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('royal_golden');
  const [colorStrength, setColorStrength] = useState<number>(85);
  const [enableCulling, setEnableCulling] = useState<boolean>(true);
  const [enableBlemish, setEnableBlemish] = useState<boolean>(true);
  const [enableSkinSmooth, setEnableSkinSmooth] = useState<boolean>(true);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [jobResults, setJobResults] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(selected);
      toast.success(`Selected ${selected.length} event photos for batch fix`);
    }
  };

  const handleStartFix = async () => {
    if (files.length === 0) {
      toast.error('Please select at least 2 photos to run batch fix');
      return;
    }

    setIsProcessing(true);
    setJobResults(null);

    // Simulate multi-stage pipeline progression
    setProgressStep('Stage 1/3: Analyzing sharpness and clustering burst duplicates...');
    await new Promise((r) => setTimeout(r, 1200));

    setProgressStep('Stage 2/3: Detecting eye openness & landmark-safe blemish inpainting...');
    await new Promise((r) => setTimeout(r, 1400));

    setProgressStep(`Stage 3/3: Applying 3D LUT (${selectedPreset}) & frequency skin polish...`);
    await new Promise((r) => setTimeout(r, 1200));

    // Calculate synthetic results for instant UI feedback
    const culledCount = Math.max(1, Math.round(files.length * 0.25));
    const blurryCount = Math.max(0, Math.round(files.length * 0.40));
    const blinkCount = Math.max(0, Math.round(files.length * 0.15));

    setJobResults({
      totalInput: files.length,
      culledWinners: culledCount,
      burstStacks: Math.max(1, Math.round(files.length / 3)),
      blurryRejected: blurryCount,
      blinksRejected: blinkCount,
      presetUsed: selectedPreset,
      timeSeconds: (files.length * 0.18 + 2.4).toFixed(1)
    });

    setIsProcessing(false);
    setProgressStep('');
    toast.success('Batch fix completed successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Roopixo AI Studio Engine
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          1-Click Event & Wedding <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">Batch Fixer</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl font-light">
          Upload 500+ raw burst shots. In minutes, Roopixo automatically filters out blinks, camera shake, and duplicates, smooths skin naturally, and applies cinematic color grading.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preset Selector */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3">
              1. Cinematic 3D Color Grade
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/10 shadow-sm ring-1 ring-violet-500/30'
                        : 'border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-50 dark:bg-white/[0.01]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 ${p.previewBg} border border-white/20`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">{p.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 line-clamp-1">{p.tagline}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Strength Slider */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5">
              <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium mb-1.5">
                <span>Grade Intensity</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">{colorStrength}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={colorStrength}
                onChange={(e) => setColorStrength(Number(e.target.value))}
                className="w-full accent-violet-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* AI Retouching & Culling Toggles */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              2. Smart AI Processing
            </label>

            {/* Smart Culling */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  Auto-Cull Burst Duplicates
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Picks sharpest eyes-open hero frame per burst</div>
              </div>
              <input
                type="checkbox"
                checked={enableCulling}
                onChange={(e) => setEnableCulling(e.target.checked)}
                className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
              />
            </div>

            {/* Safe Blemish Removal */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Safe Blemish Cleanup
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Protects bindis, nath, jewelry & beauty moles</div>
              </div>
              <input
                type="checkbox"
                checked={enableBlemish}
                onChange={(e) => setEnableBlemish(e.target.checked)}
                className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
              />
            </div>

            {/* Texture-Preserving Smoothing */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-fuchsia-500" />
                  Natural Skin Texture Smoothing
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Keeps 100% skin pores (no plastic face)</div>
              </div>
              <input
                type="checkbox"
                checked={enableSkinSmooth}
                onChange={(e) => setEnableSkinSmooth(e.target.checked)}
                className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Upload Zone & Processing Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Dropzone */}
          <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/15 bg-white dark:bg-white/[0.01] text-center flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden transition-all hover:border-violet-400">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              {files.length > 0 ? `${files.length} Event Photos Selected` : 'Drag & drop event photos here'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
              Supports JPEG, WebP, and high-res camera exports. Batch size up to 1,500 photos.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
              Browse Event Folder
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleStartFix}
            disabled={isProcessing || files.length === 0}
            className="w-full py-4 rounded-xl font-display text-sm font-bold tracking-wide text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-600/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Run 1-Click Batch Fixer ({files.length} Photos)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Live Progress Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{progressStep}</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </motion.div>
          )}

          {/* Execution Results View */}
          {jobResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Batch Fix Complete in {jobResults.timeSeconds}s</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Downloading Master Hero Album...')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-md hover:bg-emerald-500 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {jobResults.culledWinners} Hero Picks</span>
                </button>
              </div>

              {/* Stats Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 text-center">
                  <div className="text-xl font-black text-zinc-900 dark:text-white">{jobResults.totalInput}</div>
                  <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Input Photos</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-emerald-500/30 text-center">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{jobResults.culledWinners}</div>
                  <div className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Hero Picks</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 text-center">
                  <div className="text-xl font-black text-amber-500">{jobResults.blurryRejected}</div>
                  <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Blurry Discarded</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 text-center">
                  <div className="text-xl font-black text-rose-500">{jobResults.blinksRejected}</div>
                  <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Blinks Avoided</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
