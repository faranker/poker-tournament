import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { css, keyframes } from "styled-components";
import { User, AlertTriangle } from "lucide-react";
import {
  signIn, signUp, signOut, resetPassword, checkUsername,
  type AuthUser, type Plan,
  PLAN_COLORS,
} from "../auth";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;backdrop-filter:blur(5px);
  animation:${overlayShow} .15s ease;
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2001;
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:24px;width:min(400px,92vw);box-shadow:var(--shadow-lg);
  animation:${contentShow} .18s ease;max-height:92vh;overflow-y:auto;
  &:focus{outline:none;}
`;
const Title = styled.h3`font-size:16px;font-weight:800;margin-bottom:18px;color:var(--text);display:flex;align-items:center;gap:8px;`;
const FieldLabel = styled.p`
  font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--text-muted);margin-bottom:5px;margin-top:12px;&:first-child{margin-top:0;}
`;
const Input = styled.input`
  width:100%;padding:9px 11px;border-radius:var(--radius-sm);
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:16px;font-family:inherit;
  &:focus{outline:none;border-color:var(--border2);box-shadow:0 0 0 3px var(--accent-soft);}
  &::placeholder{color:var(--text-dim);}
`;
const Hint = styled.p`font-size:13px;color:var(--text-dim);margin-top:4px;`;
const ErrMsg = styled.p`font-size:14px;color:var(--accent);margin-top:8px;font-weight:600;`;
const OkMsg  = styled.p`font-size:14px;color:var(--success);margin-top:8px;font-weight:600;`;
const Divider = styled.div`height:1px;background:var(--border);margin:16px 0;`;
const BtnRow  = styled.div`display:flex;gap:8px;margin-top:18px;justify-content:flex-end;`;

type BtnV = "primary"|"secondary"|"ghost"|"success"|"warn";
const Btn = styled.button<{$v?:BtnV;$full?:boolean;$sm?:boolean}>`
  padding:${p=>p.$sm?"6px 12px":"9px 18px"};border-radius:var(--radius-sm);border:none;
  font-size:${p=>p.$sm?"12px":"13px"};font-weight:700;cursor:pointer;font-family:inherit;
  width:${p=>p.$full?"100%":"auto"};transition:all .18s;
  &:disabled{opacity:.5;cursor:not-allowed;}
  ${p=>{switch(p.$v){
    case"primary": return css`background:var(--accent);color:#fff;&:hover:not(:disabled){opacity:.88;}`;
    case"success": return css`background:var(--success);color:#fff;&:hover:not(:disabled){opacity:.88;}`;
    case"warn":    return css`background:var(--gold);color:#000;&:hover:not(:disabled){opacity:.88;}`;
    case"ghost":   return css`background:transparent;color:var(--text-muted);border:1px solid var(--border);&:hover{color:var(--text);}`;
    default:       return css`background:var(--surface3);color:var(--text);border:1px solid var(--border);&:hover{border-color:var(--border2);}`;
  }}}
`;

export const PlanBadge = styled.span<{$plan:Plan}>`
  display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:800;
  background:${p=>PLAN_COLORS[p.$plan]}22;color:${p=>PLAN_COLORS[p.$plan]};
  border:1px solid ${p=>PLAN_COLORS[p.$plan]}55;
`;
const TabRow = styled.div`display:flex;gap:4px;margin-bottom:20px;`;
const Tab = styled.button<{$active?:boolean}>`
  flex:1;padding:9px;border-radius:var(--radius-sm);border:1px solid var(--border);
  font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;
  ${p=>p.$active
    ? css`background:var(--accent);color:#fff;border-color:var(--accent);`
    : css`background:transparent;color:var(--text-muted);&:hover{color:var(--text);border-color:var(--border2);}`}
`;
const ForgotLink = styled.button`
  background:none;border:none;padding:0;font-size:13px;color:var(--text-muted);
  cursor:pointer;text-decoration:underline;margin-top:5px;
  &:hover{color:var(--text);}
`;
const ReasonBanner = styled.div`
  background:var(--accent-soft);border:1px solid var(--accent);border-radius:var(--radius-sm);
  padding:9px 12px;font-size:14px;color:var(--accent);margin-bottom:16px;font-weight:600;
`;
const PlanSection = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:14px;margin-bottom:14px;
`;
const PlanRow = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;`;


const UsernameStatus = styled.span<{$ok?:boolean|null}>`
  font-size:13px;margin-left:6px;
  color:${p=>p.$ok===true?"var(--success)":p.$ok===false?"var(--accent)":"var(--text-dim)"};
`;

export const NavLoginBtn = styled.button<{$loggedIn?:boolean}>`
  padding:5px 13px;border-radius:7px;border:1px solid var(--border);
  background:var(--surface2);color:var(--text-muted);
  font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;
  display:flex;align-items:center;gap:6px;transition:all .18s;
  &:hover{border-color:var(--border2);color:var(--text);}
  ${p=>p.$loggedIn&&css`border-color:var(--accent);color:var(--accent);background:var(--accent-soft);`}
`;

interface Props {
  user: AuthUser | null;
  reason?: string;
  onLogin: (u: AuthUser) => void;
  onLogout: () => void;
  onClose: () => void;
  onUpgrade: () => void;
  onRefresh: (u: AuthUser) => void;
  lang: "TH" | "EN";
}

type ViewMode = "login" | "register" | "forgot";

export function LoginModal({ user, reason, onLogin, onLogout, onClose, onUpgrade, onRefresh: _onRefresh, lang }: Props) {
  const [view,        setView]        = useState<ViewMode>("login");
  const [identifier,  setIdentifier]  = useState("");
  const [email,       setEmail]       = useState("");
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [err,         setErr]         = useState("");
  const [ok,          setOk]          = useState("");
  const [usernameOk,  setUsernameOk]  = useState<boolean | null>(null);
  const [checkingUN,  setCheckingUN]  = useState(false);

  const isTH = lang === "TH";
  const reset = () => { setErr(""); setOk(""); };

  let unTimer: ReturnType<typeof setTimeout>;
  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/[^a-z0-9_.]/gi, "").toLowerCase();
    setUsername(clean);
    setUsernameOk(null);
    clearTimeout(unTimer);
    if (clean.length < 3) return;
    setCheckingUN(true);
    unTimer = setTimeout(async () => {
      const avail = await checkUsername(clean);
      setUsernameOk(avail);
      setCheckingUN(false);
    }, 500);
  };

  const handleLogin = async () => {
    if (!identifier || !password) { setErr(isTH ? "กรอกข้อมูลให้ครบ" : "Fill in all fields"); return; }
    setLoading(true); reset();
    const { user: u, error } = await signIn(identifier, password);
    setLoading(false);
    if (error || !u) { setErr(error ?? (isTH ? "เข้าสู่ระบบไม่สำเร็จ" : "Login failed")); return; }
    onLogin(u);
  };

  const handleRegister = async () => {
    if (!email || !username || !password) { setErr(isTH ? "กรอกข้อมูลให้ครบ" : "Fill in all fields"); return; }
    if (username.length < 3) { setErr(isTH ? "Username ต้องมีอย่างน้อย 3 ตัว" : "Username must be at least 3 characters"); return; }
    if (password.length < 6) { setErr(isTH ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัว" : "Password must be at least 6 characters"); return; }
    if (usernameOk === false) { setErr(isTH ? "Username นี้ถูกใช้แล้ว" : "Username already taken"); return; }
    setLoading(true); reset();
    const { user: u, error } = await signUp(email, username, password);
    setLoading(false);
    if (error) { setErr(error); return; }
    if (u) { onLogin(u); return; }
    setOk(isTH ? "สมัครสำเร็จ! ตรวจสอบอีเมลเพื่อยืนยัน แล้วกลับมา login" : "Registered! Check your email to confirm, then sign in.");
  };

  const handleForgot = async () => {
    const em = identifier.includes("@") ? identifier : email;
    if (!em) { setErr(isTH ? "กรอกอีเมลก่อน" : "Enter your email first"); return; }
    setLoading(true); reset();
    const { error } = await resetPassword(em);
    setLoading(false);
    if (error) { setErr(error); return; }
    setOk(isTH ? `ส่งลิงก์ไปที่ ${em} แล้ว` : `Reset link sent to ${em}`);
  };

  const handleLogout = async () => { await signOut(); onLogout(); };



  /* ── Logged-in view ── */
  if (user) {
    const PLAN_NAMES: Record<Plan, string> = { free:"Free", cash_pro:"Cash Pro", full_pro:"Full Pro" };

    const countdown = (() => {
      if (!user.expiresAt) return null;
      const diff = new Date(user.expiresAt).getTime() - Date.now();
      if (diff <= 0) return { expired: true, days: 0, hours: 0 };
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      return { expired: false, days, hours };
    })();

    return (
      <Dialog.Root open onOpenChange={open=>{ if(!open) onClose(); }}>
        <Dialog.Portal>
          <Overlay />
          <Box>
            <Title><User size={16}/>{isTH?"บัญชีของคุณ":"Your Account"}</Title>
            <PlanSection>
              <PlanRow>
                <div>
                  {user.username && (
                    <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>@{user.username}</div>
                  )}
                  <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:8}}>{user.email}</div>
                  <PlanBadge $plan={user.plan}>{PLAN_NAMES[user.plan]}</PlanBadge>
                </div>
                <Btn $v={user.plan==="full_pro"?"secondary":"warn"} $sm onClick={()=>{onClose();onUpgrade();}}>
                  {user.plan==="full_pro"
                    ? (isTH?"🔄 ต่ออายุ":"🔄 Renew")
                    : (isTH?"⬆ อัพเกรด":"⬆ Upgrade")}
                </Btn>
              </PlanRow>

              {/* Expiry countdown */}
              <div style={{marginTop:14,padding:"10px 12px",borderRadius:"var(--radius-sm)",
                background:"var(--surface3)",border:"1px solid var(--border)"}}>
                {countdown === null ? (
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>
                    {isTH?"ไม่มีวันหมดอายุ":"No expiry date"}
                  </div>
                ) : countdown.expired ? (
                  <div style={{fontSize:12,color:"var(--accent)",fontWeight:700}}>
                    {isTH?"แพลนหมดอายุแล้ว":"Plan has expired"}
                  </div>
                ) : (
                  <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:11,color:"var(--text-muted)"}}>
                      {isTH?"หมดอายุใน":"Expires in"}
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"baseline"}}>
                      <span>
                        <span style={{fontSize:22,fontWeight:800,color:countdown.days<=7?"var(--gold)":"var(--text)",fontVariantNumeric:"tabular-nums"}}>
                          {countdown.days}
                        </span>
                        <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:3}}>
                          {isTH?"วัน":"d"}
                        </span>
                      </span>
                      <span>
                        <span style={{fontSize:22,fontWeight:800,color:countdown.days<=7?"var(--gold)":"var(--text)",fontVariantNumeric:"tabular-nums"}}>
                          {countdown.hours}
                        </span>
                        <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:3}}>
                          {isTH?"ชั่วโมง":"h"}
                        </span>
                      </span>
                    </div>
                    {countdown.days <= 7 && (
                      <div style={{fontSize:11,color:"var(--gold)",fontWeight:600}}>  <AlertTriangle size={12} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/>{isTH?"ใกล้หมดอายุ":"Expiring soon"}</div>
                    )}
                  </div>
                )}
                {user.expiresAt && !countdown?.expired && (
                  <div style={{fontSize:10,color:"var(--text-dim)",marginTop:4}}>
                    {new Date(user.expiresAt).toLocaleDateString(isTH?"th-TH":"en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                  </div>
                )}
              </div>
            </PlanSection>
            <BtnRow style={{justifyContent:"space-between"}}>
              <Btn $v="ghost" onClick={handleLogout}>{isTH?"ออกจากระบบ":"Logout"}</Btn>
              <div style={{display:"flex",gap:8}}>
                <Btn $v="secondary" onClick={()=>{onClose();onUpgrade();}}>
                  {isTH?"ดู Plans":"View Plans"}
                </Btn>
                <Dialog.Close asChild>
                  <Btn $v="primary">{isTH?"ปิด":"Close"}</Btn>
                </Dialog.Close>
              </div>
            </BtnRow>
          </Box>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  /* ── Auth form ── */
  return (
    <Dialog.Root open onOpenChange={open=>{ if(!open) onClose(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          <Title style={{justifyContent:"center",marginBottom:20}}>
            <img src="/logo22.png" alt="Go Poker" style={{height:125,objectFit:"contain"}} />
          </Title>

          {reason && <ReasonBanner>{reason}</ReasonBanner>}

          {view !== "forgot" && (
            <TabRow>
              <Tab $active={view==="login"}    onClick={()=>{setView("login");reset();}}>{isTH?"เข้าสู่ระบบ":"Sign In"}</Tab>
              <Tab $active={view==="register"} onClick={()=>{setView("register");reset();}}>{isTH?"สมัครสมาชิก":"Register"}</Tab>
          </TabRow>
        )}

        {/* ── LOGIN ── */}
        {view === "login" && <>
          <FieldLabel>{isTH?"Email หรือ Username":"Email or Username"}</FieldLabel>
          <Input autoFocus placeholder={isTH?"กรอก email หรือ username":"Enter email or username"}
            value={identifier} onChange={e=>{setIdentifier(e.target.value);reset();}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} />

          <FieldLabel>{isTH?"รหัสผ่าน":"Password"}</FieldLabel>
          <Input type="password" placeholder="••••••••" value={password}
            onChange={e=>{setPassword(e.target.value);reset();}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          <ForgotLink onClick={()=>{setView("forgot");reset();}}>
            {isTH?"ลืมรหัสผ่าน?":"Forgot password?"}
          </ForgotLink>

          {err && <ErrMsg><AlertTriangle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>{err}</ErrMsg>}
          <BtnRow>
            <Btn $v="ghost" onClick={onClose}>{isTH?"ยกเลิก":"Cancel"}</Btn>
            <Btn $v="primary" disabled={loading} onClick={handleLogin}>
              {loading?"...":(isTH?"เข้าสู่ระบบ":"Sign In")}
            </Btn>
          </BtnRow>
        </>}

        {/* ── REGISTER ── */}
        {view === "register" && <>
          <FieldLabel>
            Username
            {username.length >= 3 && (
              checkingUN
                ? <UsernameStatus $ok={null}> {isTH?"กำลังตรวจสอบ...":"checking..."}</UsernameStatus>
                : usernameOk === true
                  ? <UsernameStatus $ok={true}> ✓ {isTH?"ว่างอยู่":"available"}</UsernameStatus>
                  : usernameOk === false
                    ? <UsernameStatus $ok={false}> ✗ {isTH?"ถูกใช้แล้ว":"taken"}</UsernameStatus>
                    : null
            )}
          </FieldLabel>
          <Input autoFocus placeholder={isTH?"เช่น john_poker":"e.g. john_poker"}
            value={username} onChange={e=>handleUsernameChange(e.target.value)} />
          <Hint>{isTH?"ตัวอักษร ตัวเลข _ . เท่านั้น อย่างน้อย 3 ตัว":"Letters, numbers, _ . only. Min 3 characters."}</Hint>

          <FieldLabel>Email</FieldLabel>
          <Input type="email" placeholder="you@example.com" value={email}
            onChange={e=>{setEmail(e.target.value);reset();}} />

          <FieldLabel>{isTH?"รหัสผ่าน (อย่างน้อย 6 ตัว)":"Password (min 6 characters)"}</FieldLabel>
          <Input type="password" placeholder="••••••••" value={password}
            onChange={e=>{setPassword(e.target.value);reset();}}
            onKeyDown={e=>e.key==="Enter"&&handleRegister()} />

          {err && <ErrMsg><AlertTriangle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>{err}</ErrMsg>}
          {ok  && <OkMsg>✓ {ok}</OkMsg>}
          <BtnRow>
            <Dialog.Close asChild>
              <Btn $v="ghost">{isTH?"ยกเลิก":"Cancel"}</Btn>
            </Dialog.Close>
            <Btn $v="success" disabled={loading||usernameOk===false} onClick={handleRegister}>
              {loading?"...":(isTH?"สมัครสมาชิก":"Register")}
            </Btn>
          </BtnRow>
        </>}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && <>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>
            {isTH?"กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่":"Enter your email to receive a password reset link"}
          </div>
          <FieldLabel>Email</FieldLabel>
          <Input autoFocus type="email" placeholder="you@example.com"
            value={identifier.includes("@")?identifier:email}
            onChange={e=>{identifier.includes("@")?setIdentifier(e.target.value):setEmail(e.target.value);reset();}}
            onKeyDown={e=>e.key==="Enter"&&handleForgot()} />
          {err && <ErrMsg><AlertTriangle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>{err}</ErrMsg>}
          {ok  && <OkMsg>✓ {ok}</OkMsg>}
          <BtnRow>
            <Btn $v="ghost" onClick={()=>{setView("login");reset();}}>{isTH?"กลับ":"Back"}</Btn>
            <Btn $v="primary" disabled={loading} onClick={handleForgot}>
              {loading?"...":(isTH?"ส่งลิงก์":"Send Link")}
            </Btn>
          </BtnRow>
        </>}

        <Divider />
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
