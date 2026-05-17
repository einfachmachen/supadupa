// Auto-generated module (siehe app-src.jsx)

import { theme as T } from "../theme/activeTheme.js";

function extractVendor(desc) {
  return (desc||"").replace(/\{[^}]{0,300}\}/g,"").trim()
    .split("·")[0].split("–")[0].split(" · ")[0].trim().toLowerCase().slice(0,40);
}

// Hilfsfunktion: Top-Kategorien für einen Händler aus Buchungshistorie

function getVendorSuggestions(vendor, txs, cats, getSub, getCat, limit=3) {
  if(!vendor || vendor.length < 2) return [];
  const counts = {};
  txs.forEach(t => {
    if(t.pending) return;
    const tVendor = extractVendor(t.desc);
    if(!tVendor.includes(vendor) && !vendor.includes(tVendor)) return;
    (t.splits||[]).forEach(sp => {
      if(!sp.catId) return;
      const key = sp.catId + "|" + (sp.subId||"");
      counts[key] = (counts[key]||0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, limit)
    .map(([key, count]) => {
      const [catId, subId] = key.split("|");
      const cat = getCat(catId);
      const sub = getSub(catId, subId);
      return {catId, subId, count, catName: cat?.name||"?", subName: sub?.name||"", color: cat?.color||T.blue, icon: cat?.icon||"tag"};
    });
}

function txFingerprint(date, amount, desc, accountId) {
  const base = `${date}|${Math.round(Math.abs(parseFloat(amount||0)*100))}|${(desc||"").trim().toLowerCase().slice(0,80)}`;
  return accountId ? `${base}|${accountId}` : base;
}

// Datum DD.MM.YY oder DD.MM.YYYY → ISO

export { extractVendor, getVendorSuggestions, txFingerprint };
