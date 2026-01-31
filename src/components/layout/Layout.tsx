import type { ReactNode } from 'react';
import { useState } from 'react';
import { Header } from './Header';
import { CartDrawer } from '../cart/CartDrawer';
import { AuthModalProvider } from '../auth/AuthModalProvider';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="app-root">
      <AuthModalProvider>
        <Header onCartClick={() => setIsCartOpen(true)} />
        <main className="app-main">{children}</main>
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </AuthModalProvider>
    </div>
  );
}
