"use client";

import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/field";
import type { FormField } from "@/lib/types";

export function DynamicField({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.key}`;
  const label = (
    <Label htmlFor={id}>
      {field.label}
      {field.required && <span className="ml-0.5 text-rose-500">*</span>}
    </Label>
  );

  if (field.type === "checkbox") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-3">
        <label htmlFor={id} className="flex items-start gap-2 text-sm text-stone-700">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span>
            {field.label}
            {field.required && <span className="ml-0.5 text-rose-500">*</span>}
          </span>
        </label>
        {field.help_text && <FieldHint>{field.help_text}</FieldHint>}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <Select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        >
          <option value="">Pilih {field.label.toLowerCase()}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        {field.help_text && <FieldHint>{field.help_text}</FieldHint>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <Textarea
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          required={field.required}
        />
        {field.help_text && <FieldHint>{field.help_text}</FieldHint>}
      </div>
    );
  }

  return (
    <div>
      {label}
      <Input
        id={id}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={
          typeof value === "string" || typeof value === "number" ? String(value) : ""
        }
        onChange={(event) =>
          onChange(field.type === "number" ? event.target.value : event.target.value)
        }
        placeholder={field.placeholder ?? undefined}
        required={field.required}
      />
      {field.help_text && <FieldHint>{field.help_text}</FieldHint>}
    </div>
  );
}
