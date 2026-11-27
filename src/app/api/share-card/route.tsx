import { ImageResponse } from "next/og";
import { formatRupiah } from "@/lib/format";
import { safePublicStats, safeSettings } from "@/lib/safe";

export async function GET() {
  const settings = await safeSettings();
  const stats = await safePublicStats(settings.target_amount);
  const percent =
    settings.target_amount > 0
      ? Math.round((stats.total / settings.target_amount) * 100)
      : 0;
  const barWidth = Math.max(2, Math.min(100, percent));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#064e3b",
          color: "#ffffff",
          padding: 32,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -90,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: "rgba(251,191,36,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: -130,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: "rgba(16,185,129,0.18)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#fbbf24",
              color: "#064e3b",
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fde68a" }}>
              {"TA'AWUN 2026"}
            </div>
            <div style={{ fontSize: 22, color: "#a7f3d0" }}>
              {settings.site_name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#d1fae5" }}>
            Alhamdulillah, terkumpul
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 92,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            {formatRupiah(stats.total)}
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 32, color: "#a7f3d0" }}>
            dari target {formatRupiah(settings.target_amount)}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 20,
              width: "100%",
              height: 30,
              borderRadius: 15,
              backgroundColor: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                width: `${barWidth}%`,
                height: "100%",
                backgroundColor: "#fbbf24",
              }}
            />
          </div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 36, fontWeight: 800, color: "#fde68a" }}>
            {percent}% tercapai
          </div>

          <div style={{ display: "flex", marginTop: 12, fontSize: 18, color: "#d1fae5" }}>
            {`Partisipasi OTS · ${stats.ots.terdaftar}/${stats.ots.total} keluarga terdaftar`}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 165, padding: "6px 12px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: "#ffffff" }}>{stats.ots.hadir}</div>
              <div style={{ display: "flex", fontSize: 14, color: "#a7f3d0" }}>{"Ikut"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 165, padding: "6px 12px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: "#ffffff" }}>{stats.ots.tidak}</div>
              <div style={{ display: "flex", fontSize: 14, color: "#a7f3d0" }}>{"Tidak ikut"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 165, padding: "6px 12px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: "#ffffff" }}>{stats.ots.belumDaftar}</div>
              <div style={{ display: "flex", fontSize: 14, color: "#a7f3d0" }}>{"Belum daftar"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 165, padding: "6px 12px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: "#ffffff" }}>{stats.ots.bertaawun}</div>
              <div style={{ display: "flex", fontSize: 14, color: "#a7f3d0" }}>{"Bertaawun"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              borderRadius: 16,
              backgroundColor: "#ffffff",
              color: "#065f46",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {"Tambah Ta'awun  →"}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#a7f3d0" }}>
            {"Daftar Maqom & Ta'awun"}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
