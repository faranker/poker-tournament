import { useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { X, Copy, Check, Download, FileText, Image, Moon, Sun, ImagePlus, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2000;backdrop-filter:blur(6px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2001;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  width:min(520px,96vw);max-height:90vh;display:flex;flex-direction:column;
  box-shadow:var(--shadow-lg);animation:${contentShow} .18s ease;
  &:focus{outline:none;}
`;
const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 20px;border-bottom:1px solid var(--border);flex-shrink:0;
`;
const Title = styled.h2`font-size:16px;font-weight:900;display:flex;align-items:center;gap:8px;color:var(--text);`;
const CloseBtn = styled.button`
  background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;
  border-radius:6px;display:flex;&:hover{color:var(--text);background:var(--surface2);}
`;
const TabRow = styled.div`
  display:flex;gap:2px;padding:12px 20px 0;border-bottom:1px solid var(--border);flex-shrink:0;
`;
const Tab = styled.button<{$active?:boolean}>`
  display:flex;align-items:center;gap:7px;padding:9px 16px;border:none;border-radius:8px 8px 0 0;
  font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;
  background:${p=>p.$active?"var(--surface2)":"transparent"};
  color:${p=>p.$active?"var(--text)":"var(--text-muted)"};
  border-bottom:${p=>p.$active?"2px solid var(--accent)":"2px solid transparent"};
  margin-bottom:-1px;
  &:hover{color:var(--text);}
`;
const Body = styled.div`flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;`;

const TextBox = styled.pre`
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:16px;font-family:monospace;font-size:13px;line-height:1.7;color:var(--text);
  white-space:pre-wrap;word-break:break-word;overflow-y:auto;max-height:320px;margin:0;
`;
const CopyBtn = styled.button<{$copied?:boolean}>`
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:12px;border-radius:var(--radius-sm);border:none;
  font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;
  background:${p=>p.$copied?"var(--success)":"var(--accent)"};color:#fff;
  &:hover:not(:disabled){opacity:.88;}
`;

const ThemeGrid = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:12px;`;
const ThemeCard = styled.button<{$active?:boolean}>`
  display:flex;flex-direction:column;align-items:center;gap:10px;
  padding:16px 10px;border-radius:var(--radius-sm);border:2px solid;cursor:pointer;
  font-family:inherit;transition:all .18s;
  border-color:${p=>p.$active?"var(--accent)":"var(--border)"};
  background:${p=>p.$active?"var(--accent-soft)":"var(--surface2)"};
  color:${p=>p.$active?"var(--accent)":"var(--text-muted)"};
  &:hover{border-color:var(--accent);color:var(--text);}
`;
const ThemePreview = styled.div<{$theme:"dark"|"light"|"custom";$bg?:string}>`
  width:100%;aspect-ratio:16/9;border-radius:6px;overflow:hidden;
  background:${p=>
    p.$theme==="dark"?"#111624":
    p.$theme==="light"?"#f8fafc":
    p.$bg?`url(${p.$bg}) center/cover`:"#334155"};
  border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;
  color:${p=>p.$theme==="light"?"#0f172a":"#fff"};
  opacity:${p=>p.$theme==="custom"&&!p.$bg?0.5:1};
`;
const DownloadBtn = styled.button`
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:12px;border-radius:var(--radius-sm);border:none;
  font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;
  background:var(--accent);color:#fff;
  &:hover:not(:disabled){opacity:.88;}
  &:disabled{opacity:.5;cursor:not-allowed;}
`;
const Note = styled.div`font-size:13px;color:var(--text-muted);text-align:center;`;

type Theme = "dark"|"light"|"custom";

interface Player { name:string; buyInTotal:number; cashout:number; bounty:number; count:number; }
interface PrizeWinner { name:string; amount:number; count:number; profit:number; }
interface Tournament { name:string; buyIn:number; payouts:number[]; }

interface Props {
  lang: "TH"|"EN";
  mode: "CASH"|"TOURNAMENT";
  players: Player[];
  tournament: Tournament;
  prizeWinners: PrizeWinner[];
  sumBuyIn: number;
  totalCashout: number;
  normalPrize: number;
  summaryRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

function fmtN(n:number){ return Math.round(n).toLocaleString(); }

export function ShareModal({ lang, mode, players, tournament, prizeWinners, sumBuyIn, totalCashout, normalPrize, summaryRef, onClose }: Props) {
  const [tab, setTab] = useState<"text"|"image">("text");
  const [theme, setTheme] = useState<Theme>("dark");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [customBg, setCustomBg] = useState<string|null>(localStorage.getItem("poker_bg_image"));
  const isTH = lang === "TH";

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      localStorage.setItem("poker_bg_image", result);
      setCustomBg(result);
    };
    reader.readAsDataURL(f);
  };
  const handleBgRemove = () => { localStorage.removeItem("poker_bg_image"); setCustomBg(null); };

  const getSep = () => "━━━━━━━━━━━━━━━━";

  const getText = () => {
    const sep = getSep();
    const date = new Date().toLocaleDateString(isTH?"th-TH":"en-GB");

    if (mode === "CASH") {
      const sorted = [...players]
        .filter(p => p.name.trim())
        .map(p => ({ ...p, profit:(p.cashout||0)-p.buyInTotal }))
        .sort((a,b) => b.profit - a.profit);

      let txt = `${sep}\n`;
      txt += `🃏 ${tournament.name||(isTH?"ไม่มีชื่อ":"Unnamed Game")}\n`;
      txt += `${date} | Cash Game\n`;
      txt += isTH
        ? `Buy-in รวม: ${fmtN(sumBuyIn)}฿  |  Cashout รวม: ${fmtN(totalCashout)}฿\n`
        : `Total Buy-in: ${fmtN(sumBuyIn)}฿  |  Total Cashout: ${fmtN(totalCashout)}฿\n`;
      txt += `${sep}\n`;
      sorted.forEach((p,i) => {
        const sign = p.profit >= 0 ? "+" : "";
        const label = isTH
          ? `เข้า ${fmtN(p.buyInTotal)} ▶ ออก ${fmtN(p.cashout||0)}`
          : `In ${fmtN(p.buyInTotal)} ▶ Out ${fmtN(p.cashout||0)}`;
        txt += `#${i+1} ${p.name}  ${label}   ${sign}${fmtN(p.profit)}฿\n`;
      });
      txt += sep;
      return txt;
    } else {
      const totalPlayers = players.length;
      let txt = `${sep}\n`;
      txt += `🏆 ${tournament.name||(isTH?"ไม่มีชื่อ":"Unnamed Tournament")}\n`;
      txt += `${date} | Tournament\n`;
      txt += isTH
        ? `Buy-in: ${fmtN(tournament.buyIn)}฿ × ${totalPlayers} คน | Prize Pool: ${fmtN(normalPrize)}฿\n`
        : `Buy-in: ${fmtN(tournament.buyIn)}฿ × ${totalPlayers} players | Prize Pool: ${fmtN(normalPrize)}฿\n`;
      txt += `${sep}\n`;
      prizeWinners.forEach((w,i) => {
        txt += `#${i+1} ${w.name}  ${w.amount>0?`${fmtN(w.amount)}฿`:"—"}\n`;
      });
      txt += sep;
      return txt;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    } catch { /* fallback for older browsers */ }
  };

  const LIGHT_VARS: Record<string,string> = {
    "--surface":"#ffffff","--surface2":"#f1f5f9","--surface3":"#e2e8f0",
    "--border":"#e2e8f0","--border2":"#cbd5e1",
    "--text":"#0f172a","--text-muted":"#475569","--text-dim":"#94a3b8",
    "--success":"#16a34a","--accent":"#ef4444",
    "--gold":"#d97706","--silver":"#64748b","--bronze":"#92400e","--info":"#2563eb",
  };

  const handleDownload = async () => {
    if (!summaryRef.current) return;
    setDownloading(true);
    const el = summaryRef.current;
    const prevBg = el.style.background;
    const prevBgImg = el.style.backgroundImage;
    const prevBgSize = el.style.backgroundSize;
    const prevBgPos = el.style.backgroundPosition;

    try {
      if (theme === "dark") {
        el.style.background = "#111624";
      } else if (theme === "light") {
        el.style.background = "#f8fafc";
        Object.entries(LIGHT_VARS).forEach(([k,v]) => el.style.setProperty(k,v));
      } else if (theme === "custom" && customBg) {
        el.style.backgroundImage = `url(${customBg})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      }

      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale:2, useCORS:true, logging:false,
      });

      const link = document.createElement("a");
      link.download = `${tournament.name||"poker"}-${new Date().toLocaleDateString("th-TH").replace(/\//g,"-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      el.style.background = prevBg;
      el.style.backgroundImage = prevBgImg;
      el.style.backgroundSize = prevBgSize;
      el.style.backgroundPosition = prevBgPos;
      if (theme === "light") {
        Object.keys(LIGHT_VARS).forEach(k => el.style.removeProperty(k));
      }
      setDownloading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={open=>{ if(!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Header>
            <Title>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {isTH?"แชร์ผลลัพธ์":"Share Results"}
            </Title>
            <CloseBtn onClick={onClose}><X size={18}/></CloseBtn>
          </Header>

          <TabRow>
            <Tab $active={tab==="text"} onClick={()=>setTab("text")}>
              <FileText size={15}/>{isTH?"ข้อความ":"Text"}
            </Tab>
            <Tab $active={tab==="image"} onClick={()=>setTab("image")}>
              <Image size={15}/>{isTH?"ภาพ":"Image"}
            </Tab>
          </TabRow>

          <Body>
            {tab === "text" && (
              <>
                <TextBox>{getText()}</TextBox>
                <CopyBtn $copied={copied} onClick={handleCopy}>
                  {copied
                    ? <><Check size={16}/>{isTH?"คัดลอกแล้ว!":"Copied!"}</>
                    : <><Copy size={16}/>{isTH?"คัดลอกข้อความ":"Copy Text"}</>}
                </CopyBtn>
              </>
            )}

            {tab === "image" && (
              <>
                <ThemeGrid>
                  <ThemeCard $active={theme==="dark"} onClick={()=>setTheme("dark")}>
                    <ThemePreview $theme="dark">
                      <Moon size={18} color="#818cf8"/>
                    </ThemePreview>
                    <span style={{fontSize:13,fontWeight:700}}>Dark</span>
                  </ThemeCard>

                  <ThemeCard $active={theme==="light"} onClick={()=>setTheme("light")}>
                    <ThemePreview $theme="light">
                      <Sun size={18} color="#d97706"/>
                    </ThemePreview>
                    <span style={{fontSize:13,fontWeight:700}}>Light</span>
                  </ThemeCard>

                  <ThemeCard $active={theme==="custom"} onClick={()=>setTheme("custom")}>
                    <ThemePreview $theme="custom" $bg={customBg||undefined}>
                      {!customBg && <ImagePlus size={18} color="#94a3b8"/>}
                    </ThemePreview>
                    <span style={{fontSize:13,fontWeight:700}}>Custom</span>
                  </ThemeCard>
                </ThemeGrid>

                {theme === "custom" && (
                  customBg ? (
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                      background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8}}>
                      <img src={customBg} alt="bg" style={{width:56,height:36,objectFit:"cover",borderRadius:5,flexShrink:0,border:"1px solid var(--border)"}}/>
                      <div style={{flex:1,fontSize:13,color:"var(--text-muted)",fontWeight:600,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {isTH?"รูป Background ที่เลือก":"Selected background"}
                      </div>
                      <label style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
                        borderRadius:6,border:"1px solid var(--border2)",cursor:"pointer",
                        fontSize:12,fontWeight:700,color:"var(--text-muted)",background:"var(--surface3)",flexShrink:0}}>
                        <ImagePlus size={12}/>{isTH?"เปลี่ยน":"Change"}
                        <input type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
                      </label>
                      <button onClick={handleBgRemove} style={{background:"none",border:"none",
                        cursor:"pointer",color:"var(--text-muted)",padding:4,display:"flex",flexShrink:0}}>
                        <X size={15}/>
                      </button>
                    </div>
                  ) : (
                    <label style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",
                      border:"1.5px dashed var(--border2)",borderRadius:8,cursor:"pointer",
                      color:"var(--text-muted)",fontSize:13,fontWeight:600,justifyContent:"center"}}>
                      <ImagePlus size={16}/>{isTH?"อัปโหลดรูป Background":"Upload Background Image"}
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
                    </label>
                  )
                )}

                <DownloadBtn onClick={handleDownload} disabled={downloading||(theme==="custom"&&!customBg)}>
                  {downloading
                    ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>{isTH?"กำลังสร้างภาพ...":"Generating..."}</>
                    : <><Download size={16}/>{isTH?"ดาวน์โหลดรูป":"Download Image"}</>}
                </DownloadBtn>
              </>
            )}
          </Body>
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
