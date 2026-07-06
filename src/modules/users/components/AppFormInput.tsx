// src/modules/users/components/AppFormInput.tsx
import React from "react";
import type { UseFormRegister, FieldValues, Path, FieldError } from "react-hook-form";

interface AppFormInputProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  registerField: UseFormRegister<T>;
  error?: FieldError | string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export default function AppFormInput<T extends FieldValues>({
  label,
  name,
  registerField,
  error,
  placeholder = "",
  type = "text",
  disabled = false,
}: AppFormInputProps<T>) {
  const errorMessage = error && (typeof error === "string" ? error : error.message);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`block w-full rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
          ${error ? "border-red-500" : "border-gray-300"}`}
        {...registerField(name)}
      />
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}




