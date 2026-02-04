/** localStorage key for startup user view mode: see main app as "member" or stay in "startup" hub. */
const KEY = "equalmint_startup_view_mode";

export type StartupViewMode = "startup" | "normal";

export function getStartupViewMode(): StartupViewMode {
  if (typeof window === "undefined") return "startup";
  const v = localStorage.getItem(KEY);
  return v === "normal" ? "normal" : "startup";
}

export function setStartupViewMode(mode: StartupViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, mode);
}
