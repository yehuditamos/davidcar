export type QuestionLike = { id:string; section:string; title:string; hint:string; options:[string,string,number][] };
export type Severity = "critical" | "medium" | "minor";

export type Finding = {
  id:string; title:string; answer:string; severity:Severity; severityScore:number;
  impact:string; priceImpact:string; costLow:number; costHigh:number; negotiation:string;
};

const COSTS:Record<string,[number,number]> = {
  brakes:[800,2500], tires:[300,3600], suspension:[1000,4000], engine:[3000,15000],
  gearbox:[3000,15000], body:[500,5000], electrical:[300,2000], documents:[0,0], general:[300,2000]
};

function family(q:QuestionLike) {
  if (["brakes"].includes(q.id)) return "brakes";
  if (["tires","tire_condition"].includes(q.id)) return "tires";
  if (["suspension","straight","steering"].includes(q.id)) return "suspension";
  if (["gearbox"].includes(q.id)) return "gearbox";
  if (q.section === "מנוע") return "engine";
  if (q.section === "מרכב") return "body";
  if (q.section === "חשמל") return "electrical";
  if (q.section === "מסמכים" || q.section === "עסקה") return "documents";
  return "general";
}

function effect(group:string, severity:Severity) {
  if (group === "documents") return severity === "critical" ? "עלול למנוע עסקה בטוחה עד לבירור מלא" : "דורש אימות לפני העברת כסף";
  if (severity === "critical") return "עלול לפגוע בבטיחות או באמינות הרכב ודורש בדיקה לפני רכישה";
  if (severity === "medium") return "צפוי לדרוש טיפול ולהשפיע על התחזוקה הקרובה";
  return "לא מונע שימוש רגיל, אך כדאי להביא בחשבון בתחזוקה";
}

export function buildReport(questions:QuestionLike[], answers:Record<string,string>) {
  const findings:Finding[] = [];
  for (const q of questions) {
    const option=q.options.find(o=>o[0]===answers[q.id]);
    if (!option || Number(option[2]) <= 0) continue;
    const risk=Number(option[2]);
    const severityScore=Math.max(1,Math.min(10,Math.ceil(risk/4)));
    const severity:Severity=severityScore>=8?"critical":severityScore>=4?"medium":"minor";
    const group=family(q);
    let [costLow,costHigh]=COSTS[group] || COSTS.general;
    if (group === "tires" && option[0] === "worn") [costLow,costHigh]=[300,1800];
    if (option[0] === "unknown" || option[0] === "pending") [costLow,costHigh]=[0,0];
    const priceImpact=costHigh ? `הפחתה אפשרית של ₪${costLow.toLocaleString("he-IL")}–₪${costHigh.toLocaleString("he-IL")}` : "אין לתמחר לפני אימות מקצועי";
    const negotiation=severity === "critical"
      ? `בבדיקה עלה: ${option[1]}. לפני שמתקדמים אבקש תיקון מלא או הפחתה שמשקפת את מלוא עלות הטיפול.`
      : severity === "medium"
        ? `נמצא ${option[1]}. זה תיקון צפוי, ולכן אבקש לגלם חלק משמעותי מהעלות במחיר.`
        : `יש גם ${option[1]}. זה לא פוסל את הרכב, אבל מצטרף להתאמת המחיר הכוללת.`;
    findings.push({id:q.id,title:q.title,answer:option[1],severity,severityScore,impact:effect(group,severity),priceImpact,costLow,costHigh,negotiation});
  }
  findings.sort((a,b)=>b.severityScore-a.severityScore || b.costHigh-a.costHigh);
  const costLow=findings.reduce((s,f)=>s+f.costLow,0);
  const costHigh=findings.reduce((s,f)=>s+f.costHigh,0);
  const average=Math.round((costLow+costHigh)/2/100)*100;
  const critical=findings.filter(f=>f.severity==="critical");
  const medium=findings.filter(f=>f.severity==="medium");
  const minor=findings.filter(f=>f.severity==="minor");
  const viability=critical.length>=2||costHigh>=15000?"נמוכה":critical.length||medium.length>=3||costHigh>=6000?"בינונית":"גבוהה";
  return {findings,groups:{critical,medium,minor},costLow,costHigh,average,viability};
}
