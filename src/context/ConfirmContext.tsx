import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(() =>
  Promise.resolve(false),
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const stateRef = useRef<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const next: ConfirmState = { ...options, resolve };
      stateRef.current = next;
      setState(next);
    });
  }, []);

  const close = useCallback((result: boolean) => {
    stateRef.current?.resolve(result);
    stateRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state !== null}
        title={state?.title}
        message={state?.message ?? ''}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        destructive={state?.destructive}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
