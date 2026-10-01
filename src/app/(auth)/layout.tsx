export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-display text-lg font-bold tracking-wide">
          <span className="text-brand">NEON</span> ADDA
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Admin
          </span>
        </p>
        {children}
      </div>
    </main>
  );
}
