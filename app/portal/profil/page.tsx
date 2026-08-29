import { getPortalUser, getMyProfile, kelengkapanProfil } from "@/lib/portal";
import { ProfilForm } from "./_components/ProfilForm";
import { saveProfilAction } from "./actions";

export const metadata = { title: "Profil Instansi" };

export default async function ProfilPage() {
  const user = (await getPortalUser())!;
  const profile = await getMyProfile(user);
  const persen = kelengkapanProfil(profile);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Profil Instansi
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Diisi sekali, dipakai di seluruh dokumen pengadaan Anda — surat pesanan,
          invoice, berita acara. Tidak perlu mengetik ulang NPWP dan NIP setiap kali.
        </p>
      </header>

      {persen < 100 && (
        <div className="max-w-2xl rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          Kelengkapan profil {persen}%. Dokumen resmi baru bisa dibuat otomatis
          setelah data wajib terisi.
        </div>
      )}

      <ProfilForm action={saveProfilAction} profile={profile} />
    </div>
  );
}
