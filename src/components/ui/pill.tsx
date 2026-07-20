import { ButtonHTMLAttributes, FormHTMLAttributes, InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable glassmorphic pill button used across landing / measured / auth shells.
 */
export const Pill = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "glass" | "solid" | "outline" }>(
  ({ className, variant = "glass", ...props }, ref) => {
    const variants = {
      glass: "glass text-[#1a1a1a] hover:bg-white/80",
      solid: "bg-[#1a1a1a] text-white hover:bg-black",
      outline: "border border-[#1a1a1a]/15 bg-white/60 text-[#1a1a1a] hover:bg-white",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm lowercase tracking-tight transition-all",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Pill.displayName = "Pill";

/**
 * Search capsule — matches the hero search pill used on landing/measured.
 */
type SearchCapsuleProps = FormHTMLAttributes<HTMLFormElement> & {
  value?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  trailing?: ReactNode;
};

export const SearchCapsule = ({
  value,
  onValueChange,
  placeholder = "search…",
  inputProps,
  trailing,
  className,
  ...form
}: SearchCapsuleProps) => (
  <form
    {...form}
    className={cn(
      "flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-full pl-6 pr-2 py-2 shadow-soft max-w-xl",
      className,
    )}
  >
    <input
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-[#8e8e8e] text-[#1a1a1a] py-2 lowercase"
      {...inputProps}
    />
    {trailing ?? (
      <button
        type="submit"
        aria-label="Submit"
        className="w-11 h-11 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-black transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )}
  </form>
);

/**
 * Small architectural anchor label used at page edges (year, footer text, etc.)
 */
export const EdgeLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn("text-xs text-[#1a1a1a]/70 tracking-wide lowercase", className)}>{children}</span>
);
