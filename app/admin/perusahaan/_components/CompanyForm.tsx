"use client";

import { useActionState } from "react";
import type { CompanyProfile } from "@/lib/admin/company";
import type { CompanyFormState } from "../actions";

type Action = (prev: CompanyFormState, formData: FormData) => Promise<CompanyFormState>;

const INITIAL: CompanyFormState = { ok: false };

export function CompanyForm({
  action,
  profile,
}: {
  action: Action;
  profile: CompanyProfile;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const field =
    "mt-1 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const hint = "mt-1 text-xs text-[var(--color-mute)]";

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 text-sm text-[var(--color-red-deep)]">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-dim)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="nama" className={label}>
          Nama Perusahaan
        </label>
        <input
          id="nama"
          name="nama"
          defaultValue={profile.nama}
          className={field}
          placeholder="PT Boemi Nusantara Kaya Berkah"
        />
        <p className={hint}>Tercetak sebagai penyedia di seluruh surat.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="npwp" className={label}>
            NPWP
          </label>
          <input
            id="npwp"
            name="npwp"
            defaultValue={profile.npwp}
            className={field}
            placeholder="00.000.000.0-000.000"
          />
        </div>
        <div>
          <label htmlFor="kodeSurat" className={label}>
            Kode Surat
          </label>
          <input
            id="kodeSurat"
            name="kodeSurat"
            defaultValue={profile.kodeSurat}
            className={field}
            placeholder="BNKB"
          />
          <p className={hint}>Muncul di nomor surat, mis. SP/BNKB/2607/0001</p>
        </div>
      </div>

      <div>
        <label htmlFor="alamat" className={label}>
          Alamat
        </label>
        <textarea
          id="alamat"
          name="alamat"
          rows={2}
          defaultValue={profile.alamat}
          className={field}
          placeholder="Jalan KH Hasyim Ashari No. 34 C-D, Cipondoh"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="kota" className={label}>
            Kota
          </label>
          <input id="kota" name="kota" defaultValue={profile.kota} className={field} />
          <p className={hint}>Untuk baris tanggal surat.</p>
        </div>
        <div>
          <label htmlFor="telepon" className={label}>
            Telepon
          </label>
          <input
            id="telepon"
            name="telepon"
            defaultValue={profile.telepon}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input id="email" name="email" defaultValue={profile.email} className={field} />
        </div>
      </div>

      <fieldset className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--color-ink)]">
          Penanda tangan dokumen
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="penandatangan" className={label}>
              Nama
            </label>
            <input
              id="penandatangan"
              name="penandatangan"
              defaultValue={profile.penandatangan}
              className={field}
              placeholder="Christian Purnama"
            />
          </div>
          <div>
            <label htmlFor="jabatan" className={label}>
              Jabatan
            </label>
            <input
              id="jabatan"
              name="jabatan"
              defaultValue={profile.jabatan}
              className={field}
              placeholder="Direktur"
            />
          </div>
        </div>
        <p className={hint}>
          Nama ini tercetak di bawah blok tanda tangan. Kolom tanda tangannya
          sengaja dikosongkan untuk dicetak dan ditandatangani basah.
        </p>
      </fieldset>

      <fieldset className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--color-ink)]">
          Rekening penerima pembayaran
        </legend>
        <p className={hint}>Tercetak di invoice dan kwitansi.</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="bankName" className={label}>Nama Bank</label>
            <input id="bankName" name="bankName" defaultValue={profile.bankName} className={field} placeholder="BCA" />
          </div>
          <div>
            <label htmlFor="bankAccount" className={label}>Nomor Rekening</label>
            <input id="bankAccount" name="bankAccount" defaultValue={profile.bankAccount} className={field} inputMode="numeric" />
          </div>
          <div>
            <label htmlFor="bankHolder" className={label}>Atas Nama</label>
            <input id="bankHolder" name="bankHolder" defaultValue={profile.bankHolder} className={field} />
          </div>
        </div>
        <div className="mt-5 max-w-xs">
          <label htmlFor="termDays" className={label}>Tempo pembayaran (hari)</label>
          <input id="termDays" name="termDays" type="number" min={1} defaultValue={profile.termDays} className={field} />
        </div>
      </fieldset>

      <fieldset className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-4">
        <legend className="px-1 text-sm font-medium text-[var(--color-ink)]">
          Redaksi Surat Pernyataan PDN / Non-TKDN
        </legend>
        <p className={hint}>
          Isi pernyataan hukum — harus dari Boemi, tidak boleh dikarang sistem.
          Surat PDN tidak bisa diterbitkan sebelum ini diisi.
        </p>
        <textarea
          id="pdnStatement"
          name="pdnStatement"
          rows={5}
          defaultValue={profile.pdnStatement}
          className={field + " mt-3 font-mono text-[13px]"}
          placeholder="Dengan ini kami menyatakan bahwa barang yang kami tawarkan…"
        />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-[var(--radius-card)] bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan Identitas"}
      </button>
    </form>
  );
}
