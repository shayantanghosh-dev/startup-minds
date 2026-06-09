import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kyc/signed-url?document_id=xxx — generate a 1-hour signed URL for a KYC doc
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Must be admin or the investor who owns the document
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role && ["sub_admin", "super_admin"].includes(profile.role);

  const documentId = req.nextUrl.searchParams.get("document_id");
  if (!documentId) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  // Fetch document record
  const { data: doc } = await supabase
    .from("kyc_documents")
    .select("*, investors(user_id)")
    .eq("id", documentId)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const investor = doc.investors as { user_id: string } | null;
  const isOwner = investor?.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Extract storage path from the document_url
  // URL format: https://<project>.supabase.co/storage/v1/object/public/kyc-documents/<path>
  // or just a path like kyc-documents/<path>
  const rawUrl = doc.document_url as string;
  let storagePath = rawUrl;

  if (rawUrl.includes("/storage/v1/object/")) {
    const match = rawUrl.match(/\/storage\/v1\/object\/(?:public|private)\/kyc-documents\/(.+)/);
    storagePath = match ? match[1] : rawUrl;
  } else if (rawUrl.startsWith("kyc-documents/")) {
    storagePath = rawUrl.replace("kyc-documents/", "");
  }

  // Generate signed URL (1 hour expiry)
  const { data: signedData, error } = await adminSupabase.storage
    .from("kyc-documents")
    .createSignedUrl(storagePath, 3600);

  if (error || !signedData) {
    // If storage path extraction failed, return the original URL for non-storage docs (seed data)
    return NextResponse.json({ url: rawUrl, signed: false });
  }

  // Log access (non-critical, ignore errors)
  try {
    await supabase.from("data_room_access_logs").insert({
      document_id: documentId,
      user_id: user.id,
      action: "view",
    });
  } catch { /* ignore */ }

  return NextResponse.json({ url: signedData.signedUrl, signed: true, expires_in: 3600 });
}
