import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { FieldManager } from "@/components/admin/field-manager";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Kelola Formulir",
  robots: { index: false, follow: false },
};

export default async function AdminFieldsPage() {
  const fields = await getStore().listFormFields(false);

  return (
    <div>
      <PageHeader
        eyebrow="Formulir"
        title="Kelola field formulir"
        description="Tambahkan data wali atau santri yang harus diisi saat pendaftaran. Field bawaan (nama, kelas, nominal) selalu tersedia."
      />
      <FieldManager initial={fields} />
    </div>
  );
}
