import { forwardRef } from "react";

type Result = {
  name: string;
  count: number;
  total: number;
  profit: number;
  prize?: number;
  bounty?: number;
  rank?: number | null;
};

interface Props {
  mode: "TOURNAMENT" | "CASH";
  gameName: string;
  players: { name: string; buyInTotal: number; bounty: number; cashout: number; count: number }[];
  allResults: Result[];
  prizeWinners: { name: string; amount: number; count: number; profit: number }[];
  buyIn: number;
  prizePool: number;
  modeBounty: boolean;
  bountyPool: number;
  watermark?: boolean;
}

const fmtN = (n: number) => n.toLocaleString("en-US");

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  "#c0392b", "#2980b9", "#27ae60", "#e67e22",
  "#8e44ad", "#16a085", "#d35400", "#2c3e50",
];

const CARD_W      = 540;
const H_PAD       = 24;   // card horizontal padding
const ROW_H_PAD   = 12;   // player row horizontal padding
const LABEL_W     = 54;   // "BUY-IN"/"CASH OUT" label + gap
const BAR_MAX_W   = CARD_W - H_PAD * 2 - ROW_H_PAD * 2 - LABEL_W; // 364px

export const SummaryCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { mode, gameName, players, allResults, buyIn, prizePool, modeBounty, bountyPool, watermark } = props;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();

  type RowData = { name: string; buyAmt: number; cashAmt: number; profit: number; rank: number | null };

  const rows: RowData[] = allResults.map((r) => {
    const player = players.find((p) => p.name === r.name);
    if (mode === "CASH") {
      return { name: r.name, buyAmt: r.count, cashAmt: r.total, profit: r.profit, rank: null };
    }
    const buyAmt = (player?.count ?? 0) * buyIn;
    return { name: r.name, buyAmt, cashAmt: r.total ?? 0, profit: r.profit, rank: r.rank ?? null };
  });

  const maxVal = Math.max(...rows.flatMap((r) => [r.buyAmt, r.cashAmt]), 1);
  const barW = (v: number): number =>
    v > 0 ? Math.max(44, Math.round((v / maxVal) * BAR_MAX_W)) : 0;

  const totalBuyin = mode === "CASH"
    ? players.reduce((s, p) => s + p.buyInTotal, 0)
    : prizePool;

  const medalOf = (rank: number | null) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank ? `#${rank}` : "";

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        background: "linear-gradient(175deg, #1e2235 0%, #111624 55%, #181d2e 100%)",
        borderRadius: 20,
        border: "2px solid #7a6030",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: "#f0e6c8",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Gold top bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #3a2808, #d4af37, #3a2808)" }} />

      {/* BG glow */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(212,175,55,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(212,175,55,0.04)", pointerEvents: "none" }} />

      {/* ── HEADER ── */}
      <div style={{ padding: `20px ${H_PAD}px 16px`, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#8a7a5a", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
          ♠ &nbsp;GO POKER&nbsp; ♠
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#f0e6c8", lineHeight: 1.2 }}>
          {gameName || "POKER SUMMARY"}
        </div>
        <div style={{ fontSize: 11, color: "#7a6a4a", letterSpacing: 1.5, marginTop: 5, textTransform: "uppercase" }}>
          {mode === "CASH" ? "Cash Game" : "Tournament"}&nbsp;·&nbsp;{today}
        </div>

        {/* Pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill color="#d4af37" bg="rgba(212,175,55,0.12)" border="rgba(212,175,55,0.3)">
            Total Pool: {fmtN(totalBuyin)}
          </Pill>
          {modeBounty && (
            <Pill color="#e57a7a" bg="rgba(229,9,20,0.12)" border="rgba(229,9,20,0.3)">
              Bounty: {fmtN(bountyPool)}
            </Pill>
          )}
          <Pill color="#9a8a6a" bg="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.1)">
            {players.length} Players
          </Pill>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #7a6030, transparent)", margin: `0 ${H_PAD}px 8px` }} />

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, padding: `0 ${H_PAD}px 8px`, justifyContent: "flex-end" }}>
        <LegendDot color="#4caf7d">Buy-In</LegendDot>
        <LegendDot color="#4a8cdf">Cash Out</LegendDot>
      </div>

      {/* ── PLAYER ROWS ── */}
      <div style={{ padding: `0 ${H_PAD}px 20px` }}>
        {rows.map((r, i) => {
          const isTop  = i === 0 && r.profit > 0;
          const medal  = medalOf(r.rank);
          const bw     = barW(r.buyAmt);
          const cw     = barW(r.cashAmt);

          return (
            <div
              key={i}
              style={{
                marginBottom: 10,
                background: isTop
                  ? "linear-gradient(90deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))"
                  : i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                borderRadius: 12,
                border: isTop ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(255,255,255,0.04)",
                padding: `11px ${ROW_H_PAD}px 10px`,
                overflow: "hidden",   // ← กัน bar ล้น
              }}
            >
              {/* Top row: avatar + name + P&L */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: avatarColors[i % avatarColors.length],
                  border: isTop ? "2.5px solid #d4af37" : "2px solid rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff",
                  boxShadow: isTop ? "0 0 10px rgba(212,175,55,0.45)" : "none",
                }}>
                  {getInitials(r.name)}
                </div>

                {/* Name + badges */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{
                    fontWeight: 800, fontSize: 15, letterSpacing: 0.4,
                    color: isTop ? "#f5d060" : "#f0e6c8",
                    textTransform: "uppercase",
                  }}>
                    {r.name}
                  </span>
                  {medal && <span style={{ fontSize: 14 }}>{medal}</span>}
                  {isTop && (
                    <span style={{
                      background: "linear-gradient(90deg, #8a5f10, #d4af37)",
                      color: "#fff", fontSize: 9, fontWeight: 900,
                      padding: "2px 8px", borderRadius: 5, letterSpacing: 1.2,
                    }}>★ WINNER</span>
                  )}
                </div>

                {/* P&L — ชัดเจน */}
                <div style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  color: r.profit > 0 ? "#4cef90" : r.profit < 0 ? "#ff4d4d" : "#aaa",
                  flexShrink: 0,
                  textShadow: r.profit > 0
                    ? "0 0 12px rgba(76,239,144,0.5)"
                    : r.profit < 0 ? "0 0 12px rgba(255,77,77,0.5)" : "none",
                }}>
                  {r.profit > 0 ? "+" : ""}{fmtN(r.profit)}
                </div>
              </div>

              {/* Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {/* Buy-in — สีเขียว */}
                <BarRow
                  label="BUY-IN"
                  labelColor="#5a8a6a"
                  width={bw}
                  gradient="linear-gradient(90deg, #1b5e3b, #4caf7d)"
                  value={r.buyAmt}
                />
                {/* Cash out — สีฟ้า */}
                <BarRow
                  label="CASH OUT"
                  labelColor="#4a6a9a"
                  width={cw}
                  gradient="linear-gradient(90deg, #1a3a7e, #4a8cdf)"
                  value={r.cashAmt}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: "1px solid rgba(122,96,48,0.25)",
        padding: "11px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "#4a4030" }}>♠ ♥ ♣ ♦</span>
        <span style={{ fontSize: 10, color: "#5a5040", letterSpacing: 2, textTransform: "uppercase" }}>
          Go Poker — Premium Edition
        </span>
        <span style={{ fontSize: 12, color: "#4a4030" }}>♦ ♣ ♥ ♠</span>
      </div>

      {/* Gold bottom bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #3a2808, #d4af37, #3a2808)" }} />

      {/* Watermark overlay for Free plan */}
      {watermark && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.07)",
            letterSpacing: 6, textTransform: "uppercase", transform: "rotate(-30deg)",
            userSelect: "none", whiteSpace: "nowrap",
          }}>
            GO POKER TRIAL
          </div>
        </div>
      )}
    </div>
  );
});

SummaryCard.displayName = "SummaryCard";

/* ── sub-components (inline, html2canvas-safe) ── */

function Pill({ color, bg, border, children }: {
  color: string; bg: string; border: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 20,
      padding: "4px 14px", fontSize: 12, color, fontWeight: 700,
    }}>
      {children}
    </div>
  );
}

function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#7a6a4a" }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function BarRow({ label, labelColor, width, gradient, value }: {
  label: string; labelColor: string; width: number; gradient: string; value: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, color: labelColor,
        width: LABEL_W - 8, textAlign: "right", flexShrink: 0,
        textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.2,
      }}>
        {label}
      </span>
      {value > 0 ? (
        <div style={{
          height: 24,
          width,
          maxWidth: BAR_MAX_W,    // ← hard cap ไม่ให้เกิน
          background: gradient,
          borderRadius: 5,
          display: "flex", alignItems: "center", paddingLeft: 8,
          fontSize: 11, fontWeight: 700, color: "#fff",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {fmtN(value)}
        </div>
      ) : (
        <span style={{ color: "#3a3a4a", fontSize: 12, marginLeft: 4 }}>—</span>
      )}
    </div>
  );
}
