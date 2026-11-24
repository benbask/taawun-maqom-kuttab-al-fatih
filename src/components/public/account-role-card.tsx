"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, UserRound } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleSelector } from "@/components/public/role-selector";
import { roleLabels } from "@/lib/account-roles";
import type { AccountRole } from "@/lib/account-roles";

export function AccountRoleCard({
  role,
  hasAlumniProfile,
}: {
  role: AccountRole | null;
  hasAlumniProfile: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!role);

  if (editing) {
    return (
      <Card className="p-5 sm:p-6">
        <RoleSelector
          currentRole={role}
          title="Peran Anda"
          description="Pilih satu. Anda bisa mengubahnya lagi nanti."
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100">
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-stone-500">Peran Anda</p>
          <p className="text-sm font-bold text-stone-900">
            {role ? roleLabels[role] : "Belum dipilih"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {role === "alumni_join" && !hasAlumniProfile && (
          <Link href="/alumni" className={buttonClasses("secondary", "sm")}>
            Lengkapi data alumni
          </Link>
        )}
        {role === "alumni_join" && hasAlumniProfile && (
          <Link href="/alumni" className={buttonClasses("ghost", "sm")}>
            Ubah data alumni
          </Link>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" /> Ubah peran
        </Button>
      </div>
    </Card>
  );
}
