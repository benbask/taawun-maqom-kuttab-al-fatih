import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { LoginFlow } from "@/components/public/login-flow";
import { Card } from "@/components/ui/card";
import { getUserSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Ta'awun Maqom Kuttab Al Fatih Lampung dengan OTP WhatsApp.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = first(params.next) ?? "/akun";
  const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/akun";

  const session = await getUserSession();
  if (session) redirect(safeNext);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          <LogIn className="h-3.5 w-3.5" /> Akun Ta&apos;awun
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-950">
          Masuk ke akun Anda
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Lihat riwayat Ta&apos;awun, status pembayaran, dan tambah kontribusi baru.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <LoginFlow next={safeNext} />
      </Card>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
        Kode OTP hanya berlaku beberapa menit dan tidak boleh dibagikan.
      </p>
    </div>
  );
}
