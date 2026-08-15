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
  "#c0392b","#2980b9","#27ae60","#e67e22",
  "#8e44ad","#16a085","#d35400","#2c3e50",
  "#c0392b","#2980b9","#27ae60","#e67e22",
  "#8e44ad","#16a085","#d35400","#2c3e50",
  "#9b59b6","#1abc9c","#e74c3c","#3498db",
];

/* ── Layout constants (16:9) ── */
const CARD_W   = 1080;
const CARD_H   = 607;   // 1080 × 9/16
const H_PAD    = 22;
const COL_GAP  = 10;
const INNER_W  = CARD_W - H_PAD * 2;           // 1036
const COL_W    = (INNER_W - COL_GAP) / 2;       // 513
const ROW_HPAD = 9;
const AV_SIZE  = 26;
const PROFIT_W = 72;
const LABEL_W  = 42;
/* bar area = colW - hpad*2 - avatar - gaps - profit */
const BAR_AREA = COL_W - ROW_HPAD * 2 - AV_SIZE - 8 - 8 - PROFIT_W; // ~369px
/* each bar max = (barArea - labelW*2 - gap between bars) / 2 */
const BAR_MAX  = Math.floor((BAR_AREA - LABEL_W * 2 - 6) / 2);       // ~132px

export const SummaryCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { mode, gameName, players, allResults, buyIn, prizePool, modeBounty, bountyPool, watermark } = props;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();

  type RowData = { name: string; buyAmt: number; cashAmt: number; profit: number; rank: number | null };

  const rows: RowData[] = allResults.map((r) => {
    const player = players.find((p) => p.name === r.name);
    if (mode === "CASH") {
      /* Fix: use buyInTotal (baht amount), not count (number of re-buys) */
      const buyAmt  = player?.buyInTotal ?? 0;
      const cashAmt = player?.cashout ?? r.total ?? 0;
      return { name: r.name, buyAmt, cashAmt, profit: r.profit, rank: null };
    }
    const buyAmt = (player?.count ?? 0) * buyIn;
    return { name: r.name, buyAmt, cashAmt: r.total ?? 0, profit: r.profit, rank: r.rank ?? null };
  });

  const maxVal = Math.max(...rows.flatMap((r) => [r.buyAmt, r.cashAmt]), 1);
  const barW   = (v: number): number =>
    v > 0 ? Math.max(24, Math.round((v / maxVal) * BAR_MAX)) : 0;

  const totalBuyin = mode === "CASH"
    ? players.reduce((s, p) => s + p.buyInTotal, 0)
    : prizePool;

  const medalOf = (rank: number | null) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank ? `#${rank}` : "";

  /* Split into two columns */
  const half  = Math.ceil(rows.length / 2);
  const left  = rows.slice(0, half);
  const right = rows.slice(half);

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "linear-gradient(160deg, #1e2235 0%, #111624 60%, #181d2e 100%)",
        borderRadius: 18,
        border: "2px solid #7a6030",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        color: "#f0e6c8",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gold top bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#3a2808,#d4af37,#3a2808)", flexShrink: 0 }} />

      {/* BG glows */}
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"rgba(212,175,55,0.05)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-30, left:-30, width:130, height:130, borderRadius:"50%", background:"rgba(212,175,55,0.04)", pointerEvents:"none" }} />

      {/* ── HEADER ── */}
      <div style={{ padding:`10px ${H_PAD}px 6px`, textAlign:"center", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#8a7a5a", letterSpacing:3, textTransform:"uppercase", marginBottom:2 }}>
          ♠ &nbsp;GO POKER&nbsp; ♠
        </div>
        <div style={{ fontSize:20, fontWeight:900, letterSpacing:2, textTransform:"uppercase", color:"#f0e6c8", lineHeight:1.15 }}>
          {gameName || "POKER SUMMARY"}
        </div>
        <div style={{ fontSize:10, color:"#7a6a4a", letterSpacing:1.5, marginTop:2, textTransform:"uppercase" }}>
          {mode === "CASH" ? "Cash Game" : "Tournament"}&nbsp;·&nbsp;{today}
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:6, flexWrap:"wrap" }}>
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

      {/* Thin divider */}
      <div style={{ height:1, background:"linear-gradient(90deg,transparent,#7a6030,transparent)", margin:`0 ${H_PAD}px 4px`, flexShrink:0 }} />

      {/* Legend */}
      <div style={{ display:"flex", gap:12, padding:`0 ${H_PAD}px 4px`, justifyContent:"flex-end", flexShrink:0 }}>
        <LegendDot color="#4caf7d">Buy-In</LegendDot>
        <LegendDot color="#4a8cdf">Cash Out</LegendDot>
      </div>

      {/* ── TWO-COLUMN PLAYER GRID ── */}
      <div style={{ flex:1, display:"flex", gap:COL_GAP, padding:`0 ${H_PAD}px`, overflow:"hidden" }}>
        <PlayerCol rows={left}  startIdx={0}    maxVal={maxVal} barW={barW} medalOf={medalOf} />
        <PlayerCol rows={right} startIdx={half} maxVal={maxVal} barW={barW} medalOf={medalOf} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop:"1px solid rgba(122,96,48,0.25)",
        padding:"5px 24px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        flexShrink:0,
      }}>
        <span style={{ fontSize:11, color:"#4a4030" }}>♠ ♥ ♣ ♦</span>
        <span style={{ fontSize:9, color:"#5a5040", letterSpacing:2, textTransform:"uppercase" }}>
          Go Poker — Premium Edition
        </span>
        <span style={{ fontSize:11, color:"#4a4030" }}>♦ ♣ ♥ ♠</span>
      </div>

      {/* Gold bottom bar */}
      <div style={{ height:4, background:"linear-gradient(90deg,#3a2808,#d4af37,#3a2808)", flexShrink:0 }} />

      {/* Watermark */}
      {watermark && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ fontSize:48, fontWeight:900, color:"rgba(255,255,255,0.07)", letterSpacing:6, textTransform:"uppercase", transform:"rotate(-30deg)", userSelect:"none", whiteSpace:"nowrap" }}>
            GO POKER TRIAL
          </div>
        </div>
      )}
    </div>
  );
});

SummaryCard.displayName = "SummaryCard";

/* ── Column sub-component ── */
type RowData = { name: string; buyAmt: number; cashAmt: number; profit: number; rank: number | null };

function PlayerCol({
  rows, startIdx, maxVal: _maxVal, barW, medalOf,
}: {
  rows: RowData[];
  startIdx: number;
  maxVal: number;
  barW: (v: number) => number;
  medalOf: (r: number | null) => string;
}) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3, paddingBottom:4 }}>
      {rows.map((r, i) => {
        const idx    = startIdx + i;
        const isTop  = idx === 0 && r.profit > 0;
        const medal  = medalOf(r.rank);
        const bw     = barW(r.buyAmt);
        const cw     = barW(r.cashAmt);

        return (
          <div
            key={i}
            style={{
              flex: 1,
              background: isTop
                ? "linear-gradient(90deg,rgba(212,175,55,0.10),rgba(212,175,55,0.04))"
                : idx % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: 8,
              border: isTop ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(255,255,255,0.04)",
              padding: `4px ${ROW_HPAD}px`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: AV_SIZE, height: AV_SIZE, borderRadius: "50%", flexShrink: 0,
              background: avatarColors[idx % avatarColors.length],
              border: isTop ? "2px solid #d4af37" : "1.5px solid rgba(255,255,255,0.14)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#fff",
              boxShadow: isTop ? "0 0 8px rgba(212,175,55,0.45)" : "none",
            }}>
              {getInitials(r.name)}
            </div>

            {/* Name + badges */}
            <div style={{ width:90, flexShrink:0, overflow:"hidden" }}>
              <div style={{
                fontWeight:800, fontSize:12, letterSpacing:0.3,
                color: isTop ? "#f5d060" : "#f0e6c8",
                textTransform:"uppercase",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>
                {r.name}
              </div>
              <div style={{ display:"flex", gap:4, marginTop:1 }}>
                {medal && <span style={{ fontSize:10 }}>{medal}</span>}
                {isTop && (
                  <span style={{
                    background:"linear-gradient(90deg,#8a5f10,#d4af37)",
                    color:"#fff", fontSize:7, fontWeight:900,
                    padding:"1px 5px", borderRadius:4, letterSpacing:0.8,
                  }}>★ WIN</span>
                )}
              </div>
            </div>

            {/* Bars — inline side by side */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3, minWidth:0, overflow:"hidden" }}>
              {/* Buy-in */}
              <InlineBar
                label="BUY" labelColor="#5a8a6a"
                width={bw} gradient="linear-gradient(90deg,#1b5e3b,#4caf7d)"
                value={r.buyAmt}
              />
              {/* Cash out */}
              <InlineBar
                label="OUT" labelColor="#4a6a9a"
                width={cw} gradient="linear-gradient(90deg,#1a3a7e,#4a8cdf)"
                value={r.cashAmt}
              />
            </div>

            {/* P&L */}
            <div style={{
              width: PROFIT_W, textAlign:"right", flexShrink:0,
              fontSize: 13, fontWeight:900, letterSpacing:0.3,
              color: r.profit > 0 ? "#4cef90" : r.profit < 0 ? "#ff4d4d" : "#aaa",
              textShadow: r.profit > 0
                ? "0 0 10px rgba(76,239,144,0.5)"
                : r.profit < 0 ? "0 0 10px rgba(255,77,77,0.5)" : "none",
            }}>
              {r.profit > 0 ? "+" : ""}{fmtN(r.profit)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── sub-components ── */

function Pill({ color, bg, border, children }: { color:string; bg:string; border:string; children:React.ReactNode }) {
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:20, padding:"3px 12px", fontSize:11, color, fontWeight:700 }}>
      {children}
    </div>
  );
}

function LegendDot({ color, children }: { color:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:"#7a6a4a" }}>
      <div style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0 }} />
      {children}
    </div>
  );
}

function InlineBar({ label, labelColor, width, gradient, value }: {
  label:string; labelColor:string; width:number; gradient:string; value:number;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <span style={{
        fontSize:7, fontWeight:700, color:labelColor,
        width: LABEL_W, textAlign:"right", flexShrink:0,
        textTransform:"uppercase", letterSpacing:0.4,
      }}>
        {label}
      </span>
      {value > 0 ? (
        <div style={{
          height: 16,
          width,
          maxWidth: BAR_MAX,
          background: gradient,
          borderRadius: 4,
          display:"flex", alignItems:"center", paddingLeft:5,
          fontSize:9, fontWeight:700, color:"#fff",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15)",
          flexShrink:0,
          overflow:"hidden",
          whiteSpace:"nowrap",
        }}>
          {fmtN(value)}
        </div>
      ) : (
        <span style={{ color:"#3a3a4a", fontSize:11, marginLeft:2 }}>—</span>
      )}
    </div>
  );
}
