import type { CSSProperties } from "react";

/**
 * Reading themes for the Quran reader. Each one overrides the colour tokens
 * for the reader subtree only (the rest of the site keeps its own theme), so
 * every card, marker and button inside the reader follows the page colour.
 * "app" follows the site's light / dark theme.
 */
export type ReaderThemeId = "emerald" | "night" | "mint" | "paper" | "cream" | "app";

type ThemeDef = {
  id: ReaderThemeId;
  label: string;
  dark: boolean;
  /** Small swatch shown in the settings picker. */
  swatch: string;
  ink: string;
  vars?: Record<string, string>;
};

const dark = (bg: string, card: string, ink: string, muted: string, line: string, accent: string, gold: string) => ({
  "--reader-bg": bg,
  "--reader-bar": "rgb(8 22 18 / 0.78)",
  "--background": "transparent",
  "--card": card,
  "--popover": "#14211c",
  "--foreground": ink,
  "--card-foreground": ink,
  "--muted": "rgb(255 255 255 / 0.06)",
  "--accent": "rgb(255 255 255 / 0.08)",
  "--muted-foreground": muted,
  "--subtle-foreground": muted,
  "--border": line,
  "--border-strong": "rgb(255 255 255 / 0.16)",
  "--primary": accent,
  "--primary-hover": accent,
  "--primary-foreground": "#04261a",
  "--primary-soft": "rgb(63 207 149 / 0.16)",
  "--primary-soft-foreground": accent,
  "--gold": gold,
  "--gold-soft": "rgb(227 194 122 / 0.14)",
  "--gold-foreground": gold,
});

const light = (bg: string, card: string, ink: string, muted: string, line: string, accent: string, gold: string, soft: string) => ({
  "--reader-bg": bg,
  "--reader-bar": "rgb(255 255 255 / 0.72)",
  "--background": "transparent",
  "--card": card,
  "--popover": card,
  "--foreground": ink,
  "--card-foreground": ink,
  "--muted": "rgb(0 0 0 / 0.04)",
  "--accent": "rgb(0 0 0 / 0.05)",
  "--muted-foreground": muted,
  "--subtle-foreground": muted,
  "--border": line,
  "--border-strong": "rgb(0 0 0 / 0.14)",
  "--primary": accent,
  "--primary-hover": accent,
  "--primary-foreground": "#ffffff",
  "--primary-soft": soft,
  "--primary-soft-foreground": accent,
  "--gold": gold,
  "--gold-soft": "rgb(185 134 44 / 0.12)",
  "--gold-foreground": gold,
});

export const READER_THEMES: ThemeDef[] = [
  {
    id: "emerald",
    label: "সবুজ রাত",
    dark: true,
    swatch: "linear-gradient(160deg,#0f3b2e,#1b2733)",
    ink: "#f3efe2",
    vars: dark("linear-gradient(180deg,#0f3a2d 0%,#14302a 35%,#18232f 100%)", "rgb(255 255 255 / 0.04)", "#f3efe2", "#a7c2b5", "rgb(255 255 255 / 0.09)", "#3fcf95", "#e3c27a"),
  },
  {
    id: "night",
    label: "গভীর রাত",
    dark: true,
    swatch: "linear-gradient(160deg,#0b1220,#141b2b)",
    ink: "#e6e9ef",
    vars: dark("linear-gradient(180deg,#0b1220 0%,#111827 100%)", "rgb(255 255 255 / 0.035)", "#e6e9ef", "#98a3b8", "rgb(255 255 255 / 0.08)", "#5fd3a8", "#d9b56a"),
  },
  {
    id: "mint",
    label: "সবুজাভ",
    dark: false,
    swatch: "linear-gradient(160deg,#f4faf2,#e2f1e2)",
    ink: "#1d2a22",
    vars: light("linear-gradient(180deg,#f5fbf3 0%,#e6f3e6 100%)", "rgb(255 255 255 / 0.7)", "#1d2a22", "#5d7064", "rgb(0 0 0 / 0.07)", "#0b7a55", "#9b6d1c", "rgb(11 122 85 / 0.1)"),
  },
  {
    id: "paper",
    label: "সাদা",
    dark: false,
    swatch: "linear-gradient(160deg,#ffffff,#eef1f4)",
    ink: "#1a1f24",
    vars: light("linear-gradient(180deg,#ffffff 0%,#f3f5f7 100%)", "#ffffff", "#1a1f24", "#5f6b76", "rgb(0 0 0 / 0.08)", "#0b6e4f", "#9b6d1c", "rgb(11 110 79 / 0.08)"),
  },
  {
    id: "cream",
    label: "সেপিয়া",
    dark: false,
    swatch: "linear-gradient(160deg,#fbf3e2,#efdfc0)",
    ink: "#3a2e1c",
    vars: light("linear-gradient(180deg,#fbf3e2 0%,#f1e3c6 100%)", "rgb(255 252 244 / 0.75)", "#3a2e1c", "#77664a", "rgb(90 60 20 / 0.12)", "#8a5a14", "#8a5a14", "rgb(138 90 20 / 0.1)"),
  },
  { id: "app", label: "সাইটের মতো", dark: false, swatch: "conic-gradient(#0f3b2e 0 50%,#f6f5ef 0 100%)", ink: "currentColor" },
];

export function getReaderTheme(id: string | undefined) {
  return READER_THEMES.find((theme) => theme.id === id) ?? READER_THEMES[0];
}

/** Inline style applying a theme to the reader subtree. */
export function readerThemeStyle(id: string | undefined): CSSProperties | undefined {
  const theme = getReaderTheme(id);
  if (!theme.vars) return undefined;
  return { ...(theme.vars as CSSProperties), colorScheme: theme.dark ? "dark" : "light", background: "var(--reader-bg)" };
}
