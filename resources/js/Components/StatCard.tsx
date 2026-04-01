export default function StatCard({
    label,
    value,
    hint,
    tone = 'bg-[#f8f4ec]',
}: {
    label: string;
    value: string;
    hint: string;
    tone?: string;
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-[28px] border border-white/70 p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.65)] ${tone}`}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/55 to-transparent" />
            <p className="relative text-xs uppercase tracking-[0.24em] text-slate-500">
                {label}
            </p>
            <p className="relative mt-4 break-words text-2xl font-semibold leading-tight text-slate-900 md:text-[1.75rem]">
                {value}
            </p>
            <p className="relative mt-3 text-sm leading-6 text-slate-600">{hint}</p>
        </div>
    );
}
