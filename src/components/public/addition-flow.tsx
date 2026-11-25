"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldHint, Input, Label, Textarea } from "@/components/ui/field";
import { AccessPanel } from "@/components/public/access-panel";
import { amountFromInput, formatNumber, formatRupiah } from "@/lib/format";
import type { ClassRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StudentOption {
  id: string;
  name: string;
  classId: string | null;
  className: string;
}

interface ExistingTaawun {
  familyId: string;
  fatherName: string;
  invoiceNo: string;
  amount: number;
  status: string;
}

export function AdditionFlow({
  classes,
  initialPhone,
  initialStudents,
}: {
  classes: ClassRecord[];
  initialPhone: string;
  initialStudents: StudentOption[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"phone" | "form">(
    initialPhone ? "form" : "phone",
  );
  const [students, setStudents] = useState<StudentOption[]>(initialStudents);
  const [studentId, setStudentId] = useState(initialStudents[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [existing, setExisting] = useState<ExistingTaawun[]>([]);
  const [confirmAgain, setConfirmAgain] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage === "form" && students.length === 0) {
      router.replace("/daftar");
      router.refresh();
    }
  }, [stage, students.length, router]);

  async function checkExisting(ids: string[]) {
    if (!ids.length) return;
    setChecking(true);
    try {
      const response = await fetch("/api/addition/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: ids }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        existing?: ExistingTaawun[];
      };
      if (response.ok && data.ok) {
        setExisting(data.existing ?? []);
        setConfirmAgain(null);
      }
    } catch {
      // abaikan: kullanıcı tetap bisa melanjutkan
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!studentId) return;
    const timer = setTimeout(() => void checkExisting([studentId]), 0);
    return () => clearTimeout(timer);
  }, [studentId]);

  async function refreshProfile() {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        students?: Array<{ id: string; name: string; class_id: string | null }>;
        classes?: ClassRecord[];
      };
      const classList = data.classes ?? classes;
      const mapped = (data.students ?? []).map((student) => ({
        id: student.id,
        name: student.name,
        classId: student.class_id,
        className:
          classList.find((cls) => cls.id === student.class_id)?.name ?? "Kelas belum diatur",
      }));
      setStudents(mapped);
      if (mapped.length) setStudentId((current) => current || mapped[0].id);
    } catch {
      // biarkan data awal dipakai
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!studentId) {
      setError("Pilih santri terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(amount) || amount < 1000) {
      setError("Nominal Ta'awun minimal Rp 1.000.");
      return;
    }
    if (existing.length && confirmAgain !== true) {
      setError("Konfirmasi dulu apakah Anda ingin menambah Ta'awun.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/addition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount,
          note: note.trim() || undefined,
          linkFamilyId: existing.length && confirmAgain ? existing[0].familyId : null,
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
      router.refresh();
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
          <AccessPanel
            initialPhone={initialPhone}
            title="Masuk untuk menambah Ta'awun"
            description="Masukkan nomor WhatsApp dan Kode Keamanan yang diberikan di grup angkatan."
            submitLabel="Lanjutkan"
            onAuthenticated={async (result) => {
              if (!result.role) {
                router.push("/daftar");
                router.refresh();
                return;
              }
              setStage("form");
              await refreshProfile();
            }}
          />
        </Card>
      </div>
    );
  }

  const selectedStudent = students.find((student) => student.id === studentId);

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Data tersimpan
          </span>
          <span className="h-px w-5 bg-stone-300" />
          <span className="rounded-full bg-emerald-900 px-3 py-1 text-white">
            1 Tambah Ta&apos;awun
          </span>
          <span className="h-px w-5 bg-stone-300" />
          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-500">
            2 Pembayaran
          </span>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-emerald-950">
                Data yang sudah tersimpan
              </h2>
              <p className="text-xs text-stone-500">
                Pilih santri yang ingin ditambahi Ta&apos;awun.
              </p>
            </div>
            <Badge tone="green" className="ml-auto">
              <ShieldCheck className="h-3 w-3" /> Tersimpan
            </Badge>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setStudentId(student.id);
                  void checkExisting([student.id]);
                }}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition active:translate-y-px",
                  studentId === student.id
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10"
                    : "border-stone-200 bg-white hover:border-emerald-300",
                )}
              >
                <span className="block text-sm font-semibold text-stone-800">
                  {student.name}
                </span>
                <span className="block text-[11px] text-stone-500">
                  {student.className}
                </span>
              </button>
            ))}
          </div>

          {checking && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memeriksa data
              Ta&apos;awun sebelumnya...
            </p>
          )}

          {existing.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-900">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Data ini sudah memiliki Ta&apos;awun sebelumnya.
              </p>
              <ul className="mt-2 space-y-1 pl-5 text-xs text-amber-900">
                {existing.map((item) => (
                  <li key={item.invoiceNo} className="list-disc">
                    Ayah {item.fatherName} sudah berta&apos;awun{" "}
                    <strong>{formatRupiah(item.amount)}</strong> ({item.invoiceNo})
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-bold text-amber-950">
                Apakah Anda ingin berta&apos;awun lagi?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setConfirmAgain(true)}
                  className={cn(confirmAgain === true && "ring-2 ring-emerald-900/20")}
                >
                  Ya, lanjut berta&apos;awun
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmAgain(false)}
                  className={cn(confirmAgain === false && "ring-2 ring-stone-400/30")}
                >
                  Tidak jadi
                </Button>
              </div>
              {confirmAgain === false && (
                <p className="mt-2 text-[11px] text-amber-800">
                  Pilih nominal hanya jika Anda tetap ingin menambah Ta&apos;awun.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-emerald-950">
            Nominal Ta&apos;awun
          </h2>
          <p className="text-xs text-stone-500">
            Kode unik 3 digit ditambahkan otomatis saat QRIS dibuat.
          </p>

          <div className="mt-4">
            <Label>Nominal</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
                Rp
              </span>
              <Input
                value={amount ? formatNumber(amount) : ""}
                onChange={(event) => setAmount(amountFromInput(event.target.value))}
                placeholder="500.000"
                inputMode="numeric"
                className="pl-11 text-lg font-bold"
                required
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[100_000, 250_000, 500_000, 1_000_000, 2_000_000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-800 active:translate-y-px"
                >
                  {formatRupiah(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="addition-note">Catatan (opsional)</Label>
            <Textarea
              id="addition-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Contoh: Ta'awun tambahan ibunda"
              maxLength={300}
              className="min-h-20"
            />
            <FieldHint>{note.length}/300 karakter</FieldHint>
          </div>

          {error && <FieldError className="mt-3">{error}</FieldError>}
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="bg-emerald-950 p-5 text-emerald-50">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
              <Receipt className="h-3.5 w-3.5" /> Ringkasan
            </p>
            <p className="mt-2 text-2xl font-extrabold">{formatRupiah(amount)}</p>
            <p className="text-xs text-emerald-100/60">
              {selectedStudent?.name ?? "Pilih santri"}
            </p>
          </div>
          <div className="space-y-2 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Ta&apos;awun pokok</span>
              <span className="font-semibold text-stone-800">{formatRupiah(amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Kode unik audit</span>
              <span className="font-semibold text-amber-700">+ 3 digit</span>
            </div>
          </div>
          <div className="p-5 pt-0">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              disabled={loading || (existing.length > 0 && confirmAgain !== true)}
            >
              <Wallet className="h-4 w-4" /> Buat QRIS pembayaran
            </Button>
            <FieldHint className="mt-2 text-center">
              QRIS dinamis langsung menampilkan total transfer.
            </FieldHint>
          </div>
        </Card>

        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <Badge tone="green" className="mb-2">
            <ArrowRight className="h-3 w-3" /> Alur
          </Badge>
          <ul className="space-y-1.5 text-xs text-stone-500">
            <li>1. Scan QRIS dengan aplikasi bank/e-wallet.</li>
            <li>2. Transfer sesuai total yang tampil.</li>
            <li>3. Unggah bukti pada halaman invoice.</li>
            <li>4. Admin memverifikasi pembayaran.</li>
          </ul>
        </div>
      </aside>
    </form>
  );
}
