"use client";

import { useRouter } from "next/navigation";
import { PhoneOtpPanel } from "@/components/public/phone-otp-panel";

export function LoginFlow({ next }: { next: string }) {
  const router = useRouter();

  return (
    <PhoneOtpPanel
      title="Masuk dengan WhatsApp"
      description="Gunakan nomor yang pernah didaftarkan. Kode OTP akan dikirim melalui WhatsApp admin."
      submitLabel="Kirim kode masuk"
      onVerified={() => {
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/akun";
        router.push(safeNext);
        router.refresh();
      }}
    />
  );
}
