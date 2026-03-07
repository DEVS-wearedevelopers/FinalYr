"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const reviewSteps = [
    { label: "Checking MDCN Database", detail: "Cross-referencing director folio number" },
    { label: "Verifying Documents", detail: "Scanning operating license & ID" },
    { label: "Pending Admin Review", detail: "Queued for manual verification" },
];

// Phase transitions over ~2 minutes: 0→1 at 40s, 1→2 at 90s
const PHASE_TIMINGS = [40_000, 90_000];

export default function ApplicationUnderReview() {
    const [phase, setPhase] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
        const t1 = setTimeout(() => setPhase(1), PHASE_TIMINGS[0]);
        const t2 = setTimeout(() => setPhase(2), PHASE_TIMINGS[1]);
        return () => { clearInterval(tick); clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const totalSec = 120;
    const progressPct = Math.min((elapsed / totalSec) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-16">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#1e52f1] to-[#123bb5] px-8 pt-10 pb-14 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                    />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Application Under Review</h1>
                        <p className="text-white/80 text-sm leading-relaxed">
                            Your institution registration is being processed through our verification pipeline.
                        </p>
                        {/* Progress bar */}
                        <div className="mt-4 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-8 -mt-6 relative z-10">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        {reviewSteps.map((step, idx) => {
                            const isDone = idx < phase;
                            const isActive = idx === phase;
                            const isPending = idx > phase;
                            return (
                                <div key={step.label} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${isActive ? "bg-blue-50 border border-blue-100" : ""}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${isDone ? "bg-green-100" : isActive ? "bg-[#1e52f1]" : "bg-slate-100"}`}>
                                        {isDone ? (
                                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : isActive ? (
                                            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${isDone ? "text-green-700" : isActive ? "text-[#1e52f1]" : "text-slate-400"}`}>{step.label}</p>
                                        <p className={`text-xs mt-0.5 ${isDone ? "text-green-600/70" : isActive ? "text-[#1e52f1]/70" : "text-slate-300"}`}>{step.detail}</p>
                                    </div>
                                    {isDone && <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">Done</span>}
                                    {isActive && <span className="text-xs font-medium text-[#1e52f1] bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 animate-pulse">Active</span>}
                                    {isPending && <span className="text-xs font-medium text-slate-300 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">Pending</span>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Activation Timeline</p>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                You will receive an activation email within <strong>24–48 hours</strong> once your application has been reviewed. Please check your institutional inbox.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Application locked — no modifications allowed during review.
                    </div>
                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm font-semibold text-[#1e52f1] hover:underline">← Back to Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
