"use client";
import React from "react";

interface ReviewRowProps {
    label: string;
    value: React.ReactNode;
}
function ReviewRow({ label, value }: ReviewRowProps) {
    return (
        <div className="flex flex-col gap-0.5 py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
            <span className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-300 italic">—</span>}</span>
        </div>
    );
}

function SectionCard({
    title, icon, onEdit, children,
}: {
    title: string; icon: React.ReactNode; onEdit: () => void; children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#1e52f1]/10 flex items-center justify-center text-[#1e52f1]">{icon}</div>
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                </div>
                <button type="button" onClick={onEdit}
                    className="text-xs font-semibold text-[#1e52f1] hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                </button>
            </div>
            <div className="px-5 py-2 divide-y divide-slate-100">{children}</div>
        </div>
    );
}

export interface ReviewStepProps {
    step1: { facilityName: string; facilityType: string; registrationNumber: string };
    step2: { directorFullName: string; professionalFolioNumber: string; institutionalEmail: string; phoneNumber: string };
    step3: { streetAddress: string; city: string; state: string; lga: string; postalCode: string; latitude: number | null; longitude: number | null };
    step4: { operatingLicense: File | null; directorGovernmentId: File | null; dataSharingConsent: boolean; accountabilityClause: boolean };
    onEditStep: (step: number) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string;
}

export default function ReviewStep({ step1, step2, step3, step4, onEditStep, onSubmit, isLoading, error }: ReviewStepProps) {
    return (
        <div className="space-y-5">
            <div className="pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Review Your Application</h3>
                <p className="text-sm text-slate-500 mt-0.5">Check everything carefully before submitting — you cannot edit after submission.</p>
            </div>

            <SectionCard title="Facility Information" onEdit={() => onEditStep(1)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>}
            >
                <ReviewRow label="Facility Name" value={step1.facilityName} />
                <ReviewRow label="Facility Type" value={step1.facilityType} />
                <ReviewRow label="Registration Number" value={step1.registrationNumber} />
            </SectionCard>

            <SectionCard title="Medical Director" onEdit={() => onEditStep(2)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>}
            >
                <ReviewRow label="Director Name" value={step2.directorFullName} />
                <ReviewRow label="MDCN Folio Number" value={step2.professionalFolioNumber} />
                <ReviewRow label="Institutional Email" value={step2.institutionalEmail} />
                <ReviewRow label="Phone Number" value={step2.phoneNumber} />
            </SectionCard>

            <SectionCard title="Physical Location" onEdit={() => onEditStep(3)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
            >
                <ReviewRow label="Street Address" value={step3.streetAddress} />
                <ReviewRow label="City" value={step3.city} />
                <ReviewRow label="State" value={step3.state} />
                <ReviewRow label="LGA" value={step3.lga} />
                <ReviewRow label="Postal Code" value={step3.postalCode} />
                <ReviewRow label="Coordinates" value={
                    step3.latitude ? `${step3.latitude}, ${step3.longitude}` : null
                } />
            </SectionCard>

            <SectionCard title="Documents & Agreements" onEdit={() => onEditStep(4)}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            >
                <ReviewRow label="Operating License" value={step4.operatingLicense?.name} />
                <ReviewRow label="Director Gov't ID" value={step4.directorGovernmentId?.name} />
                <ReviewRow label="Data Sharing Consent" value={
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${step4.dataSharingConsent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {step4.dataSharingConsent ? "✓ Agreed" : "✗ Not agreed"}
                    </span>
                } />
                <ReviewRow label="Accountability Clause" value={
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${step4.accountabilityClause ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {step4.accountabilityClause ? "✓ Accepted" : "✗ Not accepted"}
                    </span>
                } />
            </SectionCard>

            {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 text-xs text-blue-700 leading-relaxed">
                By submitting, this application will be sent to Supabase and queued for MDCN database verification and manual admin review.
            </div>
        </div>
    );
}
