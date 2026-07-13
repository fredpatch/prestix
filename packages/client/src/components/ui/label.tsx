import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-[11.5px] font-medium text-neutral-800 mb-1.5 leading-none",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
