'use client';
import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Design tokens ──────────────────────────────────────────────────────────
const PROJECT = {
  name: "Disease Outbreak Monitoring and Response System",
  short: "DOMRS",
  tagline: "Nigeria's Disease Outbreak Response Network",
  description:
    "DOMRS connects hospitals, public health officers and the Emergency Operations Centre in a live intelligence network — so that no outbreak goes undetected, and no response is delayed.",
};

const TEAM = [
  { id: 1, name: "Ryan Offiong", matric: "22/0251", role: "Backend Engineer", focus: "API design, database architecture & server infrastructure", initials: "RO", color: "#1e52f1" },
  { id: 2, name: "Benjamin", matric: "22/0271", role: "Frontend Engineer", focus: "UI/UX design, React components & screens", initials: "TM", color: "#7c3aed" },
  { id: 3, name: "Jedidah", matric: "22/0010", role: "Full-Stack / AI", focus: "CBS scoring engine, AI pipeline & integrations", initials: "TM", color: "#0891b2" },
  { id: "sup", name: "Me Okesola", matric: null, role: "Project Supervisor", focus: "Academic oversight & system architecture review", initials: "SV", color: "#059669", isSupervisor: true },
];

const ROLE_BADGE: Record<string, { dot: string; bg: string; text: string }> = {
  Civilian: { dot: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  Institution: { dot: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  PHO: { dot: "#eab308", bg: "#fefce8", text: "#a16207" },
  "EOC Admin": { dot: "#f43f5e", bg: "#fff1f2", text: "#be123c" },
};

// ─── Injected CSS (animations + hover utilities) ─────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pingDot { 75%,100%{transform:scale(2.2);opacity:0} }
  @keyframes greenFlash {
    0%,100%{ color:#16a34a }
    45%    { color:#22c55e; text-shadow:0 0 10px rgba(34,197,94,.6) }
  }
  @keyframes pingMap { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(2.6);opacity:0} }
  .fu1{animation:fadeUp .6s cubic-bezier(.22,.68,0,1.15) .08s both}
  .fu2{animation:fadeUp .6s cubic-bezier(.22,.68,0,1.15) .22s both}
  .fu3{animation:fadeUp .6s cubic-bezier(.22,.68,0,1.15) .36s both}
  .fu4{animation:fadeUp .6s cubic-bezier(.22,.68,0,1.15) .50s both}
  .flash{animation:greenFlash 1.8s ease-in-out infinite}
  .ping{animation:pingDot 1.6s cubic-bezier(0,0,.2,1) infinite}
  .pingmap{animation:pingMap 2s ease-out infinite}
  .fcGo{transition:all .25s}
  .fcGo:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(15,23,42,.1)!important}
  .rcGo{transition:all .2s}
  .rcGo:hover{border-color:#1e52f1!important;background:#f7f9ff!important}
  .tcGo{transition:all .2s}
  .tcGo:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(15,23,42,.1)!important}
  .nlGo{transition:color .2s}
  .nlGo:hover{color:#1e52f1!important}
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Doodle({ opacity = 0.035, color = "#1e52f1", id = "d1" }: { opacity?: number; color?: string; id?: string }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="20" y1="12" x2="20" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="20" x2="28" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

function MapPlaceholder() {
  const zones = [
    { x: "36%", y: "30%", c: "#dc2626", l: "NW" },
    { x: "63%", y: "26%", c: "#d97706", l: "NE" },
    { x: "50%", y: "52%", c: "#1e52f1", l: "NC" },
    { x: "30%", y: "67%", c: "#16a34a", l: "SW" },
    { x: "62%", y: "70%", c: "#d97706", l: "SE" },
    { x: "47%", y: "80%", c: "#dc2626", l: "SS" },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#f0f4ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Doodle id="map-d" opacity={0.04} color="#1e52f1" />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", pointerEvents: "none" }}>
        <svg width="160" height="145" viewBox="0 0 220 200" fill="none" style={{ opacity: .13, display: "block", margin: "0 auto" }}>
          <path d="M50 30 L80 20 L120 18 L160 28 L185 55 L190 90 L175 125 L160 155 L130 175 L100 180 L70 165 L45 140 L30 105 L28 70 Z" fill="#1e52f1" />
        </svg>
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#1e52f1" }}>Live Map — 6 Zones</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Powered by Leaflet · reports/live endpoint</div>
      </div>
      {zones.map(({ x, y, c, l }) => (
        <div key={l} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ position: "relative", display: "flex" }}>
            <div className="pingmap" style={{ position: "absolute", inset: -4, borderRadius: "50%", background: c, opacity: .2 }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: c, border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,.2)", position: "relative" }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: c, background: "white", padding: "1px 5px", borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMapOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#ffffff", color: "#0f172a", overflowX: "hidden" }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 30, height: 30 }}>
              <div className="ping" style={{ position: "absolute", inset: 0, background: "#1e52f1", borderRadius: 7, opacity: .18 }} />
              <div style={{ position: "relative", width: 30, height: 30, background: "#1e52f1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1, color: "#0f172a", letterSpacing: "-0.3px" }}>
                DOM<span style={{ color: "#1e52f1" }}>RS</span>
              </div>
              <div style={{ fontSize: 9, color: "#64748b", fontWeight: 500, letterSpacing: "0.2px" }}>Disease Outbreak Response</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {[["Features", "#features"], ["How it works", "#how-it-works"], ["Team", "#team"]].map(([l, h]) => (
              <a key={l} href={h} className="nlGo" style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>{l}</a>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setMapOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#f0fdf4", fontSize: 12, fontWeight: 700, color: "#15803d", cursor: "pointer", transition: "all .2s" }}
            >
              <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span className="ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", opacity: .6 }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "block", position: "relative" }} />
              </span>
              Live Map
            </button>
            <Link href="/login" style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 600, color: "#0f172a", transition: "all .2s", textDecoration: "none" }}>
              Sign In
            </Link>
            <Link href="/register" style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#1e52f1", color: "white", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 14px rgba(30,82,241,.3)", transition: "all .2s", textDecoration: "none" }}>
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── LIVE MAP MODAL ── */}
      {mapOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setMapOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "white", borderRadius: 22, width: "100%", maxWidth: 720, height: 500, display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 13px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px rgba(22,163,74,.6)" }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Live Report Map — Nigeria</span>
                <span style={{ fontSize: 11, background: "#f0fdf4", color: "#15803d", fontWeight: 700, padding: "2px 9px", borderRadius: 100, border: "1px solid #bbf7d0" }}>Live</span>
              </div>
              <button onClick={() => setMapOpen(false)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e2e8f0", background: "white", fontSize: 18, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "9px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 18, flexShrink: 0, alignItems: "center" }}>
              {[["#16a34a", "Normal"], ["#d97706", "Warning"], ["#dc2626", "Critical"]].map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "block" }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>{l}</span>
                </div>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>6 active zones · updated just now</span>
            </div>
            <div style={{ flex: 1, padding: 14 }}><MapPlaceholder /></div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 24px 56px", overflow: "hidden", background: "#ffffff" }}>
        <Doodle id="hero-d" />
        <div style={{ position: "absolute", top: -100, right: -120, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,82,241,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,82,241,.05) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 780, textAlign: "center" }}>
          {/* Badge */}
          <div className="fu1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "6px 16px", marginBottom: 26 }}>
            <span style={{ position: "relative", display: "flex", flexShrink: 0 }}>
              <span className="ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", opacity: .7 }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "block", position: "relative" }} />
            </span>
            <span className="flash" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2px" }}>{PROJECT.tagline}</span>
          </div>

          <h1 className="fu2" style={{ fontSize: "clamp(34px,5.5vw,62px)", lineHeight: 1.1, fontWeight: 800, color: "#0f172a", letterSpacing: "-2px", marginBottom: 20 }}>
            One platform for every<br />
            <span style={{ color: "#1e52f1", fontStyle: "italic" }}>medical emergency</span> in Nigeria
          </h1>

          <p className="fu3" style={{ fontSize: "clamp(14px,1.8vw,17px)", lineHeight: 1.75, color: "#64748b", maxWidth: 560, margin: "0 auto 36px" }}>
            {PROJECT.description}
          </p>

          <div className="fu4" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <Link href="/register" style={{ padding: "13px 30px", borderRadius: 11, border: "none", background: "#1e52f1", color: "white", fontSize: 15, fontWeight: 700, boxShadow: "0 6px 20px rgba(30,82,241,.3)", display: "flex", alignItems: "center", gap: 7, textDecoration: "none", transition: "all .2s" }}>
              Get Started
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/login" style={{ padding: "13px 30px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "white", color: "#0f172a", fontSize: 15, fontWeight: 600, textDecoration: "none", transition: "all .2s" }}>
              Sign In
            </Link>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            {[["🔒", "MDCN Verified"], ["🛡️", "EOC-Governed"], ["📡", "Real-time Surveillance"]].map(([i, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>{i}</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#e8eeff", color: "#1e52f1", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 13px", borderRadius: 100, marginBottom: 12 }}>Platform Features</div>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.2 }}>Built for every layer of<br />Nigeria's health system</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {[
              { e: "🧬", t: "Sentinel Reporting", d: "Conversational ward-level symptom collection that auto-scores cluster risk with the AI CBS engine.", b: "Institution" },
              { e: "🚨", t: "PHO Command Centre", d: "Alert triage inbox, evidence board with 14-day delta charts, and one-click broadcast dispatch.", b: "PHO" },
              { e: "🗺️", t: "National Zone Map", d: "Interactive map of all 6 geopolitical zones with live alert counts and facility health status.", b: "EOC" },
              { e: "🔐", t: "Multi-tier Access", d: "Four role levels — Civilian, Institution, PHO, EOC Admin — each with tailored onboarding and audit trails.", b: "All Roles" },
              { e: "🤖", t: "AI-Scored Intelligence", d: "CBS score (0–1) on every report. Above 0.7 triggers automatic PHO notification and escalation.", b: "AI" },
              { e: "📢", t: "Emergency Broadcasts", d: "PHOs push typed advisories — Respiratory, Enteric, Hemorrhagic — to civilians and facilities in zone.", b: "PHO" },
            ].map(({ e, t, d, b }) => (
              <div key={t} className="fcGo" style={{ background: "white", borderRadius: 14, padding: 22, border: "1px solid #e2e8f0" }}>
                <div style={{ width: 44, height: 44, background: "#e8eeff", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{e}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{t}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#e8eeff", color: "#1e52f1", padding: "2px 7px", borderRadius: 100 }}>{b}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "#64748b" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#e8eeff", color: "#1e52f1", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 13px", borderRadius: 100, marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 48, lineHeight: 1.2 }}>From ward to national response<br />in minutes, not days</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { s: "01", t: "Facility logs a symptom cluster", d: "Staff uses the Sentinel Modal to log ward-level symptoms. AI immediately scores it with a CBS.", bg: "#eff6ff", ac: "#1e52f1" },
              { s: "02", t: "PHO receives a prioritised alert", d: "CBS above threshold flags the alert in the PHO's inbox, ranked by severity and ready to claim.", bg: "#fefce8", ac: "#d97706" },
              { s: "03", t: "PHO validates and acts", d: "PHO issues an advisory, dispatches a response team, or escalates to EOC — with mandatory justification notes.", bg: "#fff1f2", ac: "#dc2626" },
              { s: "04", t: "EOC coordinates the response", d: "EOC sees the full national zone map live, manages facility trust scores, and executes National Protocols if needed.", bg: "#f0fdf4", ac: "#16a34a" },
            ].map(({ s, t, d, bg, ac }, i, a) => (
              <div key={s} style={{ display: "flex", alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 18, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, border: `2px solid ${ac}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ac, flexShrink: 0, zIndex: 1 }}>{s}</div>
                  {i < a.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", margin: "3px 0" }} />}
                </div>
                <div style={{ textAlign: "left", paddingBottom: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{t}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "#64748b" }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-block", background: "#e8eeff", color: "#1e52f1", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 13px", borderRadius: 100, marginBottom: 12 }}>User Roles</div>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-1px" }}>Who is DOMRS for?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {[
              { r: "Civilian", lv: "Level 0", d: "Report health concerns and receive area-specific advisories from your local PHO.", badge: "Self-register", href: "/register", locked: false },
              { r: "Institution", lv: "Level 1", d: "Submit Sentinel Reports, manage facility staff, maintain your MDCN-verified institution profile.", badge: "Full Onboarding", href: "/register/institution", locked: false },
              { r: "PHO", lv: "Level 2", d: "Triage AI-scored alerts, issue advisories, dispatch response teams, and escalate to EOC.", badge: "Restricted Form", href: "/register/pho", locked: false },
              { r: "EOC Admin", lv: "Level 3", d: "Oversee the national zone map, govern facility trust, manage broadcasts, execute national protocols.", badge: "🔒 Provisioned", href: null, locked: true },
            ].map(({ r, lv, d, badge, href, locked }) => {
              const c = ROLE_BADGE[r];
              return (
                <div key={r} className="rcGo" style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "block", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r}</div>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>{lv}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap" }}>{badge}</span>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: "#64748b", flex: 1 }}>{d}</p>
                  {!locked && href ? (
                    <Link href={href} style={{ display: "block", width: "100%", padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", fontSize: 12, fontWeight: 600, color: "#0f172a", textAlign: "center", textDecoration: "none", transition: "all .2s" }}>
                      Register →
                    </Link>
                  ) : (
                    <div style={{ padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 11, fontWeight: 500, color: "#94a3b8", textAlign: "center", background: "#fafafa", cursor: "not-allowed" }}>
                      Contact your EOC Admin
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-block", background: "#e8eeff", color: "#1e52f1", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 13px", borderRadius: 100, marginBottom: 12 }}>The Team</div>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.2 }}>Built by students,<br />supervised by excellence</h2>
            <p style={{ marginTop: 10, fontSize: 14, color: "#64748b" }}>Final Year Project · Babcock University · 2024 / 2025</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
            {TEAM.filter(m => !("isSupervisor" in m)).map(m => (
              <div key={m.id} className="tcGo" style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${m.color}18`, border: `3px solid ${m.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: m.color }}>{m.initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{m.name}</div>
                  {m.matric && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.matric}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: `${m.color}15`, color: m.color, padding: "3px 11px", borderRadius: 100 }}>{m.role}</span>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>{m.focus}</p>
              </div>
            ))}
          </div>
          {TEAM.filter(m => "isSupervisor" in m).map(s => (
            <div key={s.id} style={{ background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${s.color}18`, border: `3px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: s.color, flexShrink: 0 }}>{s.initials}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "2px 10px", borderRadius: 100 }}>{s.role}</span>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{s.focus}</p>
              </div>
              <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>🎓Babcock University</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "72px 24px", background: "#1e52f1", position: "relative", overflow: "hidden" }}>
        <Doodle id="cta-d" opacity={0.05} color="white" />
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, color: "white", marginBottom: 12, lineHeight: 1.2, letterSpacing: "-1px" }}>Ready to join the response network?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.72)", marginBottom: 28, lineHeight: 1.65 }}>
            Register your facility, officer account, or civilian profile and become part of Nigeria's medical emergency infrastructure.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ padding: "12px 28px", borderRadius: 11, border: "none", background: "white", color: "#1e52f1", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", transition: "all .2s" }}>
              Create an account →
            </Link>
            <Link href="/login" style={{ padding: "12px 28px", borderRadius: 11, border: "1.5px solid rgba(255,255,255,.35)", background: "transparent", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all .2s" }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a", padding: "36px 24px 22px", color: "rgba(255,255,255,.4)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 22, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <div style={{ width: 24, height: 24, background: "#1e52f1", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>DOMRS</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.65, maxWidth: 190 }}>Disease Outbreak Monitoring<br />& Response System · Nigeria · 2025</p>
            </div>
            <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
              {[
                { h: "Platform", ls: [["Features", "#features"], ["How it Works", "#how-it-works"], ["Roles", "#roles"], ["Team", "#team"]] },
                { h: "Access", ls: [["Sign In", "/login"], ["Register", "/register"], ["Forgot Password", "/auth/forgot-password"]] },
              ].map(({ h, ls }) => (
                <div key={h}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>{h}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {ls.map(([l, href]) => (
                      <Link key={l} href={href} style={{ fontSize: 12, color: "rgba(255,255,255,.38)", textDecoration: "none" }}>{l}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11 }}>© 2025 DOMRS · Final Year Project · Babcock University</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "block" }} />
              <span style={{ fontSize: 11, color: "#22c55e" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}