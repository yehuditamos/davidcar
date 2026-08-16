const RESOURCE_ID="053cea08-09bc-40ec-8f7a-156f0677aff3";

export async function GET(_:Request,{params}:{params:Promise<{license:string}>}) {
  const {license}=await params;
  const clean=license.replace(/\D/g,"");
  if (!/^\d{7,8}$/.test(clean)) return Response.json({error:"מספר רכב חייב להכיל 7 או 8 ספרות"},{status:400});
  try {
    const query=new URLSearchParams({resource_id:RESOURCE_ID,limit:"1",filters:JSON.stringify({mispar_rechev:Number(clean)})});
    const response=await fetch(`https://data.gov.il/api/3/action/datastore_search?${query}`,{signal:AbortSignal.timeout(8000),next:{revalidate:86400}});
    if(!response.ok) throw new Error("vehicle source unavailable");
    const payload=await response.json();
    const row=payload?.result?.records?.[0];
    if(!row) return Response.json({error:"הרכב לא נמצא במאגר. אפשר להמשיך במילוי ידני."},{status:404});
    const extra=[
      ["רמת גימור",row.ramat_gimur],["סוג דלק",row.sug_delek_nm],["מועד עלייה לכביש",row.moed_aliya_lakvish],
      ["צבע",row.tzeva_rechev],["בעלות נוכחית",row.baalut],["טסט אחרון",row.mivchan_acharon_dt],
      ["תוקף רישוי",row.tokef_dt],["צמיג קדמי",row.zmig_kidmi],["צמיג אחורי",row.zmig_ahori],
      ["משקל כולל",row.mishkal_kolel?`${row.mishkal_kolel} ק״ג`:null]
    ].filter((item):item is [string,string]=>Boolean(item[1]));
    const typeNames:Record<string,string>={P:"פרטי",M:"מסחרי",T:"מונית"};
    const engine=row.nefach_manoa?`${row.nefach_manoa} סמ״ק`:row.degem_manoa?`דגם מנוע ${row.degem_manoa}`:"";
    return Response.json({license:clean,make:row.tozeret_nm||"",model:row.kinuy_mishari||row.degem_nm||"",year:String(row.shnat_yitzur||""),vehicleType:row.sug_rechev_nm||typeNames[row.sug_degem]||row.sug_degem||"",engine,version:row.ramat_gimur||"",extra});
  } catch {
    return Response.json({error:"לא הצלחנו להתחבר כרגע למאגר. אפשר להמשיך במילוי ידני."},{status:503});
  }
}
