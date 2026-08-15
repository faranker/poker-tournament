import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { css, keyframes } from "styled-components";
import { ShieldCheck, X } from "lucide-react";

/* ── Animations ── */
const overlayShow  = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow  = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2300;backdrop-filter:blur(5px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2301;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:24px;width:min(420px,94vw);box-shadow:var(--shadow-lg);
  animation:${contentShow} .18s ease;max-height:92vh;overflow-y:auto;
  &:focus{outline:none;}
`;

const ModalHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;
`;
const ModalTitle = styled.h3`
  font-size:16px;font-weight:900;display:flex;align-items:center;gap:8px;color:var(--text);
`;
const CloseBtn = styled.button`
  background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;
  border-radius:6px;display:flex;&:hover{color:var(--text);background:var(--surface2);}
`;

const FieldLabel = styled.label`
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:var(--text-muted);margin-bottom:5px;display:block;
`;
const Input = styled.input`
  width:100%;padding:9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:16px;font-family:inherit;
  &:focus{outline:none;border-color:var(--border2);box-shadow:0 0 0 3px var(--accent-soft);}
  &::placeholder{color:var(--text-dim);}
`;

const StreetRow = styled.div`display:flex;gap:6px;`;
const StreetBtn = styled.button<{$active?:boolean}>`
  flex:1;padding:8px 4px;border-radius:var(--radius-sm);
  border:1px solid var(--border);font-size:13px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:all .15s;
  ${p=>p.$active
    ?css`background:var(--accent);color:#fff;border-color:var(--accent);`
    :css`background:transparent;color:var(--text-muted);&:hover{color:var(--text);border-color:var(--border2);}`}
`;

const Divider = styled.div`height:1px;background:var(--border);margin:16px 0;`;

const SliderWrap = styled.div`display:flex;align-items:center;gap:12px;`;
const Slider = styled.input`
  flex:1;accent-color:var(--accent);cursor:pointer;height:4px;
`;
const SliderNum = styled.div<{$color?:string}>`
  min-width:36px;text-align:center;font-size:22px;font-weight:900;
  color:${p=>p.$color??"var(--accent)"};
`;

const ResultGrid = styled.div`
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;
`;
const ResultCard = styled.div<{$accent?:string}>`
  border-radius:var(--radius-sm);
  border:1px solid ${p=>p.$accent?`${p.$accent}44`:"var(--border)"};
  background:${p=>p.$accent?`${p.$accent}0d`:"var(--surface2)"};
  padding:10px 10px;text-align:center;
`;
const ResultLabel = styled.div`font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;`;
const ResultValue = styled.div<{$color?:string}>`font-size:17px;font-weight:900;color:${p=>p.$color??"var(--text)"};`;
const ResultSub   = styled.div`font-size:9px;color:var(--text-dim);margin-top:2px;`;

const NetBox = styled.div`
  border-radius:var(--radius-sm);
  border:1px solid rgba(34,197,94,.3);
  background:rgba(34,197,94,.06);
  padding:12px 14px;
  display:flex;justify-content:space-between;align-items:center;
`;
const NetLabel = styled.div`font-size:12px;font-weight:700;color:var(--success);`;
const NetValue = styled.div`font-size:22px;font-weight:900;color:var(--text);`;

/* ── Trigger button ── */
const TriggerBtn = styled.button`
  display:flex;align-items:center;gap:7px;
  width:100%;padding:10px 14px;
  border-radius:var(--radius-sm);border:1px solid rgba(34,197,94,.35);
  background:rgba(34,197,94,.07);color:var(--success);
  font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;
  transition:all .18s;
  &:hover{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.6);}
`;

const REMAINING: Record<string,"45"|"44"> = { flop:"45", turn:"44" };
const fmtN = (n: number) => Math.round(n).toLocaleString("en-US");

interface Props { lang: "TH" | "EN" }

export default function PokerInsurance({ lang }: Props) {
  const isTH = lang === "TH";
  const [open,       setOpen]       = useState(false);
  const [pot,        setPot]        = useState("");
  const [street,     setStreet]     = useState<"flop"|"turn">("turn");
  const [totalOuts,  setTotalOuts]  = useState(12);   // จำนวน out ทั้งหมดของฝั่งตรงข้าม
  const [buyOuts,    setBuyOuts]    = useState(3);    // จำนวน out ที่จะซื้อประกัน

  const potNum    = parseFloat(pot) || 0;
  const remaining = Number(REMAINING[street]);

  /* cap buyOuts ไม่เกิน totalOuts */
  const safeBuy   = Math.min(buyOuts, totalOuts);

  /* ค่าประกันต่อ 1 out */
  const costPerOut    = potNum > 0 ? potNum / remaining : 0;
  /* ค่าประกันที่ต้องจ่าย */
  const totalCost     = costPerOut * safeBuy;
  /* โอกาสที่ out ที่ซื้อออกมา */
  const probBought    = (safeBuy  / remaining) * 100;
  /* โอกาสที่ out ทั้งหมดออกมา */
  const probTotal     = (totalOuts / remaining) * 100;
  /* ถ้า out ที่ซื้อออก: ได้รับ pot เต็ม */
  const payoutIfHit   = potNum;
  /* กำไรสุทธิ = payout - cost */
  const netIfHit      = payoutIfHit - totalCost;

  const hasResult = potNum > 0 && totalOuts > 0 && safeBuy > 0;

  return (
    <>
      <TriggerBtn onClick={()=>setOpen(true)}>
        <ShieldCheck size={15}/>
        {isTH ? "คำนวณประกัน (Insurance)" : "Insurance Calculator"}
      </TriggerBtn>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Overlay />
          <Box>
            <ModalHeader>
              <ModalTitle>
                <ShieldCheck size={17} style={{color:"var(--success)"}}/>
                {isTH ? "คำนวณประกัน" : "Insurance Calculator"}
              </ModalTitle>
              <CloseBtn onClick={()=>setOpen(false)}><X size={18}/></CloseBtn>
            </ModalHeader>

            {/* Pot */}
            <FieldLabel>{isTH ? "ยอด Pot (บาท)" : "Pot Size (฿)"}</FieldLabel>
            <Input
              type="number" inputMode="numeric"
              placeholder={isTH ? "เช่น 5,000" : "e.g. 5000"}
              value={pot}
              onChange={e=>setPot(e.target.value)}
              style={{marginBottom:14}}
            />

            {/* Street */}
            <FieldLabel>{isTH ? "ตำแหน่งไพ่" : "Street"}</FieldLabel>
            <StreetRow style={{marginBottom:14}}>
              <StreetBtn $active={street==="flop"} onClick={()=>setStreet("flop")}>
                Flop
                <div style={{fontSize:10,fontWeight:500,opacity:.7,marginTop:1}}>
                  {isTH?"เหลือ 2 ใบ (45 ใบ)":"2 to come (45)"}
                </div>
              </StreetBtn>
              <StreetBtn $active={street==="turn"} onClick={()=>setStreet("turn")}>
                Turn
                <div style={{fontSize:10,fontWeight:500,opacity:.7,marginTop:1}}>
                  {isTH?"เหลือ 1 ใบ (44 ใบ)":"1 to come (44)"}
                </div>
              </StreetBtn>
            </StreetRow>

            {/* Total outs */}
            <FieldLabel>
              {isTH ? "Out ทั้งหมดของฝั่งตรงข้าม" : "Opponent's Total Outs"}
            </FieldLabel>
            <SliderWrap style={{marginBottom:4}}>
              <Slider
                type="range" min={1} max={20} value={totalOuts}
                onChange={e=>{
                  const v = Number(e.target.value);
                  setTotalOuts(v);
                  if(buyOuts > v) setBuyOuts(v);
                }}
              />
              <SliderNum $color="var(--text-muted)">{totalOuts}</SliderNum>
            </SliderWrap>
            <div style={{fontSize:10,color:"var(--text-dim)",marginBottom:14,textAlign:"right"}}>
              {isTH?`โอกาสฝั่งตรงข้ามแตก ${probTotal.toFixed(1)}%`:`Opponent hits ${probTotal.toFixed(1)}%`}
            </div>

            {/* Outs to buy */}
            <FieldLabel>
              {isTH ? "จำนวน Out ที่ต้องการซื้อประกัน" : "Outs to Cover (buy)"}
            </FieldLabel>
            <SliderWrap style={{marginBottom:4}}>
              <Slider
                type="range" min={1} max={totalOuts} value={safeBuy}
                onChange={e=>setBuyOuts(Number(e.target.value))}
              />
              <SliderNum>{safeBuy}</SliderNum>
            </SliderWrap>
            <div style={{fontSize:10,color:"var(--text-dim)",marginBottom:16,textAlign:"right"}}>
              {isTH
                ?`ซื้อ ${safeBuy} จาก ${totalOuts} out (${((safeBuy/totalOuts)*100).toFixed(0)}% ของ risk ทั้งหมด)`
                :`${safeBuy} of ${totalOuts} outs (${((safeBuy/totalOuts)*100).toFixed(0)}% of total risk)`}
            </div>

            <Divider style={{margin:"0 0 16px"}}/>

            {/* Results */}
            {hasResult ? (
              <>
                <ResultGrid>
                  <ResultCard $accent="#d4af37">
                    <ResultLabel>{isTH?"ค่าประกัน":"Premium"}</ResultLabel>
                    <ResultValue $color="var(--gold)">฿{fmtN(totalCost)}</ResultValue>
                    <ResultSub>{safeBuy} × ฿{fmtN(costPerOut)}</ResultSub>
                  </ResultCard>
                  <ResultCard $accent="#4a8cdf">
                    <ResultLabel>{isTH?"โอกาส out ที่ซื้อออก":"Bought Hit %"}</ResultLabel>
                    <ResultValue $color="#4a8cdf">{probBought.toFixed(1)}%</ResultValue>
                    <ResultSub>{safeBuy}/{remaining} {isTH?"ใบ":"cards"}</ResultSub>
                  </ResultCard>
                  <ResultCard $accent="#22c55e">
                    <ResultLabel>{isTH?"ถ้าประกันแตก ได้รับ":"If Hit — Receive"}</ResultLabel>
                    <ResultValue $color="var(--success)">฿{fmtN(payoutIfHit)}</ResultValue>
                    <ResultSub>{isTH?"(เต็ม Pot)":"(full pot)"}</ResultSub>
                  </ResultCard>
                </ResultGrid>

                <NetBox style={{marginTop:12}}>
                  <div>
                    <NetLabel>
                      {isTH?"กำไรสุทธิถ้าประกันแตก":"Net gain if insurance hits"}
                    </NetLabel>
                    <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>
                      {isTH
                        ?`฿${fmtN(payoutIfHit)} − ค่าประกัน ฿${fmtN(totalCost)}`
                        :`฿${fmtN(payoutIfHit)} − premium ฿${fmtN(totalCost)}`}
                    </div>
                  </div>
                  <NetValue style={{color: netIfHit >= 0 ? "var(--success)" : "#ff4d4d"}}>
                    {netIfHit >= 0 ? "+" : ""}฿{fmtN(netIfHit)}
                  </NetValue>
                </NetBox>

                <div style={{fontSize:11,color:"var(--text-dim)",marginTop:10,lineHeight:1.6,
                  background:"var(--surface2)",borderRadius:"var(--radius-sm)",padding:"8px 10px",
                  border:"1px solid var(--border)"}}>
                  {isTH
                    ?`💡 ซื้อ ${safeBuy} จาก ${totalOuts} out · ค่าประกัน/out = ฿${fmtN(costPerOut)} · ถ้า out ที่ไม่ได้ซื้อ (${totalOuts-safeBuy} out) ออกมา — ไม่ได้รับอะไร`
                    :`💡 Covering ${safeBuy} of ${totalOuts} outs · ฿${fmtN(costPerOut)}/out · If uncovered outs (${totalOuts-safeBuy}) hit — no payout`}
                </div>
              </>
            ) : (
              <div style={{textAlign:"center",color:"var(--text-dim)",fontSize:13,padding:"16px 0"}}>
                {isTH?"กรอกยอด Pot เพื่อคำนวณ":"Enter pot size to calculate"}
              </div>
            )}
          </Box>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
