// Poker Tournament Timer — Responsive UI + i18n
import { useState, useEffect, useRef } from "react";
import styled, { createGlobalStyle, keyframes, css } from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import html2canvas from "html2canvas";
import {
  Plus, X, Play, Pause, SkipBack, SkipForward,
  Coffee, Camera, Trophy, Banknote, TrendingUp, TrendingDown, Check, ChevronDown,
} from "lucide-react";
import { SummaryCard } from "./components/SummaryCard";
import { LoginModal, NavLoginBtn } from "./components/LoginModal";
import { PricingModal } from "./components/PricingModal";
import { PaymentModal } from "./components/PaymentModal";
import { AppDialog, type DialogConfig } from "./components/AppDialog";
import {
  getSessionUser, refreshUser, type AuthUser, type Plan,
  getExportCount, incExportCount,
  FREE_MAX_PLAYERS, FREE_MAX_EXPORTS,
  PLAN_COLORS,
} from "./auth";
import { supabase } from "./lib/supabase";

/* ─────────────────────────────────────────
   i18n
───────────────────────────────────────── */
type Lang = "TH" | "EN";

const T = {
  TH: {
    tournament: "Tournament", cashGame: "Cash Game",
    settings: "ตั้งค่า", players: "ผู้เล่น", summary: "สรุป", timer: "จับเวลา",
    gameName: "ชื่อเกม", gameNamePh: "เช่น Friday Night Cash",
    blindLevel: "Blind Level", defaultBuy: "จำนวน Buy-in ต่อครั้ง",
    addPlayer: "เพิ่มผู้เล่น", buyIn: "Buy-in", cashOut: "Cash Out",
    totalBuyIn: "Total Buy-in", totalCashout: "Total Cashout",
    difference: "ผลต่าง", balanced: "สมดุล",
    playerResults: "ผลลัพธ์ผู้เล่น",
    shareToLine: "แชร์ LINE", exportImg: "ส่งออกรูป",
    theme: "ธีม", language: "ภาษา",
    structure: "โครงสร้าง", addLevel: "เพิ่ม Level",
    buyInAmount: "ราคา Buy-in", payoutPct: "% รางวัล", addPayout: "เพิ่ม",
    bountyLabel: "Bounty", enableBounty: "เปิด Hunter Bounty", bountyPct: "% Bounty",
    prizePool: "กองรางวัล", bountyPool: "Bounty Pool", perBounty: "ต่อหัว",
    level: "Level", blinds: "Blinds", ante: "Ante",
    start: "เริ่ม", pause: "หยุด",
    prev: "ก่อน", next: "ถัดไป",
    breakTime: "พัก", resumeTime: "เล่นต่อ",
    leaderboard: "อันดับ", results: "ผลลัพธ์", player: "ผู้เล่น", prize: "รางวัล",
    confirmMode: (m: string) => `เปลี่ยนโหมดเป็น ${m}\nข้อมูลทั้งหมดจะถูกล้าง ยืนยันหรือไม่?`,
    confirmRemove: (n: string) => `ลบ "${n}" ใช่ไหม?`,
    confirmDelLevel: "ลบ level นี้?",
    playerNamePrompt: "ชื่อผู้เล่น",
    invalidNum: "กรอกตัวเลขให้ถูกต้อง",
    amtExceeded: "จำนวนเกิน",
    noPlayer: "ยังไม่มีผู้เล่น",
    date: "วันที่", modeLabel: "โหมด",
  },
  EN: {
    tournament: "Tournament", cashGame: "Cash Game",
    settings: "Settings", players: "Players", summary: "Summary", timer: "Timer",
    gameName: "Game Name", gameNamePh: "e.g. Friday Night Cash",
    blindLevel: "Blind Level", defaultBuy: "Default Buy-in",
    addPlayer: "Add Player", buyIn: "Buy-in", cashOut: "Cash Out",
    totalBuyIn: "Total Buy-in", totalCashout: "Total Cashout",
    difference: "Difference", balanced: "Balanced",
    playerResults: "Player Results",
    shareToLine: "Share LINE", exportImg: "Export",
    theme: "Theme", language: "Language",
    structure: "Structure", addLevel: "Add Level",
    buyInAmount: "Buy-in Amount", payoutPct: "Payout %", addPayout: "Add",
    bountyLabel: "Bounty", enableBounty: "Enable Hunter Bounty", bountyPct: "Bounty %",
    prizePool: "Prize Pool", bountyPool: "Bounty Pool", perBounty: "Per Bounty",
    level: "Level", blinds: "Blinds", ante: "Ante",
    start: "Start", pause: "Pause",
    prev: "Prev", next: "Next",
    breakTime: "Break", resumeTime: "Resume",
    leaderboard: "Leaderboard", results: "Results", player: "Player", prize: "Prize",
    confirmMode: (m: string) => `Switch to ${m} mode?\nAll data will be cleared. Continue?`,
    confirmRemove: (n: string) => `Remove "${n}"?`,
    confirmDelLevel: "Delete this level?",
    playerNamePrompt: "Player Name",
    invalidNum: "Please enter a valid number",
    amtExceeded: "Amount exceeded",
    noPlayer: "No players yet",
    date: "Date", modeLabel: "Mode",
  },
} as const;

/* ─────────────────────────────────────────
   Theme System
───────────────────────────────────────── */
type ThemeKey = "dark" | "light" | "neon" | "casino";

const themeVars: Record<ThemeKey, string> = {
  dark: `
    --bg:#0a0a10; --surface:#13131f; --surface2:#1c1c2e; --surface3:#252540;
    --border:#2e2e4a; --border2:#3d3d60;
    --text:#f0f0f8; --text-muted:#7878a8; --text-dim:#4a4a70;
    --accent:#e50914; --accent-soft:rgba(229,9,20,.15); --accent-glow:rgba(229,9,20,.4);
    --success:#22c55e; --success-soft:rgba(34,197,94,.15);
    --info:#3b82f6; --discord:#7289da; --gold:#f5c542; --silver:#c0c0c0; --bronze:#cd7f32;
    --timer-color:#fff; --progress-bg:#2e2e4a; --tag-winner:#1e3a8a;
    --shadow:0 4px 24px rgba(0,0,0,.5); --shadow-lg:0 8px 40px rgba(0,0,0,.7);
    --radius:14px; --radius-sm:8px;`,
  light: `
    --bg:#eeeef5; --surface:#fff; --surface2:#f4f4fb; --surface3:#e8e8f4;
    --border:#dcdcee; --border2:#c8c8e0;
    --text:#18182e; --text-muted:#6060a0; --text-dim:#a0a0c0;
    --accent:#e50914; --accent-soft:rgba(229,9,20,.08); --accent-glow:rgba(229,9,20,.2);
    --success:#16a34a; --success-soft:rgba(22,163,74,.1);
    --info:#2563eb; --discord:#5b70c4; --gold:#d4a017; --silver:#888; --bronze:#a0522d;
    --timer-color:#18182e; --progress-bg:#e0e0f0; --tag-winner:#dbeafe;
    --shadow:0 2px 16px rgba(0,0,0,.08); --shadow-lg:0 6px 32px rgba(0,0,0,.12);
    --radius:14px; --radius-sm:8px;`,
  neon: `
    --bg:#04040e; --surface:#0b0b1e; --surface2:#10102a; --surface3:#181836;
    --border:rgba(120,80,255,.2); --border2:rgba(120,80,255,.4);
    --text:#d8d8ff; --text-muted:#6060a0; --text-dim:#303060;
    --accent:#a855f7; --accent-soft:rgba(168,85,247,.15); --accent-glow:rgba(168,85,247,.5);
    --success:#06d6a0; --success-soft:rgba(6,214,160,.15);
    --info:#00d4ff; --discord:#7289da; --gold:#f0c060; --silver:#a0a0d0; --bronze:#c06040;
    --timer-color:#e0d0ff; --progress-bg:#181836; --tag-winner:#2d1060;
    --shadow:0 4px 24px rgba(80,0,160,.3); --shadow-lg:0 8px 40px rgba(80,0,160,.5);
    --radius:14px; --radius-sm:8px;`,
  casino: `
    --bg:#091409; --surface:#0e1e0e; --surface2:#152815; --surface3:#1e361e;
    --border:#2a4a2a; --border2:#3a6a3a;
    --text:#f0e6c8; --text-muted:#8a7a5a; --text-dim:#4a3a2a;
    --accent:#d4af37; --accent-soft:rgba(212,175,55,.15); --accent-glow:rgba(212,175,55,.4);
    --success:#4ade80; --success-soft:rgba(74,222,128,.15);
    --info:#60a5fa; --discord:#7289da; --gold:#ffd700; --silver:#c0c0c0; --bronze:#cd7f32;
    --timer-color:#f0e6c8; --progress-bg:#1e361e; --tag-winner:#1a3a1a;
    --shadow:0 4px 24px rgba(0,0,0,.6); --shadow-lg:0 8px 40px rgba(0,0,0,.8);
    --radius:14px; --radius-sm:8px;`,
};

const themeSwatches: Record<ThemeKey, { label: string; color: string }> = {
  dark:   { label: "Dark",   color: "#e50914" },
  light:  { label: "Light",  color: "#f0f0f0" },
  neon:   { label: "Neon",   color: "#a855f7" },
  casino: { label: "Casino", color: "#d4af37" },
};

const AVATAR_COLORS = [
  "#e53935","#1e88e5","#43a047","#fb8c00",
  "#8e24aa","#00897b","#d81b60","#3949ab","#f4511e","#0288d1",
];

/* ─────────────────────────────────────────
   Global Styles
───────────────────────────────────────── */
const GlobalStyle = createGlobalStyle<{ $t: ThemeKey }>`
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{ ${p => themeVars[p.$t]} }
  body{background:var(--bg);color:var(--text);font-family:'Kanit',system-ui,sans-serif;
       -webkit-font-smoothing:antialiased;font-size:16px;}
  input[type=number]::-webkit-inner-spin-button{opacity:1}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:var(--surface2)}
  ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

/* ─────────────────────────────────────────
   Animations
───────────────────────────────────────── */
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const pulse  = keyframes`0%,100%{opacity:1}50%{opacity:.5}`;
const glow   = keyframes`
  0%,100%{text-shadow:0 0 20px var(--accent-glow),0 0 40px var(--accent-glow)}
  50%{text-shadow:0 0 32px var(--accent-glow),0 0 64px var(--accent-glow)}`;

/* ─────────────────────────────────────────
   Layout
───────────────────────────────────────── */
const Page = styled.div`min-height:100vh;background:var(--bg);animation:${fadeIn} .25s ease;display:flex;flex-direction:column;`;
const PageBody = styled.div`flex:1;background:var(--surface2);display:flex;flex-direction:column;`;

/* ── Header ── */
const Header = styled.header`
  background:var(--surface);border-bottom:1px solid var(--border);
  padding:0 20px;height:56px;display:flex;align-items:center;
  justify-content:space-between;gap:12px;position:sticky;top:0;z-index:200;
  box-shadow:var(--shadow);

  @media(max-width:768px){padding:0 14px;height:52px;}
`;

const LogoImg = styled.img`
  height:60px;width:auto;object-fit:contain;
  @media(max-width:480px){height:28px;}
`;

const ModeTabs = styled.div`
  display:flex;background:var(--surface2);border-radius:10px;
  padding:3px;gap:2px;border:1px solid var(--border);
  @media(max-width:480px){display:none}
`;
const ModeTab = styled.button<{$active?:boolean}>`
  padding:5px 14px;border-radius:8px;border:none;font-size:14px;font-weight:700;
  cursor:pointer;white-space:nowrap;transition:all .18s;
  ${p=>p.$active
    ? css`background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--accent-glow);`
    : css`background:transparent;color:var(--text-muted);&:hover{background:var(--surface3);color:var(--text);}`}
`;

const HeaderRight = styled.div`display:flex;align-items:center;gap:8px;`;

const LangTrigger = styled(Select.Trigger)`
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 10px;border-radius:7px;border:1px solid var(--border);
  background:var(--surface2);color:var(--text-muted);font-size:15px;font-weight:700;
  cursor:pointer;outline:none;font-family:inherit;transition:all .18s;
  &:hover{border-color:var(--border2);color:var(--text);}
  &[data-state=open]{border-color:var(--border2);color:var(--text);}
  svg{width:12px;height:12px;flex-shrink:0;}
`;
const LangContent = styled(Select.Content)`
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius-sm);
  box-shadow:var(--shadow-lg);overflow:hidden;z-index:500;min-width:130px;
`;
const LangItem = styled(Select.Item)`
  display:flex;align-items:center;gap:8px;
  padding:9px 14px;font-size:15px;font-weight:600;font-family:inherit;
  color:var(--text);cursor:pointer;outline:none;transition:background .12s;
  &[data-highlighted]{background:var(--surface2);}
  &[data-state=checked]{color:var(--accent);font-weight:800;}
`;

const ThemeRow = styled.div`display:flex;align-items:center;gap:5px;`;

const NavAvatar = styled.button<{$color:string}>`
  width:34px;height:34px;border-radius:50%;border:2px solid ${p=>p.$color};
  background:${p=>p.$color}22;color:${p=>p.$color};
  font-size:15px;font-weight:900;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  position:relative;transition:all .18s;flex-shrink:0;
  &:hover{background:${p=>p.$color}44;transform:scale(1.08);}
  @media(max-width:480px){width:30px;height:30px;font-size:13px;}
`;
const NavAvatarDot = styled.span<{$color:string}>`
  position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;
  background:${p=>p.$color};border:2px solid var(--surface);
`;
const Swatch = styled.button<{$c:string;$active?:boolean}>`
  width:20px;height:20px;border-radius:50%;border:2px solid ${p=>p.$active?"var(--text)":"transparent"};
  background:${p=>p.$c};cursor:pointer;transition:all .18s;&:hover{transform:scale(1.2);}
`;

/* ── Mobile Tab Bar ── */
const MobileTabBar = styled.nav`
  display:none;
  @media(max-width:768px){
    display:flex;background:var(--surface);border-bottom:1px solid var(--border);
    position:sticky;top:52px;z-index:190;
  }
`;
const MobileTabBtn = styled.button<{$active?:boolean}>`
  flex:1;padding:11px 4px;border:none;background:transparent;cursor:pointer;
  font-size:15px;font-weight:600;transition:all .18s;
  color:${p=>p.$active?"var(--accent)":"var(--text-muted)"};
  border-bottom:2px solid ${p=>p.$active?"var(--accent)":"transparent"};
  &:hover{color:var(--text);}
`;

/* ── Mode select for mobile ── */
const MobileModeRow = styled.div`
  display:none;
  @media(max-width:480px){
    display:flex;gap:8px;padding:12px 14px 0;
  }
`;
const MobileModeBtn = styled.button<{$active?:boolean}>`
  flex:1;padding:8px;border-radius:9px;border:1.5px solid;font-size:15px;font-weight:700;cursor:pointer;
  transition:all .18s;
  ${p=>p.$active
    ? css`background:var(--accent);color:#fff;border-color:var(--accent);`
    : css`background:transparent;color:var(--text-muted);border-color:var(--border);&:hover{border-color:var(--accent);color:var(--accent);}`}
`;

/* ── Content Grid ── */
const Content = styled.main`
  padding:0;
  flex:1;display:flex;flex-direction:column;
  @media(max-width:768px){padding:10px;}
`;

/* Desktop 3-col grid */
const ThreeCols = styled.div`
  display:grid;
  grid-template-columns:400px 1fr 400px;
  gap:0;
  flex:1;
  @media(max-width:1300px){grid-template-columns:340px 1fr 340px;}
  @media(max-width:1100px){grid-template-columns:300px 1fr 300px;}
  @media(max-width:768px){display:none;}
`;

/* Column with vertical divider — flattens Card inside */
/* Mobile: single column panels hidden/shown by tab */
const MobilePanel = styled.div<{$show?:boolean}>`
  display:none;
  @media(max-width:768px){display:${p=>p.$show?"block":"none"};}
`;

/* ─────────────────────────────────────────
   Card
───────────────────────────────────────── */
const Card = styled.div`
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);
  @media(max-width:768px){padding:14px;}
`;

/* Column with vertical divider — flattens Card inside */
const Col = styled.div`
  padding:16px 20px;
  border-right:1px solid var(--border);
  &:last-child{border-right:none;}
  ${Card}{
    background:transparent;border:none;box-shadow:none;
    border-radius:0;padding:16px 0;
    &:first-child{padding-top:0;}
  }
`;

/* Timer column — keeps TimerCard gradient, just adds divider */
const TimerCol = styled.div`
  border-right:1px solid var(--border);
  &:last-child{border-right:none;}
`;

const CardHead = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:14px;gap:8px;flex-wrap:wrap;
`;

const CardTitle = styled.h2`
  font-size:16px;font-weight:800;color:var(--text);
  display:flex;align-items:center;gap:7px;
  &::before{content:'';display:inline-block;width:3px;height:15px;
    background:var(--accent);border-radius:2px;}
`;

const Label = styled.p`
  font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--text-muted);margin-bottom:5px;margin-top:12px;
  &:first-child{margin-top:0;}
`;

/* ─────────────────────────────────────────
   Inputs & Buttons
───────────────────────────────────────── */
const Input = styled.input`
  width:100%;padding:9px 12px;border-radius:var(--radius-sm);
  border:1.5px solid var(--border);background:var(--surface);
  color:var(--text);font-size:15px;font-family:inherit;transition:border-color .18s,box-shadow .18s;
  &:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
  &:hover:not(:focus){border-color:var(--border2);}
  &::placeholder{color:var(--text-dim);}
`;

type BtnV = "primary"|"secondary"|"success"|"danger"|"ghost"|"info"|"discord";
const Btn = styled.button<{$v?:BtnV;$sm?:boolean;$full?:boolean}>`
  display:inline-flex;align-items:center;justify-content:center;gap:5px;
  border:none;border-radius:var(--radius-sm);font-weight:600;cursor:pointer;
  transition:all .18s;white-space:nowrap;font-family:inherit;
  padding:${p=>p.$sm?"5px 11px":"8px 14px"};
  font-size:${p=>p.$sm?"11px":"13px"};
  width:${p=>p.$full?"100%":"auto"};

  ${p=>{switch(p.$v){
    case"primary":  return css`background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--accent-glow);&:hover{opacity:.88;transform:translateY(-1px);}`;
    case"success":  return css`background:var(--success);color:#fff;&:hover{opacity:.88;transform:translateY(-1px);}`;
    case"danger":   return css`background:transparent;color:var(--accent);border:1px solid var(--accent);&:hover{background:var(--accent-soft);}`;
    case"ghost":    return css`background:transparent;color:var(--text-muted);&:hover{background:var(--surface2);color:var(--text);}`;
    case"info":     return css`background:var(--info);color:#fff;&:hover{opacity:.88;}`;
    default:        return css`background:var(--surface3);color:var(--text);border:1px solid var(--border);&:hover{border-color:var(--border2);}`;
  }}}
  &:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}
  &:active:not(:disabled){transform:translateY(0) scale(.97);}
`;

const CheckLabel = styled.label`
  display:flex;align-items:center;gap:9px;cursor:pointer;color:var(--text);
  font-size:15px;padding:8px 10px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  input[type=checkbox]{width:15px;height:15px;accent-color:var(--accent);cursor:pointer;}
  &:hover{border-color:var(--border2);}
`;

/* ─────────────────────────────────────────
   Player Cards
───────────────────────────────────────── */
const Avatar = styled.div<{$c:string}>`
  width:36px;height:36px;border-radius:50%;background:${p=>p.$c};flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:800;color:#fff;letter-spacing:.5px;
`;

/* Desktop player row */
const PlayerRow = styled.div<{$winner?:boolean;$rank?:number}>`
  display:grid;
  grid-template-columns:40px 1fr 110px auto 120px 32px;
  align-items:center;gap:10px;
  padding:8px 10px;border-radius:10px;
  border:1px solid transparent;
  transition:all .15s;cursor:pointer;
  background:transparent;
  ${p=>p.$winner&&css`
    background:var(--surface2);
    border-color:var(--border);
    border-left:3px solid ${
      p.$rank===1?"var(--gold)":p.$rank===2?"var(--silver)":p.$rank===3?"var(--bronze)":"var(--border2)"};
    padding-left:8px;
  `}
  &:hover{background:var(--surface2);}
  @media(max-width:768px){display:none;}
`;

/* Mobile player card */
const PlayerCardMobile = styled.div`
  display:none;
  @media(max-width:768px){
    display:block;background:var(--surface2);border:1px solid var(--border);
    border-radius:12px;padding:12px 14px;margin-bottom:10px;
  }
`;

const PlayerCardTop = styled.div`
  display:flex;align-items:center;gap:10px;margin-bottom:10px;
`;

const PlayerName = styled.div`font-size:16px;font-weight:700;color:var(--text);`;
const PlayerSub  = styled.div`font-size:13px;color:var(--text-muted);margin-top:1px;`;

const MobileBuyBtns = styled.div`display:flex;gap:8px;margin-bottom:8px;`;
const MobileBuyBtn = styled.button<{$variant:"buy"|"sell"}>`
  flex:1;padding:8px;border-radius:8px;border:none;font-size:15px;font-weight:700;cursor:pointer;
  transition:all .18s;
  background:${p=>p.$variant==="buy"?"var(--success)":"var(--accent)"};
  color:#fff;
  &:hover{opacity:.88;}
`;

const CashOutRow = styled.div`display:flex;align-items:center;gap:8px;`;
const CashLabel = styled.span`font-size:14px;color:var(--text-muted);white-space:nowrap;`;
const CashInput = styled(Input)`font-size:16px;font-weight:700;`;

/* Count control (tournament) */
const CountBox = styled.div`
  display:inline-flex;align-items:center;gap:4px;
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:2px 4px;
`;
const CountBtn = styled.button`
  width:22px;height:22px;border-radius:5px;border:none;
  background:var(--surface3);color:var(--text);font-size:16px;font-weight:700;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  &:hover{background:var(--border2);}
`;

/* Desktop table header */
const TableHeader = styled.div`
  display:grid;
  grid-template-columns:40px 1fr 110px auto 120px 32px;
  gap:10px;padding:0 10px 8px;
  font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--text-muted);border-bottom:1px solid var(--border);margin-bottom:6px;
  @media(max-width:768px){display:none;}
`;

/* Rank badge */
const RankBadge = styled.span<{$pos:number}>`
  display:inline-flex;align-items:center;justify-content:center;
  min-width:26px;height:22px;padding:0 6px;border-radius:6px;
  font-size:13px;font-weight:900;margin-right:6px;letter-spacing:.02em;
  ${p=>p.$pos===1?css`background:var(--gold);color:#000;box-shadow:0 1px 6px rgba(245,197,66,.5);`
    :p.$pos===2?css`background:var(--silver);color:#000;box-shadow:0 1px 6px rgba(192,192,192,.4);`
    :p.$pos===3?css`background:var(--bronze);color:#fff;box-shadow:0 1px 6px rgba(205,127,50,.4);`
    :css`background:var(--surface3);color:var(--text-muted);`}
`;

/* ─────────────────────────────────────────
   Summary Panel
───────────────────────────────────────── */
const StatRow = styled.div`
  display:flex;justify-content:space-between;align-items:center;
  padding:9px 0;border-bottom:1px solid var(--border);font-size:16px;
  &:last-of-type{border-bottom:none;}
  .lbl{color:var(--text-muted);} .val{font-weight:700;}
`;

const BalanceBadge = styled.div<{$ok?:boolean}>`
  padding:5px 12px;border-radius:7px;font-size:14px;font-weight:700;
  ${p=>p.$ok
    ? css`background:var(--success-soft);color:var(--success);border:1px solid var(--success);`
    : css`background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent);`}
`;

const SummaryPlayerItem = styled.div`
  display:flex;align-items:center;gap:10px;padding:8px 0;
  border-bottom:1px solid var(--border);&:last-child{border-bottom:none;}
`;

const PLArrow = styled.span<{$pos?:boolean}>`
  display:inline-flex;align-items:center;
  color:${p=>p.$pos?"var(--success)":"var(--accent)"};
`;

const ShareBtns = styled.div`
  display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:14px;
  @media(max-width:768px){flex-direction:column;}
`;

/* ─────────────────────────────────────────
   Tournament / Timer
───────────────────────────────────────── */
const TimerCard = styled(Card)`
  display:flex;flex-direction:column;align-items:center;gap:16px;
  padding:28px 20px;position:relative;overflow:hidden;
  &::before{content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse at center top,var(--accent-soft) 0%,transparent 70%);
    pointer-events:none;}
`;
const LevelBadge = styled.div`
  font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
  color:var(--text-muted);background:var(--surface2);border:1px solid var(--border);
  padding:3px 14px;border-radius:20px;
`;

/* Circular timer */
const CircleWrap = styled.div`
  position:relative;display:flex;align-items:center;justify-content:center;
  width:200px;height:200px;
  @media(max-width:640px){width:160px;height:160px;}
`;
const CircleSvg = styled.svg`
  position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);
`;
const CircleTrack = styled.circle`
  fill:none;stroke:var(--progress-bg);stroke-width:8;
`;
const CircleProgress = styled.circle<{$urgent?:boolean}>`
  fill:none;stroke-width:8;stroke-linecap:round;
  stroke:${p=>p.$urgent?"var(--accent)":"var(--accent)"};
  filter:drop-shadow(0 0 6px var(--accent-glow));
  transition:stroke-dashoffset 1s linear;
`;
const CircleInner = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
`;
const BigTimer = styled.div<{$urgent?:boolean}>`
  font-size:52px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;
  letter-spacing:-1px;color:var(--timer-color);
  ${p=>p.$urgent&&css`color:var(--accent);animation:${glow} 1.5s ease-in-out infinite;`}
  @media(max-width:640px){font-size:42px;}
`;
const StatusLabel = styled.div<{$urgent?:boolean}>`
  font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:${p=>p.$urgent?"var(--accent)":"var(--text-muted)"};
`;

/* Blind cards */
const BlindsRow = styled.div`
  display:flex;gap:10px;width:100%;justify-content:center;
`;
const BlindCard = styled.div`
  flex:1;background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:10px 8px;text-align:center;
  .lbl{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
  .val{font-size:22px;font-weight:800;color:var(--text);}
  @media(max-width:640px){.val{font-size:18px;}}
`;

const TimerCtrl = styled.div`
  display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;
`;


/* Tournament table */
const TournTable = styled.table`
  width:100%;border-collapse:collapse;font-size:15px;
  th{background:var(--surface2);color:var(--text-muted);font-size:12px;font-weight:700;
     text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;text-align:left;
     border-bottom:1px solid var(--border);}
  td{padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text);}
  tbody tr:last-child td{border-bottom:none;}
  tbody tr{transition:background .15s;&:hover{background:var(--surface2);}}
`;
const TableScroll = styled.div`
  overflow-x:auto;border-radius:var(--radius-sm);border:1px solid var(--border);
`;
const ActiveDot = styled.span`
  display:inline-block;width:6px;height:6px;border-radius:50%;
  background:var(--accent);animation:${pulse} 1.4s ease infinite;
`;

/* Payout row */
const PayRow = styled.div`
  display:flex;align-items:center;gap:8px;margin-bottom:8px;
  .num{font-size:13px;color:var(--text-muted);font-weight:700;min-width:22px;}
`;

/* Prize pool box */
const PrizeBox = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:12px 14px;margin-bottom:12px;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;
`;
const PrizeItem = styled.div`
  .lbl{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;}
  .val{font-size:18px;font-weight:700;margin-top:2px;}
`;

/* Modal — Radix Dialog primitives */
const ModalOverlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;backdrop-filter:blur(4px);
`;
const ModalBox = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1001;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:22px;width:min(340px,90vw);box-shadow:var(--shadow-lg);
  &:focus{outline:none;}
  h3{font-size:15px;font-weight:800;margin-bottom:14px;}
`;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const BASE = import.meta.env.BASE_URL;
const levelUpSound = new Audio(`${BASE}sounds/short-alarm-clock.mp3`);
const fmt  = (s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
const fmtN = (n:number) => n?.toLocaleString("en-US") ?? "";
const initials = (name:string) =>
  name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase().slice(0,2);

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Result = {
  name:string;count:number;total:number;profit:number;
  prize?:number;bounty?:number;rank?:number|null;
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function App() {
  const [lang,   setLang]  = useState<Lang>("TH");
  const [theme,  setTheme] = useState<ThemeKey>("dark");
  const [mode,   setMode]  = useState<"TOURNAMENT"|"CASH">("CASH");
  const [mobileTab, setMobileTab] = useState<"players"|"summary"|"settings"|"timer">("players");

  /* ── Auth ── */
  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [showLogin,   setShowLogin]   = useState(false);
  const [loginReason, setLoginReason] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<{plan: Plan; cycle: "monthly"|"yearly"}|null>(null);

  const plan: Plan = user?.plan ?? "free";
  const [exportCount, setExportCount] = useState(0);

  /* ── App dialogs (replaces window.alert/confirm/prompt) ── */
  const [appDialog, setAppDialog] = useState<DialogConfig | null>(null);

  const showAlert = (message: string) =>
    new Promise<void>(resolve =>
      setAppDialog({ type:"alert", message, resolve:()=>{ resolve(); setAppDialog(null); } }));

  const showConfirm = (title: string, body?: string) =>
    new Promise<boolean>(resolve =>
      setAppDialog({ type:"confirm", title, body, resolve:(ok)=>{ resolve(ok); setAppDialog(null); } }));

  const showPrompt = (label: string, placeholder?: string) =>
    new Promise<string|null>(resolve =>
      setAppDialog({ type:"prompt", label, placeholder, resolve:(v)=>{ resolve(v); setAppDialog(null); } }));

  /* restore session on mount + listen for auth changes */
  useEffect(() => {
    getSessionUser().then(u => {
      setUser(u);
      if (u) getExportCount(u.id).then(setExportCount);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await getSessionUser();
        setUser(u);
        if (u) getExportCount(u.id).then(setExportCount);
      } else {
        setUser(null);
        setExportCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Refresh plan when tab comes back into focus ── */
  useEffect(() => {
    const onFocus = async () => {
      if (!user) return;
      const refreshed = await refreshUser(user.id);
      if (refreshed && refreshed.plan !== user.plan) {
        setUser(refreshed);
      }
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => window.removeEventListener("visibilitychange", onFocus);
  }, [user]);


  const t = (key: keyof typeof T.TH) => T[lang][key] as string;

  /* ── Tournament state ── */
  const [tournament, setTournament] = useState({
    name:"", buyIn:200, payouts:[50,30,20],
    rounds:[
      {sb:100,bb:200,ante:200,duration:10*60},
      {sb:200,bb:400,ante:400,duration:10*60},
      {sb:400,bb:800,ante:800,duration:10*60},
    ],
  });
  const [openModal,   setOpenModal]   = useState(false);
  const [newLevel,    setNewLevel]    = useState({sb:0,bb:0,ante:0,duration:0});
  const [roundIndex,  setRoundIndex]  = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(tournament.rounds[0]?.duration??0);
  const [running,     setRunning]     = useState(false);
  const [breakTime,   setBreakTime]   = useState(false);
  const [modeBounty,  setModeBounty]  = useState(false);
  const [bountyPct,   setBountyPct]   = useState(20);
  const [prizeWinners,setPrizeWinners]= useState<{name:string;amount:number;count:number;profit:number}[]>([]);

  /* ── Cash state ── */

  /* ── Shared players ── */
  const [players, setPlayers] = useState<{name:string;buyInTotal:number;bounty:number;cashout:number;count:number}[]>([]);

  const summaryRef = useRef<HTMLDivElement>(null);

  /* ── Timer ── */
  const round    = tournament.rounds[roundIndex] ?? {sb:0,bb:0,ante:0,duration:1};
  const progress = round.duration>0 ? (timeLeft/round.duration)*100 : 0;
  const isUrgent = progress<20 && running;

  useEffect(()=>{
    const r=tournament.rounds[roundIndex]; if(r) setTimeLeft(r.duration);
  },[roundIndex]);

  useEffect(()=>{
    if(!running) return;
    if(timeLeft<=0){
      levelUpSound.currentTime=0; levelUpSound.play().catch(()=>{});
      setRoundIndex(prev=>{
        const n=prev+1;
        if(n>=tournament.rounds.length){setRunning(false);return prev;}
        setTimeLeft(tournament.rounds[n].duration); return n;
      }); return;
    }
    const id=setInterval(()=>setTimeLeft(s=>s-1),1000);
    return ()=>clearInterval(id);
  },[running,timeLeft,tournament.rounds]);

  useEffect(()=>{levelUpSound.load();},[]);

  /* ── Calculations ── */
  const totalBuyIn   = players.reduce((s,p)=>s+p.count,0);
  const prizePool    = totalBuyIn * tournament.buyIn;
  const bountyPool   = modeBounty ? prizePool*(bountyPct/100) : 0;
  const normalPrize  = prizePool - bountyPool;
  const bountyPerHd  = totalBuyIn>0 ? bountyPool/totalBuyIn : 0;
  const MAX_WIN      = tournament.payouts.length;
  const prizes       = tournament.payouts.map(p=>Math.floor((p/100)*normalPrize));
  const sumBuyIn     = players.reduce((s,p)=>s+p.buyInTotal,0);
  const totalCashout = players.reduce((s,p)=>s+(p.cashout||0),0);
  const diff         = totalCashout - sumBuyIn;

  const isWinner  = (name:string) => prizeWinners.some(w=>w.name===name);
  const getPos    = (name:string) => { const i=prizeWinners.findIndex(w=>w.name===name); return i!==-1?i+1:null; };

  const allResults: Result[] = mode==="CASH"
    ? players.map(p=>({name:p.name,count:p.buyInTotal,total:p.cashout||0,profit:(p.cashout||0)-p.buyInTotal}))
             .sort((a,b)=>b.profit-a.profit)
    : [
        ...prizeWinners.map((w,i)=>{
          const p=players.find(pl=>pl.name===w.name);
          const bounty=modeBounty?(p?.bounty||0)*bountyPerHd:0;
          const total=w.amount+bounty; const cost=(p?.count||0)*tournament.buyIn;
          return {name:w.name,rank:i+1,prize:w.amount,bounty,count:p?.count||0,total,profit:total-cost};
        }),
        ...players.filter(p=>!prizeWinners.some(w=>w.name===p.name)).map(p=>{
          const cost=p.count*tournament.buyIn;
          return {name:p.name,rank:null,prize:0,bounty:0,count:p.count,total:0,profit:-cost};
        }),
      ];

  /* ── Handlers ── */
  const handleChangeMode = async (next:"TOURNAMENT"|"CASH") => {
    if(mode===next) return;
    if(next==="TOURNAMENT" && plan==="cash_pro") {
      setLoginReason(lang==="TH"
        ? "Tournament mode ต้องการแพลน Full Pro (99฿/เดือน)"
        : "Tournament mode requires Full Pro plan (99฿/mo)");
      setShowLogin(true); return;
    }
    const [title, body] = T[lang].confirmMode(next).split("\n");
    if(!await showConfirm(title, body)) return;
    setMode(next); setPlayers([]); setPrizeWinners([]);
    setModeBounty(false); setRoundIndex(0); setRunning(false);
    setMobileTab(next==="TOURNAMENT"?"timer":"players");
  };

  const addPlayer = async () => {
    if(!user) {
      setLoginReason(lang==="TH" ? "กรุณาเข้าสู่ระบบเพื่อเพิ่มผู้เล่น" : "Please sign in to add players");
      setShowLogin(true); return;
    }
    if(plan==="free" && players.length>=FREE_MAX_PLAYERS) {
      setLoginReason(lang==="TH"
        ? `แพลน Free จำกัด ${FREE_MAX_PLAYERS} คน — อัพเกรดเพื่อเพิ่มผู้เล่นไม่จำกัด`
        : `Free plan is limited to ${FREE_MAX_PLAYERS} players — upgrade for unlimited`);
      setShowLogin(true); return;
    }
    const name = await showPrompt(t("playerNamePrompt"));
    if(!name) return;
    setPlayers(p=>[...p,{name,buyInTotal:0,bounty:0,cashout:0,count:1}]);
  };

  const cashBuy = async (i:number, isAdd:boolean) => {
    const label = isAdd
      ? `Buy-in ของ "${players[i].name}" (฿)`
      : `ลด buy-in ของ "${players[i].name}" (฿)`;
    const raw = await showPrompt(label, "0");
    if(!raw) return;
    const v = Number(raw);
    if(isNaN(v)||v<=0){ await showAlert(t("invalidNum")); return; }
    const next = players[i].buyInTotal + (isAdd ? v : -v);
    if(next < 0){ await showAlert(t("amtExceeded")); return; }
    setPlayers(prev=>{ const np=[...prev]; np[i]={...np[i],buyInTotal:next}; return np; });
  };

  const tournBuy = async (i:number, delta:number) => {
    const nextCount = players[i].count + delta;
    if(nextCount < 1) {
      if(!await showConfirm(T[lang].confirmRemove(players[i].name))) return;
      setPlayers(prev=>prev.filter((_,j)=>j!==i));
      return;
    }
    setPlayers(prev=>{ const np=[...prev]; np[i]={...np[i],count:nextCount}; return np; });
  };

  const removePlayer = async (i:number) => {
    if(!await showConfirm(T[lang].confirmRemove(players[i].name))) return;
    setPlayers(prev=>prev.filter((_,j)=>j!==i));
  };

  const deleteLevel = async (i:number) => {
    if(plan==="free"){
      setLoginReason(lang==="TH"?"แก้ไข Blind Structure ต้องการแพลน Full Pro":"Editing blind structure requires Full Pro");
      setShowLogin(true); return;
    }
    if(!await showConfirm(t("confirmDelLevel"))) return;
    setTournament(s=>({...s,rounds:s.rounds.filter((_,j)=>j!==i)}));
  };

  const selectPlayer = (p:{name:string;count:number}) => {
    if(mode!=="TOURNAMENT") return;
    setPrizeWinners(prev=>{
      const idx=prev.findIndex(w=>w.name===p.name);
      if(idx!==-1) return prev.filter(w=>w.name!==p.name);
      if(prev.length>=MAX_WIN) return prev;
      const pos=prev.length; const prize=prizes[pos]||0;
      const cost=p.count*tournament.buyIn;
      return [...prev,{name:p.name,amount:prize,count:p.count,profit:prize-cost}];
    });
  };

  const exportAsImage = async () => {
    if(!user) {
      setLoginReason(lang==="TH" ? "กรุณาเข้าสู่ระบบเพื่อส่งออกรูป" : "Please sign in to export image");
      setShowLogin(true); return;
    }
    if(plan==="free" && exportCount>=FREE_MAX_EXPORTS) {
      setLoginReason(lang==="TH"
        ? `ใช้ Export ครบ ${FREE_MAX_EXPORTS} ครั้งแล้วในเดือนนี้ — อัพเกรดเพื่อ Export ไม่จำกัด`
        : `You've used ${FREE_MAX_EXPORTS} exports this month — upgrade for unlimited`);
      setShowLogin(true); return;
    }
    const el=summaryRef.current; if(!el) return;
    const canvas=await html2canvas(el,{backgroundColor:"#111624",scale:2,useCORS:true,logging:false});
    const link=document.createElement("a");
    link.download=`${tournament.name||"poker"}-${new Date().toLocaleDateString("th-TH").replace(/\//g,"-")}.png`;
    link.href=canvas.toDataURL("image/png"); link.click();
    if(plan==="free" && user) { const c = await incExportCount(user.id); setExportCount(c); }
  };

  const handleShare = async () => {
    if(!user) {
      setLoginReason(lang==="TH" ? "กรุณาเข้าสู่ระบบเพื่อแชร์ผลลัพธ์" : "Please sign in to share results");
      setShowLogin(true); return;
    }
    if(plan==="free" && exportCount>=FREE_MAX_EXPORTS) {
      setLoginReason(lang==="TH"
        ? `ใช้ Export/Share ครบ ${FREE_MAX_EXPORTS} ครั้งแล้วในเดือนนี้ — อัพเกรดเพื่อใช้ไม่จำกัด`
        : `You've used ${FREE_MAX_EXPORTS} exports/shares this month — upgrade for unlimited`);
      setShowLogin(true); return;
    }
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(generateText())}`);
    if(plan==="free" && user) { const c = await incExportCount(user.id); setExportCount(c); }
  };

  const generateText = () => {
    const l=T[lang];
    let txt=`🏆 ${tournament.name||"Poker Game"}\n\n`;
    txt+=`${l.date}: ${new Date().toLocaleDateString()}\n`;
    txt+=`${l.modeLabel}: ${mode==="CASH"?l.cashGame:l.tournament}\n\n`;
    if(mode==="CASH"){
      txt+=`${l.totalBuyIn}: ${fmtN(sumBuyIn)}\n${l.totalCashout}: ${fmtN(totalCashout)}\n\n`;
      players.forEach(p=>{
        const prf=(p.cashout||0)-p.buyInTotal;
        txt+=`• ${p.name} (${fmtN(p.buyInTotal)} → ${fmtN(p.cashout)}) = ${prf>=0?"+":""}${fmtN(prf)}\n`;
      });
    } else {
      txt+=`Buy-In: ${fmtN(tournament.buyIn)}\n${l.prizePool}: ${fmtN(normalPrize)}\n\n`;
      prizeWinners.forEach((w,i)=>{
        const m=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`;
        txt+=`${m} ${w.name} — ${fmtN(w.amount)}\n`;
      });
    }
    return txt;
  };

  /* ─────────────────────────────────────────
     Settings Panel (shared)
  ───────────────────────────────────────── */
  const SettingsPanel = () => (
    <Card>
      <CardTitle style={{marginBottom:14}}>{t("settings")}</CardTitle>
      <Label>{t("gameName")}</Label>
      <Input value={tournament.name} placeholder={t("gameNamePh")}
        onChange={e=>setTournament(s=>({...s,name:e.target.value}))} />


      {mode==="TOURNAMENT" && <>
        <Label>{t("buyInAmount")}</Label>
        <Input type="number" value={tournament.buyIn}
          onChange={e=>setTournament(s=>({...s,buyIn:Number(e.target.value)}))} />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0 6px"}}>
          <Label style={{margin:0}}>{t("payoutPct")}</Label>
          <Btn $v="secondary" $sm onClick={()=>setTournament(s=>({...s,payouts:[...s.payouts,0]}))}>
            <Plus size={12} /> {t("addPayout")}
          </Btn>
        </div>
        {tournament.payouts.map((p,i)=>(
          <PayRow key={i}>
            <span className="num">#{i+1}</span>
            <Input type="number" value={p}
              onChange={e=>{const v=[...tournament.payouts];v[i]=Number(e.target.value);setTournament(s=>({...s,payouts:v}));}} />
            <Btn $v="danger" $sm onClick={()=>{
              setTournament(s=>({...s,payouts:s.payouts.filter((_,j)=>j!==i)}));
              setPrizeWinners(prev=>prev.filter((_,j)=>j!==i));
            }}><X size={12} /></Btn>
          </PayRow>
        ))}
        <Label style={{marginTop:14}}>{t("bountyLabel")}</Label>
        <CheckLabel>
          <input type="checkbox" checked={modeBounty} onChange={e=>setModeBounty(e.target.checked)} />
          {t("enableBounty")}
        </CheckLabel>
        {modeBounty && <>
          <Label>{t("bountyPct")}</Label>
          <Input type="number" value={bountyPct} onChange={e=>setBountyPct(Number(e.target.value))} />
        </>}
      </>}

    </Card>
  );

  /* ─────────────────────────────────────────
     Players Panel (Cash)
  ───────────────────────────────────────── */
  const PlayersPanel = () => (
    <Card>
      <CardHead>
        <CardTitle>{t("players")} ({players.length})</CardTitle>
        <Btn $v="primary" $sm onClick={addPlayer}><Plus size={12} /> {t("addPlayer")}</Btn>
      </CardHead>

      {/* Desktop table header */}
      <TableHeader>
        <span></span>
        <span>{t("player")}</span>
        <span style={{textAlign:"center"}}>{t("buyIn")}</span>
        <span></span>
        <span>{t("cashOut")}</span>
        <span></span>
      </TableHeader>

      {players.length===0 && (
        <p style={{color:"var(--text-dim)",textAlign:"center",padding:"20px 0",fontSize:13}}>{t("noPlayer")}</p>
      )}

      {players.map((p,i)=>{
        const pos = getPos(p.name);
        const color = AVATAR_COLORS[i%AVATAR_COLORS.length];
        return (
          <div key={i}>
            {/* Desktop row */}
            <PlayerRow>
              <Avatar $c={color}>{initials(p.name)}</Avatar>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>
                  {pos&&<RankBadge $pos={pos}>{pos===1?"🥇":pos===2?"🥈":pos===3?"🥉":`#${pos}`}</RankBadge>}
                  {p.name}
                </div>
              </div>
              <div style={{textAlign:"center",fontWeight:700,fontSize:14}}>{fmtN(p.buyInTotal)}</div>
              <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                <Btn $v="success" $sm onClick={()=>cashBuy(i,true)}>+</Btn>
                <Btn $v="primary" $sm onClick={()=>cashBuy(i,false)}>−</Btn>
              </div>
              <div onClick={e=>e.stopPropagation()}>
                <Input type="number" value={p.cashout||0}
                  style={{fontSize:13,fontWeight:600}}
                  onChange={e=>{const np=[...players];np[i].cashout=Number(e.target.value);setPlayers(np);}} />
              </div>
              <Btn $v="ghost" $sm onClick={e=>{e.stopPropagation();removePlayer(i);}}><X size={13} /></Btn>
            </PlayerRow>

            {/* Mobile card */}
            <PlayerCardMobile>
              <PlayerCardTop>
                <Avatar $c={color}>{initials(p.name)}</Avatar>
                <div style={{flex:1}}>
                  <PlayerName>{p.name}</PlayerName>
                  <PlayerSub>{t("buyIn")}: {fmtN(p.buyInTotal)}</PlayerSub>
                </div>
                <Btn $v="ghost" $sm onClick={()=>removePlayer(i)}><X size={13} /></Btn>
              </PlayerCardTop>
              <MobileBuyBtns>
                <MobileBuyBtn $variant="buy" onClick={()=>cashBuy(i,true)}>
                  + {t("buyIn")}
                </MobileBuyBtn>
                <MobileBuyBtn $variant="sell" onClick={()=>cashBuy(i,false)}>
                  − {t("buyIn")}
                </MobileBuyBtn>
              </MobileBuyBtns>
              <CashOutRow>
                <CashLabel>{t("cashOut")}</CashLabel>
                <CashInput type="number" value={p.cashout||0}
                  onChange={e=>{const np=[...players];np[i].cashout=Number(e.target.value);setPlayers(np);}} />
              </CashOutRow>
            </PlayerCardMobile>
          </div>
        );
      })}
    </Card>
  );

  /* ─────────────────────────────────────────
     Summary Panel (Cash)
  ───────────────────────────────────────── */
  const SummaryPanel = () => (
    <Card>
      <CardTitle style={{marginBottom:14}}>{t("summary")}</CardTitle>
      <StatRow>
        <span className="lbl">{t("totalBuyIn")}</span>
        <span style={{fontWeight:800,fontSize:20,color:"var(--info)"}}>{fmtN(sumBuyIn)}</span>
      </StatRow>
      <StatRow>
        <span className="lbl">{t("totalCashout")}</span>
        <span style={{fontWeight:800,fontSize:20,color:"var(--success)"}}>{fmtN(totalCashout)}</span>
      </StatRow>
      <StatRow>
        <span className="lbl">{t("difference")}</span>
        <BalanceBadge $ok={diff===0} style={{display:"inline-flex",alignItems:"center",gap:4}}>
          {diff===0?<><Check size={12}/>{t("balanced")}</>:`${diff>0?"+":""}${fmtN(diff)}`}
        </BalanceBadge>
      </StatRow>

      {players.length>0 && <>
        <Label style={{marginTop:14}}>{t("playerResults")}</Label>
        {allResults.map((r,i)=>{
          const color=AVATAR_COLORS[players.findIndex(p=>p.name===r.name)%AVATAR_COLORS.length];
          return (
            <SummaryPlayerItem key={i}>
              <Avatar $c={color} style={{width:32,height:32,fontSize:11}}>{initials(r.name)}</Avatar>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13}}>{r.name}</div>
                <div style={{display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--info)"}}>
                    {t("buyIn")}: {fmtN(r.count)}
                  </span>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--success)"}}>
                    {t("cashOut")}: {fmtN(r.total)}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <PLArrow $pos={r.profit>=0}>{r.profit>=0?<TrendingUp size={14}/>:<TrendingDown size={14}/>}</PLArrow>
                <span style={{fontWeight:800,fontSize:14,color:r.profit>=0?"var(--success)":"var(--accent)"}}>
                  {r.profit>=0?"+":""}{fmtN(r.profit)}
                </span>
              </div>
            </SummaryPlayerItem>
          );
        })}
      </>}

      <ShareBtns>
        <Btn $v="success" disabled={players.length===0} onClick={handleShare}>
          {t("shareToLine")}
          {plan==="free" && <span style={{fontSize:10,opacity:.75,fontWeight:500,marginLeft:2}}>
            {Math.max(0,FREE_MAX_EXPORTS-exportCount)}/{FREE_MAX_EXPORTS}
          </span>}
        </Btn>
        <Btn $v="secondary" disabled={players.length===0} onClick={exportAsImage}>
          <Camera size={14} /> {t("exportImg")}
          {plan==="free" && <span style={{fontSize:10,opacity:.75,fontWeight:500,marginLeft:2}}>
            {Math.max(0,FREE_MAX_EXPORTS-exportCount)}/{FREE_MAX_EXPORTS}
          </span>}
        </Btn>
      </ShareBtns>
    </Card>
  );

  /* ─────────────────────────────────────────
     Tournament Players Panel
  ───────────────────────────────────────── */
  const TournPlayersPanel = () => (
    <Card>
      <CardHead>
        <CardTitle>{t("players")} ({players.length})</CardTitle>
        <Btn $v="primary" $sm onClick={addPlayer}><Plus size={12} /> {t("addPlayer")}</Btn>
      </CardHead>
      <TableHeader>
        <span></span>
        <span>{t("player")}</span>
        <span style={{textAlign:"center"}}>{t("buyIn")} ×</span>
        <span></span>
        <span></span>
        <span></span>
      </TableHeader>
      {players.length===0 && (
        <p style={{color:"var(--text-dim)",textAlign:"center",padding:"20px 0",fontSize:13}}>{t("noPlayer")}</p>
      )}
      {players.map((p,i)=>{
        const pos=getPos(p.name);
        const color=AVATAR_COLORS[i%AVATAR_COLORS.length];
        return (
          <div key={i}>
            <PlayerRow $winner={isWinner(p.name)} $rank={pos??undefined} onClick={()=>selectPlayer(p)}>
              {pos && pos<=3
                ? <div style={{
                    width:36,height:36,borderRadius:"50%",flexShrink:0,
                    background:pos===1?"var(--gold)":pos===2?"var(--silver)":"var(--bronze)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:20,boxShadow:`0 2px 8px ${pos===1?"rgba(245,197,66,.4)":pos===2?"rgba(192,192,192,.3)":"rgba(205,127,50,.4)"}`
                  }}>
                    {pos===1?"🥇":pos===2?"🥈":"🥉"}
                  </div>
                : <Avatar $c={color}>{initials(p.name)}</Avatar>}
              <div>
                <div style={{fontWeight:700,fontSize:13}}>
                  {pos && pos>3 && <RankBadge $pos={pos}>#{pos}</RankBadge>}
                  {p.name}
                </div>
                {pos && <div style={{fontSize:10,color:"var(--text-muted)",marginTop:2}}>
                  {pos===1?"อันดับ 1":pos===2?"อันดับ 2":pos===3?"อันดับ 3":`อันดับ ${pos}`}
                </div>}
              </div>
              <div style={{textAlign:"center"}}>
                <CountBox onClick={e=>e.stopPropagation()}>
                  <CountBtn onClick={()=>tournBuy(i,-1)}>−</CountBtn>
                  <span style={{minWidth:20,textAlign:"center",fontSize:13,fontWeight:700}}>{p.count}</span>
                  <CountBtn onClick={()=>tournBuy(i,1)}>+</CountBtn>
                </CountBox>
              </div>
              {modeBounty && (
                <div onClick={e=>e.stopPropagation()}>
                  <Input type="number" value={p.bounty||0} style={{width:60}}
                    onChange={e=>{const np=[...players];np[i].bounty=Number(e.target.value);setPlayers(np);}} />
                </div>
              )}
              <span></span>
              <Btn $v="ghost" $sm onClick={e=>{e.stopPropagation();removePlayer(i);}}><X size={13} /></Btn>
            </PlayerRow>
            {/* Mobile card */}
            <PlayerCardMobile style={pos?{borderLeft:`3px solid ${pos===1?"var(--gold)":pos===2?"var(--silver)":"var(--bronze)"}`}:{}}>
              <PlayerCardTop>
                {pos && pos<=3
                  ? <div style={{
                      width:36,height:36,borderRadius:"50%",flexShrink:0,
                      background:pos===1?"var(--gold)":pos===2?"var(--silver)":"var(--bronze)",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:20
                    }}>{pos===1?"🥇":pos===2?"🥈":"🥉"}</div>
                  : <Avatar $c={color}>{initials(p.name)}</Avatar>}
                <div style={{flex:1}}>
                  <PlayerName>
                    {pos && pos>3 && <RankBadge $pos={pos}>#{pos}</RankBadge>}
                    {p.name}
                  </PlayerName>
                  <PlayerSub>{t("buyIn")} × {p.count} = {fmtN(p.count*tournament.buyIn)}</PlayerSub>
                </div>
                <Btn $v="ghost" $sm onClick={()=>removePlayer(i)}><X size={13} /></Btn>
              </PlayerCardTop>
              <MobileBuyBtns onClick={()=>selectPlayer(p)}>
                <MobileBuyBtn $variant="buy" onClick={e=>{e.stopPropagation();tournBuy(i,1);}}>
                  + {t("buyIn")}
                </MobileBuyBtn>
                <MobileBuyBtn $variant="sell" onClick={e=>{e.stopPropagation();tournBuy(i,-1);}}>
                  − {t("buyIn")}
                </MobileBuyBtn>
              </MobileBuyBtns>
              {modeBounty && (
                <CashOutRow>
                  <CashLabel>Bounty</CashLabel>
                  <CashInput type="number" value={p.bounty||0}
                    onChange={e=>{const np=[...players];np[i].bounty=Number(e.target.value);setPlayers(np);}} />
                </CashOutRow>
              )}
            </PlayerCardMobile>
          </div>
        );
      })}
    </Card>
  );

  /* ─────────────────────────────────────────
     Tournament Results Panel
  ───────────────────────────────────────── */
  const TournResultsPanel = () => (
    <Card>
      <CardTitle style={{marginBottom:14}}>{t("results")}</CardTitle>
      <PrizeBox>
        <PrizeItem>
          <div className="lbl">{modeBounty?t("prizePool"):"Total"}</div>
          <div className="val">{fmtN(modeBounty?normalPrize:prizePool)}</div>
        </PrizeItem>
        {modeBounty&&<>
          <PrizeItem><div className="lbl">{t("bountyPool")}</div><div className="val">{fmtN(bountyPool)}</div></PrizeItem>
          <PrizeItem><div className="lbl">{t("perBounty")}</div><div className="val">{bountyPerHd.toFixed(0)}</div></PrizeItem>
        </>}
      </PrizeBox>

      <Label>{t("leaderboard")}</Label>
      <TableScroll>
        <TournTable>
          <thead><tr>
            <th>{t("player")}</th>
            <th>{t("prize")??t("results")}</th>
            {modeBounty&&<th>{t("bountyLabel")}</th>}
            <th>P&L</th>
          </tr></thead>
          <tbody>
            {allResults.map((w,i)=>(
              <tr key={i}>
                <td>
                  <RankBadge $pos={w.rank??99}>
                    {w.rank===1?"🥇":w.rank===2?"🥈":w.rank===3?"🥉":w.rank?`#${w.rank}`:"—"}
                  </RankBadge>{w.name}
                </td>
                <td>{fmtN(w.prize??0)}</td>
                {modeBounty&&<td>{fmtN(w.bounty??0)}</td>}
                <td style={{fontWeight:700,color:w.profit>=0?"var(--success)":"var(--accent)"}}>
                  {w.profit>=0?"+":""}{fmtN(w.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </TournTable>
      </TableScroll>
      <ShareBtns>
        <Btn $v="success" disabled={players.length===0} onClick={handleShare}>
          {t("shareToLine")}
          {plan==="free" && <span style={{fontSize:10,opacity:.75,fontWeight:500,marginLeft:2}}>
            {Math.max(0,FREE_MAX_EXPORTS-exportCount)}/{FREE_MAX_EXPORTS}
          </span>}
        </Btn>
        <Btn $v="secondary" disabled={players.length===0} onClick={exportAsImage}>
          <Camera size={14} /> {t("exportImg")}
          {plan==="free" && <span style={{fontSize:10,opacity:.75,fontWeight:500,marginLeft:2}}>
            {Math.max(0,FREE_MAX_EXPORTS-exportCount)}/{FREE_MAX_EXPORTS}
          </span>}
        </Btn>
      </ShareBtns>
    </Card>
  );

  /* ─────────────────────────────────────────
     Tournament Timer Panel
  ───────────────────────────────────────── */
  const TimerPanel = () => {
    const R = 88; const C = 2*Math.PI*R;
    const dashOffset = C * (1 - progress/100);
    const statusText = breakTime
      ? (lang==="TH"?"พัก":"BREAK")
      : running
        ? (lang==="TH"?"กำลังนับ":"RUNNING")
        : (lang==="TH"?"หยุด":"PAUSED");
    return (
    <TimerCard>
      <LevelBadge>{breakTime?t("breakTime"):`${t("level")} ${roundIndex+1}`}</LevelBadge>

      <CircleWrap>
        <CircleSvg viewBox="0 0 200 200">
          <CircleTrack cx="100" cy="100" r={R}/>
          <CircleProgress
            $urgent={isUrgent}
            cx="100" cy="100" r={R}
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
          />
        </CircleSvg>
        <CircleInner>
          <BigTimer $urgent={isUrgent}>{fmt(timeLeft)}</BigTimer>
          <StatusLabel $urgent={isUrgent}>{statusText}</StatusLabel>
        </CircleInner>
      </CircleWrap>

      <BlindsRow>
        <BlindCard>
          <div className="lbl">{lang==="TH"?"Small Blind":"Small Blind"}</div>
          <div className="val">{fmtN(round.sb)}</div>
        </BlindCard>
        <BlindCard>
          <div className="lbl">{lang==="TH"?"Big Blind":"Big Blind"}</div>
          <div className="val">{fmtN(round.bb)}</div>
        </BlindCard>
        {round.ante>0&&(
          <BlindCard>
            <div className="lbl">{t("ante")}</div>
            <div className="val">{fmtN(round.ante)}</div>
          </BlindCard>
        )}
      </BlindsRow>

      <TimerCtrl>
        <Btn $v="secondary" $sm onClick={()=>{
          levelUpSound.currentTime=0;levelUpSound.play().catch(()=>{});
          setRoundIndex(i=>{const p=Math.max(i-1,0);setTimeLeft(tournament.rounds[p].duration);return p;});
        }}><SkipBack size={14} /></Btn>
        <Btn $v="primary" style={{padding:"9px 28px",fontSize:15}} onClick={()=>{
          if(timeLeft<=0) setTimeLeft(round.duration);
          setRunning(r=>!r);
        }}>{running?<Pause size={18}/>:<Play size={18}/>}</Btn>
        <Btn $v="secondary" $sm onClick={()=>{
          levelUpSound.currentTime=0;levelUpSound.play().catch(()=>{});
          setRoundIndex(i=>{const n=Math.min(i+1,tournament.rounds.length-1);setTimeLeft(tournament.rounds[n].duration);return n;});
        }}><SkipForward size={14} /></Btn>
        <Btn $v="ghost" $sm onClick={()=>setBreakTime(b=>!b)} title={breakTime?t("resumeTime"):t("breakTime")}>
          {breakTime?<Play size={14}/>:<Coffee size={14}/>}
        </Btn>
      </TimerCtrl>
    </TimerCard>
  );};

  /* ─────────────────────────────────────────
     Tournament Structure Panel
  ───────────────────────────────────────── */
  const StructurePanel = () => (
    <Card>
      <CardHead>
        <CardTitle>{t("structure")}</CardTitle>
        <Btn $v="primary" $sm disabled={plan==="free"} title={plan==="free"?(lang==="TH"?"ต้องการ Full Pro":"Requires Full Pro"):undefined}
          onClick={()=>plan==="free"
            ? (setLoginReason(lang==="TH"?"แก้ไข Blind Structure ต้องการแพลน Full Pro":"Editing blind structure requires Full Pro"), setShowLogin(true))
            : setOpenModal(true)
          }><Plus size={12} /> {t("addLevel")}</Btn>
      </CardHead>
      <TableScroll>
        <TournTable>
          <thead><tr><th></th><th>SB</th><th>BB</th><th>Ante</th><th>Min</th><th></th></tr></thead>
          <tbody>
            {tournament.rounds.map((r,i)=>(
              <tr key={i} style={i===roundIndex?{background:"var(--accent-soft)",color:"var(--accent)"}:{}}>
                <td style={{width:20}}>{i===roundIndex&&running&&<ActiveDot/>}</td>
                <td>{r.sb?fmtN(r.sb):"—"}</td>
                <td>{r.bb?fmtN(r.bb):"—"}</td>
                <td>{r.ante?fmtN(r.ante):"—"}</td>
                <td>{fmt(r.duration)}</td>
                <td>
                  <Btn $v="danger" $sm disabled={plan==="free"} onClick={()=>deleteLevel(i)}><X size={12} /></Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </TournTable>
      </TableScroll>
    </Card>
  );

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  const cashTabs  = ["players","summary","settings"] as const;
  const tournTabs = ["timer","players","settings"]   as const;
  const activeTabs = mode==="CASH" ? cashTabs : tournTabs;

  return (
    <>
      <GlobalStyle $t={theme} />
      <Page>

        {/* ── Login Modal ── */}
        {showLogin && (
          <LoginModal
            user={user} reason={loginReason} lang={lang}
            onLogin={u=>{ setUser(u); setShowLogin(false); setLoginReason(""); }}
            onLogout={()=>{ setUser(null); setShowLogin(false); }}
            onClose={()=>{ setShowLogin(false); setLoginReason(""); }}
            onUpgrade={()=>setShowPricing(true)}
            onRefresh={u=>setUser(u)}
          />
        )}

        {/* ── Pricing Modal ── */}
        {showPricing && (
          <PricingModal
            currentPlan={plan} lang={lang}
            onClose={()=>setShowPricing(false)}
            onUpgrade={(p)=>{ setShowPricing(false); setPaymentPlan({plan:p, cycle:"monthly"}); }}
          />
        )}

        {/* ── Payment Modal ── */}
        {paymentPlan && (
          <PaymentModal
            plan={paymentPlan.plan}
            billingCycle={paymentPlan.cycle}
            lang={lang}
            onClose={()=>setPaymentPlan(null)}
            onSuccess={()=>setPaymentPlan(null)}
          />
        )}

        {/* ── Add Level Modal ── */}
        <Dialog.Root open={openModal} onOpenChange={open=>{ if(!open) setOpenModal(false); }}>
          <Dialog.Portal>
            <ModalOverlay />
            <ModalBox>
              <h3 style={{display:"flex",alignItems:"center",gap:6}}><Plus size={15}/> {t("addLevel")}</h3>
              {([["Small Blind","sb"],["Big Blind","bb"],["Ante","ante"],["Duration (min)","duration"]] as [string,string][]).map(([lbl,k])=>(
                <div key={k} style={{marginBottom:10}}>
                  <Label>{lbl}</Label>
                  <Input type="number" value={(newLevel as any)[k]}
                    onChange={e=>setNewLevel(s=>({...s,[k]:Number(e.target.value)}))} />
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
                <Dialog.Close asChild>
                  <Btn $v="secondary">Cancel</Btn>
                </Dialog.Close>
                <Btn $v="primary" onClick={()=>{
                  setTournament(s=>({...s,rounds:[...s.rounds,{...newLevel,duration:newLevel.duration*60}]}));
                  setNewLevel({sb:0,bb:0,ante:0,duration:0}); setOpenModal(false);
                }}>{t("addLevel")}</Btn>
              </div>
            </ModalBox>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ── Header ── */}
        <Header>
          <LogoImg src={`${BASE}logo.png`} alt="Go Poker" />

          <ModeTabs>
            <ModeTab $active={mode==="TOURNAMENT"} onClick={()=>handleChangeMode("TOURNAMENT")}>
              <Trophy size={13} /> {t("tournament")}
            </ModeTab>
            <ModeTab $active={mode==="CASH"} onClick={()=>handleChangeMode("CASH")}>
              <Banknote size={13} /> {t("cashGame")}
            </ModeTab>
          </ModeTabs>

          <HeaderRight>
            <Select.Root value={lang} onValueChange={v=>setLang(v as Lang)}>
              <LangTrigger aria-label="Language">
                <span>{lang==="TH"?"🇹🇭 ไทย":"🇬🇧 English"}</span>
                <Select.Icon asChild><ChevronDown size={12}/></Select.Icon>
              </LangTrigger>
              <Select.Portal>
                <LangContent position="popper" sideOffset={6}>
                  <Select.Viewport>
                    <LangItem value="TH">
                      <Select.ItemText>🇹🇭 ไทย</Select.ItemText>
                    </LangItem>
                    <LangItem value="EN">
                      <Select.ItemText>🇬🇧 English</Select.ItemText>
                    </LangItem>
                  </Select.Viewport>
                </LangContent>
              </Select.Portal>
            </Select.Root>
            <ThemeRow>
              {(Object.keys(themeSwatches) as ThemeKey[]).map(k=>(
                <Swatch key={k} $c={themeSwatches[k].color} $active={theme===k}
                  title={themeSwatches[k].label} onClick={()=>setTheme(k)}
                  style={k==="light"?{border:`2px solid ${theme===k?"var(--text)":"#aaa"}`,background:"#f0f0f0"}:{}} />
              ))}
            </ThemeRow>
            {user ? (
              <NavAvatar
                $color={PLAN_COLORS[plan]}
                onClick={()=>{setLoginReason("");setShowLogin(true);}}
                title={`@${user.username ?? user.email.split("@")[0]}`}
              >
                {(user.username ?? user.email).slice(0,2).toUpperCase()}
                <NavAvatarDot $color={PLAN_COLORS[plan]} />
              </NavAvatar>
            ) : (
              <NavLoginBtn onClick={()=>{setLoginReason("");setShowLogin(true);}}>
                {lang==="TH"?"เข้าสู่ระบบ":"Sign In"}
              </NavLoginBtn>
            )}
          </HeaderRight>
        </Header>

        {/* ── Mobile: mode select ── */}
        <MobileModeRow>
          <MobileModeBtn $active={mode==="TOURNAMENT"} onClick={()=>handleChangeMode("TOURNAMENT")}>
            <Trophy size={13} /> {t("tournament")}
          </MobileModeBtn>
          <MobileModeBtn $active={mode==="CASH"} onClick={()=>handleChangeMode("CASH")}>
            <Banknote size={13} /> {t("cashGame")}
          </MobileModeBtn>
        </MobileModeRow>

        {/* ── Mobile Tab Bar ── */}
        <MobileTabBar>
          {activeTabs.map(tab=>(
            <MobileTabBtn key={tab} $active={mobileTab===tab} onClick={()=>setMobileTab(tab)}>
              {tab==="players"  ? t("players")
               :tab==="summary" ? t("summary")
               :tab==="settings"? t("settings")
               :tab==="timer"   ? t("timer")
               : tab}
            </MobileTabBtn>
          ))}
        </MobileTabBar>

        <PageBody>
        <Content>

          {/* ════════════════════════
              CASH GAME
          ════════════════════════ */}
          {mode==="CASH" && <>
            {/* Desktop 3-col */}
            <ThreeCols>
              <Col>{SettingsPanel()}</Col>
              <Col>{PlayersPanel()}</Col>
              <Col>{SummaryPanel()}</Col>
            </ThreeCols>

            {/* Mobile panels */}
            <MobilePanel $show={mobileTab==="players"}>{PlayersPanel()}</MobilePanel>
            <MobilePanel $show={mobileTab==="summary"}>{SummaryPanel()}</MobilePanel>
            <MobilePanel $show={mobileTab==="settings"}>{SettingsPanel()}</MobilePanel>
          </>}

          {/* ════════════════════════
              TOURNAMENT
          ════════════════════════ */}
          {mode==="TOURNAMENT" && <>
            {/* Desktop: 3-col timer row */}
            <ThreeCols style={{marginBottom:0}}>
              <Col>{StructurePanel()}</Col>
              <TimerCol>{TimerPanel()}</TimerCol>
              <Col>{TournResultsPanel()}</Col>
            </ThreeCols>

            {/* Desktop: 2-col bottom row */}
            <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:0,borderTop:"1px solid var(--border)"}}>
              <Col>{SettingsPanel()}</Col>
              <Col style={{borderRight:"none"}}>{TournPlayersPanel()}</Col>
            </div>

            {/* Mobile panels */}
            <MobilePanel $show={mobileTab==="timer"}>
              {TimerPanel()}
              <div style={{marginTop:12}}>{StructurePanel()}</div>
            </MobilePanel>
            <MobilePanel $show={mobileTab==="players"}>
              {TournPlayersPanel()}
              <div style={{marginTop:12}}>{TournResultsPanel()}</div>
            </MobilePanel>
            <MobilePanel $show={mobileTab==="settings"}>{SettingsPanel()}</MobilePanel>
          </>}

        </Content>
        </PageBody>

        {/* ── App Dialogs ── */}
        <AppDialog config={appDialog} lang={lang} />

        {/* ── Hidden export card ── */}
        <div style={{position:"fixed",left:"-9999px",top:0,zIndex:-1}}>
          <SummaryCard ref={summaryRef} mode={mode} gameName={tournament.name}
            players={players} allResults={allResults} prizeWinners={prizeWinners}
            buyIn={tournament.buyIn} prizePool={prizePool}
            modeBounty={modeBounty} bountyPool={bountyPool}
            watermark={plan==="free"} />
        </div>

      </Page>
    </>
  );
}
