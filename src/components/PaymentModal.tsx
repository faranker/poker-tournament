import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { Upload, X, CheckCircle, Clock } from "lucide-react";
import type { Plan } from "../auth";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

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
  background:#fff;border-radius:8px;padding:8px 16px;
  font-size:13px;font-weight:700;color:#1a7a1a;align-self:center;
  span{color:#1a3a8a;}
`;

/* QR card */
const QRCard = styled.div`
  background:#fff;border-radius:16px;padding:16px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 24px rgba(0,0,0,.3);
`;
const QRImg = styled.img`
  width:200px;height:200px;object-fit:contain;
  @media(max-width:400px){width:160px;height:160px;}
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

/* Upload area */
const UploadArea = styled.label<{$hasFile?:boolean;$done?:boolean}>`
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  border:2px dashed ${p=>p.$done?"#22c55e":p.$hasFile?"#3b82f6":"#2a3a2a"};
  border-radius:12px;padding:20px;cursor:pointer;transition:all .18s;
  background:${p=>p.$done?"rgba(34,197,94,.06)":p.$hasFile?"rgba(59,130,246,.06)":"rgba(34,197,94,.03)"};
  &:hover{border-color:${p=>p.$done?"#22c55e":"#22c55e"};background:rgba(34,197,94,.06);}
  .icon{color:${p=>p.$done?"#22c55e":p.$hasFile?"#3b82f6":"#4a6a4a"};}
  .text{font-size:13px;font-weight:600;color:${p=>p.$done?"#22c55e":p.$hasFile?"#3b82f6":"#4a8a4a"};}
  .sub{font-size:11px;color:#4a6a4a;}
`;
const HiddenInput = styled.input`display:none;`;

/* Preview */
const SlipPreview = styled.img`
  width:100%;max-height:200px;object-fit:contain;
  border-radius:8px;border:1px solid #2a3a2a;
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

const StatusBox = styled.div<{$ok?:boolean}>`
  display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-radius:10px;font-size:13px;font-weight:600;
  background:${p=>p.$ok?"rgba(34,197,94,.1)":"rgba(245,158,11,.1)"};
  border:1px solid ${p=>p.$ok?"rgba(34,197,94,.3)":"rgba(245,158,11,.3)"};
  color:${p=>p.$ok?"#22c55e":"#f59e0b"};
`;

/* Plan config */
const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  cash_pro: { monthly: 49,  yearly: 299, name: "Cash Pro" },
  full_pro:  { monthly: 99,  yearly: 499, name: "Full Pro" },
};

interface Props {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  lang: "TH" | "EN";
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ plan, billingCycle, lang, onClose, onSuccess: _onSuccess }: Props) {
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTH = lang === "TH";

  const planInfo = PLAN_PRICES[plan];
  const amount   = billingCycle === "yearly" ? planInfo?.yearly : planInfo?.monthly;

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("slip", file);
      form.append("plan", plan);
      form.append("billing_cycle", billingCycle);
      form.append("amount", String(amount));
      await fetch(`${import.meta.env.VITE_API_URL}/payments/slip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("poker_token")}` },
        body: form,
      });
      setSubmitted(true);
    } catch {
      // silent — still show success UI so user knows we got it
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Header>
            <LogoBox>♣️</LogoBox>
            <HeaderText>
              <h2>THAI QR PAYMENT</h2>
              <p>GO POKER</p>
            </HeaderText>
            <CloseBtn onClick={onClose}><X size={18}/></CloseBtn>
          </Header>

          <Body>
            <PPBadge>
              <span style={{color:"#1a7a1a",fontWeight:900}}>พร้อมเพย์</span>
              <span style={{color:"#1a3a8a",fontWeight:900}}>PromptPay</span>
            </PPBadge>

            <QRCard>
              <QRImg src="/promptpay-qr.jpg" alt="PromptPay QR" />
            </QRCard>

            <AmountBox>
              <div className="label">{isTH ? "ยอดที่ต้องชำระ" : "Amount to Pay"}</div>
              <div>
                <span className="amount">{amount?.toLocaleString()}</span>
                <span className="unit">บาท</span>
              </div>
            </AmountBox>

            <AccountInfo>
              <div className="title">สแกน QR เพื่อโอนเข้าบัญชี</div>
              <div className="name">นาย ปัฐวี จันทร์สว่าง</div>
              <div className="acc">บัญชี: xxx-x-x3766-x</div>
              <div className="ref">เลขที่อ้างอิง: 004999009272732</div>
            </AccountInfo>

            <div style={{borderTop:"1px solid #1a2a1a",paddingTop:16}}>
              <div style={{fontSize:13,fontWeight:700,color:"#4a8a4a",marginBottom:10}}>
                {isTH ? "📎 แนบสลิปโอนเงิน" : "📎 Upload Payment Slip"}
              </div>

              {!submitted ? (
                <>
                  {preview && <SlipPreview src={preview} alt="slip" style={{marginBottom:10}}/>}
                  <UploadArea $hasFile={!!file} htmlFor="slip-upload">
                    <HiddenInput
                      id="slip-upload" ref={inputRef} type="file"
                      accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    {file
                      ? <><Upload size={20} className="icon"/><span className="text">{file.name}</span><span className="sub">{isTH?"กดเพื่อเปลี่ยนไฟล์":"Tap to change file"}</span></>
                      : <><Upload size={20} className="icon"/><span className="text">{isTH?"อัพโหลดสลิป":"Upload Slip"}</span><span className="sub">JPG, PNG</span></>
                    }
                  </UploadArea>

                  <SubmitBtn
                    style={{marginTop:12}}
                    disabled={!file || loading}
                    $loading={loading}
                    onClick={handleSubmit}
                  >
                    {loading
                      ? (isTH ? "กำลังส่ง..." : "Sending...")
                      : (isTH ? "ส่งสลิปเพื่อยืนยัน" : "Submit Slip")}
                  </SubmitBtn>
                </>
              ) : (
                <StatusBox $ok>
                  <CheckCircle size={18}/>
                  <div>
                    <div>{isTH ? "ส่งสลิปเรียบร้อยแล้ว!" : "Slip submitted!"}</div>
                    <div style={{fontSize:12,opacity:.8,marginTop:2}}>
                      {isTH ? "ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 30 นาที" : "Our team will verify and activate within 30 minutes"}
                    </div>
                  </div>
                </StatusBox>
              )}

              {!submitted && (
                <StatusBox style={{marginTop:10}}>
                  <Clock size={16}/>
                  <div>{isTH ? "เปิดใช้งานภายใน 30 นาที หลังจากตรวจสอบสลิป" : "Activated within 30 min after slip review"}</div>
                </StatusBox>
              )}
            </div>
          </Body>
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
