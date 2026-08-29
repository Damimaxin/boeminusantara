import { getCompanyProfile, profileSiap } from "@/lib/admin/company";
import { CompanyForm } from "./_components/CompanyForm";
import { saveCompanyAction } from "./actions";

export const metadata = { title: "Identitas Perusahaan" };

export default async function CompanyPage() {
  const profile = await getCompanyProfile();
  const siap = profileSiap(profile);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Identitas Perusahaan</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Data di halaman ini tercetak di surat pesanan, invoice, surat jalan, dan
          berita acara. Isi sekali, dipakai seluruh dokumen.
        </p>
      </header>

      {!siap && (
        <div className="max-w-2xl rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 text-sm text-[var(--color-red-deep)]">
          Identitas belum lengkap. Dokumen resmi belum bisa diterbitkan sampai nama
          perusahaan, NPWP, alamat, dan nama penanda tangan terisi.
        </div>
      )}

      <CompanyForm action={saveCompanyAction} profile={profile} />
    </div>
  );
}
