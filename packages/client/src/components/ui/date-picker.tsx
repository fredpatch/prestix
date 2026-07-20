import { CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD", matching every existing <Input type="date"> call site exactly — drop-in replacement
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Deliberately keeps the same ISO-string value/onChange contract every
// existing date input already uses (useState<string>, "YYYY-MM-DD") — a
// call site can swap <Input type="date" value={x} onChange={e=>setX(e.target.value)} />
// for <DatePicker value={x} onChange={setX} /> without touching any
// surrounding state or validation logic.
//
// PopoverTrigger renders its OWN button element — this codebase's Button
// component doesn't support asChild/Slot (confirmed by reading it directly,
// same class of issue as the Dialog asChild lesson from earlier), so rather
// than nest a real <Button> inside a <button> (invalid HTML, broken click
// behavior), the button-look is applied straight to PopoverTrigger via
// buttonVariants().
export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  const disabledMatchers = [
    ...(fromDate ? [{ before: fromDate }] : []),
    ...(toDate ? [{ after: toDate }] : []),
  ];

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal h-10",
          !selected && "text-neutral-400",
          className,
        )}
      >
        <CalendarIcon size={13} className="mr-2 shrink-0" />
        {selected ? format(selected, "dd MMM yyyy", { locale: fr }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onChange(format(date, "yyyy-MM-dd"))}
          startMonth={fromDate}
          endMonth={toDate}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
