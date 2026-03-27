import { Button, Input, Space } from 'antd';
import type { Key } from 'react';

interface TableTextFilterDropdownProps {
    selectedKeys: Key[];
    setSelectedKeys: (keys: Key[]) => void;
    confirm: () => void;
    clearFilters?: () => void;
    placeholder: string;
    widthClassName?: string;
}

export default function TableTextFilterDropdown({
    selectedKeys,
    setSelectedKeys,
    confirm,
    clearFilters,
    placeholder,
    widthClassName = 'w-64',
}: TableTextFilterDropdownProps) {
    return (
        <div className={`${widthClassName} p-3`}>
            <Input
                value={String(selectedKeys[0] ?? '')}
                placeholder={placeholder}
                onChange={(event) =>
                    setSelectedKeys(event.target.value ? [event.target.value] : [])
                }
                onPressEnter={() => confirm()}
            />
            <Space className="mt-3">
                <Button type="primary" size="small" onClick={() => confirm()}>
                    Aplicar
                </Button>
                <Button
                    size="small"
                    onClick={() => {
                        clearFilters?.();
                        confirm();
                    }}
                >
                    Limpar
                </Button>
            </Space>
        </div>
    );
}
