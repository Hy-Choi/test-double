import { NextResponse } from "next/server";
import { getSupabaseServerConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const config = getSupabaseServerConfig();
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from("search_weight_config").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          usingServiceRole: config.usingServiceRole
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      usingServiceRole: config.usingServiceRole
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
