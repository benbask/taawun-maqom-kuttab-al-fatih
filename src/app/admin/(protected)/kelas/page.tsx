import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ClassManager } from "@/components/admin/class-manager";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Kelola Kelas",
  robots: { index: false, follow: false },
};

export default async function AdminClassesPage() {
  const classes = await getStore().listClasses(false);

  return (
    <div>
      <PageHeader
        eyebrow="Formulir"
        title="Kelola kelas"
        description="Daftar kelas yang tersedia saat wali santri mengisi formulir pendaftaran."
      />
      <ClassManager initial={classes} />
    </div>
  );
}
