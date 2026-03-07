"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ApplicationUnderReview from "./components/ApplicationUnderReview";
import ReviewStep from "./components/ReviewStep";
import type { NominatimAddress } from "./components/MapPicker";
import { institutionService } from "@/services/institutionService";

// Lazy-load the map (Leaflet is client-only)
const MapPicker = dynamic(() => import("./components/MapPicker"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step1 { facilityName: string; facilityType: string; registrationNumber: string }
interface Step2 { directorFullName: string; professionalFolioNumber: string; institutionalEmail: string; phoneNumber: string }
interface Step3 { streetAddress: string; city: string; state: string; lga: string; postalCode: string; latitude: number | null; longitude: number | null }
interface Step4 { operatingLicense: File | null; directorGovernmentId: File | null; dataSharingConsent: boolean; accountabilityClause: boolean }

const FACILITY_TYPES = ["General Hospital", "Teaching Hospital", "Specialist Hospital", "Primary Healthcare Centre", "Private Clinic", "Maternity Home", "Diagnostic Centre", "Rehabilitation Centre", "Dental Clinic", "Eye Clinic", "Other"];
const BLOCKED_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];
const STEPS = [{ id: 1, label: "Facility" }, { id: 2, label: "Director" }, { id: 3, label: "Location" }, { id: 4, label: "Documents" }, { id: 5, label: "Review" }];

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">{children}</label>;
}

function TextInput({ id, label, type = "text", placeholder, value, onChange, required, error }: {
    id: string; label: string; type?: string; placeholder?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; error?: string;
}) {
    return (
        <div className="space-y-1">
            <FieldLabel htmlFor={id}>{label}{required && <span className="text-red-500 ml-1">*</span>}</FieldLabel>
            <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 bg-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function SelectInput({ id, label, value, onChange, options, required }: {
    id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; required?: boolean;
}) {
    return (
        <div className="space-y-1">
            <FieldLabel htmlFor={id}>{label}{required && <span className="text-red-500 ml-1">*</span>}</FieldLabel>
            <div className="relative">
                <select id={id} value={value} onChange={onChange} required={required}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] hover:border-slate-300">
                    <option value="">Select facility type</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
    );
}

function FileUpload({ id, label, description, file, onChange, required, error }: {
    id: string; label: string; description: string; file: File | null; onChange: (f: File | null) => void; required?: boolean; error?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div className="space-y-1">
            <FieldLabel htmlFor={id}>{label}{required && <span className="text-red-500 ml-1">*</span>}</FieldLabel>
            <input ref={ref} id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => ref.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl px-6 py-7 flex flex-col items-center gap-2.5 text-sm transition-all group ${file ? "border-[#1e52f1] bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-[#1e52f1]/50 hover:bg-blue-50/40"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file ? "bg-[#1e52f1]/10 text-[#1e52f1]" : "bg-slate-100 text-slate-400 group-hover:bg-[#1e52f1]/10 group-hover:text-[#1e52f1]"} transition-colors`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={file ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"} />
                    </svg>
                </div>
                {file ? (
                    <div className="text-center"><p className="font-semibold text-[#1e52f1]">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · <span className="underline">Replace</span></p></div>
                ) : (
                    <div className="text-center"><p className="font-semibold text-slate-700 group-hover:text-[#1e52f1]">Click to upload</p><p className="text-xs text-slate-400">{description}</p></div>
                )}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function Checkbox({ checked, onChange, label, detail, error }: {
    checked: boolean; onChange: (v: boolean) => void; label: string; detail: string; error?: string;
}) {
    return (
        <div>
            <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${checked ? "bg-blue-50 border-[#1e52f1]/30" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-[#1e52f1] border-[#1e52f1]" : "bg-white border-slate-300"}`}>
                    {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p></div>
                <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            </label>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-between w-full mb-10">
            {STEPS.map((step, idx) => {
                const done = step.id < current; const active = step.id === current;
                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-1.5 min-w-0">
                            <div className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${done ? "bg-[#1e52f1] border-[#1e52f1]" : active ? "bg-[#1e52f1] border-[#1e52f1] shadow-lg shadow-[#1e52f1]/30" : "bg-white border-slate-300"}`}>
                                {done ? (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <span className={`text-xs font-bold ${active ? "text-white" : "text-slate-400"}`}>{step.id}</span>
                                )}
                                {active && <span className="absolute inset-0 rounded-full bg-[#1e52f1] opacity-20 animate-ping" />}
                            </div>
                            <span className={`text-xs font-medium ${done || active ? "text-[#1e52f1]" : "text-slate-400"}`}>{step.label}</span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1.5 mt-[-18px]">
                                <div className={`h-full rounded-full transition-all duration-500 ${step.id < current ? "bg-[#1e52f1]" : "bg-slate-200"}`} />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InstitutionRegisterScreen() {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [s1, setS1] = useState<Step1>({ facilityName: "", facilityType: "", registrationNumber: "" });
    const [s2, setS2] = useState<Step2>({ directorFullName: "", professionalFolioNumber: "", institutionalEmail: "", phoneNumber: "" });
    const [s3, setS3] = useState<Step3>({ streetAddress: "", city: "", state: "", lga: "", postalCode: "", latitude: null, longitude: null });
    const [s4, setS4] = useState<Step4>({ operatingLicense: null, directorGovernmentId: null, dataSharingConsent: false, accountabilityClause: false });

    // ── Map handler: reverse-geocode auto-fills address boxes ─────────────────
    const handleMapPick = useCallback((lat: number, lng: number, addr: NominatimAddress) => {
        setS3(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            streetAddress: [addr.road, addr.suburb].filter(Boolean).join(", ") || prev.streetAddress,
            city: addr.city || addr.town || addr.village || prev.city,
            state: addr.state || prev.state,
            lga: addr.county || prev.lga,
            postalCode: addr.postcode || prev.postalCode,
        }));
    }, []);

    // ── Validation ─────────────────────────────────────────────────────────────
    const validate = useCallback((which: number): boolean => {
        const e: Record<string, string> = {};
        if (which === 1) {
            if (!s1.facilityName.trim()) e.facilityName = "Required.";
            if (!s1.facilityType) e.facilityType = "Required.";
            if (!s1.registrationNumber.trim()) e.registrationNumber = "Required.";
        }
        if (which === 2) {
            if (!s2.directorFullName.trim()) e.directorFullName = "Required.";
            if (!s2.professionalFolioNumber.trim()) e.professionalFolioNumber = "Required.";
            if (!s2.institutionalEmail.trim()) { e.institutionalEmail = "Required."; }
            else { const d = s2.institutionalEmail.split("@")[1]?.toLowerCase(); if (!d || BLOCKED_DOMAINS.includes(d)) e.institutionalEmail = "Personal emails (Gmail, Yahoo, etc.) are not accepted."; }
            if (!s2.phoneNumber.trim()) e.phoneNumber = "Required.";
        }
        if (which === 3) {
            if (!s3.streetAddress.trim()) e.streetAddress = "Required.";
            if (!s3.city.trim()) e.city = "Required.";
            if (!s3.state.trim()) e.state = "Required.";
            if (!s3.lga.trim()) e.lga = "Required.";
            if (s3.latitude === null) e.map = "Pin your location on the map.";
        }
        if (which === 4) {
            if (!s4.operatingLicense) e.operatingLicense = "Required.";
            if (!s4.directorGovernmentId) e.directorGovernmentId = "Required.";
            if (!s4.dataSharingConsent) e.dataSharingConsent = "Required.";
            if (!s4.accountabilityClause) e.accountabilityClause = "Required.";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [s1, s2, s3, s4]);

    const next = () => { if (validate(step)) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };
    const editStep = (n: number) => { setErrors({}); setStep(n); };

    const handleSubmit = async () => {
        setIsLoading(true);
        setSubmitError("");
        try {
            await institutionService.submitRegistration({
                facility_name: s1.facilityName,
                facility_type: s1.facilityType,
                registration_number: s1.registrationNumber,
                director_full_name: s2.directorFullName,
                professional_folio_number: s2.professionalFolioNumber,
                institutional_email: s2.institutionalEmail,
                phone_number: s2.phoneNumber,
                street_address: s3.streetAddress || null,
                city: s3.city || null,
                state: s3.state || null,
                lga: s3.lga || null,
                postal_code: s3.postalCode || null,
                latitude: s3.latitude,
                longitude: s3.longitude,
                data_sharing_consent: s4.dataSharingConsent,
                accountability_clause: s4.accountabilityClause,
            });
            setSubmitted(true);
        } catch (err: any) {
            setSubmitError(err?.response?.data?.error || err?.message || "Submission failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) return <ApplicationUnderReview />;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans text-slate-900">

            {/* ── Brand panel ── */}
            <div className="relative hidden md:flex flex-col flex-shrink-0 w-[320px] lg:w-[380px] bg-[#1e52f1] text-white overflow-hidden p-10 justify-between">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1e52f1]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" /></svg>
                        </div>
                        MERMS
                    </Link>
                </div>
                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Institution Registration
                        </div>
                        <h1 className="text-3xl font-bold leading-tight mb-3">Join Nigeria's Emergency Response Network</h1>
                        <p className="text-white/70 text-sm leading-relaxed">Connect your facility to MERMS — real-time coordination, resource tracking, and instant health alerts.</p>
                    </div>
                    <div className="space-y-3">
                        {[{ e: "🏥", t: "MDCN Verified", d: "Your institution is verified across the network." }, { e: "📊", t: "Live Dashboards", d: "Real-time beds, incidents & resource management." }, { e: "🔔", t: "Emergency Alerts", d: "Receive and respond to PHO-issued alerts." }].map(f => (
                            <div key={f.t} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
                                <span className="text-xl shrink-0">{f.e}</span>
                                <div><p className="text-sm font-semibold">{f.t}</p><p className="text-xs text-white/60 mt-0.5">{f.d}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 pt-5 border-t border-white/20 text-xs text-white/40">© 2026 MERMS Platform</div>
            </div>

            {/* ── Form panel ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-6 md:px-10 lg:px-14 py-10">
                <div className="w-full max-w-2xl mx-auto">
                    <div className="mb-7">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Institution Registration</h2>
                        <p className="text-slate-500 mt-1 text-sm">
                            Step {step} of 5 — {["Facility Information", "Medical Director", "Physical Location", "Documents & Agreements", "Review & Submit"][step - 1]}
                        </p>
                    </div>

                    <Stepper current={step} />

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">

                        {/* STEP 1 */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100"><h3 className="text-lg font-bold">Facility Information</h3><p className="text-sm text-slate-500 mt-0.5">Basic details about your healthcare institution.</p></div>
                                <TextInput id="facilityName" label="Facility Name" placeholder="e.g. Lagos University Teaching Hospital" value={s1.facilityName} onChange={e => setS1(p => ({ ...p, facilityName: e.target.value }))} required error={errors.facilityName} />
                                <SelectInput id="facilityType" label="Facility Type" value={s1.facilityType} onChange={e => setS1(p => ({ ...p, facilityType: e.target.value }))} options={FACILITY_TYPES} required />
                                {errors.facilityType && <p className="text-xs text-red-500 -mt-3">{errors.facilityType}</p>}
                                <TextInput id="registrationNumber" label="CAC / Facility Registration Number" placeholder="e.g. RC123456" value={s1.registrationNumber} onChange={e => setS1(p => ({ ...p, registrationNumber: e.target.value }))} required error={errors.registrationNumber} />
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100"><h3 className="text-lg font-bold">Medical Director Details</h3><p className="text-sm text-slate-500 mt-0.5">Information about the facility's registered medical director.</p></div>
                                <TextInput id="directorFullName" label="Director Full Name" placeholder="e.g. Dr. Emeka Okonkwo" value={s2.directorFullName} onChange={e => setS2(p => ({ ...p, directorFullName: e.target.value }))} required error={errors.directorFullName} />
                                <TextInput id="professionalFolioNumber" label="MDCN Professional Folio Number" placeholder="e.g. MDCN/2024/R/12345" value={s2.professionalFolioNumber} onChange={e => setS2(p => ({ ...p, professionalFolioNumber: e.target.value }))} required error={errors.professionalFolioNumber} />
                                <div>
                                    <TextInput id="institutionalEmail" label="Official Institutional Email" type="email" placeholder="director@luth.gov.ng" value={s2.institutionalEmail} onChange={e => setS2(p => ({ ...p, institutionalEmail: e.target.value }))} required error={errors.institutionalEmail} />
                                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Gmail, Yahoo, and personal emails are not accepted.</p>
                                </div>
                                <TextInput id="phoneNumber" label="Official Phone Number" type="tel" placeholder="+234 801 234 5678" value={s2.phoneNumber} onChange={e => setS2(p => ({ ...p, phoneNumber: e.target.value }))} required error={errors.phoneNumber} />
                            </div>
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100"><h3 className="text-lg font-bold">Physical Location</h3><p className="text-sm text-slate-500 mt-0.5">Click the map to pin your facility — address fields will auto-fill.</p></div>
                                <div>
                                    <FieldLabel htmlFor="map">Facility Map Location <span className="text-red-500">*</span></FieldLabel>
                                    <MapPicker lat={s3.latitude} lng={s3.longitude} onPick={handleMapPick} />
                                    {errors.map && <p className="text-xs text-red-500 mt-1">{errors.map}</p>}
                                </div>
                                <TextInput id="streetAddress" label="Street Address" placeholder="Auto-filled from map or type manually" value={s3.streetAddress} onChange={e => setS3(p => ({ ...p, streetAddress: e.target.value }))} required error={errors.streetAddress} />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput id="city" label="City" placeholder="e.g. Lagos" value={s3.city} onChange={e => setS3(p => ({ ...p, city: e.target.value }))} required error={errors.city} />
                                    <TextInput id="state" label="State" placeholder="e.g. Lagos State" value={s3.state} onChange={e => setS3(p => ({ ...p, state: e.target.value }))} required error={errors.state} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput id="lga" label="LGA" placeholder="e.g. Lagos Island" value={s3.lga} onChange={e => setS3(p => ({ ...p, lga: e.target.value }))} required error={errors.lga} />
                                    <TextInput id="postalCode" label="Postal Code" placeholder="e.g. 100001" value={s3.postalCode} onChange={e => setS3(p => ({ ...p, postalCode: e.target.value }))} />
                                </div>
                            </div>
                        )}

                        {/* STEP 4 */}
                        {step === 4 && (
                            <div className="space-y-5">
                                <div className="pb-4 border-b border-slate-100"><h3 className="text-lg font-bold">Documents & Agreements</h3><p className="text-sm text-slate-500 mt-0.5">Upload required documents and accept compliance terms.</p></div>
                                <FileUpload id="operatingLicense" label="Operating License (PDF)" description="PDF only · Max 10MB" file={s4.operatingLicense} onChange={f => setS4(p => ({ ...p, operatingLicense: f }))} required error={errors.operatingLicense} />
                                <FileUpload id="directorGovernmentId" label="Director Government-Issued ID" description="NIN, Passport, or Driver's License · PDF or Image" file={s4.directorGovernmentId} onChange={f => setS4(p => ({ ...p, directorGovernmentId: f }))} required error={errors.directorGovernmentId} />
                                <div className="space-y-3 pt-1">
                                    <p className="text-sm font-semibold text-slate-700">Compliance Agreements</p>
                                    <Checkbox checked={s4.dataSharingConsent} onChange={v => setS4(p => ({ ...p, dataSharingConsent: v }))} label="Data Sharing Consent" detail="I consent to sharing de-identified facility data for public health analytics, emergency coordination, and resource allocation." error={errors.dataSharingConsent} />
                                    <Checkbox checked={s4.accountabilityClause} onChange={v => setS4(p => ({ ...p, accountabilityClause: v }))} label="Accountability Clause" detail="I confirm all information is accurate. False declarations may result in suspension and legal action under Nigerian health regulations." error={errors.accountabilityClause} />
                                </div>
                            </div>
                        )}

                        {/* STEP 5 — Review */}
                        {step === 5 && (
                            <ReviewStep
                                step1={{ facilityName: s1.facilityName, facilityType: s1.facilityType, registrationNumber: s1.registrationNumber }}
                                step2={{ directorFullName: s2.directorFullName, professionalFolioNumber: s2.professionalFolioNumber, institutionalEmail: s2.institutionalEmail, phoneNumber: s2.phoneNumber }}
                                step3={{ streetAddress: s3.streetAddress, city: s3.city, state: s3.state, lga: s3.lga, postalCode: s3.postalCode, latitude: s3.latitude, longitude: s3.longitude }}
                                step4={{ operatingLicense: s4.operatingLicense, directorGovernmentId: s4.directorGovernmentId, dataSharingConsent: s4.dataSharingConsent, accountabilityClause: s4.accountabilityClause }}
                                onEditStep={editStep}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                                error={submitError}
                            />
                        )}

                        {/* ── Nav buttons ── */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                            {step > 1 ? (
                                <button type="button" onClick={back} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Back
                                </button>
                            ) : (
                                <Link href="/register" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Change Role
                                </Link>
                            )}

                            {step < 5 ? (
                                <button type="button" onClick={next} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all shadow-sm hover:shadow-md hover:shadow-[#1e52f1]/25">
                                    Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-semibold hover:bg-[#123bb5] transition-all shadow-sm hover:shadow-md hover:shadow-[#1e52f1]/25 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isLoading ? (
                                        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Submitting...</>
                                    ) : (
                                        <>Submit to Supabase <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-6">Already registered? <Link href="/login" className="text-[#1e52f1] font-semibold hover:underline">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
}
