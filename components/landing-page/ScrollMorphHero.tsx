"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import Link from "next/link";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({
    src,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    return (
        <motion.div
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 40,
                damping: 15,
            }}
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gray-800"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={src}
                        alt={`event-photo-${index}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent" />
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-violet-900 to-indigo-900 flex flex-col items-center justify-center p-4 border border-violet-500/30"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-violet-300 uppercase tracking-widest mb-1">QuickSnap</p>
                        <p className="text-xs font-medium text-white">Your Photo</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Main Hero Component ---
const TOTAL_IMAGES = 20;
const MAX_SCROLL = 3000;

// Event photography themed images
const IMAGES = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=80",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&q=80",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=300&q=80",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=300&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80",
    "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=300&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300&q=80",
    "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=300&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80",
    "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=300&q=80",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=300&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&q=80",
    "https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=300&q=80",
    "https://images.unsplash.com/photo-1508997449629-303059a039c0?w=300&q=80",
];

// Helper for linear interpolation
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export interface ScrollMorphHeroProps {
    signupHref?: string;
    loginHref?: string;
}

export function ScrollMorphHero({
    signupHref = '/register',
    loginHref = '/login'
}: ScrollMorphHeroProps) {
    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Container Size ---
    useEffect(() => {
        if (!containerRef.current) return;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);

        setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        });

        return () => observer.disconnect();
    }, []);

    // --- Virtual Scroll Logic ---
    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);
    const [animationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // If animation is complete and user scrolls down, let page scroll naturally
            if (animationComplete && e.deltaY > 0) {
                return; // Don't prevent default - let page scroll
            }

            // If at top of page and scrolling up into hero, capture scroll again
            if (animationComplete && e.deltaY < 0 && window.scrollY === 0) {
                e.preventDefault();
                setAnimationComplete(false);
                scrollRef.current = MAX_SCROLL - 100;
                virtualScroll.set(scrollRef.current);
                return;
            }

            // During animation, capture all scroll
            if (!animationComplete) {
                e.preventDefault();
                const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
                scrollRef.current = newScroll;
                virtualScroll.set(newScroll);

                // Check if animation reached end
                if (newScroll >= MAX_SCROLL) {
                    setAnimationComplete(true);
                }
            }
        };

        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;

            // If animation complete and swiping down, let page scroll
            if (animationComplete && deltaY > 0) {
                return;
            }

            // If at top and swiping up, re-enter hero
            if (animationComplete && deltaY < 0 && window.scrollY === 0) {
                e.preventDefault();
                setAnimationComplete(false);
                scrollRef.current = MAX_SCROLL - 100;
                virtualScroll.set(scrollRef.current);
                return;
            }

            if (!animationComplete) {
                e.preventDefault();
                const newScroll = Math.min(Math.max(scrollRef.current + deltaY, 0), MAX_SCROLL);
                scrollRef.current = newScroll;
                virtualScroll.set(newScroll);

                if (newScroll >= MAX_SCROLL) {
                    setAnimationComplete(true);
                }
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("touchstart", handleTouchStart, { passive: false });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
        };
    }, [virtualScroll, animationComplete]);

    const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

    const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

    // --- Mouse Parallax ---
    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const normalizedX = (relativeX / rect.width) * 2 - 1;
            mouseX.set(normalizedX * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    // --- Intro Sequence ---
    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    // --- Random Scatter Positions ---
    const scatterPositions = useMemo(() => {
        return IMAGES.map(() => ({
            x: (Math.random() - 0.5) * 1500,
            y: (Math.random() - 0.5) * 1000,
            rotation: (Math.random() - 0.5) * 180,
            scale: 0.6,
            opacity: 0,
        }));
    }, []);

    // --- Render Loop ---
    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);
    const [parallaxValue, setParallaxValue] = useState(0);

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
        const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
        const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
        return () => {
            unsubscribeMorph();
            unsubscribeRotate();
            unsubscribeParallax();
        };
    }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

    // --- Content Opacity ---
    const contentOpacity = useTransform(smoothMorph, [0.7, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.7, 1], [40, 0]);

    // Bottom content fades in after arc is formed
    const bottomContentOpacity = useTransform(smoothMorph, [0.85, 1], [0, 1]);
    const bottomContentY = useTransform(smoothMorph, [0.85, 1], [30, 0]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

            {/* Container */}
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

                {/* Intro Text (Fades out) - Centered in viewport */}
                <motion.div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none px-6"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: introPhase === "circle" && morphValue < 0.5 ? 1 - morphValue * 2 : 0
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={introPhase === "circle" ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-white leading-tight text-center">
                            Your Photos,
                            <br />
                            <span className="text-violet-400">Delivered Instantly</span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={introPhase === "circle" ? { opacity: 0.6 } : { opacity: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="mt-6 text-[10px] md:text-xs font-medium tracking-[0.3em] text-violet-300/60 uppercase"
                        >
                            ↓ Scroll
                        </motion.p>
                    </motion.div>
                </motion.div>

                {/* Arc Active Content (Fades in) - Centered in top area */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center text-center pointer-events-auto px-6 pt-24 md:pt-28"
                >
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-6 flex items-center justify-center gap-3">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-400/50" />
                            <span className="text-xs font-medium tracking-[0.2em] text-violet-400 uppercase">QuickSnap</span>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-400/50" />
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-6 leading-tight">
                            No Hustle.
                            <br />
                            <span className="text-violet-400">Just One Click.</span>
                        </h2>
                        <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-light mb-8">
                            Get your event photos instantly with AI-powered face recognition.
                            Find yourself in thousands of photos within seconds.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                href={signupHref}
                                className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium tracking-wider transition-all border border-violet-500"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href={loginHref}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-medium tracking-wider transition-all border border-white/10"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Stats/Features - Fills space below arc */}
                <motion.div
                    style={{ opacity: bottomContentOpacity, y: bottomContentY }}
                    className="absolute bottom-0 left-0 right-0 z-10 pointer-events-auto"
                >
                    {/* Feature Highlights Row */}
                    <div className="border-t border-white/5 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm">
                        <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                                <div className="text-center">
                                    <div className="mb-2 flex justify-center">
                                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs md:text-sm text-white/60 font-light tracking-wide">Instant Delivery</p>
                                </div>
                                <div className="text-center">
                                    <div className="mb-2 flex justify-center">
                                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs md:text-sm text-white/60 font-light tracking-wide">AI Face Match</p>
                                </div>
                                <div className="text-center">
                                    <div className="mb-2 flex justify-center">
                                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs md:text-sm text-white/60 font-light tracking-wide">Secure & Private</p>
                                </div>
                                <div className="text-center">
                                    <div className="mb-2 flex justify-center">
                                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs md:text-sm text-white/60 font-light tracking-wide">Cloud Storage</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Scrolling Indicator */}
                    {animationComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
                        >
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </motion.div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Main Container for Photos */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

                        if (introPhase === "scatter") {
                            target = scatterPositions[i];
                        } else if (introPhase === "line") {
                            const lineSpacing = 70;
                            const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
                            const lineX = i * lineSpacing - lineTotalWidth / 2;
                            target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
                        } else {
                            const isMobile = containerSize.width < 768;
                            const minDimension = Math.min(containerSize.width, containerSize.height);

                            const circleRadius = Math.min(minDimension * 0.3, 280);

                            const circleAngle = (i / TOTAL_IMAGES) * 360;
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = {
                                x: Math.cos(circleRad) * circleRadius,
                                y: Math.sin(circleRad) * circleRadius,
                                rotation: circleAngle + 90,
                            };

                            // Adjusted arc to sit in the middle area
                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.2);
                            const arcRadius = baseRadius * (isMobile ? 1.0 : 0.85);

                            // Move arc center up to leave room for bottom content
                            const arcApexY = containerSize.height * (isMobile ? 0.15 : 0.08);
                            const arcCenterY = arcApexY + arcRadius;

                            const spreadAngle = isMobile ? 90 : 110;
                            const startAngle = -90 - (spreadAngle / 2);
                            const step = spreadAngle / (TOTAL_IMAGES - 1);

                            const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);

                            const maxRotation = spreadAngle * 0.8;
                            const boundedRotation = -scrollProgress * maxRotation;

                            const currentArcAngle = startAngle + (i * step) + boundedRotation;
                            const arcRad = (currentArcAngle * Math.PI) / 180;

                            const arcPos = {
                                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                                rotation: currentArcAngle + 90,
                                scale: isMobile ? 1.3 : 1.6,
                            };

                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(1, arcPos.scale, morphValue),
                                opacity: 1,
                            };
                        }

                        return (
                            <FlipCard
                                key={i}
                                src={src}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase}
                                target={target}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ScrollMorphHero;

