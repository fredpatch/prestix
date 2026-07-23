import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

// react-day-picker v9 (not v8 — confirmed via the actual installed version
// before writing this) uses a `classNames` map keyed by its `UI`/`DayFlag`
// enums, and a single `Chevron` custom component instead of v8's separate
// IconLeft/IconRight. Styled to match this app's existing Select/Dialog
// conventions (brand-gold accents, rounded-lg, same border/shadow language)
// rather than shadcn's stock look.
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-8 relative",
        caption_label: "text-[12.5px] font-semibold text-body",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 px-1",
        button_previous: cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground",
          "hover:bg-surface-subtle hover:text-body disabled:opacity-30 disabled:pointer-events-none",
        ),
        button_next: cn(
          "inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground",
          "hover:bg-surface-subtle hover:text-body disabled:opacity-30 disabled:pointer-events-none",
        ),
        month_grid: "w-full border-collapse mt-1",
        weekdays: "flex",
        weekday: "text-subtle w-8 text-[10.5px] font-medium text-center",
        week: "flex w-full mt-1",
        day: "h-8 w-8 text-center text-[11.5px] p-0 relative",
        day_button: cn(
          "h-8 w-8 rounded-md text-body inline-flex items-center justify-center",
          "hover:bg-surface-subtle aria-selected:opacity-100",
        ),
        selected: cn(
          "[&>button]:bg-brand-gold-dark [&>button]:text-white [&>button]:hover:bg-brand-gold-dark",
        ),
        today: "[&>button]:font-bold [&>button]:text-brand-gold-dark",
        outside: "text-subtle",
        disabled: "text-subtle opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
