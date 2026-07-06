// src/components/ui/calendar.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

export interface CalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | { from?: Date; to?: Date };
  onSelect?: (date: any) => void;
  className?: string;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ mode = "single", selected, onSelect, className }, ref) => {
    const formatSelected = () => {
      if (!selected) return "";
      if (mode === "single" && selected instanceof Date) {
        return format(selected, "PPP");
      }
      if (mode === "multiple" && Array.isArray(selected)) {
        return selected.map((d) => format(d, "PPP")).join(", ");
      }
      if (mode === "range" && typeof selected === "object") {
        const { from, to } = selected as any;
        return `${from ? format(from, "PPP") : ""} – ${to ? format(to, "PPP") : ""}`;
      }
      return "";
    };

    return (
      <div ref={ref} className={cn("rounded-md border p-3", className)}>
        <DayPicker
          mode={mode as any}
          selected={selected as any}
          onSelect={onSelect as any}
          required={(mode === "range") as any}
          classNames={{
            caption_label: "flex justify-center py-2",
            day: "w-10 h-10 flex items-center justify-center rounded-md",
            selected: "bg-primary text-primary-foreground",
            today: "border border-primary",
          }}
        />
        {formatSelected() && (
          <p className="mt-2 text-sm text-muted-foreground">{formatSelected()}</p>
        )}
      </div>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar };




