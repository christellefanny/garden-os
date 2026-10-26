import { parseGardenLocation, resolveGardenZone } from '@/lib/planting-location';
export const maxDuration=30;
export async function POST(request:Request){
  let location:string;
  try{
    if(Number(request.headers.get('content-length')||0)>1024)return Response.json({error:'Location request is too large.'},{status:413});
    const text=await request.text();if(text.length>1024)return Response.json({error:'Location request is too large.'},{status:413});
    location=parseGardenLocation(JSON.parse(text).location);
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Enter a U.S. ZIP code or city and state.'},{status:400});}
  try{return Response.json(await resolveGardenZone(location),{headers:{'Cache-Control':'no-store'}});}
  catch(error){return Response.json({error:error instanceof Error?error.message:'Automatic lookup is unavailable. You can enter your zone yourself.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
