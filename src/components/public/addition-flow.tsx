"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  HandHeart,
  Info,
  Loader2,
  Plus,
  Receipt,
  UserPlus,
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

type Target = "student" | "class" | "umum";

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
  const [target, setTarget] = useState<Target>(
    initialStudents.length ? "student" : classes.length ? "class" : "umum",
  );
  const [studentId, setStudentId] = useState(initialStudents[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(initialStudents.length === 0);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState(classes[0]?.id ?? "");
  const [savingStudent, setSavingStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (mapped.length) {
        setTarget("student");
        setStudentId((current) => current || mapped[0].id);
      }
    } catch {
      // biarkan pengguna memilih kelas/umum
    }
  }

  async function saveStudent() {
    if (!newStudentName.trim()) {
      const message = "Nama santri wajib diisi.";
      setError(message);
      toast.error(message);
      return;
    }
    if (!newStudentClassId) {
      const message = "Pilih kelas santri terlebih dahulu.";
      setError(message);
      toast.error(message);
      return;
    }
    setSavingStudent(true);
    setError(null);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentName.trim(),
          classId: newStudentClassId,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        student?: { id: string; name: string; class_id: string | null };
      };
      if (!response.ok || !data.ok || !data.student) {
        setError(data.error ?? "Gagal menyimpan data santri.");
        return;
      }
      const created = data.student;
      const option: StudentOption = {
        id: created.id,
        name: created.name,
        classId: created.class_id,
        className:
          classes.find((cls) => cls.id === created.class_id)?.name ??
          "Kelas belum diatur",
      };
      setStudents((items) => [...items, option]);
      setStudentId(created.id);
      setTarget("student");
      setNewStudentName("");
      setShowStudentForm(false);
      toast.success("Data santri tersimpan. Santri ini dipilih untuk Ta'awun.");
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSavingStudent(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!Number.isInteger(amount) || amount < 1000) {
      const message = "Nominal Ta'awun minimal Rp 1.000.";
      setError(message);
      toast.error(message);
      return;
    }
    if (target === "student" && !studentId) {
      setError("Pilih santri terlebih dahulu.");
      return;
    }
    if (target === "class" && !classId) {
      setError("Pilih kelas terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/addition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: target === "student" ? studentId : null,
          classId: target === "class" ? classId : null,
          amount,
          note: note.trim() || undefined,
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
      toast.success("Invoice tambahan dibuat.");
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
          <AccessPanel
            initialPhone={initialPhone}
            title="Masuk untuk menambah Ta'awun"
            description="Masukkan nomor WhatsApp dan sandi bersama panitia."
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
  const selectedClass = classes.find((cls) => cls.id === classId);

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verifikasi
          </span>
          <span className="h-px w-5 bg-stone-300" />
          <span className="rounded-full bg-emerald-900 px-3 py-1 text-white">
            2 Pilih Ta&apos;awun
          </span>
          <span className="h-px w-5 bg-stone-300" />
          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-500">
            3 Pembayaran
          </span>
        </div>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-emerald-950">
            Ta&apos;awun ini dialokasikan untuk
          </h2>
          <p className="text-xs text-stone-500">
            Pilih santri, kelas, atau serahkan untuk kebutuhan umum kuttab.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <TargetCard
              active={target === "student"}
              onClick={() => setTarget("student")}
              icon={Users}
              title="Santri"
              note={
                students.length
                  ? `${students.length} anak terdaftar`
                  : "Pilih atau tambah santri"
              }
            />
            <TargetCard
              active={target === "class"}
              onClick={() => setTarget("class")}
              icon={GraduationCap}
              title="Kelas"
              note={`${classes.length} kelas tersedia`}
              disabled={classes.length === 0}
            />
            <TargetCard
              active={target === "umum"}
              onClick={() => setTarget("umum")}
              icon={HandHeart}
              title="Umum"
              note="Kebutuhan kuttab"
            />
          </div>

          {target === "student" && (
            <div className="mt-4">
              {students.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Pilih santri</Label>
                    <button
                      type="button"
                      onClick={() => setShowStudentForm((value) => !value)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline-offset-2 hover:underline"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Tambah santri baru
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => setStudentId(student.id)}
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
                </>
              )}

              {(showStudentForm || students.length === 0) && (
                <div
                  className={cn(
                    "rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-4",
                    students.length > 0 && "mt-3",
                  )}
                >
                  <p className="text-sm font-bold text-emerald-950">
                    {students.length ? "Santri baru" : "Tambahkan data santri"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                    Data santri tersimpan pada akun ini dan bisa dipilih kembali
                    untuk Ta&apos;awun berikutnya.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="new-student-name">
                        Nama santri <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="new-student-name"
                        value={newStudentName}
                        onChange={(event) => setNewStudentName(event.target.value)}
                        placeholder="Nama santri"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-student-class">
                        Kelas <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        id="new-student-class"
                        value={newStudentClassId}
                        onChange={(event) => setNewStudentClassId(event.target.value)}
                        className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                      >
                        <option value="">Pilih kelas</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveStudent}
                      loading={savingStudent}
                      disabled={savingStudent}
                    >
                      <Plus className="h-3.5 w-3.5" /> Simpan santri
                    </Button>
                    {students.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowStudentForm(false)}
                        className="text-xs font-semibold text-stone-500 hover:text-stone-700"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {target === "class" && (
            <div className="mt-4">
              <Label>Pilih kelas</Label>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === "umum" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Info className="h-3.5 w-3.5" /> Ta&apos;awun umum
              </p>
              <p className="mt-0.5">
                Kontribusi ini tidak terikat kelas tertentu dan akan dicatat
                sebagai Ta&apos;awun umum pada rekap publik.
              </p>
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
                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:border-emerald-300 hover:text-emerald-800"
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
              placeholder="Contoh: Ta'awun untuk kegiatan mabit santri"
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
              {target === "student"
                ? selectedStudent?.name ?? "Pilih santri"
                : target === "class"
                  ? selectedClass?.name ?? "Pilih kelas"
                  : "Ta'awun umum"}
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
            <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-2">
              <span className="font-bold text-stone-800">Total transfer</span>
              <span className="font-extrabold text-emerald-900">
                {formatRupiah(amount)}
                <span className="text-xs text-amber-700"> + kode</span>
              </span>
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

function TargetCard({
  active,
  onClick,
  icon: Icon,
  title,
  note,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  title: string;
  note: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10"
          : "border-stone-200 bg-white hover:border-emerald-300",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
        <Icon className="h-4 w-4 text-emerald-700" /> {title}
      </span>
      <span className="mt-0.5 block text-[11px] text-stone-500">{note}</span>
    </button>
  );
}
