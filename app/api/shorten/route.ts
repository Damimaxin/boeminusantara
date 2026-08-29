import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL tidak valid." }, { status: 400 });
    }

    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url.trim())}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Gagal menyingkat URL via TinyURL." }, { status: 500 });
    }

    const shortUrl = await res.text();
    if (!shortUrl.startsWith("http")) {
      return NextResponse.json({ error: "Respon TinyURL tidak valid." }, { status: 500 });
    }

    return NextResponse.json({ shortUrl: shortUrl.trim() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
