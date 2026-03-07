"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/apiClient";

// ─── Constants ────────────────────────────────────────────────────────────────
const BLOCKED_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];
const CLEARANCE_LEVELS = [
    { value: "field_observer", label: "Field Observer", desc: "Ground-level surveillance and reporting" },
    { value: "verification_officer", label: "Verification Officer", desc: "Alert verification and case escalation" },
    { value: "regional_admin", label: "Regional Admin", desc: "Full regional oversight and coordination" },
];

// ─── Pending State ────────────────────────────────────────────────────────────
function PHOPendingState({ name }: { name: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 py-16">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 pt-10 pb-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                    />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
                        <p className="text-slate-400 text-sm">PHO Credential Verification</p>
                    </div>
                </div>

                <div className="px-8 py-8 space-y-5">
                    <div className="text-center">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Hello <span className="font-semibold text-slate-900">{name}</span>, your account has been created but access is currently <span className="font-semibold text-amber-600">pending approval</span>.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                            </svg>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                You will be notified via email once your credentials are verified by the System Administrator.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {[
                            { step: "1", label: "Account Created", done: true, desc: "Email & password registered in system" },
                            { step: "2", label: "EOC Admin Review", done: false, desc: "Credentials under verification" },
                            { step: "3", label: "MFA Binding", done: false, desc: "Biometric / authenticator setup on first login" },
                            { step: "4", label: "Dashboard Access", done: false, desc: "Full PHO access granted" },
                        ].map((item) => (
                            <div key={item.step} className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${item.done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                                    {item.done ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : item.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold ${item.done ? "text-green-700" : "text-slate-500"}`}>{item.label}</p>
                                    <p className="text-xs text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-3">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        No dashboard access until EOC Administrator approval is granted.
                    </div>

                    <div className="text-center pt-2">
                        <Link href="/login" className="text-sm font-semibold text-[#1e52f1] hover:underline">← Back to Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Field Components ─────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">{children}</label>;
}

function TextInput({ id, label, type = "text", placeholder, value, onChange, required, error, hint }: {
    id: string; label: string; type?: string; placeholder?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; error?: string; hint?: string;
}) {
    return (
        <div className="space-y-1">
            <FieldLabel htmlFor={id}>{label}{required && <span className="text-red-500 ml-1">*</span>}</FieldLabel>
            <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
            />
            {hint && !error && <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{hint}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
    const steps = [{ id: 1, label: "Identity" }, { id: 2, label: "Access" }];
    return (
        <div className="flex items-center justify-between w-full mb-9">
            {steps.map((s, idx) => {
                const done = s.id < current; const active = s.id === current;
                return (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${done ? "bg-[#1e52f1] border-[#1e52f1]" : active ? "bg-[#1e52f1] border-[#1e52f1] shadow-lg shadow-[#1e52f1]/30" : "bg-white border-slate-300"}`}>
                                {done ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    : <span className={`text-sm font-bold ${active ? "text-white" : "text-slate-400"}`}>{s.id}</span>}
                                {active && <span className="absolute inset-0 rounded-full bg-[#1e52f1] opacity-20 animate-ping" />}
                            </div>
                            <span className={`text-xs font-medium ${done || active ? "text-[#1e52f1]" : "text-slate-400"}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-3 mt-[-18px]">
                                <div className={`h-full rounded-full transition-all duration-500 ${s.id < current ? "bg-[#1e52f1]" : "bg-slate-200"}`} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: "", color: "bg-slate-200" },
        { label: "Weak", color: "bg-red-400" },
        { label: "Fair", color: "bg-amber-400" },
        { label: "Good", color: "bg-blue-400" },
        { label: "Strong", color: "bg-green-500" },
    ];
    return { score, ...map[score] };
}

// ─── Main PHO Screen ──────────────────────────────────────────────────────────
export default function PHORegisterScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");

    const [s1, setS1] = useState({ fullName: "", email: "", jurisdiction: "", clearanceLevel: "" });
    const [s2, setS2] = useState({ password: "", confirmPassword: "" });

    const strength = passwordStrength(s2.password);

    const validate1 = () => {
        const e: Record<string, string> = {};
        if (!s1.fullName.trim()) e.fullName = "Full name is required.";
        if (!s1.email.trim()) { e.email = "Email is required."; }
        else {
            const domain = s1.email.split("@")[1]?.toLowerCase();
            if (!domain || BLOCKED_DOMAINS.includes(domain)) e.email = "Only government or institutional emails are accepted.";
            else if (!s1.email.includes("@")) e.email = "Invalid email format.";
        }
        if (!s1.jurisdiction.trim()) e.jurisdiction = "Jurisdiction is required.";
        if (!s1.clearanceLevel) e.clearanceLevel = "Select a clearance level.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validate2 = () => {
        const e: Record<string, string> = {};
        if (s2.password.length < 8) e.password = "Password must be at least 8 characters.";
        else if (strength.score < 2) e.password = "Password is too weak. Add uppercase, numbers, or symbols.";
        if (s2.confirmPassword !== s2.password) e.confirmPassword = "Passwords do not match.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate1()) setStep(2); };
    const back = () => { setErrors({}); setStep(1); };

    const handleSubmit = async () => {
        if (!validate2()) return;
        setIsLoading(true);
        setApiError("");
        try {
            await apiClient.post("/auth/register", {
                email: s1.email,
                password: s2.password,
                role: "pho",
                firstName: s1.fullName.split(" ")[0],
                lastName: s1.fullName.split(" ").slice(1).join(" ") || "",
            });
            setSubmitted(true);
        } catch (err: any) {
            setApiError(err?.response?.data?.error || err?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) return <PHOPendingState name={s1.fullName.split(" ")[0]} />;

    const selectedClearance = CLEARANCE_LEVELS.find(c => c.value === s1.clearanceLevel);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans text-slate-900">

            {/* ── Brand Panel ── */}
            <div className="relative hidden md:flex flex-col flex-shrink-0 w-[320px] lg:w-[380px] bg-slate-900 text-white overflow-hidden p-10 justify-between">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <div className="w-8 h-8 bg-[#1e52f1] rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" /></svg>
                        </div>
                        MERMS
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            PHO Registration
                        </div>
                        <h1 className="text-3xl font-bold leading-tight mb-3">Public Health Officer Portal</h1>
                        <p className="text-slate-400 text-sm leading-relaxed">Restricted access for authorized government health officials only. All registrations are manually verified by the EOC System Administrator.</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { e: "🛡️", t: "EOC Verified", d: "Manual review by Emergency Operations Centre" },
                            { e: "🔐", t: "MFA Required", d: "Biometric or authenticator binding on first login" },
                            { e: "📡", t: "Alert Management", d: "Issue, escalate and resolve public health alerts" },
                        ].map(f => (
                            <div key={f.t} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                <span className="text-xl shrink-0">{f.e}</span>
                                <div><p className="text-sm font-semibold">{f.t}</p><p className="text-xs text-slate-500 mt-0.5">{f.d}</p></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 pt-5 border-t border-white/10 text-xs text-slate-600">© 2026 MERMS Platform — Restricted Portal</div>
            </div>

            {/* ── Form Panel ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-6 md:px-12 lg:px-16 py-10">
                <div className="w-full max-w-lg mx-auto">

                    {/* Mobile logo */}
                    <div className="md:hidden mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-[#1e52f1] tracking-tighter">
                            <div className="w-8 h-8 bg-[#1e52f1] rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" /></svg>
                            </div>
                            MERMS
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">PHO Registration</h2>
                        <p className="text-slate-500 mt-1 text-sm">
                            Step {step} of 2 — {step === 1 ? "Identity & Jurisdiction" : "Access Credentials"}
                        </p>
                    </div>

                    <Stepper current={step} />

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">

                        {/* STEP 1 */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100">
                                    <h3 className="text-lg font-bold">Identity & Jurisdiction</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Official government officer information only.</p>
                                </div>

                                <TextInput id="fullName" label="Full Name" placeholder="e.g. Dr. Ngozi Adeyemi"
                                    value={s1.fullName} onChange={e => setS1(p => ({ ...p, fullName: e.target.value }))} required error={errors.fullName} />

                                <TextInput id="email" label="Government / Institutional Email" type="email"
                                    placeholder="e.g. n.adeyemi@fmoh.gov.ng"
                                    value={s1.email} onChange={e => setS1(p => ({ ...p, email: e.target.value }))} required
                                    error={errors.email} hint="Gmail, Yahoo and personal email providers are not accepted." />

                                <TextInput id="jurisdiction" label="Assigned Jurisdiction"
                                    placeholder="e.g. Lagos State, Kano North LGA, FCT Abuja"
                                    value={s1.jurisdiction} onChange={e => setS1(p => ({ ...p, jurisdiction: e.target.value }))} required error={errors.jurisdiction} />

                                {/* Clearance Level */}
                                <div className="space-y-1.5">
                                    <FieldLabel htmlFor="clearanceLevel">Clearance Level <span className="text-red-500">*</span></FieldLabel>
                                    <div className="space-y-2">
                                        {CLEARANCE_LEVELS.map(c => (
                                            <label key={c.value}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${s1.clearanceLevel === c.value ? "bg-blue-50 border-[#1e52f1]/30" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${s1.clearanceLevel === c.value ? "border-[#1e52f1] bg-[#1e52f1]" : "border-slate-300 bg-white"}`}>
                                                    {s1.clearanceLevel === c.value && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-semibold ${s1.clearanceLevel === c.value ? "text-[#1e52f1]" : "text-slate-800"}`}>{c.label}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                                                </div>
                                                <input type="radio" className="sr-only" value={c.value} checked={s1.clearanceLevel === c.value}
                                                    onChange={() => setS1(p => ({ ...p, clearanceLevel: c.value }))} />
                                            </label>
                                        ))}
                                    </div>
                                    {errors.clearanceLevel && <p className="text-xs text-red-500">{errors.clearanceLevel}</p>}
                                </div>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100">
                                    <h3 className="text-lg font-bold">Access Credentials</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Set a strong password for your account.</p>
                                </div>

                                {/* Summary pill */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#1e52f1]/10 flex items-center justify-center text-[#1e52f1] shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{s1.fullName}</p>
                                        <p className="text-xs text-slate-500 truncate">{s1.email} · {selectedClearance?.label}</p>
                                    </div>
                                    <button type="button" onClick={back} className="text-xs text-[#1e52f1] font-semibold hover:underline shrink-0">Edit</button>
                                </div>

                                {/* Password */}
                                <div className="space-y-1">
                                    <FieldLabel htmlFor="password">Password <span className="text-red-500">*</span></FieldLabel>
                                    <input id="password" type="password" placeholder="Min. 8 characters" value={s2.password}
                                        onChange={e => setS2(p => ({ ...p, password: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl border text-slate-900 bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] ${errors.password ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
                                    />
                                    {s2.password && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                                                ))}
                                            </div>
                                            <span className={`text-xs font-semibold ${strength.score <= 1 ? "text-red-500" : strength.score === 2 ? "text-amber-500" : strength.score === 3 ? "text-blue-500" : "text-green-600"}`}>
                                                {strength.label}
                                            </span>
                                        </div>
                                    )}
                                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                                </div>

                                <div className="space-y-1">
                                    <FieldLabel htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></FieldLabel>
                                    <input id="confirmPassword" type="password" placeholder="Re-enter password" value={s2.confirmPassword}
                                        onChange={e => setS2(p => ({ ...p, confirmPassword: e.target.value }))}
                                        className={`w-full px-4 py-3 rounded-xl border text-slate-900 bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] ${errors.confirmPassword ? "border-red-400 bg-red-50" : s2.confirmPassword && s2.confirmPassword === s2.password ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}
                                    />
                                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                                </div>

                                {/* MFA Notice */}
                                <div className="bg-slate-900 rounded-2xl px-5 py-4 space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        <p className="text-sm font-bold text-white">Biometric / MFA Binding Required</p>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Upon first login after approval, you will be required to bind your account to a government-issued biometric token or an authenticator app (TOTP). This step cannot be skipped.
                                    </p>
                                </div>

                                {apiError && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{apiError}</div>
                                )}
                            </div>
                        )}

                        {/* ── Nav Buttons ── */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                            {step === 1 ? (
                                <Link href="/register" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    Change Role
                                </Link>
                            ) : (
                                <button type="button" onClick={back} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    Back
                                </button>
                            )}

                            {step === 1 ? (
                                <button type="button" onClick={next} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all shadow-sm hover:shadow-md hover:shadow-[#1e52f1]/25">
                                    Continue
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all shadow-sm hover:shadow-md hover:shadow-[#1e52f1]/25 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isLoading ? (
                                        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating account...</>
                                    ) : (
                                        <>Submit Registration <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Already registered?{" "}
                        <Link href="/login" className="text-[#1e52f1] font-semibold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
