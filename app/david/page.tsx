"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type Option = [string,string,number];
type Question = {
  id:string; section:string; title:string; hint:string; options:Option[];
  sort_order:number; active:boolean;
};
type Stats = {days:number;summary:{event_name:string;count:number;people:number}[];daily:{day:string;people:number}[]};
type View = "home"|"edit"|"share"|"stats";

const appUrl = "https://davidcar.vercel.app";
const emptyQuestion = ():Question => ({
  id:"",section:"מסמכים",title:"",hint:"",
  options:[["answer_1","",0],["answer_2","",8],["answer_3","",18],["answer_4","לא בדקתי",10]],
  sort_order:999,active:true
});
const labels:Record<string,string> = {
  app_open:"נכנסו לאפליקציה",check_started:"התחילו בדיקה",
  vehicle_details_completed:"מילאו פרטי רכב",check_completed:"סיימו בדיקה",
  phone_consultation_clicked:"לחצו להתייעץ",report_shared:"שיתפו דוח",
  report_printed:"שמרו או הדפיסו",another_vehicle_started:"בדקו רכב נוסף"
};

export default function DavidAdmin() {
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);
  const [pin,setPin]=useState("");
  const [loginError,setLoginError]=useState("");
  const [view,setView]=useState<View>("home");
  const [questions,setQuestions]=useState<Question[]>([]);
  const [editing,setEditing]=useState<Question|null>(null);
  const [stats,setStats]=useState<Stats|null>(null);
  const [days,setDays]=useState(30);
  const [notice,setNotice]=useState("");

  async function loadQuestions() {
    const response=await fetch("/api/admin/questions",{cache:"no-store"});
    if(response.status===401){setAuthenticated(false);return;}
    if(response.ok){setQuestions(await response.json());setAuthenticated(true);}
  }
  useEffect(()=>{fetch("/api/admin/questions",{cache:"no-store"}).then(async response=>{if(response.status===401){setAuthenticated(false);return;}if(response.ok){setQuestions(await response.json());setAuthenticated(true);}})},[]);
  useEffect(()=>{if(view!=="stats"||!authenticated)return;fetch(`/api/admin/stats?days=${days}`,{cache:"no-store"}).then(async response=>{if(response.ok)setStats(await response.json())})},[view,days,authenticated]);

  async function login(e:React.FormEvent) {
    e.preventDefault(); setLoginError("");
    const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin})});
    if(!response.ok){setLoginError("הקוד לא נכון. נסו שוב.");return;}
    setPin(""); await loadQuestions();
  }
  async function saveQuestion(question:Question) {
    const response=await fetch("/api/admin/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...question,action:"save",id:question.id||undefined})});
    if(!response.ok){const data=await response.json();setNotice(data.error||"לא הצלחנו לשמור");return;}
    setEditing(null);setNotice("השאלה נשמרה ופורסמה באפליקציה");await loadQuestions();
  }
  async function toggle(id:string) {
    await fetch("/api/admin/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle",id})});
    await loadQuestions();
  }
  async function move(index:number,direction:-1|1) {
    const next=[...questions];const target=index+direction;
    if(target<0||target>=next.length)return;
    [next[index],next[target]]=[next[target],next[index]];
    setQuestions(next);
    await fetch("/api/admin/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reorder",ids:next.map(q=>q.id)})});
  }
  async function copyLink() {
    await navigator.clipboard.writeText(appUrl);setNotice("הקישור הועתק");
  }
  async function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent("רוצים לבדוק רכב יד שנייה לפני שקונים? "+appUrl)}`,"_blank");
  }
  async function logout() {
    await fetch("/api/admin/logout",{method:"POST"});setAuthenticated(false);setView("home");
  }

  const metric=(name:string)=>stats?.summary.find(x=>x.event_name===name)?.people||0;
  const completion=metric("check_started")?Math.round(metric("check_completed")/metric("check_started")*100):0;
  const maxDaily=Math.max(1,...(stats?.daily.map(d=>d.people)||[1]));

  if(authenticated===null)return <main className={styles.shell}><div className={styles.loader}>טוען את דף דוד...</div></main>;
  if(!authenticated)return <main className={styles.shell}><section className={styles.loginCard}>
    <div className={styles.car}>🚘</div><span className={styles.kicker}>אזור אישי</span>
    <h1>היי דוד</h1><p>הכניסה לדף המנהל מוגנת.</p>
    <form onSubmit={login}><label>קוד כניסה<input autoFocus value={pin} onChange={e=>setPin(e.target.value)} autoComplete="one-time-code"/></label>
      {loginError&&<p className={styles.error}>{loginError}</p>}<button>כניסה לדף המנהל</button></form>
  </section></main>;

  return <main className={styles.shell} dir="rtl">
    <header className={styles.header}><button className={styles.brand} onClick={()=>setView("home")}><span>🚘</span><div><b>הדשבורד של דוד</b><small>ניהול אפליקציית בדיקת הרכב</small></div></button><button className={styles.logout} onClick={logout}>יציאה</button></header>
    {notice&&<button className={styles.notice} onClick={()=>setNotice("")}>{notice} ×</button>}

    {view==="home"&&<section className={styles.home}>
      <div className={styles.welcome}><span>בוקר טוב דוד</span><h1>הכול בשליטה, במקום אחד.</h1><p>עריכה, שיתוף ומעקב אחרי האפליקציה.</p></div>
      <div className={styles.menu}>
        <button onClick={()=>setView("edit")}><i>01</i><span>✎</span><div><b>עריכת האפליקציה</b><small>הוספת שאלות, עריכה ושינוי סדר</small></div><em>←</em></button>
        <button onClick={()=>setView("share")}><i>02</i><span>↗</span><div><b>שיתוף בשלוף</b><small>העתקה או שליחה ישירה בוואטסאפ</small></div><em>←</em></button>
        <button onClick={()=>setView("stats")}><i>03</i><span>▥</span><div><b>נתוני שימוש</b><small>כניסות, השלמות ולחיצות להתייעצות</small></div><em>←</em></button>
      </div>
    </section>}

    {view!=="home"&&<button className={styles.back} onClick={()=>{setView("home");setEditing(null)}}>→ חזרה לדף הראשי</button>}

    {view==="edit"&&<section className={styles.panel}><div className={styles.panelTitle}><div><span>עריכת האפליקציה</span><h1>השאלות בבדיקה</h1><p>{questions.filter(q=>q.active).length} שאלות פעילות</p></div><button onClick={()=>setEditing(emptyQuestion())}>+ הוספת שאלה</button></div>
      {editing&&<QuestionForm question={editing} onCancel={()=>setEditing(null)} onSave={saveQuestion}/>}
      <div className={styles.questionList}>{questions.map((q,index)=><article className={!q.active?styles.inactive:""} key={q.id}>
        <div className={styles.order}><button disabled={index===0} onClick={()=>move(index,-1)}>↑</button><b>{String(index+1).padStart(2,"0")}</b><button disabled={index===questions.length-1} onClick={()=>move(index,1)}>↓</button></div>
        <div className={styles.questionText}><span>{q.section}</span><h3>{q.title}</h3><p>{q.hint}</p></div>
        <div className={styles.rowActions}><button onClick={()=>setEditing({...q,options:q.options.map(o=>[...o] as Option)})}>עריכה</button><button onClick={()=>toggle(q.id)}>{q.active?"הסתרה":"הפעלה"}</button></div>
      </article>)}</div>
    </section>}

    {view==="share"&&<section className={styles.panel}><div className={styles.shareCard}><span className={styles.bigIcon}>↗</span><span>הקישור הקבוע לאפליקציה</span><h1>תמיד בשלוף</h1><div className={styles.linkBox}><b>{appUrl}</b><button onClick={copyLink}>העתקה</button></div><button className={styles.whatsapp} onClick={shareWhatsApp}>שליחה בוואטסאפ</button><a href={appUrl} target="_blank">פתיחת האפליקציה לבדיקה ←</a></div></section>}

    {view==="stats"&&<section className={styles.panel}><div className={styles.panelTitle}><div><span>נתוני שימוש</span><h1>מה קורה באפליקציה?</h1><p>מידע אנונימי בלבד</p></div><select value={days} onChange={e=>setDays(Number(e.target.value))}><option value="7">7 ימים</option><option value="30">30 ימים</option><option value="90">90 ימים</option></select></div>
      <div className={styles.metrics}><Metric title="נכנסו" value={metric("app_open")}/><Metric title="התחילו" value={metric("check_started")}/><Metric title="סיימו" value={metric("check_completed")}/><Metric title="אחוז השלמה" value={completion} suffix="%"/><Metric title="לחצו להתייעץ" value={metric("phone_consultation_clicked")}/><Metric title="שיתפו דוח" value={metric("report_shared")}/></div>
      <article className={styles.chart}><h2>כניסות לפי יום</h2>{!stats?.daily.length?<p>הנתונים יתחילו להופיע מכניסת המשתמש הבא.</p>:<div className={styles.bars}>{stats.daily.map(d=><div key={d.day}><span style={{height:`${Math.max(8,d.people/maxDaily*100)}%`}}><b>{d.people}</b></span><small>{new Date(d.day).toLocaleDateString("he-IL",{day:"numeric",month:"numeric"})}</small></div>)}</div>}</article>
      <article className={styles.funnel}><h2>משפך השימוש</h2>{["app_open","check_started","vehicle_details_completed","check_completed","phone_consultation_clicked"].map((name,i)=><div key={name}><span>{i+1}</span><b>{labels[name]}</b><em>{metric(name)}</em></div>)}</article>
    </section>}
  </main>;
}

function Metric({title,value,suffix=""}:{title:string;value:number;suffix?:string}) {
  return <article><span>{title}</span><b>{value}{suffix}</b></article>;
}

function QuestionForm({question,onSave,onCancel}:{question:Question;onSave:(q:Question)=>void;onCancel:()=>void}) {
  const [draft,setDraft]=useState(question);
  const updateOption=(index:number,field:1|2,value:string)=>{
    const options=draft.options.map(o=>[...o] as Option);
    if(field===1)options[index][1]=value;else options[index][2]=Number(value);
    setDraft({...draft,options});
  };
  return <div className={styles.editor}><div className={styles.editorHead}><h2>{draft.id?"עריכת שאלה":"שאלה חדשה"}</h2><button onClick={onCancel}>×</button></div>
    <label>פרק<select value={draft.section} onChange={e=>setDraft({...draft,section:e.target.value})}>{["מסמכים","מרכב","מנוע","חשמל","בלמים","נסיעה","עסקה"].map(s=><option key={s}>{s}</option>)}</select></label>
    <label>השאלה<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="מה רוצים שהמשתמש יבדוק?"/></label>
    <label>הסבר פשוט<input value={draft.hint} onChange={e=>setDraft({...draft,hint:e.target.value})} placeholder="איך אדם שלא מבין ברכב יכול לבדוק?"/></label>
    <h3>ארבע תשובות וניקוד סיכון</h3>
    <div className={styles.optionEditor}>{draft.options.map((o,i)=><div key={i}><b>{i+1}</b><input value={o[1]} onChange={e=>updateOption(i,1,e.target.value)} placeholder="נוסח התשובה"/><label>סיכון<input type="number" min="0" max="50" value={o[2]} onChange={e=>updateOption(i,2,e.target.value)}/></label></div>)}</div>
    <div className={styles.editorActions}><button onClick={()=>onSave(draft)}>שמירה ופרסום</button><button onClick={onCancel}>ביטול</button></div>
  </div>;
}
