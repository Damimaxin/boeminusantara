"use client";

import { useActionState } from "react";
import type { BuyerProfile } from "@/lib/portal";
import type { ProfilState } from "../actions";

type Action = (prev: ProfilState, formData: FormData) => Promise<ProfilState>;

const INITIAL: ProfilState = { ok: false };

const SUMBER_DANA = ["BOS", "APBD", "APBN", "Komite / Mandiri", "Lainnya"];

export function ProfilForm({
  action,
  profile,
}: {
  action: Action;
  profile: BuyerProfile;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const field =
    "mt-1 w-full rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]";
  const label = "block text-sm font-medium text-[var(--color-ink)]";
  const hint = "mt-1 text-xs text-[var(--color-mute)]";

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state.error && (
        <div className="rounded border border-[var(--color-red)] bg-[var(--color-red)]/5 px-4 py-3 text-sm text-[var(--color-red-deep)]">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          {state.success}
        </div>
      )}

      <fieldset className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <legend className="px-1 text-sm font-semibold text-[var(--color-ink)]">
          Data Instansi
        </legend>

        <div className="space-y-5">
          <div>
            <label htmlFor="institution" className={label}>
              Nama Satuan Pendidikan / Instansi
            </label>
            <input
              id="institution"
              name="institution"
              defaultValue={profile.institution}
              className={field}
              placeholder="SMK Negeri 1 Tangerang"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="npwp" className={label}>
                NPWP Instansi
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
              <label htmlFor="phone" className={label}>
                Telepon
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={profile.phone}
                className={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={label}>
              Alamat
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={profile.address}
              className={field}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={label}>
                Kota / Kabupaten
              </label>
              <input id="city" name="city" defaultValue={profile.city} className={field} />
            </div>
            <div>
              <label htmlFor="postalCode" className={label}>
                Kode Pos
              </label>
              <input
                id="postalCode"
                name="postalCode"
                defaultValue={profile.postalCode}
                className={field}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <legend className="px-1 text-sm font-semibold text-[var(--color-ink)]">
          Pejabat Penanda Tangan
        </legend>
        <p className={hint}>
          Nama dan NIP ini tercetak di surat pesanan dan berita acara serah terima.
        </p>

        <div className="mt-4 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="officerName" className={label}>
                Nama Pejabat
              </label>
              <input
                id="officerName"
                name="officerName"
                defaultValue={profile.officerName}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="officerNip" className={label}>
                NIP
              </label>
              <input
                id="officerNip"
                name="officerNip"
                defaultValue={profile.officerNip}
                className={field}
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label htmlFor="officerRole" className={label}>
              Jabatan
            </label>
            <input
              id="officerRole"
              name="officerRole"
              defaultValue={profile.officerRole}
              className={field}
              placeholder="Kepala Sekolah / PPK / Pelaksana"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <legend className="px-1 text-sm font-semibold text-[var(--color-ink)]">
          Anggaran
        </legend>

        <div className="mt-2 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="budgetYear" className={label}>
              Tahun Anggaran
            </label>
            <input
              id="budgetYear"
              name="budgetYear"
              type="number"
              defaultValue={profile.budgetYear ?? new Date().getFullYear()}
              className={field}
            />
            <p className={hint}>Dipakai untuk mengelompokkan arsip dokumen.</p>
          </div>
          <div>
            <label htmlFor="budgetSource" className={label}>
              Sumber Dana
            </label>
            <select
              id="budgetSource"
              name="budgetSource"
              defaultValue={profile.budgetSource}
              className={field}
            >
              <option value="">— pilih —</option>
              {SUMBER_DANA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded bg-[var(--color-navy)] px-4 text-sm font-medium text-[var(--color-paper)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan Profil"}
      </button>
    </form>
  );
}
