import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { X, History, TrendingUp, TrendingDown, Trophy, Coins } from "lucide-react";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2000;backdrop-filter:blur(6px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2001;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  width:min(600px,96vw);max-height:88vh;display:flex;flex-direction:column;
  box-shadow:var(--shadow-lg);animation:${contentShow} .18s ease;
  &:focus{outline:none;}
`;
const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 20px;border-bottom:1px solid var(--border);flex-shrink:0;
`;
const Title = styled.h2`font-size:16px;font-weight:900;display:flex;align-items:center;gap:8px;`;
const CloseBtn = styled.button`
  background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;
  border-radius:6px;display:flex;&:hover{color:var(--text);background:var(--surface2);}
`;
const Body = styled.div`flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;`;

const SessionCard = styled.div<{$open?:boolean}>`
  border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;
  cursor:pointer;transition:border-color .15s;
  &:hover{border-color:var(--border2);}
`;
const SessionHead = styled.div`
  display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface2);
`;
const ModeBadge = styled.span<{$cash?:boolean}>`
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;
  padding:2px 8px;border-radius:10px;flex-shrink:0;
  background:${p=>p.$cash?"rgba(34,197,94,.15)":"rgba(99,102,241,.15)"};
  color:${p=>p.$cash?"var(--success)":"#818cf8"};
`;
const SessionName = styled.div`font-size:14px;font-weight:700;color:var(--text);flex:1;`;
const SessionDate = styled.div`font-size:14px;color:var(--text-muted);flex-shrink:0;`;

const SessionDetail = styled.div`padding:12px 14px;display:flex;flex-direction:column;gap:8px;`;
const PlayerRow = styled.div<{$profit:number}>`
  display:flex;align-items:center;gap:8px;padding:6px 10px;
  border-radius:6px;background:var(--surface2);
`;
const PName = styled.div`flex:1;font-size:15px;font-weight:600;color:var(--text);`;
const PDetail = styled.div`font-size:14px;color:var(--text-muted);`;
const PProfit = styled.div<{$pos:boolean}>`
  font-size:15px;font-weight:800;
  color:${p=>p.$pos?"var(--success)":"var(--accent)"};
`;

const Empty = styled.div`
  text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px;
`;

const API = import.meta.env.VITE_API_URL as string;

type Player = { name:string; buyInTotal:number; cashout?:number };
type TournPlayer = { name:string; position?:number; prize?:number };
type Session = {
  id:number; mode:string; game_name:string|null;
  players: Player[] | TournPlayer[];
  summary: { totalBuyIn?:number; totalCashout?:number; prizePool?:number };
  played_at:string;
};

function fmtN(n:number){ return n.toLocaleString(); }
function fmtDate(s:string){
  const d = new Date(s);
  return d.toLocaleDateString("th-TH",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

interface Props { lang:"TH"|"EN"; token:string; onClose:()=>void; }

export function HistoryModal({ lang, token, onClose }: Props) {
  const isTH = lang === "TH";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [openId,   setOpenId]   = useState<number|null>(null);

  useEffect(()=>{
    fetch(`${API}/history`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : []).then(data=>setSessions(Array.isArray(data)?data:[]))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[token]);

  return (
    <Dialog.Root open onOpenChange={open=>{ if(!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Header>
            <Title><History size={16}/>{isTH?"ประวัติการเล่น":"Session History"}</Title>
            <CloseBtn onClick={onClose}><X size={18}/></CloseBtn>
          </Header>
          <Body>
            {loading && <Empty>{isTH?"กำลังโหลด...":"Loading..."}</Empty>}
            {!loading && sessions.length===0 && (
              <Empty>
                <History size={32} style={{marginBottom:10,opacity:.3}}/>
                <div>{isTH?"ยังไม่มีประวัติการเล่น":"No sessions yet"}</div>
                <div style={{fontSize:14,marginTop:6,color:"var(--text-dim)"}}>
                  {isTH?"ระบบจะบันทึกให้อัตโนมัติเมื่อกด Export หรือ Share":"Auto-saved when you Export or Share"}
                </div>
              </Empty>
            )}
            {sessions.map(s=>{
              const isCash = s.mode==="CASH";
              const isOpen = openId===s.id;
              return (
                <SessionCard key={s.id} $open={isOpen} onClick={()=>setOpenId(isOpen?null:s.id)}>
                  <SessionHead>
                    <ModeBadge $cash={isCash}>{isCash?(isTH?"Cash":"Cash"):(isTH?"Tourn":"Tourn")}</ModeBadge>
                    <SessionName>{s.game_name||(isTH?"ไม่มีชื่อ":"Unnamed")}</SessionName>
                    <SessionDate>{fmtDate(s.played_at)}</SessionDate>
                  </SessionHead>

                  {isOpen && (
                    <SessionDetail onClick={e=>e.stopPropagation()}>
                      {isCash ? (
                        <>
                          {s.summary?.totalBuyIn!=null && (
                            <div style={{display:"flex",gap:16,fontSize:14,color:"var(--text-muted)",marginBottom:4}}>
                              <span>Buy-in รวม: <b style={{color:"var(--text)"}}>{fmtN(s.summary.totalBuyIn!)}</b></span>
                              <span>Cashout รวม: <b style={{color:"var(--text)"}}>{fmtN(s.summary.totalCashout!)}</b></span>
                            </div>
                          )}
                          {(s.players as Player[]).map((p,i)=>{
                            const profit = (p.cashout||0) - p.buyInTotal;
                            return (
                              <PlayerRow key={i} $profit={profit}>
                                <PName>{p.name}</PName>
                                <PDetail>{fmtN(p.buyInTotal)} → {fmtN(p.cashout||0)}</PDetail>
                                <PProfit $pos={profit>=0}>
                                  {profit>=0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
                                  {" "}{profit>=0?"+":""}{fmtN(profit)}
                                </PProfit>
                              </PlayerRow>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          {s.summary?.prizePool!=null && (
                            <div style={{fontSize:14,color:"var(--text-muted)",marginBottom:4}}>
                              <Trophy size={12} style={{marginRight:4}}/>
                              Prize Pool: <b style={{color:"var(--text)"}}>{fmtN(s.summary.prizePool!)}</b>
                            </div>
                          )}
                          {(s.players as TournPlayer[]).map((p,i)=>(
                            <PlayerRow key={i} $profit={p.position===1?1:0}>
                              <PName>
                                {p.position!=null && (
                                  <span style={{
                                    fontSize:15,fontWeight:800,marginRight:6,
                                    color:p.position===1?"var(--gold)":p.position===2?"var(--silver)":p.position===3?"var(--bronze)":"var(--text-muted)"
                                  }}>#{p.position}</span>
                                )}
                                {p.name}
                              </PName>
                              {p.prize!=null && (
                                <PProfit $pos={true}>
                                  <Coins size={12}/>{" "}{fmtN(p.prize)}
                                </PProfit>
                              )}
                            </PlayerRow>
                          ))}
                        </>
                      )}
                    </SessionDetail>
                  )}
                </SessionCard>
              );
            })}
          </Body>
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
