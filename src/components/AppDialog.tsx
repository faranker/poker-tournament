import { useState, useRef, useEffect, useId } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled, { keyframes } from "styled-components";
import { AlertTriangle, HelpCircle, Pencil, Check, X } from "lucide-react";

const overlayShow = keyframes`from{opacity:0}to{opacity:1}`;
const contentShow = keyframes`
  from{opacity:0;transform:translate(-50%,-48%) scale(.97)}
  to{opacity:1;transform:translate(-50%,-50%) scale(1)}`;

const Overlay = styled(Dialog.Overlay)`
  position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:var(--z-dialog);backdrop-filter:blur(5px);
  animation:${overlayShow} var(--dur-fast) var(--ease-out);
`;
const Box = styled(Dialog.Content)`
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:calc(var(--z-dialog) + 1);
  background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:24px;width:min(360px,90vw);box-shadow:var(--shadow-lg);
  animation:${contentShow} var(--dur) var(--ease-out);
  &:focus{outline:none;}
`;
const IconWrap = styled.div<{$t:"alert"|"confirm"|"prompt"}>`
  width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  margin-bottom:14px;flex-shrink:0;
  ${p=>p.$t==="alert"
    ? "background:var(--accent-soft);color:var(--accent-ink);"
    : p.$t==="confirm"
    ? "background:rgba(245,197,66,.15);color:var(--gold);"
    : "background:var(--success-soft);color:var(--success-ink);"}
`;
const Title = styled.h3`font-size:0.9375rem;font-weight:800;margin-bottom:6px;color:var(--text);`;
const Body = styled.p`font-size:0.9375rem;color:var(--text-muted);margin-bottom:20px;line-height:1.55;`;
const PromptInput = styled.input<{$invalid?:boolean}>`
  width:100%;padding:9px 12px;border-radius:var(--radius-sm);
  border:1.5px solid ${p=>p.$invalid?"var(--danger-ink)":"var(--border)"};background:var(--surface2);
  color:var(--text);font-size:1rem;font-family:inherit;margin-bottom:${p=>p.$invalid?"8px":"20px"};
  transition:border-color var(--dur),box-shadow var(--dur);
  &:focus{outline:none;border-color:${p=>p.$invalid?"var(--danger-ink)":"var(--accent)"};box-shadow:0 0 0 3px var(--accent-soft);}
  &::placeholder{color:var(--text-dim);}
`;
const FieldError = styled.p`
  display:flex;align-items:center;gap:6px;margin-bottom:16px;
  font-size:0.875rem;font-weight:600;color:var(--danger-ink);
`;
const BtnRow = styled.div`display:flex;gap:8px;justify-content:flex-end;`;
const Btn = styled.button<{$primary?:boolean}>`
  padding:9px 18px;border-radius:var(--radius-sm);border:none;
  font-size:0.9375rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all var(--dur);
  display:inline-flex;align-items:center;gap:6px;
  &:disabled{opacity:.4;cursor:not-allowed;}
  ${p=>p.$primary
    ? "background:var(--accent);color:var(--on-accent);box-shadow:0 1px 2px rgba(0,0,0,.25);&:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}"
    : "background:var(--surface3);color:var(--text);border:1px solid var(--border);&:hover{border-color:var(--border2);}"}
`;

export type AlertConfig  = { type:"alert";   message:string;                                       resolve:()=>void };
export type ConfirmConfig = { type:"confirm"; title:string; body?:string;                          resolve:(ok:boolean)=>void };
export type PromptConfig  = {
  type:"prompt"; label:string; placeholder?:string;
  inputMode?:"text"|"numeric"|"decimal";
  validate?:(val:string)=>string|null;
  resolve:(val:string|null)=>void;
};
export type DialogConfig  = AlertConfig | ConfirmConfig | PromptConfig;

interface Props {
  config: DialogConfig | null;
  lang?: "TH" | "EN";
}

export function AppDialog({ config, lang = "TH" }: Props) {
  const [val, setVal] = useState("");
  const [error, setError] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const isTH = lang === "TH";

  useEffect(() => {
    if (config?.type === "prompt") {
      setVal("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [config]);

  if (!config) return null;

  const submitPrompt = () => {
    if (config.type !== "prompt") return;
    const v = val.trim();
    if (!v) return;
    const problem = config.validate?.(v) ?? null;
    if (problem) { setError(problem); inputRef.current?.focus(); return; }
    config.resolve(v);
  };

  const dismiss = () => {
    if (config.type === "alert")   config.resolve();
    else if (config.type === "confirm") config.resolve(false);
    else config.resolve(null);
  };

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) dismiss(); }}>
      <Dialog.Portal>
        <Overlay />
        <Box>
          {config.type === "alert" && (
            <>
              <IconWrap $t="alert"><AlertTriangle size={22} /></IconWrap>
              <Title>{isTH ? "แจ้งเตือน" : "Notice"}</Title>
              <Body>{config.message}</Body>
              <BtnRow>
                <Btn $primary onClick={() => config.resolve()}>
                  <Check size={14} /> OK
                </Btn>
              </BtnRow>
            </>
          )}

          {config.type === "confirm" && (
            <>
              <IconWrap $t="confirm"><HelpCircle size={22} /></IconWrap>
              <Title>{config.title}</Title>
              {config.body && <Body>{config.body}</Body>}
              <BtnRow>
                <Btn onClick={() => config.resolve(false)}>
                  <X size={14} /> {isTH ? "ยกเลิก" : "Cancel"}
                </Btn>
                <Btn $primary onClick={() => config.resolve(true)}>
                  <Check size={14} /> {isTH ? "ยืนยัน" : "Confirm"}
                </Btn>
              </BtnRow>
            </>
          )}

          {config.type === "prompt" && (
            <>
              <IconWrap $t="prompt"><Pencil size={20} /></IconWrap>
              <Title id={`${uid}-label`}>{config.label}</Title>
              <PromptInput
                ref={inputRef}
                value={val}
                placeholder={config.placeholder ?? ""}
                inputMode={config.inputMode}
                aria-labelledby={`${uid}-label`}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? `${uid}-err` : undefined}
                $invalid={!!error}
                onChange={e => { setVal(e.target.value); setError(null); }}
                onKeyDown={e => {
                  if (e.key === "Enter") submitPrompt();
                  if (e.key === "Escape") config.resolve(null);
                }}
              />
              {error && (
                <FieldError id={`${uid}-err`} role="alert">
                  <AlertTriangle size={14} aria-hidden="true" /> {error}
                </FieldError>
              )}
              <BtnRow>
                <Btn onClick={() => config.resolve(null)}>
                  <X size={14} /> {isTH ? "ยกเลิก" : "Cancel"}
                </Btn>
                <Btn $primary disabled={!val.trim()} onClick={submitPrompt}>
                  <Check size={14} /> {isTH ? "ตกลง" : "OK"}
                </Btn>
              </BtnRow>
            </>
          )}
        </Box>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
