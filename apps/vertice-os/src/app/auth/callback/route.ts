import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  try {
    const supabase = await createClient();
    const tokenHash = url.searchParams.get("token_hash");
    const code = url.searchParams.get("code");
    // Only recovery links are accepted here; redirects cannot be supplied by the caller.
    if (tokenHash && url.searchParams.get("type") === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (!error)
        return NextResponse.redirect(new URL("/redefinir-senha", url));
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(new URL("/redefinir-senha", url));
    }
  } catch {
    /* Invalid or unconfigured callbacks fail closed. */
  }
  return NextResponse.redirect(new URL("/recuperar-senha?expired=1", url));
}
