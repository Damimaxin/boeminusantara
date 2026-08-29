import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    const adminCheck = await checkAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya administrator yang diizinkan mengunggah file." },
        { status: 401 }
      );
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { error: "Layanan penyimpanan belum dikonfigurasi (kunci Supabase tidak ditemukan)." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.storage
      .from("products")
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;

    // Optionally fetch TinyURL
    let tinyUrl = publicUrl;
    try {
      const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(publicUrl)}`);
      if (tinyRes.ok) {
        const text = await tinyRes.text();
        if (text.startsWith("http")) {
          tinyUrl = text.trim();
        }
      }
    } catch {
      // Fallback to publicUrl if tinyurl service unavailable
    }

    return NextResponse.json({
      url: publicUrl,
      tinyUrl: tinyUrl,
      filename: file.name,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
