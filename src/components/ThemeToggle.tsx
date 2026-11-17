"use client";
import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";

function applyTheme() {
  let dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  try {
    const saved = localStorage.getItem("sne-theme");
    if (saved === "dark" || saved === "light") dark = saved === "dark";
  } catch {
    /* Fall back to the device preference. */
  }
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    applyTheme();
    listener();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === null || event.key === "sne-theme") update();
  };
  window.addEventListener("sne-theme-change", listener);
  window.addEventListener("storage", storage);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener("sne-theme-change", listener);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", update);
  };
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const label = dark ? "Activar tema claro" : "Activar tema oscuro";
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("sne-theme", next ? "dark" : "light");
    } catch {
      /* The current tab still changes theme when storage is blocked. */
    }
    window.dispatchEvent(new Event("sne-theme-change"));
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={dark}
      className="flex size-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
