import { Button, Select } from 'antd';
import type { PurchaseGroupBy } from './types';

interface GroupingToolbarProps {
    groupBy: PurchaseGroupBy;
    entriesCount: number;
    onChangeGroupBy: (value: PurchaseGroupBy) => void;
}

export default function GroupingToolbar({
    groupBy,
    entriesCount,
    onChangeGroupBy,
}: GroupingToolbarProps) {
    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ec] px-4 py-4">
            <div>
                <p className="text-sm font-semibold text-slate-700">{entriesCount} registros carregados</p>
                <p className="text-sm text-slate-500">
                    Use os filtros do cabeçalho, clique na linha para editar e agrupe quando fizer sentido.
                </p>
            </div>

            <div className="flex min-w-[260px] items-center gap-3">
                <Select
                    value={groupBy}
                    className="w-full"
                    size="large"
                    onChange={onChangeGroupBy}
                    options={[
                        { value: 'none', label: 'Sem agrupamento' },
                        { value: 'product', label: 'Agrupar por produto' },
                        { value: 'source', label: 'Agrupar por origem' },
                        { value: 'invoice_reference', label: 'Agrupar por referencia' },
                        { value: 'date', label: 'Agrupar por data' },
                    ]}
                />
                {groupBy !== 'none' && <Button onClick={() => onChangeGroupBy('none')}>Limpar</Button>}
            </div>
        </div>
    );
}
