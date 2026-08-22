import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { Heart, X, Check, CheckCircle, Clock, AlertTriangle, MessageCircle, Trophy } from "lucide-react";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2200;backdrop-filter:blur(6px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2201;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  width:min(420px,94vw);box-shadow:var(--shadow-lg);
  animation:${contentShow} .18s ease;max-height:92vh;overflow-y:auto;
  &:focus{outline:none;}
`;
const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 20px 0;
`;
const Title = styled.h2`
  font-size:17px;font-weight:900;display:flex;align-items:center;gap:8px;
`;
const CloseBtn = styled.button`
  background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;
  border-radius:6px;display:flex;&:hover{color:var(--text);background:var(--surface2);}
`;
const Body = styled.div`padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px;position:relative;`;

const NameInput = styled.input`
  width:100%;padding:9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:15px;font-family:inherit;
  &:focus{outline:none;border-color:#e879a0;box-shadow:0 0 0 3px #e879a022;}
  &::placeholder{color:var(--text-dim);}
  /* Hide the native up/down spinner on type="number" (the amount field) —
     harmless no-op on text inputs since these pseudo-elements/properties
     only ever apply to number inputs. */
  &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
  &[type="number"] { -moz-appearance:textfield; }
`;
const ReadOnlyName = styled.div`
  width:100%;padding:9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface3);
  color:var(--text);font-size:15px;font-weight:700;
`;
const FieldSelect = styled.select`
  width:100%;padding:9px 32px 9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:15px;font-family:inherit;cursor:pointer;
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238892a4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 11px center;
  &:focus{outline:none;border-color:#e879a0;}
`;

const SubmitBtn = styled.button`
  width:100%;padding:12px;border-radius:var(--radius-sm);border:none;
  background:linear-gradient(135deg,#be185d,#e879a0);
  color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;
  transition:all .18s;display:flex;align-items:center;justify-content:center;gap:8px;
  &:hover:not(:disabled){opacity:.9;transform:translateY(-1px);}
  &:disabled{opacity:.45;cursor:not-allowed;transform:none;}
`;
const CancelLink = styled.button`
  background:none;border:none;color:var(--text-dim);font-size:12px;font-weight:600;
  cursor:pointer;text-decoration:underline;text-underline-offset:2px;
  align-self:center;font-family:inherit;
  &:hover{color:var(--text-muted);}
`;
const LineBtn = styled.a`
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:12px;border-radius:var(--radius-sm);border:none;text-decoration:none;
  background:#06c755;color:#fff;font-size:14px;font-weight:800;cursor:pointer;
  font-family:inherit;transition:all .18s;
  &:hover{opacity:.9;}
`;

const ConfirmOverlay = styled.div`
  position:absolute;inset:0;z-index:10;border-radius:var(--radius);
  background:rgba(0,0,0,.75);backdrop-filter:blur(2px);
  display:flex;align-items:center;justify-content:center;padding:20px;
`;
const ConfirmCard = styled.div`
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:22px;width:min(300px,100%);text-align:center;
  box-shadow:var(--shadow-lg);display:flex;flex-direction:column;gap:14px;
  h3{font-size:15px;font-weight:800;color:var(--text);}
  p{font-size:13px;color:var(--text-muted);line-height:1.5;}
`;
const ConfirmActions = styled.div`display:flex;gap:8px;`;
const DangerBtn = styled.button`
  flex:1;padding:11px;border-radius:var(--radius-sm);border:none;cursor:pointer;
  background:#ef4444;color:#fff;font-size:13px;font-weight:800;font-family:inherit;
  &:hover{opacity:.9;}
`;
const GhostBtn = styled.button`
  flex:1;padding:11px;border-radius:var(--radius-sm);border:1px solid var(--border);cursor:pointer;
  background:transparent;color:var(--text);font-size:13px;font-weight:700;font-family:inherit;
  &:hover{border-color:var(--border2);}
`;

const Divider = styled.div`height:1px;background:var(--border);`;

/* Top 5 */
const Top5Wrap = styled.div`display:flex;flex-direction:column;gap:8px;`;
const Top5Row  = styled.div<{$rank:number}>`
  display:flex;align-items:center;gap:10px;
  padding:9px 12px;border-radius:var(--radius-sm);
  background:${p=>p.$rank===1?"#e879a011":p.$rank===2?"rgba(192,192,192,.1)":p.$rank===3?"rgba(205,127,50,.1)":"var(--surface2)"};
  border:1px solid ${p=>p.$rank===1?"#e879a044":p.$rank===2?"rgba(192,192,192,.3)":p.$rank===3?"rgba(205,127,50,.3)":"var(--border)"};
`;
const RankBadge = styled.div<{$rank:number}>`
  width:24px;height:24px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:900;
  background:${p=>p.$rank===1?"#e879a0":p.$rank===2?"#9ca3af":p.$rank===3?"#b45309":"var(--surface3)"};
  color:${p=>p.$rank<=3?"#fff":"var(--text-muted)"};
`;
const Top5Name   = styled.div`flex:1;font-size:14px;font-weight:700;color:var(--text);`;
const Top5Amount = styled.div`font-size:13px;font-weight:800;color:#e879a0;`;

const StatusBox = styled.div<{$ok?:boolean;$warn?:boolean}>`
  display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-radius:var(--radius-sm);font-size:13px;font-weight:600;
  background:${p=>p.$ok?"#e879a011":p.$warn?"rgba(239,68,68,.1)":"rgba(245,158,11,.1)"};
  border:1px solid ${p=>p.$ok?"#e879a044":p.$warn?"rgba(239,68,68,.3)":"rgba(245,158,11,.3)"};
  color:${p=>p.$ok?"#e879a0":p.$warn?"#ef4444":"#f59e0b"};
`;

const CountdownBox = styled.div`
  text-align:center;font-size:13px;color:var(--text-muted);font-weight:600;
  .digits{font-variant-numeric:tabular-nums;font-size:22px;font-weight:900;color:var(--text);margin-top:2px;}
`;

const FieldLabel = styled.div`font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:.07em;color:var(--text-muted);margin-bottom:5px;`;

/* Short bank codes — same vocabulary as PaymentModal.tsx's BANKS / server's
   KNOWN_BANK_CODES (line-forwarder-app's parser output). */
const BANKS: { code: string; label: string }[] = [
  { code: "SCB",   label: "ไทยพาณิชย์ (SCB)" },
  { code: "KTB",   label: "กรุงไทย (KTB)" },
  { code: "GSB",   label: "ออมสิน (GSB)" },
  { code: "KBANK", label: "กสิกรไทย (KBANK)" },
  { code: "BAY",   label: "กรุงศรีอยุธยา (BAY)" },
  { code: "BBL",   label: "กรุงเทพ (BBL)" },
  { code: "TTB",   label: "ทีทีบี (TTB)" },
  { code: "UOB",   label: "ยูโอบี (UOB)" },
  { code: "CIMB",  label: "ซีไอเอ็มบี (CIMB)" },
];

const API = import.meta.env.VITE_API_URL as string;
const LINE_CONTACT_URL = import.meta.env.VITE_LINE_CONTACT_URL as string | undefined;

type Donor = { display_name: string; amount: number };
type Step = "form" | "waiting" | "approved" | "expired_fallback";

interface Props {
  lang: "TH" | "EN";
  defaultName?: string;
  userId?: string;
  onClose: () => void;
}

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function DonateModal({ lang, defaultName = "", userId, onClose }: Props) {
  const isTH = lang === "TH";
  const isLoggedIn = !!userId;

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState(defaultName);
  const [amount, setAmountInput] = useState("");
  const [fromBank, setFromBank] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [donationId, setDonationId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const requestClose = () => setShowCancelConfirm(true);
  const confirmCancel = () => { setShowCancelConfirm(false); onClose(); };

  const [top5, setTop5] = useState<Donor[]>([]);
  useEffect(() => {
    fetch(`${API}/donations/top`).then(r => r.json()).then(setTop5).catch(() => {});
  }, [step]);

  const canSubmit = name.trim() && Number(amount) > 0 && fromBank && fromAccount.trim();

  const handleInitiate = async () => {
    if (!canSubmit) return;
    setInitiating(true);
    setInitError(null);
    try {
      const res = await fetch(`${API}/donations/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name.trim(),
          amount: Number(amount),
          expected_from_bank: fromBank,
          expected_from_account_number: fromAccount.trim(),
          user_id: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setInitError(data?.error || (isTH ? "เกิดข้อผิดพลาด" : "Something went wrong")); return; }
      setDonationId(data.id);
      setExpiresAt(data.expires_at);
      setStep("waiting");
    } catch {
      setInitError(isTH ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : "Could not reach the server");
    } finally {
      setInitiating(false);
    }
  };

  /* Poll for auto-approval while waiting */
  useEffect(() => {
    if (step !== "waiting" || !donationId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API}/donations/status/${donationId}`);
        const data = await res.json();
        if (data.status === "approved") { setStep("approved"); }
        else if (data.status === "expired") { setStep("expired_fallback"); }
      } catch {
        // transient network hiccup — next poll tick will retry
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [step, donationId]);

  /* Client-side countdown, driven by the server's expires_at */
  useEffect(() => {
    if (step !== "waiting" || !expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) setStep("expired_fallback");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, expiresAt]);

  return (
    <Dialog.Root open onOpenChange={() => { /* only the explicit close/cancel actions below may close this */ }}>
      <Dialog.Portal>
        <Overlay />
        <Box
          onPointerDownOutside={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
        >
          <Header>
            <Title>
              <Heart size={17} style={{color:"#e879a0"}} fill="#e879a0"/>
              {isTH ? "Support ค่าหมูกระทะ" : "Support Developer"}
            </Title>
            <CloseBtn onClick={requestClose}><X size={18}/></CloseBtn>
          </Header>

          <Body>
            {/* Top 5 */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <Trophy size={14} style={{color:"#e879a0"}}/>
                <span style={{fontSize:12,fontWeight:800,letterSpacing:".06em",
                  textTransform:"uppercase",color:"var(--text-muted)"}}>
                  Top Supporters
                </span>
              </div>
              {top5.length === 0 ? (
                <div style={{textAlign:"center",padding:"12px 0",fontSize:13,color:"var(--text-dim)"}}>
                  {isTH?"ยังไม่มีข้อมูล — เป็นคนแรกได้เลย!":"No data yet — be the first!"}
                </div>
              ) : (
                <Top5Wrap>
                  {top5.map((d, i) => (
                    <Top5Row key={i} $rank={i+1}>
                      <RankBadge $rank={i+1}>{i===0?"♥":i+1}</RankBadge>
                      <Top5Name>{d.display_name}</Top5Name>
                      <Top5Amount>฿{Number(d.amount).toLocaleString()}</Top5Amount>
                    </Top5Row>
                  ))}
                </Top5Wrap>
              )}
            </div>

            <Divider />

            {step === "form" && (
              <>
                <div>
                  <FieldLabel>{isTH?"ชื่อที่แสดง":"Display Name"}</FieldLabel>
                  {isLoggedIn ? (
                    <ReadOnlyName>{defaultName}</ReadOnlyName>
                  ) : (
                    <NameInput
                      placeholder={isTH?"ชื่อของคุณ...":"Your name..."}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={30}
                    />
                  )}
                </div>

                <div>
                  <FieldLabel>{isTH?"จำนวนเงิน (บาท)":"Amount (THB)"}</FieldLabel>
                  <NameInput
                    type="number" min={1} placeholder={isTH?"เช่น 99":"e.g. 99"}
                    value={amount} onChange={e => setAmountInput(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>{isTH?"ธนาคารที่จะโอนออก":"Bank you'll pay from"}</FieldLabel>
                  <FieldSelect value={fromBank} onChange={e => setFromBank(e.target.value)}>
                    <option value="">{isTH ? "เลือกธนาคาร" : "Select bank"}</option>
                    {BANKS.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
                  </FieldSelect>
                </div>

                <div>
                  <FieldLabel>{isTH?"เลขบัญชี":"Your account number"}</FieldLabel>
                  <NameInput
                    value={fromAccount}
                    onChange={e => setFromAccount(e.target.value)}
                    placeholder={isTH ? "เช่น 1234567890" : "e.g. 1234567890"}
                  />
                </div>

                {initError && (
                  <StatusBox $warn><AlertTriangle size={16} style={{flexShrink:0}}/><div>{initError}</div></StatusBox>
                )}

                <SubmitBtn disabled={!canSubmit || initiating} onClick={handleInitiate}>
                  {initiating
                    ? (isTH ? "กำลังสร้างรายการ..." : "Creating...")
                    : <><Check size={16}/> {isTH ? "ยืนยันรายการ" : "Confirm"}</>}
                </SubmitBtn>
                <CancelLink onClick={requestClose}>{isTH ? "ยกเลิก" : "Cancel"}</CancelLink>
              </>
            )}

            {step === "waiting" && (
              <>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                  gap:8,padding:"12px",borderRadius:"var(--radius-sm)",
                  background:"var(--surface2)",border:"1px solid var(--border)"}}>
                  <img src="/promptpay-qr.jpg" alt="PromptPay QR"
                    style={{width:160,height:160,objectFit:"contain",borderRadius:8}}/>
                  <div style={{fontSize:12,color:"var(--text-muted)",fontWeight:600}}>
                    {isTH?"สแกน QR เพื่อโอนเงิน":"Scan QR to transfer"}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-dim)"}}>
                    นาย ปัฐวี จันทร์สว่าง · 096-153-6525
                  </div>
                </div>

                <CountdownBox>
                  {isTH ? "เหลือเวลา" : "Time remaining"}
                  <div className="digits">{formatCountdown(remainingSec)}</div>
                </CountdownBox>

                <StatusBox>
                  <Clock size={16} style={{flexShrink:0}}/>
                  <div style={{lineHeight:1.6,fontSize:12}}>
                    {isTH
                      ? "กำลังรอตรวจสอบยอดโอนอัตโนมัติ... เมื่อโอนเสร็จระบบจะอัปเดตให้ภายในไม่กี่วินาที"
                      : "Waiting to auto-detect your transfer... it'll update within seconds of paying."}
                  </div>
                </StatusBox>

                <CancelLink onClick={requestClose}>{isTH ? "ยกเลิกรายการนี้" : "Cancel this donation"}</CancelLink>
              </>
            )}

            {step === "approved" && (
              <ConfirmOverlay>
                <ConfirmCard>
                  <h3 style={{color:"#e879a0",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <CheckCircle size={20}/> {isTH ? "ขอบคุณมากครับ 🩷" : "Thank you so much 🩷"}
                  </h3>
                  <p>
                    {isTH
                      ? "การสนับสนุนของคุณได้รับการยืนยันแล้ว กดตกลงเพื่อรีเฟรชหน้าเว็บ"
                      : "Your support has been confirmed. Click OK to refresh the page."}
                  </p>
                  <SubmitBtn onClick={() => window.location.reload()}>
                    {isTH ? "ตกลง" : "OK"}
                  </SubmitBtn>
                </ConfirmCard>
              </ConfirmOverlay>
            )}

            {step === "expired_fallback" && (
              <>
                <StatusBox $warn>
                  <AlertTriangle size={18} style={{flexShrink:0}}/>
                  <div style={{lineHeight:1.65,fontSize:12}}>
                    {isTH
                      ? "ไม่พบรายการโอนภายในเวลาที่กำหนด กรุณาติดต่อแอดมินเพื่อตรวจสอบ"
                      : "No transfer detected within the time window. Please contact the admin for manual review."}
                  </div>
                </StatusBox>

                {LINE_CONTACT_URL && (
                  <LineBtn href={LINE_CONTACT_URL} target="_blank" rel="noreferrer">
                    <MessageCircle size={16}/> {isTH ? "ติดต่อแอดมินผ่าน LINE" : "Contact admin on LINE"}
                  </LineBtn>
                )}
              </>
            )}
          </Body>

          {showCancelConfirm && (
            <ConfirmOverlay>
              <ConfirmCard>
                <h3>{isTH ? "ยกเลิกรายการนี้ใช่ไหม?" : "Cancel this donation?"}</h3>
                <p>
                  {isTH
                    ? "ถ้ายังไม่ได้โอนเงิน ยกเลิกได้เลยไม่มีผลอะไร แต่ถ้าโอนไปแล้วอย่าเพิ่งปิด รอให้ระบบตรวจสอบก่อน"
                    : "Safe to cancel if you haven't paid yet. If you already transferred, don't close this — wait for auto-detection first."}
                </p>
                <ConfirmActions>
                  <GhostBtn onClick={() => setShowCancelConfirm(false)}>
                    {isTH ? "กลับไปทำต่อ" : "Go back"}
                  </GhostBtn>
                  <DangerBtn onClick={confirmCancel}>
                    {isTH ? "ยืนยันยกเลิก" : "Yes, cancel"}
                  </DangerBtn>
                </ConfirmActions>
              </ConfirmCard>
            </ConfirmOverlay>
          )}
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
