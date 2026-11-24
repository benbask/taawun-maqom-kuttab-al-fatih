"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

interface GoogleId {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      width?: number;
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gisLoader: Promise<void> | null = null;

function loadGis() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisLoader) {
    gisLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisLoader = null;
        reject(new Error("Gagal memuat Google Sign-In."));
      };
      document.head.appendChild(script);
    });
  }
  return gisLoader;
}

export function GoogleSignInButton({
  clientId,
  onCredential,
  disabled = false,
}: {
  clientId: string;
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const id = window.google?.accounts?.id;
        if (!id) return;
        id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) void callbackRef.current(response.credential);
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "signin_with",
          shape: "pill",
          locale: "id",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat tombol Google. Periksa koneksi Anda.");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <div ref={containerRef} className="flex min-h-11 justify-center" />
      {error && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
