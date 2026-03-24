import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  fetchTeams,
  fetchMatches,
  fetchAllEvents,
  fetchAllPlayers,
  type Team,
  type Match,
  type MatchEvent,
  type Player,
} from "../lib/public-supabase";
import { format } from "date-fns";
import LogoPower from "../imports/LogoPower";

// ════════════════════════════════════════════════════
// QUADRO ESPORTIVO — COLUNA JORNAL
// 55mm × max 300mm — Fonte 10pt — letter-spacing 0
// ════════════════════════════════════════════════════

const DAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const C = {
  green: "#009640", // 90/0/90/0 CMYK
  gdk: "#009640",   // Padronizado
  gdp: "#005E1A",
  bk: "#000000",    // 0/0/0/100 CMYK
  gold: "#D4A843",
  w: "#fff",
  g: "#666",
  gl: "#ccc",
  red: "#C8102E",
  yel: "#F5C518",
};
const FM = "'JetBrains Mono','Courier New',monospace";
const FS = "'Inter','Work Sans',system-ui,sans-serif";

/* ── helpers ── */
function Lg({ url, name, s = 18 }: { url?: string; name: string; s?: number }) {
  const [e, setE] = useState(false);
  if (!url || e)
    return (
      <span style={{
        width: s, height: s, borderRadius: "50%", background: "#ddd",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: s * 0.32, fontWeight: 700, color: "#888", flexShrink: 0,
      }}>{name?.slice(0, 2)}</span>
    );
  return <img src={url} alt="" onError={() => setE(true)} style={{ width: s, height: s, objectFit: "contain", flexShrink: 0 }} />;
}

function CardIcon({ c }: { c: string }) {
  return <span style={{ display: "inline-block", width: 4, height: 6, borderRadius: 0.5, background: c, flexShrink: 0, verticalAlign: "middle" }} />;
}

function Sec({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "10pt", fontWeight: 800, textTransform: "uppercase",
      color: C.w, background: C.gdk, padding: "1mm 2mm",
      letterSpacing: 0, lineHeight: 1.2,
    }}>{children}</div>
  );
}

/* Thin rule between content sections */
function Rule() {
  return <div style={{ height: "0.3px", background: C.gl, margin: "0.5mm 2mm" }} />;
}

export function PrintNewspaperPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [t, m, e, p] = await Promise.all([fetchTeams(), fetchMatches(), fetchAllEvents(), fetchAllPlayers()]);
      setTeams(t); setMatches(m); setEvents(e); setPlayers(p); setLoading(false);
    })();
  }, []);

  const tm = useMemo(() => { const m: Record<string, Team> = {}; teams.forEach((t) => (m[t.id] = t)); return m; }, [teams]);
  const finR = useMemo(() => [...new Set(matches.filter((m) => m.status === "finished").map((m) => m.round_number))].sort((a, b) => a - b), [matches]);
  const allR = useMemo(() => [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b), [matches]);
  useEffect(() => { if (finR.length && selectedRound === null) setSelectedRound(finR[finR.length - 1]); }, [finR]);

  const cur = selectedRound ?? (finR.length ? finR[finR.length - 1] : 1);
  const nxt = allR.find((r) => r > cur) ?? null;
  const rM = matches.filter((m) => m.round_number === cur && m.status === "finished");
  const nM = nxt ? matches.filter((m) => m.round_number === nxt) : [];

  const stand = useMemo(() => {
    const a: Record<string, { j: number; v: number; e: number; d: number; gp: number; gc: number }> = {};
    teams.forEach((t) => (a[t.id] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }));
    matches.filter((m) => m.status === "finished").forEach((m) => {
      if (m.score_home == null || m.score_away == null) return;
      [m.home_team_id, m.away_team_id].forEach((id) => { if (!a[id]) a[id] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }; });
      const h = a[m.home_team_id], w = a[m.away_team_id];
      h.j++; w.j++; h.gp += m.score_home; h.gc += m.score_away; w.gp += m.score_away; w.gc += m.score_home;
      if (m.score_home > m.score_away) { h.v++; w.d++; }
      else if (m.score_away > m.score_home) { w.v++; h.d++; }
      else { h.e++; w.e++; }
    });
    return Object.entries(a).map(([id, s]) => ({ id, t: tm[id], ...s, sg: s.gp - s.gc, pts: s.v * 3 + s.e }))
      .filter((s) => s.t).sort((a, b) => b.pts - a.pts || b.v - a.v || b.sg - a.sg || b.gp - a.gp || a.gc - b.gc);
  }, [teams, matches, tm]);

  const scorers = useMemo(() => {
    const acc: Record<string, number> = {};
    events.filter((e) => e.event_type === "goal").forEach((e) => (acc[e.player_id] = (acc[e.player_id] || 0) + 1));
    return Object.entries(acc).map(([id, g]) => { const p = players.find((x) => x.id === id); return { id, g, p, t: p ? tm[p.team_id] : null }; })
      .filter((s) => s.p).sort((a, b) => b.g - a.g).slice(0, 5);
  }, [events, players, tm]);

  const rIds = useMemo(() => new Set(rM.map((m) => m.id)), [rM]);
  const rEv = useMemo(() => events.filter((e) => rIds.has(e.match_id)), [events, rIds]);
  const rGoals = rEv.filter((e) => e.event_type === "goal").length;
  const rYel = rEv.filter((e) => e.event_type === "yellow_card").length;
  const rRed = rEv.filter((e) => e.event_type === "red_card").length;
  const totG = events.filter((e) => e.event_type === "goal").length;
  const totM = matches.filter((m) => m.status === "finished").length;
  const avg = totM ? (totG / totM).toFixed(1) : "0";

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-300">
      {/* TOOLBAR */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b px-4 py-2.5 flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="flex items-center gap-1 text-sm text-gray-600 hover:text-black font-medium">
          <ArrowLeft className="w-4 h-4" /> Admin
        </button>
        <div className="h-5 w-px bg-gray-300" />
        <span className="text-sm font-bold" style={{ color: C.gdk }}>Coluna 55x300mm</span>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={() => setSelectedRound((r) => Math.max(1, (r || 1) - 1))} disabled={cur <= 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold min-w-[90px] text-center">Rodada {cur}</span>
          <button onClick={() => setSelectedRound((r) => (r || 1) + 1)} disabled={cur >= allR[allR.length - 1]} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg" style={{ background: C.gdk }}>
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* ═══ THE BOX — 55mm × max 300mm ═══ */}
      <div className="flex justify-center py-8 print:py-0 print:block" style={{ fontFamily: FS }}>
        <div
          id="quadro-esportivo"
          style={{
            width: "55mm", maxHeight: "300mm", overflow: "hidden",
            background: C.w, color: C.bk,
            fontSize: "10pt", lineHeight: 1.2, letterSpacing: 0,
            border: `1px solid ${C.gdk}`,
          }}
          className="print:shadow-none"
        >
          {/* ── HEADER ── */}
          <div style={{
            background: `linear-gradient(180deg, ${C.bk} 0%, ${C.gdp} 100%)`,
            padding: "2.5mm 2mm 2mm", color: C.w, textAlign: "center",
          }}>
            {/* Logo Power — native 276×40.5px, scaled to ~45mm */}
            <div style={{
              display: "flex", justifyContent: "center", marginBottom: "1.5mm",
            }}>
              <div style={{
                width: 276, height: 40.5,
                transform: "scale(0.58)",
                transformOrigin: "center center",
                filter: "brightness(0) invert(1)",
                ["--fill-0" as any]: "#fff",
                ["--stroke-0" as any]: "#fff",
                margin: "-8px 0",
                flexShrink: 0,
              }}>
                <LogoPower />
              </div>
            </div>
            {/* Título */}
            <div style={{
              fontSize: "12pt", fontWeight: 800, letterSpacing: 0, lineHeight: 1.1,
            }}>
              ENCANTADO <span style={{ color: C.gold, margin: "0 0.3mm" }}>|</span> AMADOR
            </div>
          </div>

          {/* Accent line */}
          <div style={{ height: "0.6mm", background: `linear-gradient(90deg, ${C.green}, ${C.gold} 50%, ${C.green})` }} />

          {/* ── STATS ── */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "1.5mm",
            padding: "1mm 1mm", fontSize: "9pt", color: C.g,
            background: "#f5f5f5", borderBottom: `0.5px solid ${C.gl}`,
            letterSpacing: 0,
          }}>
            <span><b style={{ color: C.gdk, fontFamily: FM }}>{totM}</b> jogos</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span><b style={{ color: C.gdk, fontFamily: FM }}>{totG}</b> gols</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span><b style={{ color: C.gdk, fontFamily: FM }}>{avg}</b> gols/jogo</span>
          </div>

          {/* ── RESULTADOS ── */}
          <Sec>Rodada {cur} — Resultados</Sec>
          <div style={{ padding: "1mm 1.5mm 0.5mm" }}>
            {rM.map((m, mi) => {
              const hw = (m.score_home ?? 0) > (m.score_away ?? 0);
              const aw = (m.score_away ?? 0) > (m.score_home ?? 0);
              return (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center",
                  padding: "0.8mm 0",
                  borderBottom: mi < rM.length - 1 ? "0.3px solid #e0e0e0" : "none",
                  gap: "0.5mm",
                }}>
                  <Lg url={m.home_team?.logo_url} name={m.home_team?.short_name || "?"} s={18} />
                  <span style={{
                    flex: 1, fontSize: "10pt", fontWeight: hw ? 800 : 500,
                    color: hw ? C.bk : C.g, whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", textAlign: "right", letterSpacing: 0,
                  }}>{m.home_team?.short_name}</span>
                  <span style={{
                    fontFamily: FM, fontWeight: 800, fontSize: "11pt",
                    color: C.gdk,
                    letterSpacing: 0, lineHeight: 1.2, whiteSpace: "nowrap", flexShrink: 0,
                    margin: "0 0.5mm",
                  }}>{m.score_home} × {m.score_away}</span>
                  <span style={{
                    flex: 1, fontSize: "10pt", fontWeight: aw ? 800 : 500,
                    color: aw ? C.bk : C.g, whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", letterSpacing: 0,
                  }}>{m.away_team?.short_name}</span>
                  <Lg url={m.away_team?.logo_url} name={m.away_team?.short_name || "?"} s={18} />
                </div>
              );
            })}
            <Rule />
            <div style={{ display: "flex", justifyContent: "center", gap: "2mm", fontSize: "9pt", color: C.g, padding: "0.3mm 0 0.8mm", alignItems: "center" }}>
              <b style={{ color: C.gdk }}>{rGoals}</b> gols
              <CardIcon c={C.yel} /> {rYel}
              <CardIcon c={C.red} /> {rRed}
            </div>
          </div>

          {/* ── PRÓXIMA RODADA ── */}
          {nM.length > 0 && (
            <>
              <Sec>Próxima — Rodada {nxt}</Sec>
              <div style={{ padding: "1mm 1.5mm 0.5mm" }}>
                {nM.map((m, mi) => {
                  const d = new Date(m.match_date);
                  return (
                    <div key={m.id} style={{
                      padding: "0.8mm 0",
                      borderBottom: mi < nM.length - 1 ? "0.3px solid #e0e0e0" : "none",
                      gap: "0.5mm",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5mm", fontSize: "10pt", letterSpacing: 0 }}>
                        <span style={{ flex: 1, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.home_team?.short_name}</span>
                        <Lg url={m.home_team?.logo_url} name={m.home_team?.short_name || "?"} s={16} />
                        <span style={{ fontWeight: 800, color: C.g, fontSize: "9pt", margin: "0 0.3mm" }}>x</span>
                        <Lg url={m.away_team?.logo_url} name={m.away_team?.short_name || "?"} s={16} />
                        <span style={{ flex: 1, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.away_team?.short_name}</span>
                      </div>
                      <div style={{ textAlign: "center", fontSize: "8pt", color: C.g, marginTop: "0.3mm", display: "flex", justifyContent: "center", gap: "1mm", alignItems: "center" }}>
                        <span>{DAY[d.getDay()]} {format(d, "dd/MM HH:mm")}</span>
                        {m.broadcast && (
                          <span style={{ background: C.red, color: C.w, fontSize: "7pt", fontWeight: 800, padding: "0.2mm 1mm", borderRadius: "0.5mm" }}>AO VIVO</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── CLASSIFICAÇÃO ── */}
          <Sec>Classificação</Sec>
          <div style={{ padding: "0.5mm 1mm 1mm" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `0.8px solid ${C.gdk}` }}>
                  {["", "", "P", "J", "V", "E", "D", "SG"].map((h, i) => (
                    <th key={i} style={{
                      padding: "0.5mm 0", textAlign: i < 2 ? "left" : "center",
                      fontSize: "8pt", fontWeight: 700, color: C.g, letterSpacing: 0,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stand.map((s, i) => (
                  <tr key={s.id} style={{
                    borderBottom: i === 3 ? `0.8px dashed ${C.green}` : i < stand.length - 1 ? "0.3px solid #e0e0e0" : "none",
                    background: i < 4 ? "rgba(0,150,64,0.05)" : "transparent",
                  }}>
                    <td style={{
                      padding: "0.6mm 0", textAlign: "center", width: "3.5mm",
                      fontWeight: 800, fontSize: "9pt", letterSpacing: 0,
                      color: i === 0 ? C.gold : i < 4 ? C.gdk : C.g,
                    }}>{i + 1}</td>
                    <td style={{ padding: "0.6mm 0", fontSize: "10pt", fontWeight: 700, letterSpacing: 0 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5mm" }}>
                        <Lg url={s.t?.logo_url} name={s.t?.short_name || "?"} s={15} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "13mm" }}>{s.t?.short_name}</span>
                      </span>
                    </td>
                    <td style={{
                      textAlign: "center", fontSize: "11pt", fontWeight: 800,
                      fontFamily: FM, padding: "0.6mm 0", letterSpacing: 0,
                      color: C.bk,
                    }}>{s.pts}</td>
                    {[s.j, s.v, s.e, s.d].map((v, ci) => (
                      <td key={ci} style={{ textAlign: "center", fontSize: "9pt", color: C.g, padding: "0.6mm 0", letterSpacing: 0 }}>{v}</td>
                    ))}
                    <td style={{
                      textAlign: "center", fontSize: "9pt", fontWeight: 700, letterSpacing: 0,
                      color: s.sg > 0 ? C.gdk : s.sg < 0 ? C.red : C.g,
                    }}>{s.sg > 0 ? `+${s.sg}` : s.sg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── ARTILHARIA ── */}
          <Sec>Artilharia</Sec>
          <div style={{ padding: "0.8mm 1.5mm 1mm" }}>
            {scorers.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: "0.8mm",
                padding: "0.6mm 0",
                borderBottom: i < scorers.length - 1 ? "0.3px solid #e0e0e0" : "none",
              }}>
                <span style={{
                  fontSize: "9pt", fontWeight: 800, width: "3mm", textAlign: "right",
                  color: i === 0 ? C.gold : i < 3 ? C.bk : C.g, letterSpacing: 0,
                }}>{i + 1}</span>
                <span style={{
                  flex: 1, overflow: "hidden", whiteSpace: "nowrap",
                  textOverflow: "ellipsis", letterSpacing: 0,
                }}>
                  <span style={{ fontSize: "10pt", fontWeight: i < 3 ? 700 : 500 }}>{s.p?.name}</span>
                  {" "}
                  <span style={{ fontSize: "8pt", fontWeight: 400, color: C.g, fontStyle: "italic" }}>{s.t?.short_name}</span>
                </span>
                <span style={{
                  fontWeight: 800, fontSize: "11pt", color: C.gdk,
                  fontFamily: FM, minWidth: "4mm", textAlign: "right", letterSpacing: 0,
                }}>{s.g}</span>
              </div>
            ))}
          </div>

          {/* ── RODAPÉ ── */}
          <div style={{
            background: `linear-gradient(180deg, ${C.bk}, ${C.gdp})`,
            color: C.w, padding: "1.5mm 2mm", position: "relative",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.5mm", background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
            <div style={{
              background: C.green, borderRadius: "1mm", padding: "0.8mm 1mm",
              textAlign: "center", fontSize: "9pt", fontWeight: 800, letterSpacing: 0,
              color: C.w,
            }}>power.jornalfv.com.br</div>
            <div style={{ fontSize: "7pt", lineHeight: 1.4, marginTop: "0.5mm", letterSpacing: 0, opacity: 0.75, textAlign: "center" }}>
              Acesse pelo celular e acompanhe
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:block { display: block !important; }
          #quadro-esportivo { border: none !important; }
          @page { margin: 3mm; size: 61mm auto; }
        }
      `}</style>
    </div>
  );
}
