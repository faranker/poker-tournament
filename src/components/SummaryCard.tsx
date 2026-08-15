import { forwardRef } from "react";

type Result = {
  name: string; count: number; total: number; profit: number;
  prize?: number; bounty?: number; rank?: number | null;
};
interface Props {
  mode: "TOURNAMENT" | "CASH";
  gameName: string;
  players: { name: string; buyInTotal: number; bounty: number; cashout: number; count: number }[];
  allResults: Result[];
  prizeWinners: { name: string; amount: number; count: number; profit: number }[];
  buyIn: number; prizePool: number; modeBounty: boolean; bountyPool: number; watermark?: boolean;
}

const fmtN = (n: number) => n.toLocaleString("en-US");
const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  "#c0392b","#2980b9","#27ae60","#e67e22","#8e44ad",
  "#16a085","#d35400","#2c3e50","#7f8c8d","#1abc9c",
  "#c0392b","#2980b9","#27ae60","#e67e22","#8e44ad",
  "#16a085","#d35400","#2c3e50","#9b59b6","#3498db",
];

const CARD_W = 1080;
const CARD_H = 607;  // 16:9

export const SummaryCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { mode, gameName, players, allResults, buyIn, prizePool, modeBounty, bountyPool, watermark } = props;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();

  /* ── Build rows ── */
  type RowData = { name: string; buyAmt: number; cashAmt: number; profit: number; rank: number | null };
  const rows: RowData[] = allResults.map((r) => {
    const p = players.find((pl) => pl.name === r.name);
    if (mode === "CASH") return {
      name: r.name, buyAmt: p?.buyInTotal ?? 0,
      cashAmt: p?.cashout ?? r.total ?? 0, profit: r.profit, rank: null,
    };
    return {
      name: r.name, buyAmt: (p?.count ?? 0) * buyIn,
      cashAmt: r.total ?? 0, profit: r.profit, rank: r.rank ?? null,
    };
  });

  const totalPool = mode === "CASH" ? players.reduce((s, p) => s + p.buyInTotal, 0) : prizePool;
  const maxVal    = Math.max(...rows.flatMap((r) => [r.buyAmt, r.cashAmt]), 1);
  const medal     = (rank: number | null) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank ? `#${rank}` : "";

  /* ── Layout decision ── */
  const TWO_COL   = rows.length > 10;
  const H_PAD     = 28;
  const COL_GAP   = 14;

  /* Heights */
  const HEADER_H  = 148;
  const FOOTER_H  = 36;
  const BODY_H    = CARD_H - HEADER_H - FOOTER_H;   // ~423px

  /* Per-column row count */
  const perCol    = TWO_COL ? Math.ceil(rows.length / 2) : rows.length;
  const ROW_GAP   = 5;
  const rowH      = Math.floor((BODY_H - ROW_GAP * (perCol - 1)) / perCol);

  /* Bar geometry */
  const colW      = TWO_COL
    ? (CARD_W - H_PAD * 2 - COL_GAP) / 2
    : CARD_W - H_PAD * 2;
  const AV_SIZE   = Math.min(Math.max(rowH - 14, 22), 38);
  const NAME_W    = 130;
  const PL_W      = 90;
  const LBL_W     = 46;
  const BAR_MAX   = Math.floor(colW - 12 * 2 - AV_SIZE - 10 - NAME_W - 10 - LBL_W - 6 - PL_W - 4);

  const bw = (v: number) => v > 0 ? Math.max(6, Math.round((v / maxVal) * BAR_MAX)) : 0;

  /* ── Render one player row ── */
  const PlayerRow = ({ r, idx }: { r: RowData; idx: number }) => {
    const isTop = idx === 0 && r.profit > 0;
    const buyW  = bw(r.buyAmt);
    const outW  = bw(r.cashAmt);
    const fs    = rowH >= 68 ? 15 : 12;
    const profFs = rowH >= 68 ? 18 : 14;

    return (
      <div style={{
        height: rowH, boxSizing: "border-box",
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 12px",
        borderRadius: 10,
        background: isTop
          ? "linear-gradient(90deg,rgba(212,175,55,0.13),rgba(212,175,55,0.04))"
          : idx % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.01)",
        border: isTop
          ? "1px solid rgba(212,175,55,0.32)"
          : "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* Avatar */}
        <div style={{
          width: AV_SIZE, height: AV_SIZE, flexShrink: 0,
          borderRadius: "50%", background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          border: isTop ? "2.5px solid #d4af37" : "2px solid rgba(255,255,255,0.15)",
          boxShadow: isTop ? "0 0 10px rgba(212,175,55,0.5)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.round(AV_SIZE * 0.35), fontWeight: 800, color: "#fff",
        }}>
          {getInitials(r.name)}
        </div>

        {/* Name */}
        <div style={{ width: NAME_W, flexShrink: 0, overflow: "hidden" }}>
          <div style={{
            fontWeight: 800, fontSize: fs, letterSpacing: 0.3,
            color: isTop ? "#f5d060" : "#f0e6c8", textTransform: "uppercase",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{r.name}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 1, alignItems: "center" }}>
            {medal(r.rank) && <span style={{ fontSize: 11 }}>{medal(r.rank)}</span>}
            {isTop && (
              <span style={{
                background: "linear-gradient(90deg,#8a5f10,#d4af37)", color: "#fff",
                fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
              }}>★ WIN</span>
            )}
          </div>
        </div>

        {/* Bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <Bar label="BUY" lc="#4a8a5a" w={buyW}  v={r.buyAmt}  g="linear-gradient(90deg,#1b5e3b,#4caf7d)" max={BAR_MAX}/>
          <Bar label="OUT" lc="#3a6a9a" w={outW} v={r.cashAmt} g="linear-gradient(90deg,#1a3a7e,#4a8cdf)" max={BAR_MAX}/>
        </div>

        {/* P&L */}
        <div style={{
          width: PL_W, flexShrink: 0, textAlign: "right",
          fontSize: profFs, fontWeight: 900, letterSpacing: 0.4,
          color: r.profit > 0 ? "#4cef90" : r.profit < 0 ? "#ff4d4d" : "#888",
          textShadow: r.profit > 0 ? "0 0 14px rgba(76,239,144,0.55)"
            : r.profit < 0 ? "0 0 14px rgba(255,77,77,0.55)" : "none",
        }}>
          {r.profit > 0 ? "+" : ""}{fmtN(r.profit)}
        </div>
      </div>
    );
  };

  const left  = TWO_COL ? rows.slice(0, 10) : rows;
  const right = TWO_COL ? rows.slice(10)    : [];

  return (
    <div ref={ref} style={{
      width: CARD_W, height: CARD_H, boxSizing: "border-box",
      background: "linear-gradient(160deg,#1e2235 0%,#111624 60%,#181d2e 100%)",
      borderRadius: 18, border: "2px solid #7a6030",
      fontFamily: "'Inter','Segoe UI',sans-serif", color: "#f0e6c8",
      overflow: "hidden", position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      {/* Gold bar top */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#3a2808,#d4af37,#3a2808)", flexShrink: 0 }}/>

      {/* BG glow */}
      <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"rgba(212,175,55,0.05)",pointerEvents:"none" }}/>
      <div style={{ position:"absolute",bottom:-40,left:-40,width:150,height:150,borderRadius:"50%",background:"rgba(212,175,55,0.04)",pointerEvents:"none" }}/>

      {/* ── HEADER ── */}
      <div style={{ padding:`14px ${H_PAD}px 0`, textAlign:"center", flexShrink:0 }}>
        <div style={{ fontSize:11,color:"#8a7a5a",letterSpacing:3,textTransform:"uppercase",marginBottom:3 }}>♠ &nbsp;GO POKER&nbsp; ♠</div>
        <div style={{ fontSize:24,fontWeight:900,letterSpacing:2,textTransform:"uppercase",color:"#f0e6c8",lineHeight:1.15 }}>
          {gameName || "POKER SUMMARY"}
        </div>
        <div style={{ fontSize:11,color:"#7a6a4a",letterSpacing:1.5,marginTop:3,textTransform:"uppercase" }}>
          {mode==="CASH"?"Cash Game":"Tournament"}&nbsp;·&nbsp;{today}
        </div>
        <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:8 }}>
          <Pill color="#d4af37" bg="rgba(212,175,55,0.12)" border="rgba(212,175,55,0.3)">Total Pool: {fmtN(totalPool)}</Pill>
          {modeBounty && <Pill color="#e57a7a" bg="rgba(229,9,20,0.12)" border="rgba(229,9,20,0.3)">Bounty: {fmtN(bountyPool)}</Pill>}
          <Pill color="#9a8a6a" bg="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.1)">{players.length} Players</Pill>
        </div>
      </div>

      {/* Divider + Legend */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:`10px ${H_PAD}px 8px`,flexShrink:0 }}>
        <div style={{ height:1,flex:1,background:"linear-gradient(90deg,transparent,#7a6030,transparent)" }}/>
        <div style={{ display:"flex",gap:14,marginLeft:16 }}>
          <LegendDot color="#4caf7d">Buy-In</LegendDot>
          <LegendDot color="#4a8cdf">Cash Out</LegendDot>
        </div>
      </div>

      {/* ── BODY: player rows ── */}
      <div style={{ flex:1, display:"flex", gap:COL_GAP, padding:`0 ${H_PAD}px`, overflow:"hidden", minHeight:0 }}>
        {/* Left / single column */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:ROW_GAP }}>
          {left.map((r, i) => <PlayerRow key={i} r={r} idx={i}/>)}
        </div>
        {/* Right column (only when TWO_COL) */}
        {TWO_COL && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:ROW_GAP }}>
            {right.map((r, i) => <PlayerRow key={i} r={r} idx={10 + i}/>)}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop:"1px solid rgba(122,96,48,0.2)", padding:"8px 28px",
        display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,
      }}>
        <span style={{ fontSize:12,color:"#4a4030" }}>♠ ♥ ♣ ♦</span>
        <span style={{ fontSize:10,color:"#5a5040",letterSpacing:2,textTransform:"uppercase" }}>Go Poker — Premium Edition</span>
        <span style={{ fontSize:12,color:"#4a4030" }}>♦ ♣ ♥ ♠</span>
      </div>

      {/* Gold bar bottom */}
      <div style={{ height:4,background:"linear-gradient(90deg,#3a2808,#d4af37,#3a2808)",flexShrink:0 }}/>

      {/* Watermark */}
      {watermark && (
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none" }}>
          <div style={{ fontSize:52,fontWeight:900,color:"rgba(255,255,255,0.07)",letterSpacing:6,textTransform:"uppercase",transform:"rotate(-30deg)",userSelect:"none",whiteSpace:"nowrap" }}>
            GO POKER TRIAL
          </div>
        </div>
      )}
    </div>
  );
});

SummaryCard.displayName = "SummaryCard";

/* ── helpers ── */

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
      <div style={{ width:9,height:9,borderRadius:2,background:color }}/>
      {children}
    </div>
  );
}

function Bar({ label, lc, w, v, g, max }: {
  label:string; lc:string; w:number; v:number; g:string; max:number;
}) {
  const THRESH = 58; // px — show number inside if bar wider than this
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
      <span style={{ fontSize:9,fontWeight:700,color:lc,width:46,textAlign:"right",flexShrink:0,textTransform:"uppercase",letterSpacing:.5 }}>
        {label}
      </span>
      {v > 0 ? (
        <div style={{ display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0 }}>
          <div style={{
            height:18, width:w, maxWidth:max, minWidth:6, flexShrink:0,
            background:g, borderRadius:4,
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15)",
            display:"flex",alignItems:"center",
            paddingLeft: w >= THRESH ? 6 : 0,
            overflow:"hidden",
          }}>
            {w >= THRESH && (
              <span style={{ fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap" }}>{fmtN(v)}</span>
            )}
          </div>
          {w < THRESH && (
            <span style={{ fontSize:10,fontWeight:700,color:"#b0c4b0",whiteSpace:"nowrap",flexShrink:0 }}>{fmtN(v)}</span>
          )}
        </div>
      ) : (
        <span style={{ color:"#3a3a4a",fontSize:13,marginLeft:2 }}>—</span>
      )}
    </div>
  );
}
