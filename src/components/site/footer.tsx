import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { waLink } from "@/lib/format";
import type { Settings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-20 border-t border-emerald-950/10 bg-emerald-950 text-emerald-50/80">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Logo siteName={settings.site_name} light />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-emerald-100/65">
            {settings.tagline ||
              "Bersama membangun generasi Qur'ani melalui Ta'awun yang transparan dan terverifikasi."}
          </p>
          {settings.address && (
            <p className="text-xs text-emerald-100/45">{settings.address}</p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Tautan
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="hover:text-white" href="/daftar">
                Pendaftaran Ta&apos;awun
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/tambah">
                Tambah Ta&apos;awun
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/akun">
                Riwayat Saya
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-1 hover:text-white" href="/verifikasi" target="_blank">
                Verifikasi publik <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/admin">
                Panel admin
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Kontak
          </p>
          {settings.contact_name && (
            <p className="text-sm font-semibold text-white">{settings.contact_name}</p>
          )}
          {settings.contact_whatsapp && (
            <a
              href={waLink(
                settings.contact_whatsapp,
                "Assalamu'alaikum, saya ingin bertanya tentang Ta'awun Maqom Kuttab Al Fatih Lampung.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-100/80 hover:text-white"
            >
              WhatsApp admin <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
          <p className="text-xs leading-relaxed text-emerald-100/45">
            Data pribadi ditampilkan secara terbatas pada halaman verifikasi publik.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-emerald-100/55 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {settings.site_name}. Hak cipta dilindungi.
          </p>
          <p className="flex items-center gap-1.5">
            Dibuat dengan
            <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
            oleh
            <span className="font-semibold text-amber-200">
              {settings.footer_credit || "Beny Abu Ibrahim"}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
