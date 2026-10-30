"use client";

import { ScanFace, Tv, Camera, QrCode, UploadCloud, ShieldCheck } from "lucide-react";
import { GlowingEffect } from "./GlowingEffect";
import { cn } from "@/lib/utils";

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  description: string;
  area: string;
}

const FEATURES: FeatureCard[] = [
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <ScanFace className="h-5 w-5 text-violet-400" />,
    title: "⚡ Instant AI Face Matching",
    badge: "< 2s Speed",
    description: "Guests snap one selfie and find every single candid photo they appear in across thousands of high-res shots.",
  },
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <Tv className="h-5 w-5 text-fuchsia-400" />,
    title: "📺 Live Big-Screen Photo Wall",
    badge: "Audience Favorite",
    description: "Broadcast an elegant, real-time photo slideshow onto ballroom LED walls and TVs during receptions and ceremonies.",
  },
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <Camera className="h-5 w-5 text-indigo-400" />,
    title: "📸 Guest Candid Contributions",
    badge: "Interactive",
    description: "Attendees capture raw, spontaneous moments right from their smartphones and contribute to the official event gallery.",
  },
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <QrCode className="h-5 w-5 text-emerald-400" />,
    title: "📱 Zero-App Instant QR Join",
    badge: "No App Required",
    description: "Guests scan the table standee with their native phone camera to instantly search and contribute. Zero App Store downloads.",
  },
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <UploadCloud className="h-5 w-5 text-amber-400" />,
    title: "🎨 Studio Suite & Watermarking",
    badge: "For Photographers",
    description: "Dedicated photographer studio for high-speed batch uploads, custom watermark overlays, and automated client galleries.",
  },
  {
    area: "md:col-span-6 lg:col-span-4",
    icon: <ShieldCheck className="h-5 w-5 text-teal-400" />,
    title: "🔒 Biometric Privacy & PIN Lock",
    badge: "Encrypted",
    description: "No public search indexing. Biometric vectors are protected with bank-grade encryption and optional album PIN protection.",
  },
];

export function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
      {FEATURES.map((feature) => (
        <div key={feature.title} className={cn("min-h-[14rem]", feature.area)}>
          <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-xl border border-white/5 bg-[#10091d]/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-fit rounded-xl border border-white/10 bg-white/5 p-2.5">
                  {feature.icon}
                </div>
                {feature.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/[0.06] text-white/70 border border-white/10">
                    {feature.badge}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg leading-tight font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/50 font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeaturesGrid;
