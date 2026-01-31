import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export type CartItemOptions = {
  furType: string;
  activityLevel: string;
  extras: string[];
};

export type CartItem = {
  id: string;
  name: string;
  basePrice: number;
  price: number;
  options?: CartItemOptions;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const buildAuthHeaders = (token: string | null): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

type AddItemPayload = Omit<CartItem, 'quantity'> & { quantity?: number };

type CartContextValue = {
  state: CartState;
  addItem: (item: AddItemPayload) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, setState] = useState<CartState>(initialState);
  const { token } = useAuth();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch('/api/cart', {
          headers: {
            ...buildAuthHeaders(token),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load cart');
        }

        const data: { items: CartItem[] } = await response.json();
        setState({ items: data.items });
      } catch (err) {
        console.error('Error loading cart', err);
      }
    };

    void loadCart();
  }, [token]);

  const value: CartContextValue = {
    state,
    addItem: (item) => {
      void (async () => {
        try {
          const response = await fetch('/api/cart/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...buildAuthHeaders(token),
            },
            body: JSON.stringify(item),
          });

          if (!response.ok) {
            throw new Error('Failed to add item to cart');
          }

          const data: { items: CartItem[] } = await response.json();
          setState({ items: data.items });
        } catch (err) {
          console.error('Error adding item to cart', err);
        }
      })();
    },
    removeItem: (id) => {
      void (async () => {
        try {
          const response = await fetch(`/api/cart/items/${id}`, {
            method: 'DELETE',
            headers: {
              ...buildAuthHeaders(token),
            },
          });

          if (!response.ok && response.status !== 204) {
            throw new Error('Failed to remove item from cart');
          }

          const cartResponse = await fetch('/api/cart', {
            headers: {
              ...buildAuthHeaders(token),
            },
          });
          if (!cartResponse.ok) {
            throw new Error('Failed to reload cart after remove');
          }

          const data: { items: CartItem[] } = await cartResponse.json();
          setState({ items: data.items });
        } catch (err) {
          console.error('Error removing item from cart', err);
        }
      })();
    },
    changeQuantity: (id, quantity) => {
      void (async () => {
        try {
          const response = await fetch(`/api/cart/items/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...buildAuthHeaders(token),
            },
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            throw new Error('Failed to change cart item quantity');
          }

          const data: { items: CartItem[] } = await response.json();
          setState({ items: data.items });
        } catch (err) {
          console.error('Error changing cart item quantity', err);
        }
      })();
    },
    clearCart: () => {
      void (async () => {
        try {
          const response = await fetch('/api/cart/clear', {
            method: 'POST',
            headers: {
              ...buildAuthHeaders(token),
            },
          });

          if (!response.ok && response.status !== 204) {
            throw new Error('Failed to clear cart');
          }

          setState(initialState);
        } catch (err) {
          console.error('Error clearing cart', err);
        }
      })();
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
