import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { Heart, Upload, X, CheckCircle, Trophy } from "lucide-react";

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
const Body = styled.div`padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px;`;

const AmountRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const AmountBtn = styled.button<{$active?:boolean}>`
  flex:1;min-width:60px;padding:8px 4px;border-radius:var(--radius-sm);
  font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .15s;
  border:2px solid ${p=>p.$active?"#e879a0":"var(--border)"};
  background:${p=>p.$active?"#e879a022":"var(--surface2)"};
  color:${p=>p.$active?"#e879a0":"var(--text-muted)"};
  &:hover{border-color:#e879a0;color:#e879a0;}
`;
const CustomInput = styled.input`
  width:100%;padding:9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:15px;font-family:inherit;
  &:focus{outline:none;border-color:#e879a0;box-shadow:0 0 0 3px #e879a022;}
  &::placeholder{color:var(--text-dim);}
`;
const NameInput = styled(CustomInput)``;

const UploadArea = styled.label<{$hasFile?:boolean;$done?:boolean}>`
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  border:2px dashed ${p=>p.$done?"#e879a0":p.$hasFile?"#3b82f6":"var(--border)"};
  border-radius:var(--radius-sm);padding:16px;cursor:pointer;transition:all .18s;
  background:${p=>p.$done?"#e879a011":p.$hasFile?"rgba(59,130,246,.06)":"var(--surface2)"};
  &:hover{border-color:#e879a0;}
  .text{font-size:13px;font-weight:600;color:${p=>p.$done?"#e879a0":p.$hasFile?"#3b82f6":"var(--text-muted)"};}
  .sub{font-size:11px;color:var(--text-dim);}
`;
const HiddenInput = styled.input`display:none;`;
const SlipPreview = styled.img`
  width:100%;max-height:160px;object-fit:contain;
  border-radius:var(--radius-sm);border:1px solid var(--border);
`;

const SubmitBtn = styled.button`
  width:100%;padding:12px;border-radius:var(--radius-sm);border:none;
  background:linear-gradient(135deg,#be185d,#e879a0);
  color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;
  transition:all .18s;
  &:hover:not(:disabled){opacity:.9;transform:translateY(-1px);}
  &:disabled{opacity:.45;cursor:not-allowed;transform:none;}
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

const StatusBox = styled.div<{$ok?:boolean}>`
  display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-radius:var(--radius-sm);font-size:13px;font-weight:600;
  background:${p=>p.$ok?"#e879a011":"rgba(245,158,11,.1)"};
  border:1px solid ${p=>p.$ok?"#e879a044":"rgba(245,158,11,.3)"};
  color:${p=>p.$ok?"#e879a0":"#f59e0b"};
`;

const FieldLabel = styled.div`font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:.07em;color:var(--text-muted);margin-bottom:5px;`;

const API = import.meta.env.VITE_API_URL as string;
const AMOUNTS = [29, 49, 99, 199];

type Donor = { display_name: string; amount: number };

interface Props {
  lang: "TH" | "EN";
  defaultName?: string;
  userId?: string;
  onClose: () => void;
}

export function DonateModal({ lang, defaultName = "", userId, onClose }: Props) {
  const isTH = lang === "TH";
  const [amount,    setAmount]    = useState<number | "">(49);
  const [name,      setName]      = useState(defaultName);
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [top5,      setTop5]      = useState<Donor[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/donations/top`)
      .then(r => r.json())
      .then(setTop5)
      .catch(() => {});
  }, [submitted]);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file || !name || !amount) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("slip", file);
      form.append("display_name", name);
      form.append("amount", String(amount));
      if (userId) form.append("user_id", userId);
      await fetch(`${API}/donations/slip`, { method: "POST", body: form });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    setLoading(false);
  };

  const canSubmit = !!file && !!name.trim() && !!amount;

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Header>
            <Title>
              <Heart size={17} style={{color:"#e879a0"}} fill="#e879a0"/>
              {isTH ? "Support ผู้พัฒนา" : "Support Developer"}
            </Title>
            <CloseBtn onClick={onClose}><X size={18}/></CloseBtn>
          </Header>

          <Body>
            {/* Top 5 */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <Trophy size={14} style={{color:"#e879a0"}}/>
                <span style={{fontSize:12,fontWeight:800,letterSpacing:".06em",
                  textTransform:"uppercase",color:"var(--text-muted)"}}>
                  {isTH?"Top Supporters":"Top Supporters"}
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

            {!submitted ? (
              <>
                <div>
                  <FieldLabel>{isTH?"ชื่อที่แสดงใน Top 5":"Display Name"}</FieldLabel>
                  <NameInput
                    placeholder={isTH?"ชื่อของคุณ...":"Your name..."}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={30}
                  />
                </div>

                <div>
                  <FieldLabel>{isTH?"จำนวนเงิน (฿)":"Amount (฿)"}</FieldLabel>
                  <AmountRow>
                    {AMOUNTS.map(a => (
                      <AmountBtn key={a} $active={amount===a} onClick={() => setAmount(a)}>
                        ฿{a}
                      </AmountBtn>
                    ))}
                  </AmountRow>
                  <CustomInput
                    type="number" inputMode="numeric"
                    placeholder={isTH?"หรือกรอกจำนวนเอง...":"Or enter custom amount..."}
                    style={{marginTop:8}}
                    value={AMOUNTS.includes(amount as number) ? "" : amount}
                    onChange={e => setAmount(e.target.value ? Number(e.target.value) : "")}
                    onFocus={() => { if (AMOUNTS.includes(amount as number)) setAmount(""); }}
                  />
                </div>

                {/* QR Code */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                  gap:8,padding:"12px",borderRadius:"var(--radius-sm)",
                  background:"var(--surface2)",border:"1px solid var(--border)"}}>
                  <img src="/promptpay-qr.jpg" alt="PromptPay QR"
                    style={{width:160,height:160,objectFit:"contain",borderRadius:8}}/>
                  <div style={{fontSize:12,color:"var(--text-muted)",fontWeight:600}}>
                    {isTH?"สแกน QR เพื่อโอนเงิน":"Scan QR to transfer"}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-dim)"}}>
                    นาย ปัฐวี จันทร์สว่าง · xxx-x-x3766-x
                  </div>
                </div>

                {preview && <SlipPreview src={preview} alt="slip"/>}
                <UploadArea $hasFile={!!file} htmlFor="donate-slip">
                  <HiddenInput id="donate-slip" ref={inputRef} type="file"
                    accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
                  <Upload size={18} className="icon" style={{color: file?"#3b82f6":"#e879a0"}}/>
                  {file
                    ? <><span className="text">{file.name}</span><span className="sub">{isTH?"กดเพื่อเปลี่ยน":"Tap to change"}</span></>
                    : <><span className="text">{isTH?"แนบสลิปการโอน":"Upload transfer slip"}</span><span className="sub">JPG, PNG</span></>
                  }
                </UploadArea>

                <SubmitBtn disabled={!canSubmit || loading} onClick={handleSubmit}>
                  {loading
                    ? (isTH?"กำลังส่ง...":"Sending...")
                    : (isTH?"ส่งสลิป 🩷":"Submit Slip 🩷")}
                </SubmitBtn>
              </>
            ) : (
              <StatusBox $ok>
                <CheckCircle size={18} style={{flexShrink:0}}/>
                <div style={{lineHeight:1.65,fontSize:13}}>
                  <b>{isTH?"ขอบคุณมากครับ 🩷":"Thank you so much 🩷"}</b><br/>
                  {isTH
                    ? "ทีมงานจะตรวจสอบและอัปเดต Top 5 ภายใน 5–10 นาที"
                    : "We'll verify and update Top 5 within 5–10 minutes"}
                </div>
              </StatusBox>
            )}
          </Body>
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
