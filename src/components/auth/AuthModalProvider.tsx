import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { AuthModal } from './AuthModal';

interface AuthModalController {
  openAuthModal: (onSuccess?: () => void) => void;
}

const AuthModalControllerContext = createContext<AuthModalController | undefined>(undefined);

interface AuthModalProviderProps {
  children: ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [onSuccess, setOnSuccess] = useState<(() => void) | null>(null);

  const openAuthModal = (callback?: () => void) => {
    setOnSuccess(() => callback ?? null);
    setIsOpen(true);
  };

  return (
    <AuthModalControllerContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAuthSuccess={() => {
          if (onSuccess) {
            onSuccess();
          }
        }}
      />
    </AuthModalControllerContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalControllerContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}
