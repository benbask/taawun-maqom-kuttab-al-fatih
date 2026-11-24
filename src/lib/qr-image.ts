import QRCode from "qrcode";

export async function qrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: {
      dark: "#064e3b",
      light: "#ffffff",
    },
  });
}
