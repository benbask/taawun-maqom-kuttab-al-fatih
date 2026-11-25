"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { QrisPayloadField } from "@/components/admin/qris-payload-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FieldError,
  FieldHint,
  Input,
  Label,
  Textarea,
} from "@/components/ui/field";
import type { Settings } from "@/lib/types";

type FieldKey = keyof Settings;

export interface SettingsField {
  key: FieldKey;
  label: string;
  hint?: string;
  type?: "text" | "number" | "date" | "url" | "image";
  textarea?: boolean;
  placeholder?: string;
}

export function SettingsForm({
  settings,
  sections,
  imageDecodeField,
}: {
  settings: Settings;
  sections: Array<{ title: string; description?: string; fields: SettingsField[] }>;
  imageDecodeField?: FieldKey;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [
        key,
        value === null || value === undefined ? "" : String(value),
      ]),
    ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, string | number | null> = {};
      for (const section of sections) {
        for (const field of section.fields) {
          const raw = values[field.key as string] ?? "";
          if (field.type === "number") {
            payload[field.key as string] = raw === "" ? 0 : Number(raw);
          } else if (field.type === "date") {
            payload[field.key as string] = raw ? new Date(raw).toISOString() : null;
          } else {
            payload[field.key as string] = raw.trim() === "" ? null : raw.trim();
          }
        }
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal menyimpan pengaturan.");
        return;
      }
      toast.success("Pengaturan berhasil disimpan.");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {sections.map((section) => (
        <Card key={section.title} className="p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-emerald-950">{section.title}</h2>
          {section.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
              {section.description}
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key as string}
                className={field.textarea || field.type === "url" || field.type === "image" ? "sm:col-span-2" : undefined}
              >
                <Label htmlFor={`setting-${field.key as string}`}>{field.label}</Label>
                {imageDecodeField && field.key === imageDecodeField ? (
                  <QrisPayloadField
                    id={`setting-${field.key as string}`}
                    value={values[field.key as string] ?? ""}
                    onChange={(value) => set(field.key, value)}
                  />
                ) : field.type === "image" ? (
                  <ImageUploadField
                    id={`setting-${field.key as string}`}
                    value={values[field.key as string] ?? ""}
                    onChange={(value) => set(field.key, value)}
                  />
                ) : field.textarea ? (
                  <Textarea
                    id={`setting-${field.key as string}`}
                    value={values[field.key as string] ?? ""}
                    onChange={(event) => set(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-32"
                  />
                ) : (
                  <Input
                    id={`setting-${field.key as string}`}
                    type={field.type ?? "text"}
                    value={values[field.key as string] ?? ""}
                    onChange={(event) => set(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
                {field.hint && <FieldHint>{field.hint}</FieldHint>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {error && <FieldError>{error}</FieldError>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan pengaturan
        </Button>
      </div>
    </form>
  );
}
