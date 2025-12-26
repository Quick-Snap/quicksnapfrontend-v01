"use client";

import { Zap, Shield, Users, ScanFace, Upload } from "lucide-react";
import { GlowingEffect } from "./GlowingEffect";
import { cn } from "@/lib/utils";

export function FeaturesGrid() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Zap className="h-4 w-4 text-violet-400" />}
        title="Instant Photo Delivery"
        description="Get your event photos in real-time, not days later. No more waiting around."
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<ScanFace className="h-4 w-4 text-violet-400" />}
        title="AI Face Recognition"
        description="Find yourself in thousands of photos with just a single selfie. Our AI does the work."
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Shield className="h-4 w-4 text-violet-400" />}
        title="Secure & Private"
        description="Your photos are encrypted and stored securely. Only you control who sees them."
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Upload className="h-4 w-4 text-violet-400" />}
        title="Cloud-Based Platform"
        description="Access your photos from anywhere, on any device. Always available, always fast."
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Users className="h-4 w-4 text-violet-400" />}
        title="Real-Time Guest Sharing"
        description="Guests can share and access photos instantly during events. No app downloads required."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-white/5 bg-[#111111] p-6 shadow-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-white/10 bg-white/5 p-2.5">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-lg leading-tight font-medium tracking-tight md:text-xl text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed md:text-base text-white/50 font-light">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default FeaturesGrid;

