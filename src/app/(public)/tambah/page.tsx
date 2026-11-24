import type { Metadata } from "next";
import { HandHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdditionFlow } from "@/components/public/addition-flow";
import { phoneLocal } from "@/lib/format";
import { getUserSession } from "@/lib/session";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Tambah Ta'awun",
  description:
    "Tambahkan Ta'awun untuk santri, kelas, atau kebutuhan umum Maqom Kuttab Al Fatih Lampung.",
};

export default async function AdditionPage() {
  const session = await getUserSession();
  const store = getStore();

  const classes = await store.listClasses(true).catch(() => []);
  let students: Array<{
    id: string;
    name: string;
    classId: string | null;
    className: string;
  }> = [];

  if (session) {
    const family = session.familyId
      ? await store.getFamilyById(session.familyId).catch(() => null)
      : await store.getFamilyByPhone(session.phone).catch(() => null);
    if (family) {
      const rows = await store.listStudents(family.id).catch(() => []);
      students = rows.map((student) => ({
        id: student.id,
        name: student.name,
        classId: student.class_id,
        className:
          classes.find((cls) => cls.id === student.class_id)?.name ?? "Kelas belum diatur",
      }));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <Badge tone="gold" className="gap-1.5">
          <HandHeart className="h-3.5 w-3.5" /> Tambah Ta&apos;awun
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
          Tambah kontribusi Ta&apos;awun
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Pilih alokasi untuk santri, kelas, atau kebutuhan umum. QRIS dinamis
          dibuat otomatis sesuai nominal.
        </p>
      </div>

      <AdditionFlow
        classes={classes}
        initialPhone={session ? phoneLocal(session.phone) : ""}
        initialStudents={students}
      />
    </div>
  );
}
