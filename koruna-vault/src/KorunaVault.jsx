import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const API_KEY = "e7059be3e521adac791355c4";
const DEFAULT_CZK_TO_INR = 3.78;

const CATEGORIES = [
  { id: "food",    label: "Food & Drink",    color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", icon: "🍜" },
  { id: "rent",    label: "Rent & Bills",    color: "#4ECDC4", bg: "rgba(78,205,196,0.12)",  icon: "🏠" },
  { id: "travel",  label: "Transport",       color: "#45B7D1", bg: "rgba(69,183,209,0.12)",  icon: "🚌" },
  { id: "shop",    label: "Shopping",        color: "#F7DC6F", bg: "rgba(247,220,111,0.12)", icon: "🛍️" },
  { id: "health",  label: "Health",          color: "#82E0AA", bg: "rgba(130,224,170,0.12)", icon: "💊" },
  { id: "entert",  label: "Entertainment",   color: "#BB8FCE", bg: "rgba(187,143,206,0.12)", icon: "🎮" },
  { id: "grocery", label: "Groceries",       color: "#F0B27A", bg: "rgba(240,178,122,0.12)", icon: "🛒" },
  { id: "other",   label: "Other",           color: "#85929E", bg: "rgba(133,146,158,0.12)", icon: "📦" },
];

const fmt = (n, d = 0) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const today = () => new Date().toISOString().slice(0, 10);

// Minimal GSAP-like animation using Web Animations API + custom spring
function useGSAP() {
  const animate = useCallback((el, from, to, opts = {}) => {
    if (!el) return;
    const { duration = 600, ease = "cubic-bezier(0.34,1.56,0.64,1)", delay = 0 } = opts;
    const keyframes = [
      Object.fromEntries(Object.entries(from)),
      Object.fromEntries(Object.entries(to)),
    ];
    el.animate(keyframes, { duration, easing: ease, delay, fill: "forwards" });
  }, []);
  return { animate };
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = target;
    const startTime = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const cur = start + (end - start) * e;
      setVal(cur);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else { prev.current = end; setVal(end); }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function AnimatedStat({ label, czk, showInr = true, color = "#e2c97e", size = "lg", czk_to_inr = DEFAULT_CZK_TO_INR }) {
  const animated = useCountUp(czk);
  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "0 0 3px", fontSize: size === "lg" ? 32 : 22, fontWeight: 700, color, fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>
        Kč {fmt(Math.round(animated))}
      </p>
      {showInr && (
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563", fontWeight: 400 }}>
          ≈ <span style={{ color: "#9ca3af" }}>₹ {fmt(Math.round(animated * czk_to_inr))}</span>
        </p>
      )}
    </div>
  );
}

function RingChart({ pct, color }) {
  const r = 52, cx = 60, cy = 60, stroke = 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.2,0.64,1)" }} />
    </svg>
  );
}

const VIEWS = ["overview", "add", "history"];

export default function KorunaVault() {
  const [view, setView] = useState(() => {
    const savedSalary = localStorage.getItem("korunaSalary");
    return savedSalary ? "app" : "setup";
  });
  const [salary, setSalary] = useState(() => localStorage.getItem("korunaSalary") || "");
  const [tempSalary, setTempSalary] = useState("");
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem("korunaExpenses");
    if (savedExpenses) {
      try {
        return JSON.parse(savedExpenses);
      } catch (e) {
        console.error("Failed to load expenses:", e);
        return [];
      }
    }
    return [];
  });
  const [form, setForm] = useState({ date: today(), description: "", category: "food", amount: "" });
  const [activeView, setActiveView] = useState("overview");
  const [toast, setToast] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [czk_to_inr, setCzk_to_inr] = useState(DEFAULT_CZK_TO_INR);
  const cardRefs = useRef([]);
  const { animate } = useGSAP();

  // Fetch live exchange rate from API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/CZK`);
        if (response.ok) {
          const data = await response.json();
          const rate = data.conversion_rates?.INR;
          if (rate) {
            setCzk_to_inr(rate);
          }
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
        // Fallback to default rate
        setCzk_to_inr(DEFAULT_CZK_TO_INR);
      }
    };
    fetchExchangeRate();
  }, []);

  // Save salary to localStorage whenever it changes
  useEffect(() => {
    if (salary) {
      localStorage.setItem("korunaSalary", salary);
    }
  }, [salary]);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem("korunaExpenses", JSON.stringify(expenses));
    }
  }, [expenses]);

  const salaryNum = parseFloat(salary) || 0;
  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const remaining = salaryNum - totalSpent;
  const spentPct = salaryNum > 0 ? (totalSpent / salaryNum) * 100 : 0;
  const remainPct = 100 - spentPct;

  const catTotals = CATEGORIES.map(c => ({
    ...c, total: expenses.filter(e => e.category === c.id).reduce((s, e) => s + parseFloat(e.amount), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSetSalary = () => {
    const v = parseFloat(tempSalary);
    if (!v || v <= 0) return;
    setSalary(tempSalary);
    setView("app");
    showToast("Salary set — let's track your Korunas!");
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
      localStorage.removeItem("korunaSalary");
      localStorage.removeItem("korunaExpenses");
      setSalary("");
      setExpenses([]);
      setView("setup");
      setTempSalary("");
      setActiveView("overview");
      setFilterCat("all");
      setForm({ date: today(), description: "", category: "food", amount: "" });
      showToast("All data cleared ✓");
    }
  };

  const handleAddExpense = () => {
    if (!form.amount || !form.description) { showToast("Fill all fields", "err"); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount", "err"); return; }
    const newExp = { ...form, id: Date.now(), amount: amt };
    setExpenses(p => [newExp, ...p]);
    setForm(f => ({ ...f, description: "", amount: "" }));
    showToast("Expense recorded ✓");
    setActiveView("overview");
  };

  const deleteExp = id => { setExpenses(p => p.filter(e => e.id !== id)); showToast("Removed"); };

  const getStatusColor = () => spentPct > 80 ? "#FF6B6B" : spentPct > 55 ? "#F7DC6F" : "#4ECDC4";
  const filtered = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);

  // Animate cards on mount / view switch
  useEffect(() => {
    cardRefs.current.forEach((el, i) => {
      if (el) animate(el,
        { opacity: "0", transform: "translateY(20px)" },
        { opacity: "1", transform: "translateY(0px)" },
        { duration: 500, delay: i * 80, ease: "cubic-bezier(0.22,1,0.36,1)" }
      );
    });
  }, [activeView, expenses.length, animate]);

  const catOf = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e5e7eb", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#111} ::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:4px}
        .glow-dot{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
        .glass{background:rgba(255,255,255,0.035);border:0.5px solid rgba(255,255,255,0.08);border-radius:20px;backdrop-filter:blur(12px)}
        .glass-sm{background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.06);border-radius:14px}
        .nav-btn{background:none;border:none;cursor:pointer;padding:8px 18px;border-radius:999px;font-size:13px;font-weight:500;color:#6b7280;transition:all 0.2s;letter-spacing:0.02em;font-family:'DM Sans',sans-serif;white-space:nowrap}
        .nav-btn.on{background:rgba(226,201,126,0.12);color:#e2c97e;border:0.5px solid rgba(226,201,126,0.2)}
        .nav-btn:hover:not(.on){color:#d1d5db;background:rgba(255,255,255,0.05)}
        .inp{width:100%;padding:13px 16px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.1);border-radius:12px;color:#e5e7eb;font-size:15px;font-family:'DM Sans',sans-serif;outline:none;transition:border 0.2s}
        .inp:focus{border-color:rgba(226,201,126,0.5)}
        .inp::placeholder{color:#374151}
        .inp option{background:#1a1a2e;color:#e5e7eb}
        .inp option:hover{background:#2d2d44}
        .btn-gold{background:linear-gradient(135deg,#e2c97e,#c9a84c);color:#0a0a0f;border:none;padding:13px 28px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;letter-spacing:0.01em}
        .btn-gold:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(226,201,126,0.3)}
        .btn-gold:active{transform:scale(0.98)}
        .exp-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:0.5px solid rgba(255,255,255,0.05);transition:background 0.15s;border-radius:8px;paddingLeft:8px;paddingRight:8px}
        .exp-row:hover{background:rgba(255,255,255,0.02)}
        .del-btn{background:none;border:none;cursor:pointer;color:#374151;font-size:15px;padding:4px 8px;border-radius:6px;transition:all 0.15s;font-family:sans-serif}
        .del-btn:hover{background:rgba(255,107,107,0.12);color:#FF6B6B}
        .chip{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:500}
        .prog-track{height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:6px}
        .prog-fill{height:100%;border-radius:999px;transition:width 0.9s cubic-bezier(0.34,1.2,0.64,1)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both}
        select.inp{appearance:none;cursor:pointer}
      `}</style>

      {/* Ambient glow blobs */}
      <div className="glow-dot" style={{width:400,height:400,background:"rgba(226,201,126,0.06)",top:-100,right:-100}} />
      <div className="glow-dot" style={{width:300,height:300,background:"rgba(78,205,196,0.04)",bottom:100,left:-80}} />

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,right:20,zIndex:999,padding:"12px 20px",borderRadius:12,background: toast.type==="err"?"rgba(255,107,107,0.15)":"rgba(78,205,196,0.12)",border:`0.5px solid ${toast.type==="err"?"rgba(255,107,107,0.3)":"rgba(78,205,196,0.25)"}`,color:toast.type==="err"?"#FF6B6B":"#4ECDC4",fontSize:14,fontWeight:500,animation:"toastIn 0.3s ease both",backdropFilter:"blur(12px)"}}>
          {toast.msg}
        </div>
      )}

      <div style={{maxWidth:680,margin:"0 auto",padding:"28px 16px",position:"relative",zIndex:1}}>

        {/* ── SETUP SCREEN ── */}
        {view === "setup" && (
          <div className="fade-up" style={{minHeight:"90vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{fontSize:48,marginBottom:16}}>💎</div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,background:"linear-gradient(135deg,#e2c97e,#f5e6b2,#c9a84c)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8,lineHeight:1.1}}>
                Koruna Vault
              </h1>
              <p style={{color:"#6b7280",fontSize:15}}>Your CZK → INR money command center</p>
            </div>

            <div className="glass" style={{width:"100%",maxWidth:400,padding:"32px 28px"}}>
              <p style={{fontSize:13,color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500,marginBottom:20}}>Monthly Salary in Czech Koruna</p>
              <div style={{position:"relative",marginBottom:12}}>
                <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontWeight:600,fontSize:15}}>Kč</span>
                <input className="inp" type="number" placeholder="e.g. 30 000" value={tempSalary}
                  onChange={e=>setTempSalary(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetSalary()}
                  style={{paddingLeft:40,fontSize:20,fontWeight:500}} />
              </div>
              {parseFloat(tempSalary) > 0 && (
                <div style={{padding:"10px 14px",background:"rgba(226,201,126,0.07)",borderRadius:10,marginBottom:20,border:"0.5px solid rgba(226,201,126,0.15)"}}>
                  <p style={{fontSize:13,color:"#9ca3af",margin:"0 0 2px"}}>Equivalent in Indian Rupees</p>
                  <p style={{fontSize:22,fontWeight:700,color:"#e2c97e",fontFamily:"'Syne',sans-serif"}}>
                    ₹ {fmt(Math.round(parseFloat(tempSalary)*czk_to_inr))}
                  </p>
                </div>
              )}
              <button className="btn-gold" onClick={handleSetSalary} style={{width:"100%"}}>Enter Vault →</button>
            </div>

            <p style={{marginTop:20,fontSize:12,color:"#374151"}}>1 CZK = ₹{czk_to_inr.toFixed(2)} · Rate may vary</p>
          </div>
        )}

        {/* ── MAIN APP ── */}
        {view === "app" && (
          <>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,background:"linear-gradient(135deg,#e2c97e,#c9a84c)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>
                  Koruna Vault
                </h1>
                <p style={{fontSize:12,color:"#4b5563",marginTop:2}}>CZK → INR Tracker</p>
              </div>
              <button onClick={()=>{localStorage.removeItem("korunaSalary");localStorage.removeItem("korunaExpenses");setView("setup");setSalary("");setExpenses([]);setTempSalary("");}} style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"7px 14px",color:"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}} onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"}} onMouseLeave={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.04)"}}>
                ← Back
              </button>
            </div>

            {/* Nav */}
            <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.025)",borderRadius:999,padding:4,marginBottom:24,overflowX:"auto",border:"0.5px solid rgba(255,255,255,0.06)"}}>
              {[["overview","Overview"],["add","+ Add"],["history","History"]].map(([k,l])=>(                <button key={k} className={`nav-btn ${activeView===k?"on":""}`} onClick={()=>setActiveView(k)}>{l}</button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {activeView==="overview" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* Hero balance card */}
                <div ref={el=>cardRefs.current[0]=el} className="glass" style={{padding:"28px 24px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-20,top:-20,opacity:0.4}}>
                    <RingChart pct={remainPct} color={getStatusColor()} />
                  </div>
                  <p style={{fontSize:11,letterSpacing:"0.12em",color:"#6b7280",textTransform:"uppercase",fontWeight:500,marginBottom:16}}>Monthly Budget</p>
                  <AnimatedStat label="Salary" czk={salaryNum} color="#e2c97e" czk_to_inr={czk_to_inr} />
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
                    <div style={{padding:"14px 16px",background:"rgba(255,107,107,0.08)",borderRadius:12,border:"0.5px solid rgba(255,107,107,0.15)"}}>
                      <p style={{fontSize:11,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Spent</p>
                      <p style={{fontSize:20,fontWeight:700,color:"#FF6B6B",fontFamily:"'Syne',sans-serif"}}>Kč {fmt(Math.round(totalSpent))}</p>
                      <p style={{fontSize:12,color:"rgba(255,107,107,0.6)",marginTop:2}}>≈ ₹ {fmt(Math.round(totalSpent*czk_to_inr))}</p>
                    </div>
                    <div style={{padding:"14px 16px",background:`rgba(${getStatusColor()==="#4ECDC4"?"78,205,196":getStatusColor()==="#F7DC6F"?"247,220,111":"255,107,107"},0.08)`,borderRadius:12,border:`0.5px solid rgba(${getStatusColor()==="#4ECDC4"?"78,205,196":getStatusColor()==="#F7DC6F"?"247,220,111":"255,107,107"},0.15)`}}>
                      <p style={{fontSize:11,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Remaining</p>
                      <p style={{fontSize:20,fontWeight:700,color:getStatusColor(),fontFamily:"'Syne',sans-serif"}}>Kč {fmt(Math.round(remaining))}</p>
                      <p style={{fontSize:12,color:`${getStatusColor()}99`,marginTop:2}}>≈ ₹ {fmt(Math.round(remaining*czk_to_inr))}</p>
                    </div>
                  </div>
                  <div style={{marginTop:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:12,color:"#4b5563"}}>Budget used</span>
                      <span style={{fontSize:12,fontWeight:600,color:getStatusColor()}}>{spentPct.toFixed(1)}%</span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{width:`${Math.min(spentPct,100)}%`,background:getStatusColor()}} />
                    </div>
                  </div>
                </div>

                <button className="btn-gold" onClick={()=>setActiveView("add")} style={{width:"100%",padding:15,fontSize:15}}>+ Add Expense</button>

                {/* Category bars */}
                {catTotals.length > 0 && (
                  <div ref={el=>cardRefs.current[1]=el} className="glass" style={{padding:"20px 24px"}}>
                    <p style={{fontSize:11,letterSpacing:"0.12em",color:"#6b7280",textTransform:"uppercase",fontWeight:500,marginBottom:18}}>By Category</p>
                    {catTotals.slice(0,5).map((cat,i)=>(
                      <div key={cat.id} style={{marginBottom:14}} ref={el=>cardRefs.current[i+2]=el}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16}}>{cat.icon}</span>
                            <span style={{fontSize:13,fontWeight:500,color:"#d1d5db"}}>{cat.label}</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <span style={{fontSize:13,fontWeight:600,color:cat.color}}>Kč {fmt(Math.round(cat.total))}</span>
                            <span style={{fontSize:11,color:"#4b5563",marginLeft:6}}>≈ ₹{fmt(Math.round(cat.total*czk_to_inr))}</span>
                          </div>
                        </div>
                        <div className="prog-track">
                          <div className="prog-fill" style={{width:`${salaryNum>0?(cat.total/salaryNum)*100:0}%`,background:cat.color}} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent */}
                {expenses.length > 0 ? (
                  <div ref={el=>cardRefs.current[8]=el} className="glass" style={{padding:"20px 24px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <p style={{fontSize:11,letterSpacing:"0.12em",color:"#6b7280",textTransform:"uppercase",fontWeight:500}}>Recent</p>
                      <button onClick={()=>setActiveView("history")} style={{background:"none",border:"none",color:"#e2c97e",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View all →</button>
                    </div>
                    {expenses.slice(0,4).map(e=>{
                      const cat=catOf(e.category);
                      return (
                        <div key={e.id} className="exp-row">
                          <div style={{width:38,height:38,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:14,fontWeight:500,color:"#e5e7eb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.description}</p>
                            <p style={{fontSize:11,color:"#4b5563",marginTop:1}}>{e.date} · {cat.label}</p>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <p style={{fontSize:14,fontWeight:600,color:"#FF6B6B"}}>Kč {fmt(e.amount,2)}</p>
                            <p style={{fontSize:11,color:"#374151"}}>₹ {fmt(Math.round(e.amount*czk_to_inr))}</p>
                          </div>
                          <button className="del-btn" onClick={()=>deleteExp(e.id)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div ref={el=>cardRefs.current[8]=el} className="glass" style={{padding:"40px 24px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12}}>🪙</div>
                    <p style={{color:"#4b5563",marginBottom:16}}>No expenses yet</p>
                    <button className="btn-gold" onClick={()=>setActiveView("add")}>+ Add First Expense</button>
                  </div>
                )}
              </div>
            )}

            {/* ── ADD EXPENSE ── */}
            {activeView==="add" && (
              <div ref={el=>cardRefs.current[0]=el} className="glass fade-up" style={{padding:"28px 24px",maxWidth:440,margin:"0 auto"}}>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,marginBottom:24,color:"#e2c97e"}}>New Expense</h2>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div>
                    <label style={{fontSize:12,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8}}>Date</label>
                    <input className="inp" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{fontSize:12,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8}}>Description</label>
                    <input className="inp" type="text" placeholder="e.g. Dinner at KFC" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{fontSize:12,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8}}>Category</label>
                    <select className="inp" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:12,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8}}>Amount (CZK)</label>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontWeight:600}}>Kč</span>
                      <input className="inp" type="number" placeholder="0.00" value={form.amount}
                        onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                        onKeyDown={e=>e.key==="Enter"&&handleAddExpense()}
                        style={{paddingLeft:40,fontSize:18,fontWeight:500}} />
                    </div>
                    {parseFloat(form.amount) > 0 && (
                      <div style={{marginTop:8,padding:"8px 12px",background:"rgba(226,201,126,0.06)",borderRadius:8,border:"0.5px solid rgba(226,201,126,0.12)"}}>
                        <span style={{fontSize:13,color:"#e2c97e"}}>≈ ₹ {fmt(Math.round(parseFloat(form.amount)*czk_to_inr))} INR</span>
                      </div>
                    )}
                  </div>
                  <button className="btn-gold" onClick={handleAddExpense} style={{marginTop:4,padding:15}}>Record Expense</button>
                </div>
              </div>
            )}

            {/* ── HISTORY ── */}
            {activeView==="history" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div ref={el=>cardRefs.current[0]=el} className="glass" style={{padding:"16px 20px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#6b7280",marginRight:4}}>Filter:</span>
                  {[{id:"all",label:"All",icon:"✦"},...CATEGORIES].map(c=>(
                    <button key={c.id} onClick={()=>setFilterCat(c.id)}
                      style={{background:filterCat===c.id?"rgba(226,201,126,0.1)":"rgba(255,255,255,0.03)",border:`0.5px solid ${filterCat===c.id?"rgba(226,201,126,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:999,padding:"5px 12px",color:filterCat===c.id?"#e2c97e":"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                      {c.icon} {c.label||"All"}
                    </button>
                  ))}
                </div>

                <div ref={el=>cardRefs.current[1]=el} className="glass" style={{padding:"20px 24px"}}>
                  {filtered.length === 0 ? (
                    <p style={{textAlign:"center",color:"#4b5563",padding:"32px 0"}}>No expenses found</p>
                  ) : filtered.map((e,i)=>{
                    const cat=catOf(e.category);
                    return (
                      <div key={e.id} className="exp-row" ref={el=>cardRefs.current[i+2]=el}>
                        <div style={{width:38,height:38,borderRadius:10,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:14,fontWeight:500,color:"#e5e7eb"}}>{e.description}</p>
                          <p style={{fontSize:11,color:"#4b5563",marginTop:1}}>{e.date}</p>
                        </div>
                        <span className="chip" style={{background:cat.bg,color:cat.color,fontSize:11,display:"none"}}>{cat.label}</span>
                        <div style={{textAlign:"right",marginRight:4}}>
                          <p style={{fontSize:14,fontWeight:600,color:"#FF6B6B"}}>Kč {fmt(e.amount,2)}</p>
                          <p style={{fontSize:11,color:"#374151"}}>₹ {fmt(Math.round(e.amount*czk_to_inr))}</p>
                        </div>
                        <button className="del-btn" onClick={()=>deleteExp(e.id)}>✕</button>
                      </div>
                    );
                  })}
                  {filtered.length > 0 && (
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:16,borderTop:"0.5px solid rgba(255,255,255,0.05)"}}>
                      <span style={{fontSize:13,color:"#6b7280",fontWeight:500}}>Total · {filtered.length} entries</span>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:16,fontWeight:700,color:"#FF6B6B",fontFamily:"'Syne',sans-serif"}}>Kč {fmt(Math.round(filtered.reduce((s,e)=>s+parseFloat(e.amount),0)))}</p>
                        <p style={{fontSize:12,color:"#374151"}}>≈ ₹ {fmt(Math.round(filtered.reduce((s,e)=>s+parseFloat(e.amount),0)*czk_to_inr))}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            <p style={{textAlign:"center",fontSize:11,color:"#1f2937",marginTop:28}}>1 CZK = ₹{czk_to_inr.toFixed(2)} · Data stays in browser only</p>
            <button 
              onClick={(e)=>{e.preventDefault();handleClearAllData()}} 
              style={{marginTop:12,width:"100%",padding:"10px 16px",background:"rgba(255,107,107,0.15)",border:"0.5px solid rgba(255,107,107,0.4)",borderRadius:10,color:"#FF6B6B",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}} 
              onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,107,107,0.25)"}} 
              onMouseLeave={(e)=>{e.currentTarget.style.background="rgba(255,107,107,0.15)"}}>
              🗑 Clear All Data
            </button>
          </>
        )}
      </div>
    </div>
  );
}
