import { cn } from "@/lib/utils";

/** Kolom formulir. Tetap tanpa gaya agar label bisa menyatu dengan input. */
export function Label({
  className,
  wajib,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { wajib?: boolean }) {
  return (
    <label
      className={cn("block text-sm font-medium text-navy-800", className)}
      {...props}
    >
      {props.children}
      {wajib ? <span className="ml-0.5 text-red-600">*</span> : null}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900",
        "placeholder:text-navy-400 focus:border-navy-500 focus:outline-none",
        "focus:ring-2 focus:ring-navy-200 disabled:bg-navy-50 disabled:text-navy-500",
        "aria-invalid:border-red-500 aria-invalid:ring-red-200",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900",
        "placeholder:text-navy-400 focus:border-navy-500 focus:outline-none",
        "focus:ring-2 focus:ring-navy-200 disabled:bg-navy-50",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900",
        "focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200",
        className,
      )}
      {...props}
    />
  );
}

/** Pembungkus satu baris formulir: label di atas, input, lalu pesan galat. */
export function BarisForm({
  label,
  wajib,
  galat,
  petunjuk,
  children,
  htmlFor,
}: {
  label: string;
  wajib?: boolean;
  galat?: string;
  petunjuk?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} wajib={wajib}>
        {label}
      </Label>
      {children}
      {petunjuk ? <p className="text-xs text-navy-500">{petunjuk}</p> : null}
      {galat ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
