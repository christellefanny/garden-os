import { parsePlantingInput, resolvePlantingLocation } from "@/lib/planting-location";

export const maxDuration=30;
export async function POST(request: Request) {
  if(Number(request.headers.get("content-length") || 0)>1024)return Response.json({error:"Location request is too large."},{status:413});
  let input;
  try {
    const body=await request.text();if(body.length>1024)return Response.json({error:"Location request is too large."},{status:413});
    input=parsePlantingInput(JSON.parse(body));
  } catch(error) { return Response.json({error:error instanceof Error?error.message:"Enter a U.S. ZIP code."},{status:400}); }
  try { return Response.json(await resolvePlantingLocation(input),{headers:{"Cache-Control":"no-store"}}); }
  catch(error) { return Response.json({error:error instanceof Error?error.message:"Location lookup is unavailable. Please try again."},{status:502,headers:{"Cache-Control":"no-store"}}); }
}
