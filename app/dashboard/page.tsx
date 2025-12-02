
import DashboardClient from "./dashboardCilent"
export const dynamic = "force-dynamic";

export default async function page(){
  const base = process.env.NEXT_PUBLIC_URL;
  if(!base)
 {
    return <div> Missing NEXT_PUBLIC_URL </div>
 }
 console.log("Base URL:", base);
const url = base.replace(/\/$/, "") + "/api/sales";

  console.log("Fetching:", url);

  const data = await fetch (url,{cache:"no-store"}).then(res=>res.json());
 console.log("got data", data.length);
  

  return(<>
  
         <DashboardClient data={data}/>
    </>)
}