"use client";

import { useMemo, useState } from "react";

type Answers = Record<string, string>;

const questions = [
  { id: "seller", title: "מי מוכר את הרכב?", hint: "הסיפור שמאחורי הרכב חשוב כמעט כמו הרכב עצמו", options: [["private","אדם פרטי, הרכב רשום על שמו",0],["family","אדם פרטי, אבל הרכב רשום על בן משפחה",12],["dealer","סוחר או מגרש רכבים",16],["unclear","לא ברור לי מי המוכר",25]] },
  { id: "ownership", title: "כמה בעלים היו לרכב?", hint: "בדקו ברישיון את מספר הבעלים הקודמים ואת סוג הבעלות", options: [["first","יד ראשונה פרטית",0],["second","יד שנייה פרטית",3],["many","שלוש ידיים ומעלה",10],["lease","ליסינג, השכרה או חברה",14]] },
  { id: "mileage", title: "הקילומטראז׳ הגיוני?", hint: "הממוצע בישראל הוא בערך 15–20 אלף ק״מ בשנה", options: [["normal","כן, תואם לגיל הרכב",0],["high","גבוה מהממוצע",8],["low","נמוך באופן חריג ואין הוכחות",14],["unknown","לא יודע/ת או שיש סתירות",22]] },
  { id: "service", title: "יש היסטוריית טיפולים מתועדת?", hint: "בקשו חשבוניות או תיעוד ממוסך — לא להסתפק ב׳טופל בזמן׳", options: [["full","כן, תיעוד מלא ורציף",0],["partial","יש תיעוד חלקי",7],["verbal","רק הבטחה בעל פה",16],["none","אין שום תיעוד",24]] },
  { id: "accident", title: "מה ידוע על תאונות ותיקוני פח?", hint: "תיקון קוסמטי הוא לא שלדה — אבל הסתרה היא תמיד דגל אדום", options: [["none","ללא תאונות, ויש תיעוד",0],["cosmetic","תיקוני צבע או פח קלים",5],["accident","הייתה תאונה, לא ברור מה היקפה",18],["chassis","פגיעת שלדה או קצה שלדה",40]] },
  { id: "engine", title: "איך המנוע מתנהג בהתנעה קרה?", hint: "בקשו מהמוכר לא לחמם את הרכב לפני שאתם מגיעים", options: [["smooth","מניע מיד, יציב ושקט",0],["noise","רעש, רעידות או עשן לרגע",12],["warning","נורת מנוע או עשן מתמשך",30],["warm","הרכב כבר היה חם כשהגעתי",15]] },
  { id: "fluids", title: "ראיתם נזילות או סימני התחממות?", hint: "הסתכלו מתחת לרכב ובמיכלי הנוזלים — רק כשהמנוע קר", options: [["clean","יבש ונקי, אין ריח חריג",0],["sweat","הזעה קלה באזור המנוע",6],["leak","טיפות, כתמים או חוסר בנוזלים",22],["heat","סימני התחממות או ערבוב שמן ומים",40]] },
  { id: "drive", title: "איך הרכב מרגיש בנסיעת מבחן?", hint: "בדקו האצה, בלימה, פניות, כביש משובש ונסיעה איטית", options: [["good","נוסע ישר, חלק ושקט",0],["minor","רעש קטן או משיכה קלה",8],["gear","מכות בגיר, רעידות או קושי בהעברה",28],["unsafe","בלימה חלשה, הגה לא יציב או רעש חזק",36]] },
  { id: "dashboard", title: "מה מצב נורות האזהרה והמערכות?", hint: "בסוויץ׳ הנורות צריכות להידלק, ובהנעה להיכבות", options: [["clear","הכול תקין וכל המערכות עובדות",0],["minor","תקלה קטנה במזגן או בחשמל",6],["warning","נורת אזהרה נשארת דולקת",22],["tamper","נורה לא נדלקת בכלל או נראה שטופלה",30]] },
  { id: "documents", title: "המסמכים והסיפור מסתדרים?", hint: "שם המוכר, רישיון, מספר שלדה, טסט ושעבודים חייבים להתאים", options: [["match","הכול תואם ונבדק",0],["pending","עוד לא בדקתי שעבודים ועיקולים",12],["mismatch","יש פרט שלא תואם",28],["pressure","המוכר לוחץ לסגור לפני בדיקה",32]] },
] as const;

function riskCopy(score:number) {
  if (score <= 18) return { verdict:"שווה להתקדם לבדיקה", label:"סיכון נמוך", color:"good", text:"לא עלו כרגע סימנים חריגים, אבל לפני קנייה ממשיכים לבדיקה מקצועית מלאה." };
  if (score <= 42) return { verdict:"מתקדמים בזהירות", label:"סיכון בינוני", color:"warn", text:"יש כמה נקודות שדורשות אימות ותמחור. לא סוגרים לפני בדיקה וקבלת תשובות ברורות." };
  if (score <= 66) return { verdict:"רק עם מומחה ותנאים חזקים", label:"סיכון גבוה", color:"danger", text:"הצטברו דגלים אדומים משמעותיים. אם ממשיכים — רק במחיר שמגלם את הסיכון ולאחר בדיקה קפדנית." };
  return { verdict:"דוד אומר: לוותר", label:"סיכון חריג", color:"danger", text:"יותר מדי סימני אזהרה. יש מספיק רכבים בשוק — לא צריך להתאהב דווקא בחתול שבשק." };
}

export default function Home() {
  const [started,setStarted] = useState(false);
  const [step,setStep] = useState(0);
  const [answers,setAnswers] = useState<Answers>({});
  const [car,setCar] = useState({make:"",model:"",year:"",km:"",price:""});
  const [detailsSubmitted,setDetailsSubmitted] = useState(false);
  const [done,setDone] = useState(false);
  const [showExit,setShowExit] = useState(false);
  const rawRisk = useMemo(() => questions.reduce((sum,q) => {
    const picked = q.options.find(o=>o[0]===answers[q.id]); return sum + (picked ? Number(picked[2]) : 0);
  },0),[answers]);
  const score = Math.max(0,100-Math.round(rawRisk/2.45));
  const result = riskCopy(100-score);
  const flags = questions.flatMap(q => { const o=q.options.find(x=>x[0]===answers[q.id]); return o && Number(o[2])>=14 ? [o[1]] : []; });
  const choose=(id:string,value:string)=>{ setAnswers(a=>({...a,[id]:value})); setTimeout(()=>{ if(step<questions.length-1) setStep(s=>s+1); else setDone(true); },180); };

  if(!started) return <main className="landing" dir="rtl">
    <header className="topbar"><div className="brand"><span className="brandmark" role="img" aria-label="רכב">🚘</span><div><b>המומחה של דוד</b><small>לא קונים חתול בשק</small></div></div><span className="tag">בדיקה חכמה לרכב יד שנייה</span></header>
    <section className="hero">
      <div className="heroCopy">
        <span className="eyebrow">לפני שמעבירים מקדמה</span>
        <h1><span>הרכב נראה מציאה.</span><em>בואו נבדוק מה הוא מסתיר.</em></h1>
        <p><span>בדיקה חכמה וקפדנית לפני קניית רכב יד שנייה.</span><span>בתוך כחמש דקות תקבלו ציון, דגלים אדומים ופסק דין ברור.</span></p>
        <div className="heroActions"><button className="primary" onClick={()=>setStarted(true)}>מתחילים בדיקה <span>←</span></button><span className="time">כחמש דקות ⏱</span></div>
      </div>
      <div className="gaugeCard"><div className="carIcon">🚘</div><div className="gauge"><div className="gaugeInner"><b>?</b><span>ציון הרכב</span></div></div><div className="checks"><p>מה נבדוק?</p><ul><li><span>✓</span> היסטוריית טיפולים</li><li><span>✓</span> תאונות ושלדה</li><li><span>✓</span> נסיעת מבחן</li></ul></div></div>
    </section>
    <section className="trust"><div><b>01</b><span>מכניסים פרטים</span></div><i>←</i><div><b>02</b><span>בודקים כמו מקצוענים</span></div><i>←</i><div><b>03</b><span>מקבלים פסק דין</span></div></section>
    <footer><b>חשוב לדעת:</b> הכלי מסייע בסינון ובהכנה ואינו מחליף בדיקה במכון מורשה, בדיקת מסמכים או ייעוץ מקצועי.</footer>
  </main>;

  if(!detailsSubmitted) return <main className="app" dir="rtl"><div className="appTop"><button className="logoBtn" aria-label="חזרה למסך הפתיחה" onClick={()=>setStarted(false)}>🚘</button><div className="progress"><span>פרטי הרכב</span><div><i style={{width:"8%"}}/></div></div></div><section className="formCard"><span className="stepNum">שלב ראשון</span><h2>איזה רכב מצאתם?</h2><p>נתחיל בפרטים היבשים. אחר כך נצלול למה שבאמת חשוב.</p><div className="fields"><label>יצרן<input value={car.make} onChange={e=>setCar({...car,make:e.target.value})} placeholder="לדוגמה: טויוטה"/></label><label>דגם<input value={car.model} onChange={e=>setCar({...car,model:e.target.value})} placeholder="לדוגמה: קורולה"/></label><label>שנת ייצור<input inputMode="numeric" value={car.year} onChange={e=>setCar({...car,year:e.target.value})} placeholder="2020"/></label><label>קילומטראז׳<input inputMode="numeric" value={car.km} onChange={e=>setCar({...car,km:e.target.value})} placeholder="85,000"/></label><label className="wide">מחיר מבוקש ₪<input inputMode="numeric" value={car.price} onChange={e=>setCar({...car,price:e.target.value})} placeholder="72,000"/></label></div><button className="primary full" disabled={!Object.values(car).every(Boolean)} onClick={()=>{setDetailsSubmitted(true);setStep(0)}}>ממשיכים לבדיקה ←</button></section></main>;

  if(done) return <main className="resultPage" dir="rtl"><header className="resultHead"><div className="brand"><span className="brandmark" role="img" aria-label="רכב">🚘</span><div><b>המומחה של דוד</b><small>דוח בדיקה ראשוני</small></div></div><button onClick={()=>window.print()}>הדפסת הדוח</button></header><section className="resultHero"><span className={`risk ${result.color}`}>{result.label}</span><h1>{result.verdict}</h1><p>{car.make} {car.model} · {car.year} · {car.km} ק״מ</p><div className={`scoreRing ${result.color}`}><strong>{score}</strong><span>מתוך 100</span></div><p className="resultText">{result.text}</p></section><section className="reportGrid"><article><h3>🚩 דגלים שדורשים תשובה</h3>{flags.length ? <ul>{flags.map((f,i)=><li key={i}>{f}</li>)}</ul> : <p className="empty">לא סומנו דגלים אדומים משמעותיים.</p>}</article><article><h3>💬 מה לשאול את המוכר עכשיו</h3><ul><li>אפשר לקבל תיעוד טיפולים וחשבוניות?</li><li>האם הרכב עבר תאונה או תיקון משמעותי?</li><li>האם קיימים שעבודים, עיקולים או התחייבויות?</li><li>האם תסכים לבדיקה במכון שאני בוחר/ת?</li></ul></article><article><h3>🔧 מה לבקש מהמכון לבדוק</h3><ul><li>שלדה, קצות שלדה וסימני תיקון</li><li>מנוע, מערכת קירור, נזילות ולחצי מנוע</li><li>גיר, מתלים, בלמים, היגוי וצמיגים</li><li>סריקת מחשב והיסטוריית תקלות</li></ul></article><article className="price"><h3>💰 מחיר מבוקש</h3><strong>₪{car.price}</strong><p>לא מנהלים משא ומתן לפני שמכמתים את הליקויים. כל תקלה בדוח היא כסף.</p></article></section><div className="bottomActions"><button className="primary" onClick={()=>{setDone(false);setStep(0)}}>חזרה לתשובות</button><button className="secondary" onClick={()=>{setCar({make:"",model:"",year:"",km:"",price:""});setAnswers({});setDone(false);setStep(0);setDetailsSubmitted(false)}}>בדיקת רכב נוסף</button></div><footer><b>לתשומת לב:</b> זהו דוח סינון ראשוני המבוסס על המידע שמסרתם. הוא אינו מהווה אחריות למצב הרכב ואינו מחליף בדיקה מקצועית ומסמכית.</footer></main>;

  const q=questions[step];
  return <main className="app" dir="rtl"><div className="appTop"><button className="logoBtn" aria-label="פתיחת אפשרויות יציאה" onClick={()=>setShowExit(true)}>🚘</button><div className="progress"><span>שאלה {step+1} מתוך {questions.length}</span><div><i style={{width:`${(step+1)/questions.length*100}%`}}/></div></div><span className="carPill">{car.make} {car.model} · {car.year}</span></div><section className="questionCard"><span className="stepNum">בדיקת דוד · {String(step+1).padStart(2,"0")}</span><h2>{q.title}</h2><p>{q.hint}</p><div className="options">{q.options.map((o,i)=><button key={o[0]} className={answers[q.id]===o[0]?"selected":""} onClick={()=>choose(q.id,o[0])}><span>{String.fromCharCode(65+i)}</span>{o[1]}<i>←</i></button>)}</div><div className="nav"><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>→ הקודם</button><button onClick={()=>setShowExit(true)}>שמירה ויציאה</button></div></section>{showExit&&<div className="modal"><div><h3>לעצור את הבדיקה?</h3><p>התשובות נשמרות כל עוד החלון פתוח.</p><button className="primary" onClick={()=>setShowExit(false)}>להמשיך לבדוק</button><button className="secondary" onClick={()=>setStarted(false)}>חזרה להתחלה</button></div></div>}</main>;
}
