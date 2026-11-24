"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FieldError,
  FieldHint,
  Input,
  Label,
} from "@/components/ui/field";
import { DynamicField } from "@/components/public/dynamic-field";
import { PhoneOtpPanel } from "@/components/public/phone-otp-panel";
import { formatNumber, formatRupiah, amountFromInput } from "@/lib/format";
import type { ClassRecord, FormField } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChildForm {
  uid: string;
  name: string;
  classId: string;
  amount: number;
  customData: Record<string, unknown>;
}

function newChild(): ChildForm {
  return {
    uid: Math.random().toString(36).slice(2),
    name: "",
    classId: "",
    amount: 0,
    customData: {},
  };
}

function isBlank(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return !value;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function RegistrationFlow({
  classes,
  familyFields,
  studentFields,
  initialPhone,
  initialParentName,
  existingStudents,
}: {
  classes: ClassRecord[];
  familyFields: FormField[];
  studentFields: FormField[];
  initialPhone: string;
  initialParentName: string;
  existingStudents: Array<{ id: string; name: string; className: string }>;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"phone" | "form">(
    initialPhone ? "form" : "phone",
  );
  const [phone, setPhone] = useState(initialPhone);
  const [parentName, setParentName] = useState(initialParentName);
  const [familyCustom, setFamilyCustom] = useState<Record<string, unknown>>({});
  const [children, setChildren] = useState<ChildForm[]>([newChild()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = children.reduce((sum, child) => sum + child.amount, 0);

  function updateChild(uid: string, patch: Partial<ChildForm>) {
    setChildren((items) =>
      items.map((item) => (item.uid === uid ? { ...item, ...patch } : item)),
    );
  }

  async function handleVerified(result: { phone: string; familyId: string | null }) {
    setPhone(result.phone);
    setStage("form");
    if (result.familyId) {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as {
            family?: { parent_name?: string } | null;
          };
          if (data.family?.parent_name && !parentName) {
            setParentName(data.family.parent_name);
          }
        }
      } catch {
        // abaikan, pengguna tetap bisa mengisi manual
      }
    }
  }

  function validate() {
    if (parentName.trim().length < 2) return "Nama wali minimal 2 karakter.";
    if (!children.length) return "Tambahkan minimal satu anak.";
    for (const child of children) {
      if (child.name.trim().length < 2) return "Nama anak minimal 2 karakter.";
      if (!child.classId) return `Pilih kelas untuk ${child.name || "anak"}.`;
      if (!Number.isInteger(child.amount) || child.amount < 1000) {
        return `Nominal Ta'awun ${child.name || "anak"} minimal Rp 1.000.`;
      }
      for (const field of studentFields) {
        if (field.required && isBlank(child.customData[field.key])) {
          return `Lengkapi ${field.label} untuk ${child.name}.`;
        }
      }
    }
    for (const field of familyFields) {
      if (field.required && isBlank(familyCustom[field.key])) {
        return `Lengkapi ${field.label}.`;
      }
    }
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: parentName.trim(),
          children: children.map((child) => ({
            name: child.name.trim(),
            classId: child.classId,
            amount: child.amount,
            customData: child.customData,
          })),
          customData: familyCustom,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        invoiceId?: string;
      };
      if (!response.ok || !data.ok || !data.invoiceId) {
        setError(data.error ?? "Gagal membuat invoice.");
        return;
      }
      toast.success("Invoice dibuat. Lanjutkan pembayaran.");
      router.push(`/invoice/${data.invoiceId}`);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "phone") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <Card className="p-6 sm:p-8">
          <PhoneOtpPanel
            initialPhone={initialPhone}
            title="Verifikasi WhatsApp"
            description="Masukkan nomor WhatsApp aktif. Kode OTP 4 digit akan dikirim oleh admin Ta'awun."
            onVerified={handleVerified}
          />
        </Card>
        <p className="mt-4 text-center text-xs text-stone-500">
          Dengan melanjutkan, Anda menyetujui penggunaan nomor untuk verifikasi
          dan komunikasi Ta&apos;awun.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <StepBadge index={1} label="Verifikasi" done />
          <span className="h-px w-5 bg-stone-300" />
          <StepBadge index={2} label="Data" active />
          <span className="h-px w-5 bg-stone-300" />
          <StepBadge index={3} label="Pembayaran" />
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-emerald-950">
                  Data wali santri
                </h2>
                <p className="text-xs text-stone-500">
                  Nomor WhatsApp terverifikasi:{" "}
                  <span className="font-semibold text-emerald-800">{phone}</span>
                </p>
              </div>
            </div>
            <Badge tone="green">
              <ShieldCheck className="h-3 w-3" /> Terverifikasi
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="parent-name">
                Nama wali / orang tua <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="parent-name"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="Nama lengkap wali"
                required
              />
            </div>
            {familyFields.map((field) => (
              <div
                key={field.id}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <DynamicField
                  field={field}
                  value={familyCustom[field.key]}
                  onChange={(value) =>
                    setFamilyCustom((current) => ({ ...current, [field.key]: value }))
                  }
                  idPrefix="family"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-emerald-950">Data anak</h2>
              <p className="text-xs text-stone-500">
                Satu anak satu kelas. Nominal Ta&apos;awun bisa berbeda per anak.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setChildren((items) => [...items, newChild()])}
            >
              <Plus className="h-3.5 w-3.5" /> Tambah anak
            </Button>
          </div>

          {children.map((child, index) => (
            <Card key={child.uid} className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-stone-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  Anak {index + 1}
                </p>
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setChildren((items) =>
                        items.filter((item) => item.uid !== child.uid),
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>
                    Nama anak <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={child.name}
                    onChange={(event) =>
                      updateChild(child.uid, { name: event.target.value })
                    }
                    placeholder="Nama lengkap anak"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Kelas <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={child.classId}
                    onChange={(event) =>
                      updateChild(child.uid, { classId: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                    required
                  >
                    <option value="">Pilih kelas</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>
                    Nominal Ta&apos;awun <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
                      Rp
                    </span>
                    <Input
                      value={child.amount ? formatNumber(child.amount) : ""}
                      onChange={(event) =>
                        updateChild(child.uid, {
                          amount: amountFromInput(event.target.value),
                        })
                      }
                      placeholder="1.500.000"
                      inputMode="numeric"
                      className="pl-11"
                      required
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[500_000, 1_000_000, 1_500_000, 2_000_000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => updateChild(child.uid, { amount })}
                        className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-800"
                      >
                        {formatRupiah(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {studentFields.map((field) => (
                  <div
                    key={field.id}
                    className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                  >
                    <DynamicField
                      field={field}
                      value={child.customData[field.key]}
                      onChange={(value) =>
                        updateChild(child.uid, {
                          customData: {
                            ...child.customData,
                            [field.key]: value,
                          },
                        })
                      }
                      idPrefix={`child-${child.uid}`}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          {existingStudents.length > 0 && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
              <p className="font-bold text-stone-800">Anak yang sudah terdaftar</p>
              <p className="mt-0.5">
                {existingStudents
                  .map((student) => `${student.name} (${student.className})`)
                  .join(", ")}
                . Untuk menambah Ta&apos;awun anak yang sudah terdaftar, gunakan{" "}
                <a href="/tambah" className="font-semibold text-emerald-700 underline">
                  halaman Tambah Ta&apos;awun
                </a>
                .
              </p>
            </div>
          )}

          {error && <FieldError className="mt-3">{error}</FieldError>}
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="bg-emerald-950 p-5 text-emerald-50">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
              <Receipt className="h-3.5 w-3.5" /> Ringkasan
            </p>
            <p className="mt-2 text-2xl font-extrabold">{formatRupiah(total)}</p>
            <p className="text-xs text-emerald-100/60">
              {children.length} anak • Ta&apos;awun pokok
            </p>
          </div>

          <div className="space-y-2 p-5 text-sm">
            {children.map((child, index) => (
              <div key={child.uid} className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate text-stone-500">
                  {child.name || `Anak ${index + 1}`}
                </span>
                <span className="shrink-0 font-semibold text-stone-800">
                  {formatRupiah(child.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-2 text-xs text-stone-500">
              <span>Kode unik audit</span>
              <span className="font-semibold text-amber-700">+ 3 digit</span>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
              Total transfer akhir = Ta&apos;awun pokok + kode unik. Kode unik
              dibuat otomatis untuk memudahkan pencocokan pembayaran.
            </div>
          </div>

          <div className="p-5 pt-0">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Buat QRIS pembayaran
            </Button>
            <FieldHint className="mt-2 text-center">
              Anda akan diarahkan ke halaman QRIS dinamis.
            </FieldHint>
          </div>
        </Card>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
          <p className="flex items-center gap-1.5 font-bold">
            <BadgeCheck className="h-3.5 w-3.5" /> Setelah membayar
          </p>
          <p className="mt-1 text-emerald-900/75">
            Unggah bukti transfer pada halaman invoice. Admin akan memverifikasi,
            lalu pembayaran tampil di halaman rekap publik.
          </p>
        </div>
      </aside>
    </form>
  );
}

function StepBadge({
  index,
  label,
  active = false,
  done = false,
}: {
  index: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        done
          ? "bg-emerald-100 text-emerald-800"
          : active
            ? "bg-emerald-900 text-white"
            : "bg-stone-100 text-stone-500",
      )}
    >
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{index}</span>}
      {label}
    </span>
  );
}
