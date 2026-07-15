import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cart:v1';

export interface CartItem {
  listingId: string;
  name: string;
  pricePerUnit: number;
  unit: string;
  photoUrl?: string;
  quantityAvailable: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>, qty: number) => void;
  updateQty: (listingId: string, qty: number) => void;
  removeFromCart: (listingId: string) => void;
  loaded: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, 'qty'>, qty: number) => {
      setItems((prev) => {
        const clampedQty = Math.min(qty, item.quantityAvailable);
        const existing = prev.find((i) => i.listingId === item.listingId);
        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i.listingId === item.listingId
              ? { ...i, qty: Math.min(i.qty + clampedQty, item.quantityAvailable) }
              : i
          );
        } else {
          next = [...prev, { ...item, qty: clampedQty }];
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const updateQty = useCallback(
    (listingId: string, qty: number) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i.listingId === listingId ? { ...i, qty: Math.max(0, Math.min(qty, i.quantityAvailable)) } : i
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((listingId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.listingId !== listingId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return React.createElement(
    CartContext.Provider,
    { value: { items, addToCart, updateQty, removeFromCart, loaded } },
    children
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
