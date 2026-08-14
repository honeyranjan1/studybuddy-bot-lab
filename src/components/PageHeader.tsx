import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

/** Editorial, theme-safe page header used across all tool pages. */
export const PageHeader = ({ eyebrow, title, description, icon: Icon, actions }: PageHeaderProps) => (
  <motion.header
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mb-8 md:mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
  >
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur-xl px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {Icon && <Icon className="w-3 h-3 text-accent" />} {eyebrow}
      </div>
      <h1 className="mt-4 font-display font-semibold tracking-tight text-foreground text-4xl sm:text-5xl md:text-6xl leading-[0.9] lowercase">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-md text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </motion.header>
);

interface GlassTabsProps<T extends string> {
  tabs: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}

/** Translucent capsule tab switcher. */
export function GlassTabs<T extends string>({ tabs, value, onChange }: GlassTabsProps<T>) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/50 backdrop-blur-xl p-1 mb-6">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-foreground text-background shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />} {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default PageHeader;
