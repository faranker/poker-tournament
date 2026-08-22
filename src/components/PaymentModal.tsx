import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { X, Check, CheckCircle, Clock, AlertTriangle, MessageCircle } from "lucide-react";
import type { Plan } from "../auth";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;
const rotateBorder = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:2200;backdrop-filter:blur(6px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2201;
  background:#0d1117;border:1px solid #1e2a1e;border-radius:16px;
  width:min(400px,94vw);box-shadow:0 24px 80px rgba(0,0,0,.6);
  animation:${contentShow} .18s ease;max-height:92vh;overflow-y:auto;
  &:focus{outline:none;}
`;

/* Header */
const Header = styled.div`
  display:flex;align-items:center;gap:12px;
  background:#0d1117;
  padding:16px 20px;border-radius:16px 16px 0 0;
  border-bottom:1px solid #1e2a1e;
`;
const LogoBox = styled.div`
  width:44px;height:44px;border-radius:10px;
  background:#1a4a1a;border:1px solid #2a6a2a;
  display:flex;align-items:center;justify-content:center;
  font-size:22px;flex-shrink:0;
`;
const HeaderText = styled.div`
  h2{font-size:15px;font-weight:800;letter-spacing:.05em;color:#fff;}
  p{font-size:12px;color:#4a8a4a;font-weight:600;letter-spacing:.12em;margin-top:1px;}
`;
const CloseBtn = styled.button`
  margin-left:auto;background:none;border:none;color:#4a6a4a;cursor:pointer;
  padding:4px;border-radius:6px;display:flex;
  &:hover{color:#fff;background:rgba(255,255,255,.1);}
`;

/* Body */
const Body = styled.div`padding:20px;display:flex;flex-direction:column;gap:16px;`;

/* PromptPay badge */
const PPBadge = styled.div`
  display:flex;align-items:center;justify-content:center;gap:8px;
  background:transparent;border:1px solid #2a3a2a;border-radius:8px;padding:8px 16px;
  font-size:13px;font-weight:700;align-self:center;
`;

/* QR card */
const QRWrap = styled.div`
  position:relative;display:flex;align-items:center;justify-content:center;
  padding:3px;border-radius:14px;align-self:center;overflow:hidden;
  /* static dim border underneath */
  background:#1a2a1a;
  &::before{
    content:'';position:absolute;
    /* bigger than container so rotation covers all corners */
    width:200%;height:200%;
    top:-50%;left:-50%;
    z-index:0;
    background:conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 300deg,
      #4ade80   330deg,
      #22c55e   345deg,
      #86efac   355deg,
      transparent 360deg
    );
    animation:${rotateBorder} 2.4s linear infinite;
  }
  &::after{
    content:'';position:absolute;inset:3px;border-radius:12px;z-index:1;
    background:#0d1117;
  }
`;
const QRInner = styled.div`
  position:relative;z-index:2;padding:10px;
`;
const QRImg = styled.img`
  width:200px;height:200px;object-fit:contain;display:block;
  @media(max-width:400px){width:170px;height:170px;}
`;

/* Amount */
const AmountBox = styled.div`
  background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);
  border-radius:12px;padding:14px;text-align:center;
  .label{font-size:12px;color:#4a8a4a;font-weight:600;letter-spacing:.08em;margin-bottom:4px;}
  .amount{font-size:36px;font-weight:900;color:#22c55e;letter-spacing:-.5px;}
  .unit{font-size:16px;font-weight:600;color:#4a8a4a;margin-left:4px;}
`;

/* Account info */
const AccountInfo = styled.div`
  text-align:center;
  .title{font-size:13px;font-weight:700;color:#22c55e;margin-bottom:6px;}
  .name{font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:2px;}
  .acc{font-size:13px;color:#8892a4;margin-bottom:2px;}
  .ref{font-size:11px;color:#5a6278;}
`;

/* Countdown */
const CountdownBox = styled.div`
  text-align:center;font-size:13px;color:#8892a4;font-weight:600;
  .digits{font-variant-numeric:tabular-nums;font-size:22px;font-weight:900;color:#e2e8f0;margin-top:2px;}
`;

/* Form fields (step 1 — sender bank/account) */
const FieldGroup = styled.div`
  display:flex;flex-direction:column;gap:6px;
  label{font-size:12px;font-weight:700;color:#8892a4;letter-spacing:.04em;}
`;
const FieldInput = styled.input`
  width:100%;padding:11px 12px;border-radius:10px;border:1px solid #2a3a2a;
  background:#11181f;color:#e2e8f0;font-size:14px;font-family:inherit;
  &:focus{outline:none;border-color:#22c55e;}
  &::placeholder{color:#4a5568;}
`;
const FieldSelect = styled.select`
  width:100%;padding:11px 34px 11px 12px;border-radius:10px;border:1px solid #2a3a2a;
  background:#11181f;color:#e2e8f0;font-size:14px;font-family:inherit;cursor:pointer;
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238892a4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;
  &:focus{outline:none;border-color:#22c55e;}
`;

/* Submit btn */
const SubmitBtn = styled.button<{$loading?:boolean}>`
  width:100%;padding:13px;border-radius:10px;border:none;
  background:linear-gradient(135deg,#16a34a,#22c55e);
  color:#fff;font-size:15px;font-weight:800;cursor:pointer;
  font-family:inherit;transition:all .18s;letter-spacing:.02em;
  &:hover:not(:disabled){opacity:.9;transform:translateY(-1px);}
  &:disabled{opacity:.5;cursor:not-allowed;transform:none;}
`;
const LineBtn = styled.a`
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:12px;border-radius:10px;border:none;text-decoration:none;
  background:#06c755;color:#fff;font-size:14px;font-weight:800;cursor:pointer;
  font-family:inherit;transition:all .18s;
  &:hover{opacity:.9;}
`;

/* Cancel link + confirm alert (nested modal) */
const CancelLink = styled.button`
  background:none;border:none;color:#5a6278;font-size:12px;font-weight:600;
  cursor:pointer;text-decoration:underline;text-underline-offset:2px;
  align-self:center;font-family:inherit;
  &:hover{color:#8892a4;}
`;
const ConfirmOverlay = styled.div`
  position:absolute;inset:0;z-index:10;border-radius:16px;
  background:rgba(0,0,0,.75);backdrop-filter:blur(2px);
  display:flex;align-items:center;justify-content:center;padding:20px;
`;
const ConfirmCard = styled.div`
  background:#151b23;border:1px solid #2a3a2a;border-radius:14px;
  padding:22px;width:min(300px,100%);text-align:center;
  box-shadow:0 20px 60px rgba(0,0,0,.5);
  display:flex;flex-direction:column;gap:14px;
  h3{font-size:15px;font-weight:800;color:#fff;}
  p{font-size:13px;color:#8892a4;line-height:1.5;}
`;
const ConfirmActions = styled.div`display:flex;gap:8px;`;
const DangerBtn = styled.button`
  flex:1;padding:11px;border-radius:10px;border:none;cursor:pointer;
  background:#ef4444;color:#fff;font-size:13px;font-weight:800;font-family:inherit;
  &:hover{opacity:.9;}
`;
const GhostBtn = styled.button`
  flex:1;padding:11px;border-radius:10px;border:1px solid #2a3a2a;cursor:pointer;
  background:transparent;color:#e2e8f0;font-size:13px;font-weight:700;font-family:inherit;
  &:hover{border-color:#4a6a4a;}
`;

const StatusBox = styled.div<{$ok?:boolean;$warn?:boolean}>`
  display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-radius:10px;font-size:13px;font-weight:600;
  background:${p=>p.$ok?"rgba(34,197,94,.1)":p.$warn?"rgba(239,68,68,.1)":"rgba(245,158,11,.1)"};
  border:1px solid ${p=>p.$ok?"rgba(34,197,94,.3)":p.$warn?"rgba(239,68,68,.3)":"rgba(245,158,11,.3)"};
  color:${p=>p.$ok?"#22c55e":p.$warn?"#ef4444":"#f59e0b"};
`;

/* Plan config */
const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  cash_pro: { monthly: 49,  yearly: 299, name: "Cash Pro" },
  full_pro:  { monthly: 99,  yearly: 499, name: "Full Pro" },
};

/* Short bank codes — mirrors server/routes/payments.js's KNOWN_BANK_CODES,
   which mirrors line-forwarder-app's parser_scb.py THAI_BANK_NAME_MAP /
   parser_gsb.py BANK_CODES vocabulary (what actually lands in a detected
   deposit's `from_bank` field). */
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

type Step = "form" | "waiting" | "approved" | "expired_fallback";

interface Props {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  lang: "TH" | "EN";
  onClose: () => void;
  onSuccess: () => void;
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${localStorage.getItem("poker_token")}`, ...extra };
}

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PaymentModal({ plan, billingCycle, lang, onClose, onSuccess }: Props) {
  const isTH = lang === "TH";
  const planInfo = PLAN_PRICES[plan];
  const amount   = billingCycle === "yearly" ? planInfo?.yearly : planInfo?.monthly;

  const [step, setStep] = useState<Step>("form");
  const [fromBank, setFromBank] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [requestId, setRequestId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const requestClose = () => setShowCancelConfirm(true);
  const confirmCancel = () => { setShowCancelConfirm(false); onClose(); };

  const handleInitiate = async () => {
    if (!fromAccount.trim() || !fromBank) return;
    setInitiating(true);
    setInitError(null);
    try {
      const res = await fetch(`${API}/payments/initiate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          plan, billing_cycle: billingCycle,
          expected_from_account_number: fromAccount.trim(),
          expected_from_bank: fromBank,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setInitError(data?.error || (isTH ? "เกิดข้อผิดพลาด" : "Something went wrong")); return; }
      setRequestId(data.id);
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
    if (step !== "waiting" || !requestId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payments/status/${requestId}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.status === "approved") { setStep("approved"); }
        else if (data.status === "expired") { setStep("expired_fallback"); }
      } catch {
        // transient network hiccup — next poll tick will retry
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [step, requestId, onSuccess]);

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
            <LogoBox>♣️</LogoBox>
            <HeaderText>
              <h2>THAI QR PAYMENT</h2>
              <p>GO POKER</p>
            </HeaderText>
            <CloseBtn onClick={requestClose}><X size={18}/></CloseBtn>
          </Header>

          <Body>
            <AmountBox>
              <div className="label">{isTH ? "ยอดที่ต้องชำระ" : "Amount to Pay"}</div>
              <div>
                <span className="amount">{amount?.toLocaleString()}</span>
                <span className="unit">บาท</span>
              </div>
            </AmountBox>

            {step === "form" && (
              <>
                <FieldGroup>
                  <label>{isTH ? "ธนาคารที่จะโอนออก" : "Bank you'll pay from"}</label>
                  <FieldSelect value={fromBank} onChange={e => setFromBank(e.target.value)}>
                    <option value="">{isTH ? "เลือกธนาคาร" : "Select bank"}</option>
                    {BANKS.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
                  </FieldSelect>
                </FieldGroup>
                <FieldGroup>
                  <label>{isTH ? "เลขบัญชี" : "Your account number"}</label>
                  <FieldInput
                    value={fromAccount}
                    onChange={e => setFromAccount(e.target.value)}
                    placeholder={isTH ? "เช่น 1234567890" : "e.g. 1234567890"}
                  />
                </FieldGroup>

                {initError && (
                  <StatusBox $warn><AlertTriangle size={16} style={{flexShrink:0}}/><div>{initError}</div></StatusBox>
                )}

                <StatusBox>
                  <Clock size={16} style={{flexShrink:0}}/>
                  <div style={{lineHeight:1.6,fontSize:12}}>
                    {isTH
                      ? "ระบบจะตรวจสอบยอดโอนอัตโนมัติจากบัญชีนี้ กรุณากรอกให้ตรงกับบัญชีที่จะใช้โอนจริง"
                      : "We'll auto-match your transfer from this account — enter the exact account you'll pay from."}
                  </div>
                </StatusBox>

                <SubmitBtn
                  disabled={!fromAccount.trim() || !fromBank || initiating}
                  onClick={handleInitiate}
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                >
                  {initiating
                    ? (isTH ? "กำลังสร้างรายการ..." : "Creating...")
                    : <><Check size={16}/> {isTH ? "ยืนยันรายการ" : "Confirm"}</>}
                </SubmitBtn>

                <CancelLink onClick={requestClose}>{isTH ? "ยกเลิก" : "Cancel"}</CancelLink>
              </>
            )}

            {step === "waiting" && (
              <>
                <PPBadge>
                  <span style={{color:"#22c55e",fontWeight:900}}>พร้อมเพย์</span>
                  <span style={{color:"#60a5fa",fontWeight:900}}>PromptPay</span>
                </PPBadge>

                <QRWrap>
                  <QRInner>
                    <QRImg src="/promptpay-qr.jpg" alt="PromptPay QR" />
                  </QRInner>
                </QRWrap>

                <AccountInfo>
                  <div className="title">สแกน QR เพื่อโอนเข้าบัญชี</div>
                  <div className="name">นาย ปัฐวี จันทร์สว่าง</div>
                  <div className="acc">พร้อมเพย์: 096-153-6525</div>
                </AccountInfo>

                <CountdownBox>
                  {isTH ? "เหลือเวลา" : "Time remaining"}
                  <div className="digits">{formatCountdown(remainingSec)}</div>
                </CountdownBox>

                <StatusBox>
                  <Clock size={16} style={{flexShrink:0}}/>
                  <div style={{lineHeight:1.6,fontSize:12}}>
                    {isTH
                      ? "กำลังรอตรวจสอบยอดโอนอัตโนมัติ... เมื่อโอนเสร็จระบบจะเปิดใช้งานให้ภายในไม่กี่วินาที"
                      : "Waiting to auto-detect your transfer... it'll activate within seconds of paying."}
                  </div>
                </StatusBox>

                <CancelLink onClick={requestClose}>{isTH ? "ยกเลิกรายการนี้" : "Cancel this payment"}</CancelLink>
              </>
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

          {step === "approved" && (
            <ConfirmOverlay>
              <ConfirmCard>
                <h3 style={{color:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <CheckCircle size={20}/> {isTH ? "เปิดใช้งานสำเร็จ!" : "Activated!"}
                </h3>
                <p>
                  {isTH
                    ? "แพ็กเกจของคุณอัปเดตเรียบร้อยแล้ว กดตกลงเพื่อรีเฟรชหน้าเว็บ"
                    : "Your package has been updated. Click OK to refresh the page."}
                </p>
                <SubmitBtn onClick={() => { onSuccess(); window.location.reload(); }}>
                  {isTH ? "ตกลง" : "OK"}
                </SubmitBtn>
              </ConfirmCard>
            </ConfirmOverlay>
          )}

          {showCancelConfirm && (
            <ConfirmOverlay>
              <ConfirmCard>
                <h3>{isTH ? "ยกเลิกรายการนี้ใช่ไหม?" : "Cancel this payment?"}</h3>
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
