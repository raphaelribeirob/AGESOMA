export type SafetyDecision="ALLOW"|"REVIEW"|"BLOCK";

export type SafetyResult={
  decision:SafetyDecision;
  reasons:string[];
  category:"content"|"action";
};

type RefMeta={role?:unknown;name?:unknown;value?:unknown;description?:unknown;[key:string]:unknown};

const PROMPT_INJECTION_PATTERNS:RegExp[]=[
  /ignore\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|system|developer|assistant)\s+(?:instructions?|messages?|rules?)/i,
  /(?:system|developer)\s+(?:prompt|message|instructions?)/i,
  /do\s+not\s+follow\s+(?:the\s+)?(?:previous|system|developer|assistant)\s+instructions?/i,
  /(?:reveal|print|show|return|repeat)\s+(?:your\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)/i,
  /you\s+are\s+(?:chatgpt|an?\s+ai|an?\s+assistant).{0,80}(?:must|should|will)/i,
  /(?:tool|function)\s+call.{0,80}(?:secret|token|password|cookie|credential)/i
];

const EXFILTRATION_PATTERNS:RegExp[]=[
  /(?:send|upload|post|transmit|forward|email|exfiltrate).{0,100}(?:password|api\s*key|token|cookie|secret|credential|private\s+data|contacts?|files?)/i,
  /(?:password|api\s*key|token|cookie|secret|credential).{0,100}(?:send|upload|post|transmit|forward|email|exfiltrate)/i
];

const SENSITIVE_FIELD=/\b(password|passcode|pin|otp|one[- ]?time|verification\s*code|2fa|mfa|cvv|cvc|card\s*number|credit\s*card|debit\s*card|bank\s*account|routing\s*number|private\s*key|api\s*key|secret\s*key|recovery\s*(?:code|phrase)|seed\s*phrase)\b/i;
const SECRET_VALUE_PATTERNS:RegExp[]=[
  /^sk-[A-Za-z0-9_-]{16,}$/,
  /^sk-proj-[A-Za-z0-9_-]{16,}$/,
  /^gh[pousr]_[A-Za-z0-9_]{20,}$/,
  /^AKIA[A-Z0-9]{16}$/,
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  /^(?:Bearer\s+)?[A-Za-z0-9+/_=-]{40,}$/
];

const HIGH_RISK_CLICK=/\b(buy\s*now|place\s*order|pay\s*now|confirm\s*purchase|purchase|checkout|send\s*money|transfer|wire|withdraw|delete\s*account|close\s*account|publish|post\s*publicly|send\s*message|submit\s*payment)\b/i;
const REVIEW_CLICK=/\b(submit|confirm|save|send|post|download|authorize|approve|accept\s*terms|sign\s*agreement)\b/i;

function asText(value:unknown){
  return typeof value==="string"?value:"";
}

function flattenRef(meta:RefMeta|undefined){
  if(!meta) return "";
  return [meta.role,meta.name,meta.value,meta.description].map(asText).filter(Boolean).join(" ");
}

function safeUrl(raw:string){
  try{
    const url=new URL(raw);
    if(url.protocol!=="https:") return false;
    if(url.username||url.password) return false;
    const host=url.hostname.toLowerCase();
    if(host==="localhost"||host.endsWith(".local")||host.endsWith(".internal")) return false;
    if(/^127\.|^10\.|^192\.168\.|^169\.254\./.test(host)) return false;
    const m=/^172\.(\d+)\./.exec(host);
    if(m&&Number(m[1])>=16&&Number(m[1])<=31) return false;
    return true;
  }catch{return false;}
}

export function classifyBrowserContent(input:{snapshot:string;url?:string|null;title?:string|null}):SafetyResult{
  const snapshot=input.snapshot.slice(0,250_000);
  const combined=`${input.title??""}\n${snapshot}`;
  const reasons:string[]=[];

  const injection=PROMPT_INJECTION_PATTERNS.some((pattern)=>pattern.test(combined));
  const exfil=EXFILTRATION_PATTERNS.some((pattern)=>pattern.test(combined));

  if(injection) reasons.push("prompt_injection_signature");
  if(exfil) reasons.push("credential_or_private_data_exfiltration_signature");

  if(injection&&exfil){
    return {decision:"BLOCK",reasons,category:"content"};
  }
  if(injection||exfil){
    return {decision:"REVIEW",reasons,category:"content"};
  }
  return {decision:"ALLOW",reasons:[],category:"content"};
}

export function classifyBrowserAction(input:{
  action:string;
  ref?:string|null;
  refs?:Record<string,RefMeta>|null;
  value?:unknown;
  url?:string|null;
}):SafetyResult{
  const action=input.action.trim().toLowerCase();
  const reasons:string[]=[];

  if(action==="navigate"){
    if(!input.url||!safeUrl(input.url)){
      return {decision:"BLOCK",reasons:["unsafe_navigation_target"],category:"action"};
    }
    return {decision:"ALLOW",reasons:[],category:"action"};
  }

  if(action==="scroll") return {decision:"ALLOW",reasons:[],category:"action"};

  const needsRef=new Set(["click","fill","select","check","uncheck"]);
  const ref=input.ref?.replace(/^@/,"")??"";
  const meta=ref&&input.refs?input.refs[ref]:undefined;
  if(needsRef.has(action)&&!meta){
    return {decision:"BLOCK",reasons:["unknown_or_stale_element_ref"],category:"action"};
  }

  const label=flattenRef(meta);

  if(action==="fill"){
    if(SENSITIVE_FIELD.test(label)){
      return {decision:"BLOCK",reasons:["sensitive_credential_field"],category:"action"};
    }
    const value=asText(input.value).trim();
    if(SECRET_VALUE_PATTERNS.some((pattern)=>pattern.test(value))){
      return {decision:"BLOCK",reasons:["secret_like_value"],category:"action"};
    }
    return {decision:"ALLOW",reasons:[],category:"action"};
  }

  if(action==="click"){
    if(HIGH_RISK_CLICK.test(label)){
      return {decision:"REVIEW",reasons:["high_consequence_click"],category:"action"};
    }
    if(REVIEW_CLICK.test(label)){
      return {decision:"REVIEW",reasons:["potential_submission_click"],category:"action"};
    }
    return {decision:"ALLOW",reasons:[],category:"action"};
  }

  if(action==="press"){
    const key=asText(input.value);
    if(/^(?:Control|Meta|Alt)\+/i.test(key)){
      return {decision:"BLOCK",reasons:["browser_or_system_shortcut_denied"],category:"action"};
    }
    if(/^Enter$/i.test(key)){
      return {decision:"REVIEW",reasons:["enter_may_submit_form"],category:"action"};
    }
    if(!/^(?:Escape|Tab|Shift\+Tab|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|PageUp|PageDown|Home|End|Backspace|Delete)$/i.test(key)){
      return {decision:"BLOCK",reasons:["key_not_allowlisted"],category:"action"};
    }
    return {decision:"ALLOW",reasons:[],category:"action"};
  }

  if(["select","check","uncheck"].includes(action)){
    if(SENSITIVE_FIELD.test(label)){
      return {decision:"REVIEW",reasons:["sensitive_form_control"],category:"action"};
    }
    return {decision:"ALLOW",reasons:[],category:"action"};
  }

  return {decision:"BLOCK",reasons:["unsupported_browser_action"],category:"action"};
}
