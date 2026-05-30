import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap border text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(11,139,115,0.2)] hover:border-primary-strong hover:bg-primary-strong",
        primary:
          "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(11,139,115,0.2)] hover:border-primary-strong hover:bg-primary-strong",
        secondary:
          "border-border-subtle bg-surface-soft text-text-strong hover:bg-surface-elevated hover:border-border-strong",
        outline:
          "border-border-strong bg-transparent text-text-strong hover:bg-surface-soft",
        ghost:
          "border-transparent bg-transparent text-text-base hover:bg-surface-soft hover:text-text-strong",
        destructive:
          "border-transparent bg-destructive/12 text-destructive hover:bg-destructive/18",
        link: "h-auto border-transparent bg-transparent px-0 py-0 text-primary shadow-none hover:text-primary-strong hover:underline underline-offset-4",
        inverse:
          "border-border-inverse bg-surface-inverse text-text-inverse shadow-[var(--shadow-inverse)] hover:opacity-90",
        pill: "border-transparent bg-surface-soft text-text-strong hover:bg-surface-elevated",
        icon: "border-border-subtle bg-surface-glass text-text-strong backdrop-blur-md hover:bg-surface-elevated",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6",
        xl: "h-14 px-7 text-[0.8125rem]",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
        "icon-lg": "size-12 p-0",
      },
      shape: {
        default: "rounded-xl",
        pill: "rounded-[var(--radius-pill)]",
        square: "rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "default",
    },
    compoundVariants: [
      {
        variant: "link",
        shape: "default",
        className: "rounded-none",
      },
      {
        variant: "icon",
        shape: "default",
        className: "rounded-2xl",
      },
    ],
  },
);

function Button({
  className,
  variant,
  size,
  shape,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
