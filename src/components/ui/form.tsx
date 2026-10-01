import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

const control =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-gray-50 disabled:text-gray-500 aria-invalid:border-red-400';

export function Field({
  label,
  hint,
  error,
  optional,
  className = '',
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="font-normal text-gray-400"> (optional)</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({ className = '', ...props }: ComponentProps<'input'>) {
  return <input {...props} className={`${control} ${className}`} />;
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select {...props} className={`${control} ${className}`} />;
}

export function TextArea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={3} {...props} className={`${control} resize-y ${className}`} />;
}

/** Rupee amounts are typed in rupees and sent to the API in paise. */
export function MoneyInput({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">
        ₹
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        {...props}
        className={`${control} pl-7 ${className}`}
      />
    </div>
  );
}

export const rupeesToPaise = (value: FormDataEntryValue | null) => Math.round(Number(value || 0) * 100);
export const paiseToRupees = (paise: number | null | undefined) => (paise == null ? '' : String(paise / 100));

export function Checkbox({ label, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" {...props} className="size-4 rounded border-gray-300 accent-brand" />
      {label}
    </label>
  );
}

export function CodeInput(props: ComponentProps<'input'>) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      placeholder="000000"
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-gray-900 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
    />
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800',
  secondary: 'border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({
  variant = 'primary',
  size = 'md',
  pending = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; pending?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${variants[variant]} ${className}`}
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" pending={pending} className="w-full py-2.5">
      {children}
    </Button>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}
