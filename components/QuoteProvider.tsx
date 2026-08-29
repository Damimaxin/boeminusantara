"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Item di keranjang penawaran. Harga EXCLUDE PPN. */
export type QuoteItem = {
  slug: string;
  name: string;
  price: number; // exclude PPN
  qty: number;
};

type QuoteContextValue = {
  items: QuoteItem[];
  count: number; // total qty seluruh item
  subtotal: number; // exclude PPN
  addItem: (item: { slug: string; name: string; price: number; qty?: number }) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "boemi-quote";

const QuoteContext = createContext<QuoteContextValue | null>(null);

function loadItems(): QuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitasi minimal supaya data korup tidak merusak UI.
    return parsed
      .filter(
        (x): x is QuoteItem =>
          x &&
          typeof x.slug === "string" &&
          typeof x.name === "string" &&
          typeof x.price === "number" &&
          typeof x.qty === "number",
      )
      .map((x) => ({ ...x, qty: Math.max(1, Math.floor(x.qty)) }));
  } catch {
    return [];
  }
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Muat dari localStorage setelah mount (aman SSR).
  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  // Persist tiap perubahan (hanya setelah hydrate agar tidak menimpa data awal).
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage penuh / diblokir — abaikan */
    }
  }, [items, hydrated]);

  const addItem = useCallback<QuoteContextValue["addItem"]>((item) => {
    const qty = Math.max(1, Math.floor(item.qty ?? 1));
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.slug === item.slug);
      if (idx === -1) {
        return [
          ...prev,
          { slug: item.slug, name: item.name, price: item.price, qty },
        ];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      return next;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const q = Math.max(1, Math.floor(qty || 1));
    setItems((prev) =>
      prev.map((x) => (x.slug === slug ? { ...x, qty: q } : x)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((sum, x) => sum + x.qty, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + x.price * x.qty, 0),
    [items],
  );

  const value = useMemo<QuoteContextValue>(
    () => ({ items, count, subtotal, addItem, removeItem, setQty, clear }),
    [items, count, subtotal, addItem, removeItem, setQty, clear],
  );

  return (
    <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
  );
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) {
    throw new Error("useQuote harus dipakai di dalam <QuoteProvider>");
  }
  return ctx;
}
