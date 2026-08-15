import { useState, useCallback } from "react";
import styled, { css } from "styled-components";
import { ShieldCheck, ShieldX, Info } from "lucide-react";

/* ── Styled ── */
const Wrap = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.div`
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 800; color: var(--text);
  text-transform: uppercase; letter-spacing: .06em;
`;

const FieldLabel = styled.label`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--text-muted); margin-bottom: 4px;
  display: block;
`;

const Input = styled.input`
  width: 100%; padding: 8px 10px; border-radius: var(--radius-sm);
  border: 1px solid var(--border); background: var(--surface2);
  color: var(--text); font-size: 15px; font-family: inherit;
  &:focus { outline: none; border-color: var(--border2); box-shadow: 0 0 0 3px var(--accent-soft); }
  &::placeholder { color: var(--text-dim); }
`;

const StreetRow = styled.div`display: flex; gap: 6px;`;
const StreetBtn = styled.button<{$active?: boolean}>`
  flex: 1; padding: 7px 4px; border-radius: var(--radius-sm);
  border: 1px solid var(--border); font-size: 12px; font-weight: 700;
  font-family: inherit; cursor: pointer; transition: all .15s;
  ${p => p.$active
    ? css`background: var(--accent); color: #fff; border-color: var(--accent);`
    : css`background: transparent; color: var(--text-muted); &:hover{color:var(--text);border-color:var(--border2);}`}
`;

const OutsRow = styled.div`display: flex; align-items: center; gap: 10px;`;
const OutsSlider = styled.input`
  flex: 1; accent-color: var(--accent); cursor: pointer; height: 4px;
`;
const OutsNum = styled.div`
  min-width: 32px; text-align: center; font-size: 20px; font-weight: 900;
  color: var(--accent);
`;

const Divider = styled.div`height: 1px; background: var(--border);`;

const ResultGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
`;

const ResultCard = styled.div<{$color?: string; $bg?: string}>`
  border-radius: var(--radius-sm);
  border: 1px solid ${p => p.$color ?? "var(--border)"};
  background: ${p => p.$bg ?? "var(--surface2)"};
  padding: 10px 12px;
`;
const ResultLabel = styled.div`font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px;`;
const ResultValue = styled.div<{$color?: string}>`font-size: 18px; font-weight: 900; color: ${p => p.$color ?? "var(--text)"};`;
const ResultSub = styled.div`font-size: 10px; color: var(--text-dim); margin-top: 2px;`;

const WinLoseBox = styled.div<{$win?: boolean}>`
  border-radius: var(--radius-sm);
  border: 1px solid ${p => p.$win ? "rgba(76,239,144,0.3)" : "rgba(255,77,77,0.3)"};
  background: ${p => p.$win ? "rgba(76,239,144,0.06)" : "rgba(255,77,77,0.06)"};
  padding: 10px 12px;
  display: flex; align-items: center; gap: 10px;
`;
const WinLoseIcon = styled.div<{$win?: boolean}>`color: ${p => p.$win ? "var(--success)" : "#ff4d4d"};`;
const WinLoseText = styled.div`flex: 1;`;
const WinLoseTitle = styled.div<{$win?: boolean}>`font-size: 12px; font-weight: 800; color: ${p => p.$win ? "var(--success)" : "#ff4d4d"};`;
const WinLoseAmt = styled.div`font-size: 20px; font-weight: 900; color: var(--text);`;

const Hint = styled.div`
  font-size: 11px; color: var(--text-dim); line-height: 1.5;
  background: var(--surface2); border-radius: var(--radius-sm);
  padding: 8px 10px; border: 1px solid var(--border);
  display: flex; gap: 7px; align-items: flex-start;
`;

const fmtN = (n: number) => Math.round(n).toLocaleString("en-US");

/* ── Remaining cards by street ── */
const REMAINING: Record<string, number> = {
  flop: 45,   // 52 - 2 hole A - 2 hole B - 3 flop
  turn: 44,   // 52 - 2 - 2 - 4
};

interface Props {
  lang: "TH" | "EN";
}

export default function PokerInsurance({ lang }: Props) {
  const isTH = lang === "TH";
  const [pot,    setPot]    = useState<string>("");
  const [street, setStreet] = useState<"flop"|"turn">("turn");
  const [outs,   setOuts]   = useState(9);

  const potNum    = parseFloat(pot) || 0;
  const remaining = REMAINING[street];

  /* ── Calculation ── */
  const calc = useCallback(() => {
    if (potNum <= 0) return null;

    /* fair premium per out = pot / remaining */
    const premiumPerOut = potNum / remaining;
    const cost          = premiumPerOut * outs;          // what buyer pays
    const grossPayout   = potNum;                        // if hit: buyer receives full pot
    const netIfHit      = grossPayout - cost;            // net gain for buyer
    const probHit       = (outs / remaining) * 100;

    return { cost, grossPayout, netIfHit, probHit, premiumPerOut };
  }, [potNum, remaining, outs]);

  const result = calc();

  return (
    <Wrap>
      <SectionTitle>
        <ShieldCheck size={15} style={{color:"var(--success)"}}/>
        {isTH ? "คำนวณประกัน (Insurance)" : "Insurance Calculator"}
      </SectionTitle>

      {/* Pot */}
      <div>
        <FieldLabel>{isTH ? "ยอด Pot (บาท)" : "Pot Size (฿)"}</FieldLabel>
        <Input
          type="number" inputMode="numeric"
          placeholder={isTH ? "เช่น 5000" : "e.g. 5000"}
          value={pot}
          onChange={e => setPot(e.target.value)}
        />
      </div>

      {/* Street */}
      <div>
        <FieldLabel>{isTH ? "ตำแหน่งไพ่" : "Street"}</FieldLabel>
        <StreetRow>
          <StreetBtn $active={street==="flop"} onClick={()=>setStreet("flop")}>
            Flop <span style={{fontSize:10,opacity:.7}}>{isTH?"(เหลือ 2 ใบ)":"(2 to come)"}</span>
          </StreetBtn>
          <StreetBtn $active={street==="turn"} onClick={()=>setStreet("turn")}>
            Turn <span style={{fontSize:10,opacity:.7}}>{isTH?"(เหลือ 1 ใบ)":"(1 to come)"}</span>
          </StreetBtn>
        </StreetRow>
      </div>

      {/* Outs slider */}
      <div>
        <FieldLabel style={{marginBottom:8}}>
          {isTH ? "จำนวน Out ที่ซื้อ" : "Outs to Cover"}
        </FieldLabel>
        <OutsRow>
          <OutsSlider
            type="range" min={1} max={20} value={outs}
            onChange={e => setOuts(Number(e.target.value))}
          />
          <OutsNum>{outs}</OutsNum>
        </OutsRow>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text-dim)",marginTop:2}}>
          <span>1 out</span>
          <span>20 outs</span>
        </div>
      </div>

      <Divider />

      {/* Results */}
      {result && potNum > 0 ? (
        <>
          <ResultGrid>
            <ResultCard $color="rgba(212,175,55,0.4)" $bg="rgba(212,175,55,0.06)">
              <ResultLabel>{isTH ? "ค่าประกัน (จ่าย)" : "Premium (Pay)"}</ResultLabel>
              <ResultValue $color="var(--gold)">฿{fmtN(result.cost)}</ResultValue>
              <ResultSub>{isTH ? `${outs} outs × ฿${fmtN(result.premiumPerOut)}/out` : `${outs} outs × ฿${fmtN(result.premiumPerOut)}/out`}</ResultSub>
            </ResultCard>
            <ResultCard>
              <ResultLabel>{isTH ? "โอกาสแตก" : "Hit Probability"}</ResultLabel>
              <ResultValue $color="var(--text)">{result.probHit.toFixed(1)}%</ResultValue>
              <ResultSub>{outs}/{remaining} {isTH ? "ใบ" : "cards"}</ResultSub>
            </ResultCard>
          </ResultGrid>

          {/* If insurance hits */}
          <WinLoseBox $win>
            <WinLoseIcon $win><ShieldCheck size={20}/></WinLoseIcon>
            <WinLoseText>
              <WinLoseTitle $win>{isTH ? "✅ ประกันแตก — ผู้ซื้อได้รับ" : "✅ Insurance Hits — Buyer receives"}</WinLoseTitle>
              <WinLoseAmt>฿{fmtN(result.grossPayout)}</WinLoseAmt>
              <ResultSub style={{marginTop:2}}>
                {isTH
                  ? `ได้ ฿${fmtN(result.grossPayout)} − จ่ายไป ฿${fmtN(result.cost)} = กำไรสุทธิ ฿${fmtN(result.netIfHit)}`
                  : `Receive ฿${fmtN(result.grossPayout)} − paid ฿${fmtN(result.cost)} = net ฿${fmtN(result.netIfHit)}`}
              </ResultSub>
            </WinLoseText>
          </WinLoseBox>

          {/* If insurance doesn't hit */}
          <WinLoseBox>
            <WinLoseIcon><ShieldX size={20}/></WinLoseIcon>
            <WinLoseText>
              <WinLoseTitle>{isTH ? "❌ ประกันไม่แตก — ผู้ซื้อเสีย" : "❌ Insurance Misses — Buyer loses"}</WinLoseTitle>
              <WinLoseAmt>฿{fmtN(result.cost)}</WinLoseAmt>
              <ResultSub style={{marginTop:2}}>
                {isTH
                  ? `แต่ผู้ขายประกันจ่ายเงินกลับ ฿${fmtN(result.cost)} + ชนะ Pot ฿${fmtN(potNum)}`
                  : `But seller returns ฿${fmtN(result.cost)}, buyer wins pot ฿${fmtN(potNum)}`}
              </ResultSub>
            </WinLoseText>
          </WinLoseBox>
        </>
      ) : (
        <div style={{textAlign:"center",color:"var(--text-dim)",fontSize:13,padding:"8px 0"}}>
          {isTH ? "กรอกยอด Pot เพื่อคำนวณ" : "Enter pot size to calculate"}
        </div>
      )}

      <Hint>
        <Info size={13} style={{flexShrink:0,marginTop:1,color:"var(--text-dim)"}}/>
        <span>
          {isTH
            ? `ค่าประกันต่อ 1 out = Pot ÷ ${remaining} ใบที่เหลือ · ถ้าประกันแตก ผู้ขายจ่าย Pot คืนให้ผู้ซื้อ`
            : `Cost per out = Pot ÷ ${remaining} remaining cards · If hit, seller pays full pot to buyer`}
        </span>
      </Hint>
    </Wrap>
  );
}
