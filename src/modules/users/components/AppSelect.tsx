// src/modules/users/components/AppSelect.tsx
import React from "react";
import type { UseFormRegister, FieldValues, Path, FieldError } from "react-hook-form";

interface SelectOption {
  value: string;
  label: string;
}

interface AppSelectProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: SelectOption[];
  error?: FieldError | string;
  disabled?: boolean;
}

export default function AppSelect<T extends FieldValues>({
  label,
  name,
  register,
  options,
  error,
  disabled = false,
}: AppSelectProps<T>) {
  const errorMessage = error && (typeof error === "string" ? error : error.message);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        disabled={disabled}
        defaultValue=""
        className={`block w-full rounded-md border bg-card dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        {...register(name)}
      >
        <option value="" disabled>
          Select {label}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}




