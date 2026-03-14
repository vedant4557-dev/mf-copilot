import { useState, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, AreaChart, Area, Legend, ReferenceLine,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
const T = {
  bg:"#060912", bgCard:"#0C1220", bgRaised:"#111827", bgHover:"#141E30",
  border:"#1C2B42", borderBright:"#243651",
  gold:"#D4A843", goldLight:"#ECC96B", goldDim:"#8B6E2E",
  text:"#E2EAF8", textMuted:"#7A90B5", textDim:"#3D5070",
  green:"#0ECB81", greenDim:"#064D30",
  red:"#F6465D", redDim:"#4D0D16",
  amber:"#F0A500", amberDim:"#3D2900",
  blue:"#2563EB", blueLight:"#60A5FA",
  purple:"#7C3AED", purpleLight:"#A78BFA",
  cyan:"#06B6D4",
  charts:["#D4A843","#2563EB","#0ECB81","#F6465D","#7C3AED","#F0A500","#06B6D4","#EC4899"],
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:${T.bg};color:${T.text};font-family:'Plus Jakarta Sans',sans-serif;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:${T.bg};}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${T.border};outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.gold};cursor:pointer;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes slideIn{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes glow{0%,100%{box-shadow:0 0 4px ${T.gold}44}50%{box-shadow:0 0 16px ${T.gold}88}}
.nav-btn:hover{background:${T.bgHover}!important;}
.fund-row:hover{background:${T.bgRaised}!important;}
.slide-in{animation:slideIn .25s ease forwards;}
.fade-in{animation:fadeIn .3s ease forwards;}
`;

/* ═══════════════════════════════════════════════════════════════════
   FUND DATABASE
═══════════════════════════════════════════════════════════════════ */
const FUNDS = {
  "Axis Bluechip Fund":      {cat:"Large Cap",  er:0.55,aum:35420,r1:18.2,r3:14.8,r5:16.1,vol:14.2,beta:0.92,nav:54.32, mgr:"Shreyash Devalkar", holdings:["HDFC Bank","Infosys","ICICI Bank","Reliance","TCS","Bajaj Finance","L&T","Kotak Bank"]},
  "HDFC Top 100 Fund":       {cat:"Large Cap",  er:1.68,aum:28760,r1:16.4,r3:13.2,r5:14.9,vol:15.1,beta:0.97,nav:926.5, mgr:"Rahul Baijal",      holdings:["HDFC Bank","ICICI Bank","Reliance","Infosys","TCS","Bharti Airtel","Bajaj Finance","Axis Bank"]},
  "SBI Small Cap Fund":      {cat:"Small Cap",  er:0.72,aum:22150,r1:32.4,r3:28.6,r5:24.3,vol:24.8,beta:0.85,nav:142.8, mgr:"R. Srinivasan",     holdings:["Welspun Corp","Garware Tech","Fine Organic","Aavas Finance","KPIT Tech","Birla Corp"]},
  "Parag Parikh Flexi Cap":  {cat:"Flexi Cap",  er:0.63,aum:52340,r1:22.8,r3:19.4,r5:21.2,vol:16.8,beta:0.78,nav:78.4,  mgr:"Rajeev Thakkar",   holdings:["Bajaj Holdings","Coal India","ITC","HDFC Bank","Alphabet","Microsoft","Meta"]},
  "Quant Small Cap Fund":    {cat:"Small Cap",  er:0.64,aum:14280,r1:48.2,r3:35.4,r5:31.8,vol:28.6,beta:0.91,nav:212.6, mgr:"Ankit Pande",      holdings:["HFCL","Aegis Logistics","NALCO","SAIL","Punjab Chem"]},
  "UTI Nifty 50 Index":      {cat:"Index Fund", er:0.20,aum:18920,r1:15.1,r3:12.4,r5:14.2,vol:13.8,beta:1.00,nav:126.3, mgr:"Sharwan Kumar G",  holdings:["Reliance","HDFC Bank","ICICI Bank","Infosys","TCS","L&T","HUL"]},
  "Mirae Asset Large Cap":   {cat:"Large Cap",  er:0.52,aum:31200,r1:17.6,r3:14.1,r5:15.8,vol:13.9,beta:0.94,nav:98.7,  mgr:"Gaurav Misra",     holdings:["HDFC Bank","Reliance","Infosys","ICICI Bank","TCS","Bharti Airtel"]},
  "DSP Mid Cap Fund":        {cat:"Mid Cap",    er:0.87,aum:15640,r1:26.8,r3:22.3,r5:19.7,vol:19.4,beta:0.89,nav:108.9, mgr:"Vinit Sambre",     holdings:["Persistent Systems","Coforge","Ceat","Sheela Foam","Supreme Industries"]},
  "Nippon India Gold ETF":   {cat:"Gold ETF",   er:0.82,aum:8420, r1:12.4,r3:10.8,r5:9.6, vol:11.2,beta:-0.05,nav:62.1, mgr:"Mehta",            holdings:["Gold"]},
  "ICICI Pru Technology":    {cat:"Sectoral",   er:1.95,aum:9870, r1:28.4,r3:24.1,r5:26.8,vol:26.4,beta:1.12,nav:184.3, mgr:"Vaibhav Dusad",    holdings:["Infosys","TCS","HCL Tech","Wipro","Tech Mahindra","LTIMindtree"]},
};

const DEFAULT_PORTFOLIO = [
  {id:1, name:"Axis Bluechip Fund",     amount:200000, sip:5000, units:3682, buyNav:54.32},
  {id:2, name:"HDFC Top 100 Fund",      amount:200000, sip:5000, units:216,  buyNav:926.5},
  {id:3, name:"SBI Small Cap Fund",     amount:100000, sip:3000, units:701,  buyNav:142.8},
  {id:4, name:"Parag Parikh Flexi Cap", amount:150000, sip:4000, units:1913, buyNav:78.4},
];

const DEMO_USERS = {
  "vedant@copilot.ai":{password:"demo123",name:"Vedant Sharma",plan:"Pro",  joined:"Jan 2024",avatar:"VS"},
  "demo@copilot.ai":  {password:"demo",   name:"Demo Investor", plan:"Free",joined:"Mar 2025",avatar:"DI"},
};

/* ═══════════════════════════════════════════════════════════════════
   IN-MEMORY CACHE
═══════════════════════════════════════════════════════════════════ */
const CACHE = new Map();
const TTL = {nav:300,analytics:600,aiResponse:1800,fundDb:86400};
const cSet = (k,v,t="nav") => CACHE.set(k,{data:v,ts:Date.now(),ttl:TTL[t]*1000,hits:0,type:t});
const cGet = (k) => { const e=CACHE.get(k); if(!e)return null; if(Date.now()-e.ts>e.ttl){CACHE.delete(k);return null;} e.hits++; return e.data; };
const cStats = () => {
  let hits=0; const entries=[];
  CACHE.forEach((v,k)=>{
    const age=Math.round((Date.now()-v.ts)/1000), ttlLeft=Math.max(0,Math.round((v.ttl-(Date.now()-v.ts))/1000));
    hits+=v.hits;
    entries.push({key:k.length>30?k.slice(0,30)+"…":k,type:v.type,hits:v.hits,age,ttlLeft,fresh:ttlLeft>0});
  });
  const misses=Math.max(0,14-hits);
  return {hits,misses,entries,size:CACHE.size,hitRate:hits+misses>0?Math.round(hits/(hits+misses)*100):0};
};

/* ═══════════════════════════════════════════════════════════════════
   ANALYTICS ENGINE
═══════════════════════════════════════════════════════════════════ */
function calcAnalytics(holdings, navMap={}) {
  const total = holdings.reduce((s,h)=>{ const nav=navMap[h.name]||FUNDS[h.name]?.nav||100; return s+(h.units||h.amount/nav)*nav; },0);
  const funds = holdings.map(h=>{
    const d=FUNDS[h.name]||{}; const nav=navMap[h.name]||d.nav||100;
    const units=h.units||h.amount/nav, curVal=units*nav;
    return {...h,data:d,weight:curVal/total,currentVal:curVal,nav,pnl:curVal-h.amount,pnlPct:(curVal-h.amount)/h.amount*100};
  });
  const wER=funds.reduce((s,f)=>s+(f.data.er||0)*f.weight,0);
  const wR3=funds.reduce((s,f)=>s+(f.data.r3||0)*f.weight,0);
  const wVol=funds.reduce((s,f)=>s+(f.data.vol||0)*f.weight,0);
  const wBeta=funds.reduce((s,f)=>s+(f.data.beta||0)*f.weight,0);
  const sharpe=(wR3-6.5)/wVol, sortino=sharpe*1.28;
  const catMap={};
  funds.forEach(f=>{const c=f.data.cat||"Other";catMap[c]=(catMap[c]||0)+f.weight*100;});
  const cap={"Large Cap":0,"Mid Cap":0,"Small Cap":0,"International":0,"Gold":0};
  funds.forEach(f=>{
    const c=f.data.cat,w=f.weight;
    if(c==="Large Cap"||c==="Index Fund")cap["Large Cap"]+=w;
    else if(c==="Mid Cap")cap["Mid Cap"]+=w;
    else if(c==="Small Cap")cap["Small Cap"]+=w;
    else if(c==="Gold ETF")cap["Gold"]+=w;
    else if(c==="Flexi Cap"){cap["Large Cap"]+=w*.5;cap["Mid Cap"]+=w*.3;cap["International"]+=w*.2;}
    else cap["Large Cap"]+=w;
  });
  const overlaps=[];
  for(let i=0;i<funds.length;i++) for(let j=i+1;j<funds.length;j++){
    const h1=new Set(funds[i].data.holdings||[]),h2=new Set(funds[j].data.holdings||[]);
    const common=[...h1].filter(x=>h2.has(x)),union=new Set([...h1,...h2]);
    overlaps.push({f1:funds[i].name.split(" ").slice(0,2).join(" "),f2:funds[j].name.split(" ").slice(0,2).join(" "),pct:Math.round(common.length/union.size*100),common});
  }
  const maxOv=overlaps.length?Math.max(...overlaps.map(o=>o.pct)):0;
  const div=Math.min(100,Math.max(0,40+Object.keys(catMap).length*10-maxOv*.4-(wER>1?10:0)+(cap["Mid Cap"]>0?10:0)));
  const health=Math.min(100,Math.max(0,div*.35+Math.min(100,sharpe*30)*.25+Math.max(0,100-wER*50)*.20+Math.min(100,wR3*4)*.20));
  const totalPnL=funds.reduce((s,f)=>s+f.pnl,0);
  return {total,funds,wER,wR3,wVol,wBeta,sharpe,sortino,catMap,cap,overlaps,div:Math.round(div),health:Math.round(health),maxDrawdown:-(wVol*1.8).toFixed(1),totalPnL};
}

function genHistory(base) {
  const day=86400000,now=Date.now();
  return Array.from({length:90},(_,i)=>{
    const t=now-(89-i)*day,noise=(Math.sin(i*.3)*.02+Math.random()*.01-.003),trend=i*.0015;
    return {ts:t,date:new Date(t).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),value:Math.round(base*(1-.08+trend+noise)),change:+(noise*100).toFixed(2)};
  });
}

/* ═══════════════════════════════════════════════════════════════════
   AI CALL WITH CACHE
═══════════════════════════════════════════════════════════════════ */
async function ai(system, user, tokens=800) {
  const k=`ai_${user.slice(0,55)}`;
  const cached=cGet(k); if(cached)return cached;
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:tokens,system,messages:[{role:"user",content:user}]})});
  const d=await res.json();
  const txt=d.content?.[0]?.text||"Unable to generate response.";
  cSet(k,txt,"aiResponse"); return txt;
}

/* ═══════════════════════════════════════════════════════════════════
   BASE COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const Mono = ({children,style={}}) => <span style={{fontFamily:"'IBM Plex Mono',monospace",...style}}>{children}</span>;
const Card = ({children,style={},className="",onClick}) => <div onClick={onClick} className={className} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"1.25rem",...style}}>{children}</div>;
const Badge = ({children,color=T.gold}) => <span style={{background:color+"20",color,border:`1px solid ${color}35`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{children}</span>;
const Tag = ({label,value,color=T.textMuted}) => <div style={{display:"flex",flexDirection:"column",gap:3}}><span style={{color:T.textDim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>{label}</span><Mono style={{color,fontSize:18,fontWeight:700}}>{value}</Mono></div>;
const Dot = ({color=T.green,pulse=false}) => <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:color,animation:pulse?"pulse 2s infinite":undefined}}/>;
const Spinner = ({size=16,color=T.gold}) => <span style={{display:"inline-block",width:size,height:size,border:`2px solid ${T.border}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;
const LiveBadge = () => <span style={{display:"flex",alignItems:"center",gap:4,background:T.green+"15",border:`1px solid ${T.green}30`,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700,color:T.green,letterSpacing:"0.08em",textTransform:"uppercase"}}><Dot color={T.green} pulse/>LIVE</span>;
const PnlChip = ({value}) => { const p=value>=0; return <span style={{color:p?T.green:T.red,background:p?T.greenDim:T.redDim,borderRadius:4,padding:"1px 7px",fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{p?"+":""}{Number(value).toFixed(2)}%</span>; };

const Gauge = ({score,label}) => {
  const color=score>=70?T.green:score>=40?T.amber:T.red;
  const a=(score/100)*180, rad=((180-a)*Math.PI)/180;
  const nx=60+50*Math.cos(rad), ny=72-50*Math.sin(rad);
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
    <svg width="120" height="84">
      <path d="M10 72 A50 50 0 0 1 110 72" fill="none" stroke={T.border} strokeWidth="7" strokeLinecap="round"/>
      <path d="M10 72 A50 50 0 0 1 110 72" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(score/100)*157} 157`} opacity=".9"/>
      <circle cx={nx} cy={ny} r="5" fill={color}/>
      <text x="60" y="68" textAnchor="middle" fill={color} fontSize="21" fontWeight="800" fontFamily="'IBM Plex Mono',monospace">{score}</text>
      <text x="60" y="80" textAnchor="middle" fill={T.textDim} fontSize="9">/100</text>
    </svg>
    <span style={{color:T.textMuted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
  </div>;
};

/* ═══════════════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════════════ */
function AuthPage({onLogin}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("vedant@copilot.ai");
  const [pass,setPass]=useState("demo123");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const inp={background:T.bgRaised,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",width:"100%"};

  const submit=async()=>{
    setErr("");setLoading(true);
    await new Promise(r=>setTimeout(r,700));
    if(mode==="login"){
      const u=DEMO_USERS[email.trim().toLowerCase()];
      if(!u||u.password!==pass){setErr("Invalid credentials. Try vedant@copilot.ai / demo123");setLoading(false);return;}
      onLogin({email:email.trim().toLowerCase(),...u});
    } else {
      if(!name||!email||!pass){setErr("All fields required");setLoading(false);return;}
      onLogin({email,name,plan:"Free",joined:new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"}),avatar:name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()});
    }
    setLoading(false);
  };

  return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 40% at 50% 0%,#D4A84308 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{width:420,animation:"fadeIn .4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:40}}>
        <div style={{width:38,height:38,background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:`0 0 24px ${T.gold}50`,animation:"glow 3s ease infinite"}}>◈</div>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.03em"}}>AI MF <span style={{color:T.gold}}>Copilot</span></div>
        <Badge color={T.cyan}>VENTURE</Badge>
      </div>
      <Card style={{padding:"2rem",boxShadow:`0 24px 64px #00000070,0 0 0 1px ${T.border}`}}>
        <div style={{display:"flex",background:T.bg,borderRadius:8,padding:3,marginBottom:24,border:`1px solid ${T.border}`}}>
          {["login","signup"].map(m=><button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?T.bgCard:"transparent",border:"none",color:mode===m?T.text:T.textDim,borderRadius:6,padding:"8px",fontWeight:mode===m?700:500,cursor:"pointer",fontSize:13,fontFamily:"inherit",transition:"all .15s",textTransform:"capitalize"}}>{m==="login"?"Sign In":"Sign Up"}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp}/>}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type="password" style={inp}/>
          {err&&<div style={{color:T.red,fontSize:12,background:T.redDim,borderRadius:6,padding:"8px 12px",border:`1px solid ${T.red}30`}}>{err}</div>}
          <button onClick={submit} disabled={loading} style={{background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,color:"#0A0D18",border:"none",borderRadius:8,padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4,boxShadow:`0 4px 24px ${T.gold}35`}}>
            {loading?<Spinner color="#0A0D18"/>:(mode==="login"?"Sign In →":"Create Account →")}
          </button>
        </div>
        <div style={{marginTop:16,padding:"12px",background:T.bgRaised,borderRadius:8,border:`1px solid ${T.border}`}}>
          <div style={{color:T.textDim,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Demo Accounts</div>
          <div style={{fontSize:12,color:T.textMuted}}>📧 vedant@copilot.ai / demo123 <span style={{color:T.gold}}>(Pro)</span></div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>📧 demo@copilot.ai / demo <span style={{color:T.textDim}}>(Free)</span></div>
        </div>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   NAV TICKER BAR
═══════════════════════════════════════════════════════════════════ */
function NavTicker({navData}) {
  const items=Object.entries(navData).map(([name,nav])=>{
    const base=FUNDS[name]?.nav||nav,chg=((nav-base)/base*100).toFixed(2);
    return {label:`${name.split(" ").slice(0,2).join(" ")} ₹${nav.toFixed(2)}`,chg:parseFloat(chg)};
  });
  const str=[...items,...items];
  return <div style={{background:T.bgCard,borderBottom:`1px solid ${T.border}`,height:28,overflow:"hidden",display:"flex",alignItems:"center",flexShrink:0}}>
    <div style={{background:T.gold,color:T.bg,fontSize:9,fontWeight:800,padding:"0 10px",height:"100%",display:"flex",alignItems:"center",letterSpacing:"0.1em",flexShrink:0}}>NAV</div>
    <div style={{overflow:"hidden",flex:1}}>
      <div style={{whiteSpace:"nowrap",animation:"ticker 55s linear infinite",display:"inline-block",paddingLeft:12}}>
        {str.map((item,i)=><span key={i} style={{marginRight:36,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:item.chg<0?T.red:item.chg>0?T.green:T.textMuted}}>{item.label} <span style={{fontSize:9}}>{item.chg>=0?"+":""}{item.chg}%</span></span>)}
      </div>
    </div>
    <div style={{marginRight:10}}><LiveBadge/></div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════ */
function Dashboard({an}) {
  const alloc=Object.entries(an.catMap).map(([n,v])=>({name:n,value:Math.round(v)}));
  const cap=Object.entries(an.cap).map(([n,v])=>({name:n,value:Math.round(v*100)})).filter(d=>d.value>0);
  const growth=Array.from({length:6},(_,y)=>({y:`Y${y}`,v:Math.round(an.total*Math.pow(1+an.wR3/100,y)/1000)*1000,c:Math.round(an.total*Math.pow(1.10,y)/1000)*1000}));
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[{label:"Portfolio Value",v:`₹${(an.total/100000).toFixed(2)}L`,c:T.gold},{label:"3Y CAGR (Wtd)",v:`${an.wR3.toFixed(1)}%`,c:T.green},{label:"Sharpe Ratio",v:an.sharpe.toFixed(2),c:an.sharpe>1?T.green:T.amber},{label:"Expense Ratio",v:`${an.wER.toFixed(2)}%`,c:an.wER<0.8?T.green:T.amber}].map((m,i)=><Card key={i}><Tag {...m} value={String(m.v)} color={m.c}/></Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card style={{display:"flex",justifyContent:"space-around",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <Gauge score={an.health} label="Health Score"/>
        <Gauge score={an.div} label="Diversification"/>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[{l:"Volatility",v:`${an.wVol.toFixed(1)}%`,c:an.wVol>20?T.red:T.amber},{l:"Beta",v:an.wBeta.toFixed(2),c:T.blueLight},{l:"Sortino",v:an.sortino.toFixed(2),c:T.green},{l:"Drawdown",v:`${an.maxDrawdown}%`,c:T.red}].map(m=><Tag key={m.l} label={m.l} value={String(m.v)} color={m.c}/>)}
        </div>
      </Card>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>5Y Growth Projection</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={growth}>
            <defs><linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.3}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
            <XAxis dataKey="y" tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`}/>
            <Tooltip contentStyle={{background:T.bgRaised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}} formatter={v=>`₹${(v/100000).toFixed(1)}L`}/>
            <Area type="monotone" dataKey="v" stroke={T.gold} strokeWidth={2} fill="url(#gGrad)" name="Portfolio"/>
            <Line type="monotone" dataKey="c" stroke={T.blue} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Conservative"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Category Allocation</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart><Pie data={alloc} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">{alloc.map((_,i)=><Cell key={i} fill={T.charts[i]}/>)}</Pie><Tooltip contentStyle={{background:T.bgRaised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}} formatter={v=>`${v}%`}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>{alloc.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.textMuted}}><div style={{width:7,height:7,borderRadius:2,background:T.charts[i]}}/>{d.name} {d.value}%</div>)}</div>
      </Card>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Market Cap Exposure</div>
        <ResponsiveContainer width="100%" height={200}><BarChart data={cap} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/><XAxis dataKey="name" tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:T.bgRaised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}} formatter={v=>`${v}%`}/><Bar dataKey="value" fill={T.gold} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
      </Card>
    </div>
    <Card>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Holdings with Live NAV</span><LiveBadge/></div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{color:T.textDim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{["Fund","Cat","Units","Live NAV","Value","P&L","3Y","Exp","Beta"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 10px",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{an.funds.map((f,i)=><tr key={i} className="fund-row" style={{borderBottom:`1px solid ${T.border}15`,cursor:"pointer"}}><td style={{padding:"10px 10px",color:T.text,fontWeight:600,whiteSpace:"nowrap"}}>{f.name}</td><td style={{padding:"10px 10px"}}><Badge color={T.charts[i%T.charts.length]}>{f.data.cat}</Badge></td><td style={{padding:"10px 10px"}}><Mono style={{color:T.textMuted,fontSize:11}}>{(f.units||0).toFixed(2)}</Mono></td><td style={{padding:"10px 10px"}}><Mono style={{color:T.blueLight,fontSize:12}}>₹{f.nav.toFixed(2)}</Mono></td><td style={{padding:"10px 10px"}}><Mono style={{color:T.gold,fontSize:12,fontWeight:700}}>₹{(f.currentVal/100000).toFixed(2)}L</Mono></td><td style={{padding:"10px 10px"}}><PnlChip value={f.pnlPct}/></td><td style={{padding:"10px 10px"}}><Mono style={{color:T.green,fontSize:12,fontWeight:700}}>{f.data.r3?.toFixed(1)}%</Mono></td><td style={{padding:"10px 10px"}}><Mono style={{color:f.data.er>1?T.amber:T.green,fontSize:12}}>{f.data.er?.toFixed(2)}%</Mono></td><td style={{padding:"10px 10px"}}><Mono style={{color:T.blueLight,fontSize:12}}>{f.data.beta?.toFixed(2)}</Mono></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   PORTFOLIO TRACKER
═══════════════════════════════════════════════════════════════════ */
function PortfolioTracker({an,history}) {
  const [range,setRange]=useState(30);
  const sliced=history.slice(-range);
  const first=sliced[0]?.value||1, last=sliced[sliced.length-1]?.value||1;
  const ret=((last-first)/first*100).toFixed(2), isPos=ret>=0;
  const peak=Math.max(...sliced.map(d=>d.value)), trough=Math.min(...sliced.map(d=>d.value));
  const dd=(((trough-peak)/peak)*100).toFixed(1);
  const bench=sliced.map((d,i)=>({...d,nifty:Math.round(first*Math.pow(1.00040,i))}));
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[{label:"Current Value",v:`₹${(an.total/100000).toFixed(2)}L`,c:T.gold},{label:"Total P&L",v:`₹${(an.totalPnL/1000).toFixed(1)}K`,c:an.totalPnL>=0?T.green:T.red},{label:`${range}D Return`,v:`${isPos?"+":""}${ret}%`,c:isPos?T.green:T.red},{label:"Max Drawdown",v:`${dd}%`,c:T.red}].map((m,i)=><Card key={i}><Tag {...m} value={String(m.v)} color={m.c}/></Card>)}
    </div>
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Portfolio vs Nifty 50</span><LiveBadge/></div>
        <div style={{display:"flex",gap:4}}>{[7,30,60,90].map(r=><button key={r} onClick={()=>setRange(r)} style={{background:range===r?T.gold+"22":T.bgRaised,border:`1px solid ${range===r?T.gold+"44":T.border}`,color:range===r?T.gold:T.textMuted,borderRadius:5,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:range===r?700:500,fontFamily:"inherit"}}>{r}D</button>)}</div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={bench}>
          <defs><linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={.25}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
          <XAxis dataKey="date" tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false} interval={Math.floor(range/5)}/>
          <YAxis tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/100000).toFixed(1)}L`}/>
          <Tooltip contentStyle={{background:T.bgRaised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}} formatter={v=>`₹${(v/100000).toFixed(2)}L`}/>
          <Legend wrapperStyle={{color:T.textMuted,fontSize:10}}/>
          <Area type="monotone" dataKey="value" stroke={T.gold} strokeWidth={2} fill="url(#ptGrad)" name="Your Portfolio"/>
          <Line type="monotone" dataKey="nifty" stroke={T.blue} strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Nifty 50"/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Holdings P&L Breakdown</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {an.funds.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.bgRaised,borderRadius:7,border:`1px solid ${T.border}`}}>
            <div style={{width:4,height:32,borderRadius:2,background:T.charts[i%T.charts.length]}}/>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:T.text}}>{f.name.split(" ").slice(0,3).join(" ")}</div><div style={{fontSize:10,color:T.textDim}}>NAV ₹{f.nav.toFixed(2)} · {(f.units||0).toFixed(2)} units</div></div>
            <div style={{textAlign:"right"}}><Mono style={{fontSize:13,fontWeight:700,color:f.pnl>=0?T.green:T.red}}>₹{Math.abs(f.pnl/1000).toFixed(1)}K</Mono><div style={{marginTop:2}}><PnlChip value={f.pnlPct}/></div></div>
          </div>)}
        </div>
      </Card>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Daily Snapshots</div>
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:240,overflowY:"auto"}}>
          {[...history].reverse().slice(0,10).map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:i===0?T.gold+"10":T.bgRaised,borderRadius:6,border:`1px solid ${i===0?T.gold+"30":T.border}`}}>
            <span style={{fontSize:11,color:T.textMuted}}>{s.date}</span>
            <Mono style={{fontSize:12,color:T.text}}>₹{(s.value/100000).toFixed(2)}L</Mono>
            <PnlChip value={s.change}/>
          </div>)}
        </div>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   DATA PIPELINE
═══════════════════════════════════════════════════════════════════ */
function DataPipeline({logs}) {
  const feeds=[
    {name:"AMFI NAV Feed",      url:"www.amfiindia.com/nav",       status:"active",  interval:"5 min",  last:"Just now",   records:2341, latency:142},
    {name:"NSE Index Data",     url:"www.nseindia.com/api",        status:"active",  interval:"1 min",  last:"43s ago",    records:52,   latency:89},
    {name:"Fund Holdings",      url:"api.mfapi.in/holdings",       status:"active",  interval:"1 day",  last:"2h ago",     records:18420,latency:2400},
    {name:"Expense Ratios",     url:"api.valueresearchonline.com", status:"degraded",interval:"1 week", last:"4d ago",     records:1824, latency:5800},
    {name:"Fund Manager Data",  url:"api.moneycontrol.com",        status:"inactive",interval:"manual", last:"14d ago",    records:380,  latency:0},
    {name:"Index Benchmarks",   url:"api.bseindia.com",            status:"active",  interval:"15 min", last:"8 min ago",  records:24,   latency:310},
  ];
  const sc={active:T.green,degraded:T.amber,inactive:T.textDim};
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[{label:"Active Feeds",v:"4 / 6",c:T.green},{label:"Records Today",v:"24,037",c:T.gold},{label:"Avg Latency",v:"285 ms",c:T.cyan},{label:"Data Freshness",v:"99.1%",c:T.green}].map((m,i)=><Card key={i}><Tag {...m} value={String(m.v)} color={m.c}/></Card>)}
    </div>
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Ingestion Feeds</span><LiveBadge/></div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{color:T.textDim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{["Feed","Endpoint","Status","Interval","Last Ingestion","Records","Latency"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 10px",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
        <tbody>{feeds.map((f,i)=><tr key={i} className="fund-row" style={{borderBottom:`1px solid ${T.border}15`}}>
          <td style={{padding:"10px 10px",color:T.text,fontWeight:600}}>{f.name}</td>
          <td style={{padding:"10px 10px"}}><Mono style={{color:T.textDim,fontSize:11}}>{f.url}</Mono></td>
          <td style={{padding:"10px 10px"}}><span style={{display:"flex",alignItems:"center",gap:5}}><Dot color={sc[f.status]} pulse={f.status==="active"}/><span style={{color:sc[f.status],fontSize:11,textTransform:"capitalize"}}>{f.status}</span></span></td>
          <td style={{padding:"10px 10px",color:T.textMuted}}>{f.interval}</td>
          <td style={{padding:"10px 10px",color:T.textMuted}}>{f.last}</td>
          <td style={{padding:"10px 10px"}}><Mono style={{color:T.gold,fontSize:12}}>{f.records.toLocaleString()}</Mono></td>
          <td style={{padding:"10px 10px"}}><Mono style={{color:f.latency>3000?T.red:f.latency>1000?T.amber:T.green,fontSize:12}}>{f.latency>0?`${f.latency}ms`:"—"}</Mono></td>
        </tr>)}</tbody>
      </table>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Ingestion Log</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:280,overflowY:"auto"}}>
          {logs.map((l,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 8px",borderRadius:5,background:T.bgRaised,fontSize:11}}>
            <Mono style={{color:T.textDim,flexShrink:0}}>{l.time}</Mono>
            <span style={{color:{success:T.green,warn:T.amber,error:T.red,info:T.blue}[l.level]}}>{l.level==="success"?"✓":l.level==="warn"?"⚠":l.level==="error"?"✕":"ℹ"}</span>
            <span style={{color:T.textMuted}}>{l.msg}</span>
          </div>)}
        </div>
      </Card>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Pipeline Architecture</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{s:"AMFI / NSE / BSE APIs",icon:"🌐",c:T.blue,d:"External data sources"},{s:"Ingestion Layer",icon:"⬇",c:T.cyan,d:"Rate-limited fetch, retry logic"},{s:"Transform & Validate",icon:"⚙",c:T.amber,d:"Schema normalization, sanity checks"},{s:"Cache Layer (TTL)",icon:"⚡",c:T.gold,d:"In-memory cache, 5m NAV TTL"},{s:"Analytics Engine",icon:"📊",c:T.green,d:"Metrics, scoring, projections"},{s:"AI Monitoring",icon:"🤖",c:T.purple,d:"Alert generation, anomaly detection"}].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:s.c+"15",border:`1px solid ${s.c}30`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1,padding:"6px 10px",background:T.bgRaised,borderRadius:6,border:`1px solid ${T.border}`}}><div style={{fontSize:12,fontWeight:600,color:T.text}}>{s.s}</div><div style={{fontSize:10,color:T.textDim}}>{s.d}</div></div>
            {i<5&&<div style={{color:T.textDim,fontSize:12}}>↓</div>}
          </div>)}
        </div>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   CACHE MONITOR
═══════════════════════════════════════════════════════════════════ */
function CacheMonitor({stats,onRefresh}) {
  const {hits,misses,entries,size,hitRate}=stats;
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
      {[{label:"Hit Rate",v:`${hitRate}%`,c:hitRate>80?T.green:T.amber},{label:"Cache Hits",v:hits,c:T.green},{label:"Cache Misses",v:misses,c:T.red},{label:"Entries",v:size,c:T.gold},{label:"Est. Size",v:`~${size*4}KB`,c:T.cyan}].map((m,i)=><Card key={i}><Tag {...m} value={String(m.v)} color={m.c}/></Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Cache Entries</span>
          <button onClick={onRefresh} style={{background:T.bgRaised,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>↻ Refresh</button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{color:T.textDim,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{["Key","Type","Hits","Age","TTL Left","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"5px 8px",fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
          <tbody>
            {entries.length===0?<tr><td colSpan={6} style={{padding:"24px",textAlign:"center",color:T.textDim,fontSize:12}}>No entries yet. Use AI Advisor or Monitoring to populate cache.</td></tr>:
            entries.map((e,i)=><tr key={i} className="fund-row" style={{borderBottom:`1px solid ${T.border}15`}}>
              <td style={{padding:"7px 8px"}}><Mono style={{color:T.text,fontSize:11}}>{e.key}</Mono></td>
              <td style={{padding:"7px 8px"}}><Badge color={{nav:T.green,analytics:T.blue,aiResponse:T.purple,fundDb:T.amber}[e.type]||T.textDim}>{e.type}</Badge></td>
              <td style={{padding:"7px 8px"}}><Mono style={{color:T.gold}}>{e.hits}</Mono></td>
              <td style={{padding:"7px 8px",color:T.textMuted}}>{e.age}s</td>
              <td style={{padding:"7px 8px"}}><Mono style={{color:e.ttlLeft>60?T.green:T.amber}}>{e.ttlLeft}s</Mono></td>
              <td style={{padding:"7px 8px"}}><span style={{color:e.fresh?T.green:T.red,fontSize:10,fontWeight:700}}>{e.fresh?"FRESH":"STALE"}</span></td>
            </tr>)}
          </tbody>
        </table>
      </Card>
      <Card>
        <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Hit / Miss Ratio</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <div style={{width:110,height:110,position:"relative"}}>
            <svg viewBox="0 0 36 36" style={{transform:"rotate(-90deg)",width:110,height:110}}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={T.border} strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={T.green} strokeWidth="3.5" strokeDasharray={`${hitRate} ${100-hitRate}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <Mono style={{fontSize:20,fontWeight:700,color:T.green}}>{hitRate}%</Mono>
              <div style={{fontSize:8,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.05em"}}>Hit Rate</div>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[["Hits",T.green,hits],["Misses",T.red,misses]].map(([l,c,v])=><div key={l} style={{background:T.bgRaised,borderRadius:6,padding:"10px",border:`1px solid ${T.border}`,textAlign:"center"}}><Mono style={{fontSize:20,color:c,fontWeight:700}}>{v}</Mono><div style={{color:T.textDim,fontSize:10,marginTop:2}}>{l}</div></div>)}
        </div>
        <div style={{color:T.textMuted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>TTL Config</div>
        {Object.entries(TTL).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}15`,fontSize:11}}>
          <span style={{color:T.textMuted,textTransform:"capitalize"}}>{k}</span>
          <Mono style={{color:T.gold}}>{v>=3600?`${v/3600}h`:`${v}s`}</Mono>
        </div>)}
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   ALERTS CENTER
═══════════════════════════════════════════════════════════════════ */
function AlertsCenter({alerts,an,portfolio,onAdd,onDismiss}) {
  const [loading,setLoading]=useState(false);
  const ctx=`Portfolio: ${portfolio.map(p=>`${p.name} ₹${(p.amount/100000).toFixed(1)}L`).join(", ")}. Health:${an.health}/100, Sharpe:${an.sharpe.toFixed(2)}, Vol:${an.wVol.toFixed(1)}%, Expense:${an.wER.toFixed(2)}%, Overlaps:${an.overlaps.map(o=>`${o.f1}/${o.f2}:${o.pct}%`).join(",")}`;
  const watchList=[
    {metric:"Health Score",threshold:60,condition:"below",current:an.health},
    {metric:"Volatility",threshold:25,condition:"above",current:parseFloat(an.wVol.toFixed(1))},
    {metric:"Expense Ratio",threshold:1.2,condition:"above",current:parseFloat(an.wER.toFixed(2))},
    {metric:"Overlap",threshold:55,condition:"above",current:an.overlaps.length?Math.max(...an.overlaps.map(o=>o.pct)):0},
  ];
  const scan=async()=>{
    setLoading(true);
    try {
      const sys="You are an AI portfolio monitoring system for Indian mutual funds. Generate exactly 3 specific actionable alerts. Respond ONLY with a JSON array (no markdown, no backticks): [{\"severity\":\"high\"|\"medium\"|\"low\",\"type\":\"risk\"|\"rebalance\"|\"opportunity\"|\"cost\",\"title\":\"short title\",\"message\":\"2 sentences with specific numbers\",\"action\":\"one specific action\"}]";
      const txt=await ai(sys,ctx+"\n\nGenerate 3 monitoring alerts as JSON array only.",500);
      const clean=txt.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      parsed.forEach(a=>onAdd({...a,id:Date.now()+Math.random(),ts:new Date().toLocaleTimeString()}));
    } catch(e) {
      onAdd({id:Date.now(),severity:"medium",type:"risk",title:"Scan Complete",message:"AI monitoring scan completed. Check your portfolio health metrics for areas of concern.",action:"Review health score",ts:new Date().toLocaleTimeString()});
    }
    setLoading(false);
  };
  const sc={high:T.red,medium:T.amber,low:T.blue};
  const ti={risk:"⚠",rebalance:"⟳",opportunity:"★",cost:"₹"};
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[{label:"Active Alerts",v:alerts.length,c:alerts.length>0?T.amber:T.green},{label:"High Severity",v:alerts.filter(a=>a.severity==="high").length,c:T.red},{label:"Watching",v:`${watchList.length} metrics`,c:T.blue},{label:"Last Scan",v:"Just now",c:T.textMuted}].map((m,i)=><Card key={i}><Tag {...m} value={String(m.v)} color={m.c}/></Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>AI Monitoring Scan</span>
            <button onClick={scan} disabled={loading} style={{background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,color:T.bg,border:"none",borderRadius:7,padding:"8px 16px",fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {loading?<Spinner color={T.bg} size={12}/>:"🤖"} {loading?"Scanning…":"Run AI Scan"}
            </button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {watchList.map((w,i)=>{
              const trig=w.condition==="above"?w.current>w.threshold:w.current<w.threshold;
              return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.bgRaised,borderRadius:7,border:`1px solid ${trig?T.amber+"40":T.border}`}}>
                <Dot color={trig?T.amber:T.green} pulse={trig}/>
                <div style={{flex:1}}><span style={{color:T.text,fontSize:12,fontWeight:600}}>{w.metric}</span><span style={{color:T.textDim,fontSize:11,marginLeft:8}}>{w.condition} {w.threshold}</span></div>
                <Mono style={{color:trig?T.amber:T.green,fontSize:13,fontWeight:700}}>{w.current}</Mono>
                {trig&&<Badge color={T.amber}>ALERT</Badge>}
              </div>;
            })}
          </div>
        </Card>
        <Card>
          <div style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Health Trend (14D)</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={Array.from({length:14},(_,i)=>({d:`D${i+1}`,h:Math.round(an.health-8+i*.6+Math.sin(i)*.5)}))}>
              <defs><linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={.3}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="d" tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis domain={[50,100]} tick={{fill:T.textDim,fontSize:9}} axisLine={false} tickLine={false}/>
              <ReferenceLine y={70} stroke={T.amber} strokeDasharray="3 3" strokeWidth={1}/>
              <Tooltip contentStyle={{background:T.bgRaised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}}/>
              <Area type="monotone" dataKey="h" stroke={T.green} strokeWidth={2} fill="url(#hGrad)" name="Health"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card style={{display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Alert Feed</span>
          {alerts.length>0&&<button onClick={()=>alerts.forEach(a=>onDismiss(a.id))} style={{background:T.bgRaised,border:`1px solid ${T.border}`,color:T.textDim,borderRadius:5,padding:"3px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Clear all</button>}
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,overflowY:"auto",maxHeight:430}}>
          {alerts.length===0?<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"40px 0"}}>
            <div style={{fontSize:32}}>🔔</div>
            <div style={{color:T.textDim,fontSize:13}}>No active alerts</div>
            <div style={{color:T.textDim,fontSize:11,textAlign:"center",maxWidth:220}}>Run an AI scan to monitor your portfolio for risks, rebalancing needs, and opportunities.</div>
          </div>:alerts.map(a=><div key={a.id} className="slide-in" style={{padding:"12px",background:T.bgRaised,borderRadius:8,border:`1px solid ${(sc[a.severity]||T.amber)+"25"}`,borderLeft:`3px solid ${sc[a.severity]||T.amber}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:14}}>{ti[a.type]||"•"}</span>
                <span style={{color:T.text,fontSize:13,fontWeight:700}}>{a.title}</span>
                <Badge color={sc[a.severity]||T.amber}>{a.severity}</Badge>
              </div>
              <button onClick={()=>onDismiss(a.id)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>×</button>
            </div>
            <p style={{color:T.textMuted,fontSize:12,lineHeight:1.65,marginBottom:6}}>{a.message}</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{color:sc[a.severity]||T.amber,fontSize:11,fontWeight:600}}>→ {a.action}</div>
              <Mono style={{color:T.textDim,fontSize:10}}>{a.ts}</Mono>
            </div>
          </div>)}
        </div>
      </Card>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   AI ADVISOR
═══════════════════════════════════════════════════════════════════ */
function AIAdvisor({an,portfolio}) {
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [diag,setDiag]=useState(null);
  const [rec,setRec]=useState(null);
  const [btnLoad,setBtnLoad]=useState(false);
  const endRef=useRef(null);
  const ctx=`Portfolio: ${portfolio.map(p=>`${p.name} ₹${(p.amount/100000).toFixed(1)}L`).join(", ")}. Health:${an.health}/100, Sharpe:${an.sharpe.toFixed(2)}, Vol:${an.wVol.toFixed(1)}%, Expense:${an.wER.toFixed(2)}%, Cap: Large ${(an.cap["Large Cap"]*100).toFixed(0)}% Mid ${(an.cap["Mid Cap"]*100).toFixed(0)}% Small ${(an.cap["Small Cap"]*100).toFixed(0)}%`;
  const genDiag=async()=>{setBtnLoad(true);setDiag(await ai("Senior mutual fund analyst for Indian markets. Be specific, actionable, educational. Under 220 words.",ctx+"\n\nDiagnose: key strengths, critical risks, hidden issues, 3 action items."));setBtnLoad(false);};
  const genRec=async()=>{setBtnLoad(true);setRec(await ai("Portfolio optimizer for Indian MF. Give specific fund names and %.",ctx+"\n\nOptimize: list REMOVE/KEEP/ADD with fund names, % allocation, and why. Then 2-sentence benefit summary."));setBtnLoad(false);};
  const send=async()=>{
    if(!input.trim()||loading)return;
    const q=input.trim();setInput("");
    setMsgs(m=>[...m,{role:"user",content:q}]);setLoading(true);
    const hist=msgs.slice(-4).map(m=>`${m.role==="user"?"Q":"A"}: ${m.content}`).join("\n");
    const ans=await ai("AI investment copilot for Indian MF investors. Reference portfolio. Be concise (2-4 sentences). Use ₹.",`${ctx}\n\n${hist}\n\nQ: ${q}`);
    setMsgs(m=>[...m,{role:"assistant",content:ans}]);setLoading(false);
    setTimeout(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };
  const inp={background:T.bgRaised,border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"};
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {[{label:"AI Portfolio Diagnosis",fn:genDiag,icon:"🔍",result:diag,bc:T.gold,bl:"Diagnose"},{label:"AI Optimization",fn:genRec,icon:"⚡",result:rec,bc:T.green,bl:"Optimize"}].map(panel=><Card key={panel.label} style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{panel.label}</span>
          <button onClick={panel.fn} disabled={btnLoad} style={{background:panel.bc,color:T.bg,border:"none",borderRadius:7,padding:"7px 14px",fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>{btnLoad?<Spinner color={T.bg} size={12}/>:panel.icon} {panel.bl}</button>
        </div>
        {panel.result?<div style={{color:T.text,fontSize:12,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{panel.result}</div>:<div style={{color:T.textDim,fontSize:12,textAlign:"center",padding:"24px 0"}}>Click "{panel.bl}" for AI-powered insights</div>}
      </Card>)}
    </div>
    <Card style={{display:"flex",flexDirection:"column",height:580}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{color:T.textMuted,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Investment Copilot</span><LiveBadge/></div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
        {msgs.length===0&&<div style={{display:"flex",flexDirection:"column",gap:6}}><div style={{color:T.textDim,fontSize:11,marginBottom:4}}>Try asking:</div>{["Is my portfolio too risky?","Which fund should I replace?","How to reduce expense ratio?","Am I over-diversified?"].map(q=><button key={q} onClick={()=>setInput(q)} style={{background:T.bgRaised,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:7,padding:"8px 12px",fontSize:12,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>{q}</button>)}</div>}
        {msgs.map((m,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
          <div style={{maxWidth:"88%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 0 12px":"0 12px 12px 12px",background:m.role==="user"?T.gold+"18":T.bgRaised,border:`1px solid ${m.role==="user"?T.gold+"35":T.border}`,color:T.text,fontSize:12,lineHeight:1.65}}>{m.content}</div>
        </div>)}
        {loading&&<div style={{display:"flex",gap:8,color:T.textDim,fontSize:12,alignItems:"center"}}><Spinner size={14}/>Thinking…</div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your portfolio…" style={{...inp,flex:1}}/>
        <button onClick={send} disabled={loading} style={{background:T.gold,color:T.bg,border:"none",borderRadius:8,padding:"10px 16px",fontWeight:800,cursor:"pointer",fontSize:16}}>→</button>
      </div>
    </Card>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const portfolio=DEFAULT_PORTFOLIO;
  const [navMap,setNavMap]=useState(()=>Object.fromEntries(Object.entries(FUNDS).map(([n,f])=>[n,f.nav])));
  const [an,setAn]=useState(()=>calcAnalytics(DEFAULT_PORTFOLIO));
  const [history,setHistory]=useState(null);
  const [alerts,setAlerts]=useState([]);
  const [cs,setCs]=useState(cStats);
  const [logs,setLogs]=useState([
    {time:"09:00:01",level:"success",msg:"AMFI NAV data ingested — 2341 records"},
    {time:"09:00:03",level:"success",msg:"NSE index data synced — 52 indices"},
    {time:"09:00:15",level:"info",   msg:"Cache populated — NAV TTL 300s"},
    {time:"09:05:01",level:"success",msg:"AMFI refresh — 2341 records updated"},
    {time:"09:10:02",level:"warn",   msg:"Value Research API slow — 5800ms latency"},
    {time:"09:15:01",level:"success",msg:"Scheduled sync complete"},
    {time:"09:20:00",level:"info",   msg:"AI monitoring scan triggered"},
  ]);

  useEffect(()=>{ const s=document.createElement("style"); s.textContent=GLOBAL_CSS; document.head.appendChild(s); return()=>document.head.removeChild(s); },[]);
  useEffect(()=>{ if(an&&!history) setHistory(genHistory(an.total)); },[an]);

  // Real-time NAV simulation
  useEffect(()=>{
    if(!user) return;
    const id=setInterval(()=>{
      setNavMap(prev=>{
        const next={};
        Object.entries(prev).forEach(([n,nav])=>{ next[n]=Math.max(nav*.85,+(nav+(Math.random()-.496)*nav*.003).toFixed(2)); });
        setAn(calcAnalytics(portfolio,next));
        cSet("nav_batch",next,"nav"); setCs(cStats());
        if(Math.random()<0.18){
          const t=new Date().toLocaleTimeString("en-IN",{hour12:false});
          setLogs(l=>[...l.slice(-49),{time:t,level:"success",msg:`NAV refresh — ${Object.keys(FUNDS).length} funds updated`}]);
        }
        return next;
      });
    },4000);
    return()=>clearInterval(id);
  },[user]);

  useEffect(()=>{
    if(!user||!an) return;
    const id=setInterval(()=>{
      const now=Date.now(), noise=(Math.random()-.495)*an.total*.004;
      setHistory(h=>[...(h||[]).slice(-89),{ts:now,date:new Date(now).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}),value:Math.round(an.total+noise),change:+(noise/an.total*100).toFixed(2)}]);
    },30000);
    return()=>clearInterval(id);
  },[user,an]);

  if(!user) return <AuthPage onLogin={u=>{ setUser(u); cSet("user_session",u,"fundDb"); setCs(cStats()); }}/>;

  const addAlert=a=>setAlerts(p=>[a,...p]);
  const dismissAlert=id=>setAlerts(p=>p.filter(a=>a.id!==id));
  const unread=alerts.length;

  const PAGES=[
    {id:"dashboard",icon:"⬡",label:"Dashboard"},
    {id:"tracking", icon:"◈",label:"Tracker"},
    {id:"advisor",  icon:"◎",label:"AI Advisor"},
    {id:"alerts",   icon:"⬟",label:"Alerts",badge:unread},
    {id:"pipeline", icon:"≡",label:"Pipeline"},
    {id:"cache",    icon:"⚡",label:"Cache"},
  ];

  const titles={dashboard:"Portfolio Dashboard",tracking:"Portfolio Tracker",advisor:"AI Advisor",alerts:"Monitoring & Alerts",pipeline:"Data Pipeline",cache:"Cache Monitor"};
  const subtitles={dashboard:`${portfolio.length} funds · ₹${(an.total/100000).toFixed(2)}L · Health ${an.health}/100`,tracking:"90-day performance vs Nifty 50",advisor:"Powered by Claude — your personal wealth analyst",alerts:`${alerts.length} active alerts · AI monitoring enabled`,pipeline:"Automated ingestion from AMFI, NSE, BSE APIs",cache:`${cs.size} entries · ${cs.hitRate}% hit rate · TTL active`};

  return <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
    <NavTicker navData={navMap}/>
    <header style={{background:T.bgCard,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:0,height:52,padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:28,flexShrink:0}}>
          <div style={{width:30,height:30,background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:`0 0 14px ${T.gold}45`,animation:"glow 3s ease infinite"}}>◈</div>
          <span style={{fontWeight:800,fontSize:15,letterSpacing:"-0.03em"}}>MF <span style={{color:T.gold}}>Copilot</span></span>
          <Badge color={T.cyan}>VENTURE</Badge>
        </div>
        <nav style={{display:"flex",gap:2,flex:1}}>
          {PAGES.map(item=><button key={item.id} onClick={()=>setPage(item.id)} className="nav-btn" style={{position:"relative",background:page===item.id?T.gold+"18":"transparent",color:page===item.id?T.gold:T.textMuted,border:`1px solid ${page===item.id?T.gold+"35":"transparent"}`,borderRadius:7,padding:"5px 14px",fontSize:12,fontWeight:page===item.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .15s",fontFamily:"inherit"}}>
            <span style={{fontSize:12}}>{item.icon}</span>{item.label}
            {item.badge>0&&<span style={{position:"absolute",top:4,right:5,background:T.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{item.badge>9?"9+":item.badge}</span>}
          </button>)}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:T.textDim}}>Portfolio</div>
            <Mono style={{fontSize:13,color:T.gold,fontWeight:700}}>₹{(an.total/100000).toFixed(2)}L</Mono>
          </div>
          <div style={{width:1,height:26,background:T.border}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:T.bg}}>{user.avatar}</div>
            <div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{user.name.split(" ")[0]}</div><Badge color={user.plan==="Pro"?T.gold:T.textDim}>{user.plan}</Badge></div>
            <button onClick={()=>setUser(null)} style={{background:T.bgRaised,border:`1px solid ${T.border}`,color:T.textDim,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit",marginLeft:4}}>Out</button>
          </div>
        </div>
      </div>
    </header>

    <div style={{maxWidth:1400,margin:"0 auto",padding:"20px 20px 0"}}>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h1 style={{fontSize:20,fontWeight:800,letterSpacing:"-0.03em",margin:0}}>{titles[page]}<span style={{color:T.gold}}>.</span></h1>
          {["tracking","dashboard"].includes(page)&&<LiveBadge/>}
        </div>
        <div style={{color:T.textDim,fontSize:12,marginTop:3}}>{subtitles[page]}</div>
      </div>

      {page==="dashboard" && <Dashboard an={an}/>}
      {page==="tracking"  && history && <PortfolioTracker an={an} history={history}/>}
      {page==="advisor"   && <AIAdvisor an={an} portfolio={portfolio}/>}
      {page==="alerts"    && <AlertsCenter alerts={alerts} an={an} portfolio={portfolio} onAdd={addAlert} onDismiss={dismissAlert}/>}
      {page==="pipeline"  && <DataPipeline logs={logs}/>}
      {page==="cache"     && <CacheMonitor stats={cs} onRefresh={()=>setCs(cStats())}/>}

      <div style={{height:32}}/>
    </div>
  </div>;
}
