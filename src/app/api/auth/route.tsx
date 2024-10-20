import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = 'force-dynamic';

/**
 * Given request with email confirmation code, authenticate the user and redirect them to the dashboard 
 * NOTE: email verification is currently not in use
 */
export async function GET(req: NextRequest) {
  // Instantiates a new instance of supabase, route handler variation
  const supabase = createRouteHandlerClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, 
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY
  })
  
  //get code from the search parameters
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    // Create a cookie-based user session from the code
    try{
      await supabase.auth.exchangeCodeForSession(code);
      console.log('==== Code verified successfully ====')
    } catch ( err ) {
      console.log('[Warning] Supabase code validation auth error: ' + err)
    }
  }

  // Redirect the user to the dashboard URL after authentication
  return NextResponse.redirect(new URL("/dashboard", req.url))
}