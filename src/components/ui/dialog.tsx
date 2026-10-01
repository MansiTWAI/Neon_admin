'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

/** A modal on the native <dialog> element, which handles focus trapping and Escape for us. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
