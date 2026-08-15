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

/* ── Layout constants ── */
const CARD_W  = 1080;
const CARD_H  = 607;
const H_PAD   = 28;

export const SummaryCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { mode, gameName, players, allResults, buyIn, prizePool, modeBounty, bountyPool, watermark } = props;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();

  type RowData = { name: string; buyAmt: number; cashAmt: number; profit: number; rank: number | null };

  const rows: RowData[] = allResults.map((r) => {
    const player = players.find((p) => p.name === r.name);
    if (mode === "CASH") {
      return {
        name: r.name,
        buyAmt:  player?.buyInTotal ?? 0,
        cashAmt: player?.cashout    ?? r.total ?? 0,
        profit:  r.profit,
        rank:    null,
      };
    }
    const buyAmt = (player?.count ?? 0) * buyIn;
    return { name: r.name, buyAmt, cashAmt: r.total ?? 0, profit: r.profit, rank: r.rank ?? null };
  });

  const totalBuyin = mode === "CASH"
    ? players.reduce((s, p) => s + p.buyInTotal, 0)
    : prizePool;

  const medalOf = (rank: number | null) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank ? `#${rank}` : "";

  /* ── Choose layout based on player count ── */
  const useTwoCol = rows.length > 6;

  /* Header height estimate */
  const HEADER_H = 145;
  const FOOTER_H = 32;
  const PLAYER_AREA_H = CARD_H - HEADER_H - FOOTER_H - 8;

  /* Single column: each row fills equal height */
  const ROW_GAP = 6;
  const rowsPerCol = useTwoCol ? Math.ceil(rows.length / 2) : rows.length;
  const rowH = Math.floor((PLAYER_AREA_H - ROW_GAP * (rowsPerCol - 1)) / rowsPerCol);

  /* Available bar width */
  const COL_INNER_W  = useTwoCol
    ? (CARD_W - H_PAD * 2 - 10) / 2   // two columns with gap
    : CARD_W - H_PAD * 2;             // full width
  const ROW_H_PAD    = 12;
  const AV_SIZE      = rowH >= 70 ? 38 : 30;
  const PROFIT_W     = 90;
  const LABEL_W      = 52;
  const BAR_MAX      = Math.floor(COL_INNER_W - ROW_H_PAD * 2 - AV_SIZE - 10 - 10 - LABEL_W - PROFIT_W - 4);

  const maxVal = Math.max(...rows.flatMap((r) => [r.buyAmt, r.cashAmt]), 1);
  const barW   = (v: number): number =>
    v > 0 ? Math.max(8, Math.round((v / maxVal) * BAR_MAX)) : 0;

  /* Split columns */
  const half  = Math.ceil(rows.length / 2);
  const left  = useTwoCol ? rows.slice(0, half) : rows;
  const right = useTwoCol ? rows.slice(half)    : [];

  const renderRows = (list: RowData[], startIdx: number) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: ROW_GAP }}>
      {list.map((r, i) => {
        const idx   = startIdx + i;
        const isTop = idx === 0 && r.profit > 0;
        const medal = medalOf(r.rank);
        const bw    = barW(r.buyAmt);
        const cw    = barW(r.cashAmt);

        /* bar label: inside if bar wide enough, outside otherwise */
        const MIN_INSIDE = 60; // px threshold

        return (
          <div
            key={i}
            style={{
              height: rowH,
              background: isTop
                ? "linear-gradient(90deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))"
                : idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
              borderRadius: 10,
              border: isTop ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.05)",
              padding: `0 ${ROW_H_PAD}px`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {/* Avatar */}
            <div style={{
              width: AV_SIZE, height: AV_SIZE, borderRadius: "50%", flexShrink: 0,
              background: avatarColors[idx % avatarColors.length],
              border: isTop ? "2.5px solid #d4af37" : "2px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: AV_SIZE * 0.34, fontWeight: 800, color: "#fff",
              boxShadow: isTop ? "0 0 10px rgba(212,175,55,0.5)" : "none",
              flexShrink: 0,
            }}>
              {getInitials(r.name)}
            </div>

            {/* Name + badges */}
            <div style={{ width: 120, flexShrink: 0, overflow: "hidden" }}>
              <div style={{
                fontWeight: 800,
                fontSize: rowH >= 70 ? 15 : 12,
                color: isTop ? "#f5d060" : "#f0e6c8",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {r.name}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                {medal && <span style={{ fontSize: 12 }}>{medal}</span>}
                {isTop && (
                  <span style={{
                    background: "linear-gradient(90deg,#8a5f10,#d4af37)",
                    color: "#fff", fontSize: 8, fontWeight: 900,
                    padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
                  }}>★ WIN</span>
                )}
              </div>
            </div>

            {/* Bars */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 0, overflow: "hidden" }}>
              <BarRow label="BUY" labelColor="#5a8a6a" width={bw} minInside={MIN_INSIDE}
                gradient="linear-gradient(90deg,#1b5e3b,#4caf7d)" value={r.buyAmt} barMax={BAR_MAX} />
              <BarRow label="OUT" labelColor="#4a6a9a" width={cw} minInside={MIN_INSIDE}
                gradient="linear-gradient(90deg,#1a3a7e,#4a8cdf)" value={r.cashAmt} barMax={BAR_MAX} />
            </div>

            {/* P&L */}
            <div style={{
              width: PROFIT_W, textAlign: "right", flexShrink: 0,
              fontSize: rowH >= 70 ? 18 : 14,
              fontWeight: 900, letterSpacing: 0.5,
              color: r.profit > 0 ? "#4cef90" : r.profit < 0 ? "#ff4d4d" : "#aaa",
              textShadow: r.profit > 0
                ? "0 0 12px rgba(76,239,144,0.5)"
                : r.profit < 0 ? "0 0 12px rgba(255,77,77,0.5)" : "none",
            }}>
              {r.profit > 0 ? "+" : ""}{fmtN(r.profit)}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "linear-gradient(160deg,#1e2235 0%,#111624 60%,#181d2e 100%)",
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
      <div style={{ position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:"rgba(212,175,55,0.05)",pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:-30,left:-30,width:130,height:130,borderRadius:"50%",background:"rgba(212,175,55,0.04)",pointerEvents:"none" }} />

      {/* ── HEADER ── */}
      <div style={{ padding:`14px ${H_PAD}px 8px`, textAlign:"center", flexShrink:0 }}>
        <div style={{ fontSize:11,color:"#8a7a5a",letterSpacing:3,textTransform:"uppercase",marginBottom:3 }}>
          ♠ &nbsp;GO POKER&nbsp; ♠
        </div>
        <div style={{ fontSize:24,fontWeight:900,letterSpacing:2,textTransform:"uppercase",color:"#f0e6c8",lineHeight:1.15 }}>
          {gameName || "POKER SUMMARY"}
        </div>
        <div style={{ fontSize:11,color:"#7a6a4a",letterSpacing:1.5,marginTop:3,textTransform:"uppercase" }}>
          {mode==="CASH"?"Cash Game":"Tournament"}&nbsp;·&nbsp;{today}
        </div>

        {/* Pills */}
        <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:8,flexWrap:"wrap" }}>
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
      <div style={{ height:1,background:"linear-gradient(90deg,transparent,#7a6030,transparent)",margin:`0 ${H_PAD}px 6px`,flexShrink:0 }} />

      {/* Legend */}
      <div style={{ display:"flex",gap:14,padding:`0 ${H_PAD}px 6px`,justifyContent:"flex-end",flexShrink:0 }}>
        <LegendDot color="#4caf7d">Buy-In</LegendDot>
        <LegendDot color="#4a8cdf">Cash Out</LegendDot>
      </div>

      {/* ── PLAYER AREA ── */}
      <div style={{
        flex: 1,
        display: "flex",
        gap: 10,
        padding: `0 ${H_PAD}px`,
        overflow: "hidden",
      }}>
        {renderRows(left, 0)}
        {useTwoCol && renderRows(right, half)}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop:"1px solid rgba(122,96,48,0.25)",
        padding:"7px 28px",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        flexShrink:0,
      }}>
        <span style={{ fontSize:12,color:"#4a4030" }}>♠ ♥ ♣ ♦</span>
        <span style={{ fontSize:10,color:"#5a5040",letterSpacing:2,textTransform:"uppercase" }}>
          Go Poker — Premium Edition
        </span>
        <span style={{ fontSize:12,color:"#4a4030" }}>♦ ♣ ♥ ♠</span>
      </div>

      {/* Gold bottom bar */}
      <div style={{ height:4,background:"linear-gradient(90deg,#3a2808,#d4af37,#3a2808)",flexShrink:0 }} />

      {/* Watermark */}
      {watermark && (
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none" }}>
          <div style={{ fontSize:48,fontWeight:900,color:"rgba(255,255,255,0.07)",letterSpacing:6,textTransform:"uppercase",transform:"rotate(-30deg)",userSelect:"none",whiteSpace:"nowrap" }}>
            GO POKER TRIAL
          </div>
        </div>
      )}
    </div>
  );
});

SummaryCard.displayName = "SummaryCard";

/* ── sub-components ── */

function Pill({ color, bg, border, children }: { color:string; bg:string; border:string; children:React.ReactNode }) {
  return (
    <div style={{ background:bg,border:`1px solid ${border}`,borderRadius:20,padding:"4px 14px",fontSize:12,color,fontWeight:700 }}>
      {children}
    </div>
  );
}

function LegendDot({ color, children }: { color:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#7a6a4a" }}>
      <div style={{ width:9,height:9,borderRadius:2,background:color,flexShrink:0 }} />
      {children}
    </div>
  );
}

function BarRow({ label, labelColor, width, gradient, value, barMax, minInside }: {
  label: string; labelColor: string; width: number; gradient: string;
  value: number; barMax: number; minInside: number;
}) {
  const showInside = width >= minInside;

  return (
    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
      {/* Label */}
      <span style={{
        fontSize:9,fontWeight:700,color:labelColor,
        width:52,textAlign:"right",flexShrink:0,
        textTransform:"uppercase",letterSpacing:0.5,
      }}>
        {label}
      </span>

      {/* Bar */}
      {value > 0 ? (
        <div style={{ display:"flex",alignItems:"center",gap:5,minWidth:0,flex:1 }}>
          <div style={{
            height:20,
            width,
            maxWidth:barMax,
            minWidth:8,
            background:gradient,
            borderRadius:5,
            flexShrink:0,
            overflow:"hidden",
            display:"flex",alignItems:"center",
            paddingLeft: showInside ? 7 : 0,
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>
            {showInside && (
              <span style={{ fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap" }}>
                {fmtN(value)}
              </span>
            )}
          </div>
          {/* Number outside bar if bar too narrow */}
          {!showInside && (
            <span style={{ fontSize:10,fontWeight:700,color:"#c0d0c0",whiteSpace:"nowrap",flexShrink:0 }}>
              {fmtN(value)}
            </span>
          )}
        </div>
      ) : (
        <span style={{ color:"#3a3a4a",fontSize:13,marginLeft:4 }}>—</span>
      )}
    </div>
  );
}
