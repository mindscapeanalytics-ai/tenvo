'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * LiquidLayout Component
 * Provides a premium, glassmorphic wrapper for "Award-Winning" sections.
 * Optimized for Tenvo 2026 High-Density/Busy Mode.
 */
export function LiquidLayout({
    children,
    className,
    variant = 'default', // 'default' | 'glass' | 'busy'
    stagger = 0.1,
    showGrain = true
}) {
    const variants = {
        initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
        animate: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1], // Custom "Liquid" cubic-bezier
                staggerChildren: stagger
            }
        },
        exit: { opacity: 0, scale: 0.95, filter: 'blur(5px)' }
    };

    const variantStyles = {
        default: "bg-white/70 dark:bg-slate-900/70",
        glass: "bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]",
        busy: "bg-slate-50/90 dark:bg-slate-900/90 border-b-4 border-indigo-500 shadow-xl"
    };

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] p-6 lg:p-8",
                variantStyles[variant],
                className
            )}
        >
            {/* Premium Texture Overlay */}
            {showGrain && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />
            )}

            {/* Content Container */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* Subtle Bottom Glow for 'Liquid' feel */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        </motion.div>
    );
}

/**
 * LiquidItem - Staggered Child
 */
export function LiquidItem({ children, className, delay = 0 }) {
    return (
        <motion.div
            variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 }
            }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
