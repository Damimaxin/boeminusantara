"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Keranjang BELI LANGSUNG. Kembarannya QuoteProvider (keranjang penawaran/RFQ)
 * — sengaja dipisah karena alurnya beda: yang ini berujung pembayaran.
 *
 * PENTING: `price` di sini cuma untuk tampilan. Saat checkout, server
 * menghitung ulang harga dari database berdasarkan slug — nilai dari browser
 * tidak pernah dipercaya.
 */
export type CartItem = {
  slug: string;
  name: string;
  price: number; // exclude PPN — tampilan saja
  image: string | null;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "boemi-cart";
const MAX_QTY = 999;

const CartContext = createContext<CartContextValue | null>(null);

function loadItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CartItem =>
          x &&
          typeof x.slug === "string" &&
          typeof x.name === "string" &&
          typeof x.price === "number" &&
          typeof x.qty === "number",
      )
      .map((x) => ({
        ...x,
        image: typeof x.image === "string" ? x.image : null,
        qty: Math.min(MAX_QTY, Math.max(1, Math.floor(x.qty))),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage penuh / diblokir — abaikan */
    }
  }, [items, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((item) => {
    const qty = Math.max(1, Math.floor(item.qty ?? 1));
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.slug === item.slug);
      if (idx === -1) {
        return [...prev, { ...item, qty }];
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        qty: Math.min(MAX_QTY, next[idx].qty + qty),
      };
      return next;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const q = Math.min(MAX_QTY, Math.max(1, Math.floor(qty || 1)));
    setItems((prev) => prev.map((x) => (x.slug === slug ? { ...x, qty: q } : x)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.price * x.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotal, hydrated, addItem, removeItem, setQty, clear }),
    [items, count, subtotal, hydrated, addItem, removeItem, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam <CartProvider>");
  return ctx;
}
