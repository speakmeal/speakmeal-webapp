import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

/**
 * Given request with email confirmation code, authenticate the user and redirect them to the dashboard
 */
export async function GET(req: NextRequest) {
  // Instantiates a new instance of supabase, route handler variation
  const supabase = createRouteHandlerClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, 
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY
  })
  
  // Extracts the search params from the requested url, supabase assigns
  // some custom search params to verify auth
  const { searchParams } = new URL(req.url)
  
  // a verification code is extracted from the search params
  const code = searchParams.get("code")

  if (code) {
    // Create a cookie-based user session from the code
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect the user to the dashboard URL after authentication
  return NextResponse.redirect(new URL("/dashboard", req.url))
}