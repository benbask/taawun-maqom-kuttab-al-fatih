import type { Metadata } from "next";
import { GraduationCap, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RegistrationFlow } from "@/components/public/registration-flow";
import { phoneLocal } from "@/lib/format";
import { safeSettings } from "@/lib/safe";
import { getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Pendaftaran Maqom & Ta'awun",
  description:
    "Daftarkan anak Anda dan tunaikan Ta'awun untuk Maqom Kuttab Al Fatih Lampung melalui QRIS dinamis.",
};

export default async function RegistrationPage() {
  const settings = await safeSettings();
  const session = await getUserSession();
  const store = getStore();

  const [classes, directory] = await Promise.all([
    store.listClasses(true).catch(() => []),
    store.listStudentDirectory().catch(() => []),
  ]);

  let family = null;
  let initialNis: string[] = [];
  if (session) {
    family = session.familyId
      ? await store.getFamilyById(session.familyId).catch(() => null)
      : await store.getFamilyByPhone(session.phone).catch(() => null);
    if (family) {
      const students = await store.listStudents(family.id).catch(() => []);
      initialNis = students
        .map((student) => String((student.custom_data as { nis?: unknown })?.nis ?? ""))
        .filter(Boolean);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <Badge tone="gold" className="gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" /> Pendaftaran Ta&apos;awun
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
          Daftarkan santri Maqom &amp; tunaikan Ta&apos;awun
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Daftar Maqom &amp; Ta&apos;awun: lengkapi data keluarga dan santri.
          Setelah itu sistem membuat QRIS dinamis sesuai nominal Ta&apos;awun Anda.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card className="mx-auto max-w-lg p-6 text-center">
          <Info className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-2 text-lg font-bold text-stone-800">
            Kelas belum tersedia
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Admin belum menambahkan kelas. Silakan hubungi admin Ta&apos;awun
            melalui WhatsApp {settings.contact_whatsapp || "yang tertera di beranda"}.
          </p>
        </Card>
      ) : (
        <RegistrationFlow
          classes={classes}
          directory={directory}
          initialPhone={session ? phoneLocal(session.phone) : ""}
          initialParentName={family?.parent_name ?? ""}
          initialRole={family?.account_type ?? null}
          initialAlumniYear={String(family?.alumni_profile?.angkatan ?? "")}
          initialNis={initialNis}
        />
      )}

      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-xs leading-relaxed text-stone-500 sm:flex-row sm:items-center">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
        <p>
          Data Anda hanya digunakan untuk Ta&apos;awun. Halaman verifikasi publik
          menampilkan nama dalam bentuk inisial dan empat digit terakhir nomor
          WhatsApp.
        </p>
      </div>
    </div>
  );
}
