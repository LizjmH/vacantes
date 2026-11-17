"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function EmployerSearch({ query }: { query: string }) {
  const [search, setSearch] = useState({ query, value: query });
  const [submitted, setSubmitted] = useState(query);
  // Preserve text typed while a search is in flight; synchronize external navigation.
  if (search.query !== query) {
    setSearch({ query, value: query === submitted ? search.value : query });
  }
  const value = search.value;
  function setValue(value: string) {
    setSearch((current) => ({ ...current, value }));
  }
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const lastQuery = useRef(query);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    lastQuery.current = query;
  }, [query]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = value.trim();
      if (lastQuery.current === next) return;
      lastQuery.current = next;
      setSubmitted(next);
      startTransition(() =>
        router.replace(
          `${pathname}${next ? `?q=${encodeURIComponent(next)}` : ""}`,
          { scroll: false },
        ),
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);
  return (
    <form
      action={pathname}
      role="search"
      aria-label="Buscar empleadores"
      onSubmit={(event) => {
        event.preventDefault();
        const next = value.trim();
        lastQuery.current = next;
        setSubmitted(next);
        startTransition(() =>
          router.replace(
            `${pathname}${next ? `?q=${encodeURIComponent(next)}` : ""}`,
            { scroll: false },
          ),
        );
      }}
      className="mb-8 rounded-2xl border border-line bg-panel p-5 shadow-sm shadow-black/[0.02] sm:p-6"
    >
      <label
        htmlFor="buscar-empleador"
        className="mb-4 block text-base font-semibold text-ink"
      >
        Buscar empleador
      </label>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-secondary">
            <Icon name="search" />
          </span>
          <input
            ref={input}
            id="buscar-empleador"
            name="q"
            type="search"
            maxLength={200}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Nombre, RFC, folio o contacto…"
            aria-describedby="search-help"
            className="min-h-12 w-full rounded-xl border border-input-line bg-panel py-3 pr-4 pl-12 text-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
        >
          Buscar
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              input.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
            className="flex size-12 items-center justify-center rounded-xl border border-input-line text-secondary"
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      <p id="search-help" className="sr-only">
        Escribe una parte del dato. También puedes combinar palabras, por
        ejemplo: empresa y apellido del contacto.
      </p>
      <p role="status" className="sr-only">
        {pending
          ? "Buscando…"
          : "Los resultados se actualizan mientras escribes."}
      </p>
    </form>
  );
}
