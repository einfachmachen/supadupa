// Auto-generated module (siehe app-src.jsx)

import React, { createElement, useContext, useState } from "react";
import { AppCtx } from "../../state/AppContext.js";
import { theme as T } from "../../theme/activeTheme.js";
import { INP } from "../../theme/palette.js";
import { THEMES } from "../../theme/themes.js";
import { Li } from "../../utils/icons.jsx";

function DataManagerDialog({onClose}) {
  const { cats, groups, accounts, txs, setTxs, csvRules, startBalances,
    setStartBalances, setCats, setGroups, setAccounts, setCsvRules } = useContext(AppCtx);

  const MONTHS_G=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const today = new Date();
  const [tab, setTab] = useState("export"); // export | import | delete

  // Zeitraum
  const [fromY, setFromY] = useState(today.getFullYear()-1);
  const [fromM, setFromM] = useState(0);
  const [toY,   setToY]   = useState(today.getFullYear());
  const [toM,   setToM]   = useState(today.getMonth());

  // Export-Auswahl
  const [sel, setSel] = useState({
    cats:true, groups:true, accounts:true,
    realTxs:true, pendTxs:true, rules:true, anchors:true,
  });
  const toggleSel = k => setSel(p=>({...p,[k]:!p[k]}));

  // Import
  const [importJson, setImportJson] = useState("");
  const [importErr,  setImportErr]  = useState("");
  const [importOk,   setImportOk]   = useState("");

  // Delete confirm
  const [delConfirm, setDelConfirm] = useState(null); // null | key

  const fromIso = `${fromY}-${String(fromM+1).padStart(2,"0")}-01`;
  const toIso   = `${toY}-${String(toM+1).padStart(2,"0")}-31`;

  const filterTxs = (list) => list.filter(t=>{
    if(!t.date) return false;
    return t.date>=fromIso && t.date<=toIso;
  });

  // ── Export ──────────────────────────────────────────────────────────
  const buildExport = () => {
    const out = {exportedAt: new Date().toISOString(), _type:"mbt-partial"};
    if(sel.cats)    out.cats    = cats;
    if(sel.groups)  out.groups  = groups;
    if(sel.accounts)out.accounts= accounts;
    if(sel.realTxs) out.realTxs = filterTxs(txs.filter(t=>!t.pending));
    if(sel.pendTxs) out.pendTxs = filterTxs(txs.filter(t=>t.pending));
    if(sel.rules)   out.csvRules= csvRules;
    if(sel.anchors)  out.startBalances = startBalances;
    if(sel.themes) {
      try { out.customThemes = JSON.parse(localStorage.getItem("mbt_custom_themes")||"{}"); } catch{}
    }
    return out;
  };

  const doExport = () => {
    const data = buildExport();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`mbt-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyExport = () => {
    navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2));
  };

  // Zähler
  const cntReal  = filterTxs(txs.filter(t=>!t.pending)).length;
  const cntPend  = filterTxs(txs.filter(t=>t.pending)).length;
  const cntRules = Object.keys(csvRules||{}).length;
  const cntAnch  = Object.values(startBalances||{}).reduce((s,y)=>s+Object.keys(y||{}).filter(k=>!isNaN(k)).length,0);

  // ── Import ──────────────────────────────────────────────────────────
  const doImport = () => {
    setImportErr(""); setImportOk("");
    try {
      const d = JSON.parse(importJson);
      let msg = [];
      if(d.cats)    { setCats(d.cats);    msg.push(`${d.cats.length} Kategorien`); }
      if(d.groups)  { setGroups(d.groups);msg.push(`${d.groups.length} Gruppen`); }
      if(d.accounts){ setAccounts(d.accounts); msg.push(`${d.accounts.length} Konten`); }
      if(d.csvRules){ setCsvRules(d.csvRules); msg.push(`${Object.keys(d.csvRules).length} Zuordnungen`); }
      if(d.startBalances){ setStartBalances(d.startBalances); msg.push("Ankerpunkte"); }
      if(d.realTxs||d.pendTxs) {
        const toAdd = [...(d.realTxs||[]), ...(d.pendTxs||[])];
        setTxs(prev=>{
          const ids = new Set(prev.map(t=>t.id));
          return [...prev, ...toAdd.filter(t=>!ids.has(t.id))];
        });
        msg.push(`${toAdd.length} Buchungen`);
      }
      if(d.customThemes && typeof d.customThemes === "object") {
        const existing = JSON.parse(localStorage.getItem("mbt_custom_themes")||"{}");
        const merged = {...existing, ...d.customThemes};
        localStorage.setItem("mbt_custom_themes", JSON.stringify(merged));
        // inject into THEMES live
        Object.entries(d.customThemes).forEach(([k,v]) => { THEMES[k] = v; });
        msg.push(`${Object.keys(d.customThemes).length} Themes`);
      }
      setImportOk("✓ Importiert: "+msg.join(", "));
      setImportJson("");
    } catch(e) {
      setImportErr("Ungültiges JSON: "+e.message);
    }
  };

  // ── Löschen ─────────────────────────────────────────────────────────
  const DELETE_ITEMS = [
    {key:"realTxs", label:"echte Buchungen", icon:"check-circle",
     count: filterTxs(txs.filter(t=>!t.pending)).length,
     action:()=>setTxs(p=>p.filter(t=>t.pending||!(t.date>=fromIso&&t.date<=toIso)))},
    {key:"pendTxs", label:"Vormerkungen / Wiederkehrende", icon:"calendar",
     count: filterTxs(txs.filter(t=>t.pending)).length,
     action:()=>setTxs(p=>p.filter(t=>!t.pending||!(t.date>=fromIso&&t.date<=toIso)))},
    {key:"rules",   label:"Kategorie-Zuordnungen (alle)", icon:"bookmark",
     count: cntRules, action:()=>setCsvRules({})},
    {key:"anchors", label:"Kontostand-Ankerpunkte (alle)", icon:"landmark",
     count: cntAnch,  action:()=>setStartBalances({})},
    {key:"cats",    label:"Kategorien & Gruppen (alle)", icon:"tag",
     count: cats.length+groups.length,
     action:()=>{setCats([]);setGroups([]); }},
    {key:"themes",  label:"Eigene Farbthemes (alle)",     icon:"palette",
     count: Object.keys(JSON.parse(localStorage.getItem("mbt_custom_themes")||"{}")).length,
     action:()=>{
       const saved = JSON.parse(localStorage.getItem("mbt_custom_themes")||"{}");
       Object.keys(saved).forEach(k => { delete THEMES[k]; });
       localStorage.removeItem("mbt_custom_themes");
     }},
  ];

  const SEL_ITEMS = [
    {key:"cats",    label:"Kategorien & Gruppen",    icon:"tag",       count:cats.length+groups.length},
    {key:"themes",  label:"eigene Farbthemes",       icon:"palette",   count:Object.keys(JSON.parse(localStorage.getItem("mbt_custom_themes")||"{}")).length},
    {key:"accounts",label:"Konten",                  icon:"landmark",  count:accounts.length},
    {key:"realTxs", label:"echte Buchungen",          icon:"check-circle",count:cntReal, hasRange:true},
    {key:"pendTxs", label:"Vormerkungen & Wiederkehrende",icon:"calendar",count:cntPend, hasRange:true},
    {key:"rules",   label:"Kategorie-Zuordnungen",   icon:"bookmark",  count:cntRules},
    {key:"anchors", label:"Kontostand-Ankerpunkte",  icon:"landmark",  count:cntAnch},
  ];

  const RangeSelector = ()=>(
    <div style={{background:"rgba(0,0,0,0.15)",borderRadius:9,padding:"8px 10px",marginBottom:10}}>
      <div style={{color:T.txt2,fontSize:10,marginBottom:6,fontWeight:600}}>Zeitraum:</div>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <select value={fromM} onChange={e=>setFromM(Number(e.target.value))}
          style={{flex:1,minWidth:60,...INP,marginBottom:0,fontSize:11,padding:"4px 6px"}}>
          {MONTHS_G.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
        <input type="number" value={fromY} onChange={e=>setFromY(Number(e.target.value))}
          style={{width:64,...INP,marginBottom:0,fontSize:11,padding:"4px 6px",textAlign:"center"}}/>
        <span style={{color:T.txt2,fontSize:11}}>–</span>
        <select value={toM} onChange={e=>setToM(Number(e.target.value))}
          style={{flex:1,minWidth:60,...INP,marginBottom:0,fontSize:11,padding:"4px 6px"}}>
          {MONTHS_G.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
        <input type="number" value={toY} onChange={e=>setToY(Number(e.target.value))}
          style={{width:64,...INP,marginBottom:0,fontSize:11,padding:"4px 6px",textAlign:"center"}}/>
        <button onClick={()=>{setFromM(0);setFromY(today.getFullYear()-1);setToM(today.getMonth());setToY(today.getFullYear());}}
          style={{background:"rgba(255,255,255,0.07)",border:"none",color:T.txt2,borderRadius:6,
            padding:"4px 8px",fontSize:10,cursor:"pointer"}}>Reset</button>
      </div>
    </div>
  );

  return (
    <div onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",
        zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:T.surf,borderRadius:20,width:"100%",maxWidth:480,
          maxHeight:"85vh",display:"flex",flexDirection:"column",
          border:`1px solid ${T.bds}`,boxShadow:"0 8px 40px rgba(0,0,0,0.5)"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 16px 0",flexShrink:0}}>
          <div style={{width:34,height:34,borderRadius:10,background:"rgba(170,204,0,0.12)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {Li("database",17,T.pos)}
          </div>
          <div style={{flex:1}}>
            <div style={{color:T.txt,fontSize:15,fontWeight:700}}>Daten-Manager</div>
            <div style={{color:T.txt2,fontSize:10}}>Exportieren · Importieren · Löschen</div>
          </div>
          <button onClick={onClose}
            style={{background:"rgba(255,255,255,0.07)",border:"none",color:T.txt2,
              borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"10px 16px 0",flexShrink:0}}>
          {[["export","download","Exportieren",T.pos],
            ["import","upload","importieren",T.blue],
            ["delete","trash-2","Löschen",T.neg]].map(([v,ic,lb,col])=>(
            <button key={v} onClick={()=>setTab(v)}
              style={{flex:1,padding:"7px 4px",borderRadius:9,border:"none",cursor:"pointer",
                fontFamily:"inherit",fontSize:11,fontWeight:700,
                background:tab===v?col+"22":"rgba(255,255,255,0.05)",
                color:tab===v?col:T.txt2,
                borderBottom:tab===v?`2px solid ${col}`:"2px solid transparent"}}>
              {Li(ic,11,tab===v?col:T.txt2)} {lb}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 16px 24px"}}>

          {/* ── EXPORT ── */}
          {tab==="export"&&(<>
            <RangeSelector/>
            <div style={{color:T.txt2,fontSize:10,marginBottom:8}}>Bereiche auswählen:</div>
            {SEL_ITEMS.map(({key,label,icon,count,hasRange})=>(
              <div key={key} onClick={()=>toggleSel(key)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                  borderRadius:9,marginBottom:4,cursor:"pointer",
                  background:sel[key]?"rgba(170,204,0,0.08)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${sel[key]?T.pos:T.bd}`}}>
                <div style={{width:16,height:16,borderRadius:4,flexShrink:0,
                  background:sel[key]?T.pos:"rgba(255,255,255,0.1)",
                  border:`2px solid ${sel[key]?T.pos:T.bds}`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sel[key]&&Li("check",9,T.on_accent)}
                </div>
                {Li(icon,13,sel[key]?T.pos:T.txt2)}
                <span style={{flex:1,color:T.txt,fontSize:12}}>{label}</span>
                <span style={{color:T.txt2,fontSize:10,fontFamily:"monospace"}}>
                  {hasRange?`${count} im Zeitraum`:count}
                </span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={copyExport}
                style={{flex:1,padding:"10px",borderRadius:11,border:`1px solid ${T.pos}44`,
                  background:`${T.pos}08`,color:T.pos,fontSize:12,fontWeight:700,cursor:"pointer",
                  fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {Li("copy",13,T.pos)} Kopieren
              </button>
              <button onClick={doExport}
                style={{flex:2,padding:"10px",borderRadius:11,border:"none",
                  background:T.pos,color:T.on_accent,fontSize:13,fontWeight:700,cursor:"pointer",
                  fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {Li("download",14,T.on_accent)} Als JSON speichern
              </button>
            </div>
          </>)}

          {/* ── IMPORT ── */}
          {tab==="import"&&(<>
            <div style={{color:T.txt2,fontSize:11,marginBottom:10,lineHeight:1.6}}>
              JSON aus vorherigem Export einfügen. Bestehende Daten werden ergänzt (nicht überschrieben).
            </div>
            <textarea value={importJson} onChange={e=>setImportJson(e.target.value)}
              placeholder='{"cats":[...],"realTxs":[...],...}'
              style={{width:"100%",minHeight:140,background:"rgba(0,0,0,0.2)",
                border:`1px solid ${importErr?T.neg:T.bds}`,borderRadius:10,
                color:T.txt,fontSize:11,padding:"10px",fontFamily:"monospace",
                boxSizing:"border-box",outline:"none",resize:"vertical"}}/>
            {importErr&&<div style={{color:T.neg,fontSize:10,marginTop:4}}>{importErr}</div>}
            {importOk&&<div style={{color:T.pos,fontSize:11,marginTop:4,fontWeight:700}}>{importOk}</div>}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <label style={{flex:1,padding:"10px",borderRadius:11,border:`1px solid ${T.blue}44`,
                background:`${T.blue}08`,color:T.blue,fontSize:12,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,textAlign:"center"}}>
                {Li("folder-open",13,T.blue)} Datei wählen
                <input type="file" accept=".json" style={{display:"none"}}
                  onChange={e=>{
                    const f=e.target.files[0]; if(!f) return;
                    const r=new FileReader();
                    r.onload=ev=>setImportJson(ev.target.result);
                    r.readAsText(f);
                  }}/>
              </label>
              <button onClick={doImport} disabled={!importJson.trim()}
                style={{flex:2,padding:"10px",borderRadius:11,border:"none",
                  background:importJson.trim()?T.blue:T.disabled,
                  color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",
                  fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                  opacity:importJson.trim()?1:0.4}}>
                {Li("upload",14,"#fff")} Importieren
              </button>
            </div>
          </>)}

          {/* ── LÖSCHEN ── */}
          {tab==="delete"&&(<>
            <div style={{color:T.neg,fontSize:11,marginBottom:10,padding:"6px 10px",
              background:`${T.neg}10`,borderRadius:8,border:`1px solid ${T.neg}33`}}>
              {Li("alert-triangle",11,T.neg)} Achtung: Löschen kann nicht rückgängig gemacht werden!
            </div>
            <RangeSelector/>
            {DELETE_ITEMS.map(({key,label,icon,count,action})=>(
              <div key={key} style={{marginBottom:6}}>
                {delConfirm===key ? (
                  <div style={{padding:"10px",borderRadius:10,
                    background:`${T.neg}15`,border:`1px solid ${T.neg}44`}}>
                    <div style={{color:T.neg,fontSize:11,fontWeight:700,marginBottom:8}}>
                      Wirklich löschen: {label} ({count})?
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setDelConfirm(null)}
                        style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${T.bds}`,
                          background:"transparent",color:T.txt2,fontSize:12,cursor:"pointer"}}>
                        Abbrechen
                      </button>
                      <button onClick={()=>{action();setDelConfirm(null);}}
                        style={{flex:1,padding:"7px",borderRadius:8,border:"none",
                          background:T.neg,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        {Li("trash-2",12,"#fff")} Löschen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                    borderRadius:9,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.bd}`}}>
                    {Li(icon,14,T.txt2)}
                    <span style={{flex:1,color:T.txt,fontSize:12}}>{label}</span>
                    <span style={{color:T.txt2,fontSize:10,fontFamily:"monospace",marginRight:4}}>
                      {count}
                    </span>
                    <button onClick={()=>setDelConfirm(key)}
                      style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${T.neg}44`,
                        background:`${T.neg}10`,color:T.neg,fontSize:11,fontWeight:700,
                        cursor:"pointer",fontFamily:"inherit"}}>
                      {Li("trash-2",11,T.neg)} Löschen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>)}

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════

export { DataManagerDialog };
