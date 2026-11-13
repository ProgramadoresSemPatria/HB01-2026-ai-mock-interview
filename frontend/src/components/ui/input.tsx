import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 border px-4 text-base text-text-strong md:text-sm transition-[color,background-color,border-color,box-shadow] duration-200 outline-none placeholder:text-text-soft file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-4 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
  {
    variants: {
      variant: {
        default:
          "border-border-subtle bg-surface-base shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] focus-visible:border-border-strong",
        soft: "border-transparent bg-surface-soft focus-visible:border-border-subtle",
        glass:
          "border-border-subtle bg-surface-glass backdrop-blur-md focus-visible:border-border-strong",
      },
      size: {
        default: "h-12 rounded-2xl",
        sm: "h-10 rounded-xl px-3.5 text-base md:text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Input({
  className,
  type,
  variant,
  size,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
