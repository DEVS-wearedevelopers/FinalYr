/**
 * reports.scorer.ts
 * CBS (Confidence-Based Score) algorithm — isolated so it can be tested independently.
 */

export interface ScoringInput {
    patientCount: number;
    symptomMatrix: string[];
}

export interface ScoringResult {
    W: number;           // Symptom weight
    T: number;           // Temporal trend weight
    S: number;           // Scale (patient count) weight
    CBS: number;         // Final composite score (0–1)
    severity_index: number;  // 1–10
    bypass_reason: string | null;
    recentReportCount: number;
}

export function computeSymptomWeight(symptoms: string[]): number {
    const s = symptoms.map(x => x.toLowerCase());
    const hasFever       = s.includes('fever');
    const hasHemorrhage  = s.some(x => x.includes('hemorrhage') || x.includes('bleeding'));
    const hasNeurological = s.some(x => x.includes('seizure') || x.includes('confusion') || x.includes('paralysis'));
    const hasRespiratory  = s.some(x => x.includes('cough') || x.includes('breath') || x.includes('respiratory'));
    const hasEnteric      = s.includes('vomiting') && s.some(x => x.includes('diarrhea') || x.includes('diarrhoea'));

    if (hasFever && hasHemorrhage)    return 1.0;
    if (hasFever && hasNeurological)  return 0.9;
    if (hasFever && hasRespiratory)   return 0.7;
    if (hasEnteric)                   return 0.6;
    if (hasFever)                     return 0.4;
    if (hasRespiratory)               return 0.3;
    return 0.2;
}

export function computeTemporalWeight(recentCount: number): number {
    if (recentCount >= 10) return 1.0;
    if (recentCount >= 5)  return 0.8;
    return 0.3;
}

export function computeScaleWeight(patientCount: number): number {
    if (patientCount >= 20) return 1.0;
    if (patientCount >= 10) return 0.8;
    return 0.4;
}

export function buildCbsScore(
    W: number,
    T: number,
    S: number,
    recentReportCount: number
): Pick<ScoringResult, 'CBS' | 'severity_index' | 'bypass_reason'> {
    if (W === 1.0) {
        return { CBS: 1.0, severity_index: 10, bypass_reason: 'CRITICAL_HEMORRHAGIC' };
    }
    const raw = (W * 0.40) + (T * 0.35) + (S * 0.25);
    const CBS = Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
    return { CBS, severity_index: Math.ceil(CBS * 10), bypass_reason: null };
}
