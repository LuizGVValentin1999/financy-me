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
        <div className={`rounded-[28px] p-5 ${tone}`}>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                {label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
        </div>
    );
}
