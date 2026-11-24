import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlumniForm } from "@/components/public/alumni-form";
import { getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Data Alumni",
  robots: { index: false, follow: false },
};

export default async function AlumniPage() {
  const session = await getUserSession();
  if (!session) redirect("/masuk?next=/alumni");

  const store = getStore();
  const family = session.familyId
    ? await store.getFamilyById(session.familyId)
    : await store.getFamilyByPhone(session.phone);
  const profile = family?.alumni_profile ?? {};

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">
          Ikut Maqom sebagai alumni
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Lengkapi data alumni, lalu Anda bisa menunaikan Ta&apos;awun.
        </p>
      </div>
      <AlumniForm
        initial={{
          nama: family?.parent_name ?? "",
          angkatan: String(profile.angkatan ?? ""),
          whatsapp: String(profile.whatsapp ?? family?.phone ?? ""),
          kota: String(profile.kota ?? ""),
          catatan: String(profile.catatan ?? ""),
        }}
      />
    </div>
  );
}
