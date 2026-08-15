import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { css, keyframes } from "styled-components";
import { Check, X, Spade } from "lucide-react";
import type { Plan } from "../auth";
import { PLAN_COLORS } from "../auth";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2100;backdrop-filter:blur(6px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2101;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:32px 28px;width:min(680px,94vw);box-shadow:var(--shadow-lg);
  animation:${contentShow} .18s ease;max-height:92vh;overflow-y:auto;
  &:focus{outline:none;}
`;
const Title = styled.h2`font-size:20px;font-weight:900;text-align:center;margin-bottom:6px;`;
const Sub   = styled.p`font-size:15px;color:var(--text-muted);text-align:center;margin-bottom:28px;`;

const Grid = styled.div`
  display:grid;grid-template-columns:repeat(3,1fr);gap:14px;
  @media(max-width:480px){grid-template-columns:1fr;}
`;

const PlanCard = styled.div<{$plan:Plan;$current?:boolean}>`
  border-radius:var(--radius);border:2px solid ${p=>p.$current?PLAN_COLORS[p.$plan]:"var(--border)"};
  padding:20px 16px 18px;display:flex;flex-direction:column;gap:0;position:relative;
  background:${p=>p.$current?`${PLAN_COLORS[p.$plan]}10`:"var(--surface2)"};
  transition:border-color .18s;
  &:hover{border-color:${p=>PLAN_COLORS[p.$plan]};}
`;

const CurrentBadge = styled.div<{$plan:Plan}>`
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:${p=>PLAN_COLORS[p.$plan]};color:#fff;font-size:12px;font-weight:800;
  padding:3px 12px;border-radius:10px;white-space:nowrap;
`;

const PlanName = styled.div<{$plan:Plan}>`
  font-size:16px;font-weight:900;color:${p=>PLAN_COLORS[p.$plan]};
  margin-bottom:10px;
`;
const Price = styled.div`
  font-size:28px;font-weight:900;line-height:1;margin-bottom:4px;
  span{font-size:15px;font-weight:500;color:var(--text-muted);}
`;
const PriceAlt = styled.div`font-size:13px;color:var(--text-muted);margin-bottom:14px;`;

const Divider = styled.div`height:1px;background:var(--border);margin-bottom:14px;`;

const FeatureList = styled.ul`list-style:none;display:flex;flex-direction:column;gap:8px;flex:1;margin-bottom:16px;`;
const Feature = styled.li<{$ok?:boolean}>`
  font-size:14px;display:flex;align-items:flex-start;gap:7px;line-height:1.45;
  color:${p=>p.$ok===false?"var(--text-dim)":"var(--text)"};
  svg{flex-shrink:0;margin-top:2px;}
`;

type BtnV = "primary"|"secondary"|"ghost";
const Btn = styled.button<{$v?:BtnV;$full?:boolean;$plan?:Plan}>`
  padding:10px 16px;border-radius:var(--radius-sm);border:none;
  font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;
  width:${p=>p.$full?"100%":"auto"};transition:all .18s;
  &:disabled{opacity:.45;cursor:default;}
  ${p=>{
    if(p.$plan) return css`
      background:${PLAN_COLORS[p.$plan]};color:#fff;
      &:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}
    `;
    switch(p.$v){
      case"ghost": return css`background:transparent;color:var(--text-muted);border:1px solid var(--border);&:hover{color:var(--text);}`;
      default:     return css`background:var(--surface3);color:var(--text);border:1px solid var(--border);&:hover{border-color:var(--border2);}`;
    }
  }}
`;

const Note = styled.p`
  font-size:13px;color:var(--text-dim);text-align:center;margin-top:16px;line-height:1.6;
`;

/* Billing toggle */
const ToggleWrap = styled.div`
  display:flex;align-items:center;justify-content:center;gap:0;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:10px;padding:4px;margin-bottom:24px;align-self:center;width:fit-content;margin-left:auto;margin-right:auto;
`;
const ToggleBtn = styled.button<{$active?:boolean}>`
  padding:7px 20px;border-radius:7px;border:none;cursor:pointer;
  font-size:13px;font-weight:700;font-family:inherit;transition:all .18s;
  ${p=>p.$active
    ? "background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--accent-glow);"
    : "background:transparent;color:var(--text-muted);&:hover{color:var(--text);}"}
`;
const SaveBadge = styled.span`
  font-size:10px;font-weight:800;background:#16a34a22;color:var(--success);
  border:1px solid #16a34a44;border-radius:10px;padding:1px 7px;margin-left:6px;
`;

export type BillingCycle = "monthly" | "yearly";

interface Props {
  currentPlan: Plan;
  lang: "TH" | "EN";
  onClose: () => void;
  onUpgrade: (plan: Plan, cycle: BillingCycle) => void;
}

type PlanDef = {
  key: Plan;
  nameTH: string; nameEN: string;
  monthly: number | null; yearly: number | null;
  savePct?: number;
  featuresTH: { text: string; ok?: boolean }[];
  featuresEN: { text: string; ok?: boolean }[];
};

const PLANS: PlanDef[] = [
  {
    key: "free",
    nameTH: "Free", nameEN: "Free",
    monthly: null, yearly: null,
    featuresTH: [
      { text: "Cash Game ≤ 6 คน" },
      { text: "Tournament (default blind เท่านั้น)" },
      { text: "Export/Share 3 ครั้ง/เดือน (มี watermark)" },
      { text: "ธีม Dark เท่านั้น", ok: false },
    ],
    featuresEN: [
      { text: "Cash Game ≤ 6 players" },
      { text: "Tournament (default blind only)" },
      { text: "Export/Share 3×/month (watermarked)" },
      { text: "Dark theme only", ok: false },
    ],
  },
  {
    key: "cash_pro",
    nameTH: "Cash Pro", nameEN: "Cash Pro",
    monthly: 49, yearly: 299, savePct: 41,
    featuresTH: [
      { text: "Cash Game ไม่จำกัดผู้เล่น" },
      { text: "Export/Share 5 ครั้ง/เดือน ไม่มี watermark" },
      { text: "ทุกธีม" },
      { text: "Tournament mode", ok: false },
    ],
    featuresEN: [
      { text: "Unlimited Cash Game players" },
      { text: "Export/Share 5×/month, no watermark" },
      { text: "All themes" },
      { text: "Tournament mode", ok: false },
    ],
  },
  {
    key: "full_pro",
    nameTH: "Full Pro", nameEN: "Full Pro",
    monthly: 99, yearly: 499, savePct: 58,
    featuresTH: [
      { text: "ทุกอย่างใน Cash Pro" },
      { text: "Tournament เต็มรูปแบบ (custom blind, bounty)" },
      { text: "ผู้เล่นไม่จำกัดทุกโหมด" },
      { text: "Export/Share ไม่จำกัด ไม่มี watermark" },
    ],
    featuresEN: [
      { text: "Everything in Cash Pro" },
      { text: "Full Tournament (custom blind, bounty)" },
      { text: "Unlimited players all modes" },
      { text: "Unlimited exports, no watermark" },
    ],
  },
];

export function PricingModal({ currentPlan, lang, onClose, onUpgrade }: Props) {
  const isTH = lang === "TH";
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <Dialog.Root open onOpenChange={open=>{ if(!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Title style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Spade size={18}/> {isTH ? "เลือกแพลน" : "Choose Your Plan"}
          </Title>
          <Sub>{isTH ? "อัพเกรดเพื่อใช้งานได้เต็มที่" : "Upgrade to unlock all features"}</Sub>

          {/* Billing toggle */}
          <ToggleWrap>
            <ToggleBtn $active={cycle==="monthly"} onClick={()=>setCycle("monthly")}>
              {isTH?"รายเดือน":"Monthly"}
            </ToggleBtn>
            <ToggleBtn $active={cycle==="yearly"} onClick={()=>setCycle("yearly")}>
              {isTH?"รายปี":"Yearly"}
              <SaveBadge>{isTH?"ประหยัดสูงสุด 58%":"Save up to 58%"}</SaveBadge>
            </ToggleBtn>
          </ToggleWrap>

          <Grid>
            {PLANS.map(p => {
              const isCurrent = currentPlan === p.key;
              const features = isTH ? p.featuresTH : p.featuresEN;
              const price = cycle==="yearly" ? p.yearly : p.monthly;
              const priceUnit = cycle==="yearly"
                ? (isTH?"/ปี":"/yr")
                : (isTH?"/เดือน":"/mo");
              const altPrice = cycle==="yearly"
                ? (p.monthly ? (isTH?`เทียบเท่า ${Math.round(p.yearly!/12)}฿/เดือน`:`≈ ${Math.round(p.yearly!/12)}฿/mo`) : "")
                : (p.yearly ? (isTH?`${p.yearly}฿/ปี (ประหยัด ${p.savePct}%)`:`${p.yearly}฿/yr (save ${p.savePct}%)`) : "");
              return (
                <PlanCard key={p.key} $plan={p.key} $current={isCurrent}>
                  {isCurrent && <CurrentBadge $plan={p.key}>{isTH ? "แพลนปัจจุบัน" : "Current"}</CurrentBadge>}
                  <PlanName $plan={p.key}>{isTH ? p.nameTH : p.nameEN}</PlanName>
                  <Price>
                    {price ? `${price}฿` : (isTH?"ฟรี":"Free")}
                    {price && <span>{priceUnit}</span>}
                  </Price>
                  <PriceAlt>{altPrice || (isTH?"ตลอดไป":"Forever")}</PriceAlt>
                  <Divider />
                  <FeatureList>
                    {features.map((f, i) => (
                      <Feature key={i} $ok={f.ok}>
                        {f.ok===false
                          ? <X size={12} style={{color:"var(--text-dim)"}}/>
                          : <Check size={12} style={{color:"var(--success)"}}/>}
                        {f.text}
                      </Feature>
                    ))}
                  </FeatureList>
                  <Btn $plan={p.key} $full disabled={p.key === "free"}
                    onClick={() => onUpgrade(p.key, cycle)}>
                    {p.key === "free"
                      ? (isTH ? "ฟรี" : "Free")
                      : isCurrent
                        ? (isTH ? "🔄 ต่ออายุ" : "🔄 Renew")
                        : (isTH ? "อัพเกรด" : "Upgrade")}
                  </Btn>
                </PlanCard>
              );
            })}
          </Grid>

          <Note>
            {isTH
              ? "💳 ชำระผ่าน PromptPay QR · ยกเลิกได้ทุกเมื่อ · ราคารวม VAT แล้ว"
              : "💳 Pay via PromptPay QR · Cancel anytime · VAT included"}
            <br />
            {isTH ? "ระบบ payment กำลังเปิดให้บริการเร็วๆ นี้" : "Payment system coming soon"}
          </Note>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Dialog.Close asChild>
              <Btn $v="ghost">{isTH ? "ปิด" : "Close"}</Btn>
            </Dialog.Close>
          </div>
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
