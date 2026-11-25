"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  HandHeart,
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
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { AccessPanel, type SimpleAuthResult } from "@/components/public/access-panel";
import { amountFromInput, formatNumber, formatRupiah } from "@/lib/format";
import type { AccountRole } from "@/lib/account-roles";
import type { ClassRecord, StudentDirectoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "access" | "roles" | "active" | "alumni" | "umum";
type JoinChoice = "maqom" | "taawun";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function initialStage(phone: string, role: AccountRole | null): Stage {
  if (role === "ots") return "active";
  if (role === "alumni_join" || role === "alumni") return "alumni";
  if (role === "outsider") return "umum";
  return phone ? "roles" : "access";
}

export function RegistrationFlow({
  classes,
  directory,
  initialPhone,
  initialParentName,
  initialRole,
  initialAlumniYear,
  initialNis,
}: {
  classes: ClassRecord[];
  directory: StudentDirectoryEntry[];
  initialPhone: string;
  initialParentName: string;
  initialRole: AccountRole | null;
  initialAlumniYear: string;
  initialNis: string[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(
    initialStage(initialPhone, initialRole),
  );
  const [phone, setPhone] = useState(initialPhone);
  const [parentName, setParentName] = useState(initialParentName);
  const [alumniYear, setAlumniYear] = useState(initialAlumniYear);
  const [joinChoice, setJoinChoice] = useState<JoinChoice>(() =>
    initialRole === "alumni" ? "taawun" : "maqom",
  );
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    directory
      .filter((entry) => initialNis.includes(entry.nis))
      .map((entry) => entry.id),
  );
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedClasses = [...classes].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const selected = selectedIds
    .map((id) => directory.find((entry) => entry.id === id))
    .filter((entry): entry is StudentDirectoryEntry => Boolean(entry));
  const classEntries = directory.filter(
    (entry) => entry.class_name === sortedClasses.find((c) => c.id === classId)?.name,
  );
  const matches = query.trim()
    ? classEntries.filter((entry) =>
        normalizeName(entry.name).includes(normalizeName(query)),
      )
    : [];
  const fatherName = selected[0]?.father_name ?? "";
  const youngestClass = [...selected].sort((a, b) => {
    const orderA = sortedClasses.find((c) => c.name === a.class_name)?.sort_order ?? 999;
    const orderB = sortedClasses.find((c) => c.name === b.class_name)?.sort_order ?? 999;
    return orderA - orderB;
  })[0];

  function toggleChild(entry: StudentDirectoryEntry) {
    const father = normalizeName(entry.father_name);
    const siblingIds = directory
      .filter((item) => normalizeName(item.father_name) === father)
      .map((item) => item.id);
    setError(null);
    setSelectedIds((current) => {
      const allSelected = siblingIds.every((id) => current.includes(id));
      if (allSelected) return current.filter((id) => !siblingIds.includes(id));
      return Array.from(new Set([...current, ...siblingIds]));
    });
  }

  function chooseRole(role: AccountRole) {
    setError(null);
    if (role === "ots") {
      setJoinChoice("maqom");
      setStage("active");
    } else if (role === "alumni_join" || role === "alumni") {
      setJoinChoice(role === "alumni" ? "taawun" : "maqom");
      setStage("alumni");
    } else {
      setStage("umum");
    }
  }

  async function authenticated(result: SimpleAuthResult) {
    setPhone(result.phone);
    if (result.parentName && result.parentName !== "Calon peserta") {
      setParentName(result.parentName);
    }
    setStage("roles");
  }

  async function submitActive() {
    if (!selected.length) {
      setError("Pilih minimal satu nama santri.");
      return;
    }
    if (!youngestClass) {
      setError("Kelas santri belum tersedia.");
      return;
    }
    if (amount < 1000) {
      setError("Nominal Ta'awun minimal Rp 1.000.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/registration/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: fatherName,
          classId: youngestClass.class_name
            ? sortedClasses.find((c) => c.name === youngestClass.class_name)?.id ?? classId
            : classId,
          childIds: selectedIds,
          amount,
          joinMaqom: joinChoice === "maqom",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        invoiceId?: string;
      };
      if (!response.ok || !data.ok || !data.invoiceId) {
        setError(data.error ?? "Gagal membuat pendaftaran.");
        return;
      }
      toast.success("Pendaftaran dibuat. Lanjutkan pembayaran.");
      router.push(`/invoice/${data.invoiceId}`);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAlumni() {
    if (parentName.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (alumniYear.trim().length < 2) {
      setError("Tahun angkatan wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/account/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: joinChoice === "maqom" ? "alumni_join" : "alumni",
          parentName: parentName.trim(),
          profile: { nama: parentName.trim(), angkatan: alumniYear.trim() },
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan data alumni.");
        return;
      }
      toast.success("Data alumni tersimpan. Lanjut Ta'awun.");
      router.push("/tambah");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  async function submitUmum() {
    if (parentName.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (amount < 1000) {
      setError("Nominal Ta'awun minimal Rp 1.000.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const role = await fetch("/api/account/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "outsider", parentName: parentName.trim() }),
      });
      const roleData = (await role.json()) as { ok?: boolean; error?: string };
      if (!role.ok || !roleData.ok) {
        setError(roleData.error ?? "Gagal menyimpan data.");
        return;
      }
      const response = await fetch("/api/addition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: `Ta'awun ${parentName.trim()}` }),
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

  if (stage === "access") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <Card className="p-6 sm:p-8">
          <AccessPanel
            initialPhone={initialPhone}
            title="Daftar / masuk Ta'awun"
            description="Masukkan nomor WhatsApp dan password Anda. Nomor baru akan otomatis didaftarkan."
            submitLabel="Lanjutkan"
            onAuthenticated={authenticated}
          />
        </Card>
        <p className="mt-4 text-center text-xs text-stone-500">
          Data yang Anda isi hanya dipakai untuk pendaftaran dan verifikasi
          Ta&apos;awun.
        </p>
      </div>
    );
  }

  if (stage === "roles") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-emerald-950">
                Nomor terverifikasi
              </h2>
              <p className="text-xs text-stone-500">WhatsApp: {phone}</p>
            </div>
            <Badge tone="green" className="ml-auto">
              <CheckCircle2 className="h-3 w-3" /> Tercatat
            </Badge>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-extrabold text-emerald-950">
              Pilih jenis peserta
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Pilih salah satu untuk melanjutkan.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ChoiceCard
                icon={Users}
                title="OTS Aktif"
                description="Pilih kelas, lalu pilih nama santri. Data saudara otomatis terisi."
                onClick={() => chooseRole("ots")}
              />
              <ChoiceCard
                icon={GraduationCap}
                title="OTS Alumni"
                description="Cukup isi nama dan tahun angkatan."
                onClick={() => chooseRole("alumni_join")}
              />
              <ChoiceCard
                icon={HandHeart}
                title="Pihak Umum"
                description="Donatur umum tanpa data santri. Langsung ke pembayaran."
                onClick={() => chooseRole("outsider")}
              />
            </div>
          </div>
          {error && <FieldError className="mt-3">{error}</FieldError>}
        </Card>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (stage === "active") return submitActive();
        if (stage === "alumni") return submitAlumni();
        return submitUmum();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <StepBadge index={1} label="Nomor" done />
          <span className="h-px w-5 bg-stone-300" />
          <StepBadge index={2} label="Data" active />
          <span className="h-px w-5 bg-stone-300" />
          <StepBadge index={3} label="Pembayaran" />
        </div>

        {(stage === "active" || stage === "alumni") && (
          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-extrabold text-emerald-950">
              Apakah Anda ikut Maqom?
            </h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Yang ikut adalah ayah, satu orang per keluarga.
            </p>
            <div
              className="mt-3 inline-flex flex-wrap gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-1.5"
              role="group"
              aria-label="Pilihan mengikuti Maqom"
            >
              <JoinButton
                active={joinChoice === "maqom"}
                label="Insyaallah saya ikut Maqom"
                onClick={() => setJoinChoice("maqom")}
              />
              <JoinButton
                active={joinChoice === "taawun"}
                label="Tidak ikut, hanya Ta'awun"
                onClick={() => setJoinChoice("taawun")}
              />
            </div>
          </Card>
        )}

        {stage === "active" && (
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-emerald-950">
                  Pilih kelas &amp; santri
                </h2>
                <p className="text-xs text-stone-500">
                  pilih kelas salah satu anak nanti sistem akan otomatis
                  mencocokkan data saudaranya jika memang lebih dari satu anak.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStage("roles")}
                className="text-xs font-bold text-emerald-700 underline-offset-2 hover:underline"
              >
                Ubah peserta
              </button>
            </div>

            <div className="mt-4">
              <Label htmlFor="class-select">Kelas</Label>
              <select
                id="class-select"
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setQuery("");
                }}
                className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              >
                {sortedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <Label htmlFor="santri-search">Cari nama santri</Label>
              <Input
                id="santri-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ketik satu huruf nama santri"
                autoComplete="off"
              />
              <FieldHint>
                Nama ayah tidak ditampilkan di sini, tetapi tersimpan di sistem
                untuk pencocokan dan verifikasi admin.
              </FieldHint>

              {query.trim() && (
                <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2">
                  {matches.length ? (
                    matches.map((entry) => {
                      const active = selectedIds.includes(entry.id);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => {
                            toggleChild(entry);
                            setQuery("");
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:translate-y-px",
                            active
                              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300"
                              : "text-stone-700 hover:bg-emerald-50/60",
                          )}
                        >
                          {entry.name}
                          {active && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-3 text-center text-xs text-stone-500">
                      Tidak ada santri yang cocok.
                    </p>
                  )}
                </div>
              )}

              {selected.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => toggleChild(entry)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      {entry.name} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected.length > 1 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                <p className="flex items-start gap-1.5 font-semibold">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Sistem menemukan {selected.length} anak dari ayah yang sama.
                  Semua saudara otomatis ikut, dan Ta&apos;awun masuk ke kelas
                  anak paling bungsu di kuttab.
                </p>
                <ul className="mt-2 space-y-1 pl-5">
                  {selected.map((entry) => (
                    <li key={entry.id} className="list-disc">
                      {entry.name} — {entry.class_name}
                    </li>
                  ))}
                </ul>
                {youngestClass && (
                  <p className="mt-1 pl-5 font-bold">
                    Kelas bungsu: {youngestClass.class_name}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <Label>Nominal Ta&apos;awun</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
                  Rp
                </span>
                <Input
                  value={amount ? formatNumber(amount) : ""}
                  onChange={(event) => setAmount(amountFromInput(event.target.value))}
                  placeholder="1.500.000"
                  inputMode="numeric"
                  className="pl-11"
                  required
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[500_000, 1_000_000, 1_500_000, 2_000_000].map((value) => (
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
          </Card>
        )}

        {stage === "alumni" && (
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
                <GraduationCap className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-emerald-950">
                  Data alumni
                </h2>
                <p className="text-xs text-stone-500">
                  Cukup isi nama dan tahun angkatan.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="alumni-name">Nama lengkap</Label>
                <Input
                  id="alumni-name"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="alumni-year">Tahun angkatan</Label>
                <Input
                  id="alumni-year"
                  value={alumniYear}
                  onChange={(event) => setAlumniYear(event.target.value)}
                  placeholder="Contoh: 2019"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          </Card>
        )}

        {stage === "umum" && (
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-sky-50 p-2 text-sky-700">
                <HandHeart className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-emerald-950">
                  Pihak umum
                </h2>
                <p className="text-xs text-stone-500">
                  Isi nama, lalu lanjut ke pembayaran.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="umum-name">Nama lengkap</Label>
              <Input
                id="umum-name"
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <Label>Nominal Ta&apos;awun</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
                  Rp
                </span>
                <Input
                  value={amount ? formatNumber(amount) : ""}
                  onChange={(event) => setAmount(amountFromInput(event.target.value))}
                  placeholder="500.000"
                  inputMode="numeric"
                  className="pl-11"
                  required
                />
              </div>
            </div>
          </Card>
        )}

        {error && <FieldError>{error}</FieldError>}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="bg-emerald-950 p-5 text-emerald-50">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
              <Receipt className="h-3.5 w-3.5" /> Ringkasan
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {stage === "alumni" ? alumniYear || "Tahun angkatan" : formatRupiah(amount)}
            </p>
            <p className="text-xs text-emerald-100/60">
              {stage === "active"
                ? `${selected.length} santri dipilih`
                : stage === "alumni"
                  ? "OTS Alumni"
                  : "Ta'awun umum"}
            </p>
          </div>
          <div className="p-5">
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {stage === "alumni" ? "Simpan & lanjut Ta'awun" : "Buat QRIS pembayaran"}
            </Button>
            <FieldHint className="mt-2 text-center">
              Anda akan diarahkan ke halaman invoice.
            </FieldHint>
          </div>
        </Card>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
          <p className="flex items-center gap-1.5 font-bold">
            <BadgeCheck className="h-3.5 w-3.5" /> Setelah membayar
          </p>
          <p className="mt-1 text-emerald-900/75">
            Unggah bukti transfer pada halaman invoice, lalu admin akan
            memverifikasinya.
          </p>
        </div>
      </aside>
    </form>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-sm active:translate-y-px"
    >
      <span className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-700 transition group-hover:bg-emerald-100">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-3 block text-sm font-bold text-stone-900">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-stone-500">
        {description}
      </span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
        Pilih <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function JoinButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-bold transition active:translate-y-px",
        active
          ? "bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-900/20"
          : "border border-stone-200 bg-white text-stone-600 hover:border-emerald-400",
      )}
    >
      {label}
    </button>
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
