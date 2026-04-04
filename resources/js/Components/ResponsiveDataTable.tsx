import { Grid, Input, Pagination, Table } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Key, ReactNode, useEffect, useMemo, useState } from 'react';

type MobileRenderMeta<T> = {
    key: Key;
    isSelected: boolean;
    rowSelectionEnabled: boolean;
    selectionDisabled: boolean;
    toggleSelected: (checked: boolean) => void;
    selectedKeys: Key[];
    dataSource: T[];
};

interface ResponsiveDataTableProps<T extends object> {
    rowKey: TableProps<T>['rowKey'];
    columns: ColumnsType<T>;
    dataSource: T[];
    rowSelection?: TableProps<T>['rowSelection'];
    pagination?: TableProps<T>['pagination'];
    expandable?: TableProps<T>['expandable'];
    size?: TableProps<T>['size'];
    scroll?: TableProps<T>['scroll'];
    rowClassName?: TableProps<T>['rowClassName'];
    onRow?: TableProps<T>['onRow'];
    locale?: TableProps<T>['locale'];
    mobilePageSize?: number;
    searchEnabled?: boolean;
    searchPlaceholder?: string;
    searchFields?: string[];
    searchMatcher?: (record: T, searchTerm: string) => boolean;
    mobileRenderCard: (record: T, meta: MobileRenderMeta<T>) => ReactNode;
}

const getFieldValue = (record: unknown, fieldPath: string) => {
    return fieldPath
        .split('.')
        .reduce<unknown>((current, segment) => {
            if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
                return (current as Record<string, unknown>)[segment];
            }

            return undefined;
        }, record);
};

export default function ResponsiveDataTable<T extends object>({
    rowKey,
    columns,
    dataSource,
    rowSelection,
    pagination,
    expandable,
    size = 'middle',
    scroll,
    rowClassName,
    onRow,
    locale,
    mobilePageSize,
    searchEnabled = false,
    searchPlaceholder = 'Buscar na tabela',
    searchFields,
    searchMatcher,
    mobileRenderCard,
}: ResponsiveDataTableProps<T>) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [mobilePage, setMobilePage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedKeys = rowSelection?.selectedRowKeys ?? [];
    const resolvedMobilePageSize =
        mobilePageSize ??
        (pagination && typeof pagination === 'object' && 'pageSize' in pagination
            ? Number(pagination.pageSize ?? 10)
            : 10);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredDataSource = useMemo(() => {
        if (!searchEnabled || normalizedSearchTerm === '') {
            return dataSource;
        }

        if (searchMatcher) {
            return dataSource.filter((record) => searchMatcher(record, normalizedSearchTerm));
        }

        return dataSource.filter((record) => {
            if (searchFields && searchFields.length > 0) {
                return searchFields.some((fieldPath) => {
                    const fieldValue = getFieldValue(record, fieldPath);
                    return String(fieldValue ?? '').toLowerCase().includes(normalizedSearchTerm);
                });
            }

            return JSON.stringify(record).toLowerCase().includes(normalizedSearchTerm);
        });
    }, [dataSource, normalizedSearchTerm, searchEnabled, searchFields, searchMatcher]);

    useEffect(() => {
        setMobilePage(1);
    }, [filteredDataSource.length, searchTerm]);

    const getRecordKey = (record: T): Key => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }

        const keyField = rowKey ?? 'key';
        return (record as Record<string, Key>)[String(keyField)];
    };

    const selectedRowsByKeys = (keys: Key[]) =>
        dataSource.filter((record) =>
            keys.some((key) => String(key) === String(getRecordKey(record))),
        );

    const paginatedMobileRecords = useMemo(() => {
        if (pagination === false) {
            return dataSource;
        }

        const startIndex = (mobilePage - 1) * resolvedMobilePageSize;
        return filteredDataSource.slice(startIndex, startIndex + resolvedMobilePageSize);
    }, [filteredDataSource, mobilePage, pagination, resolvedMobilePageSize]);

    const searchInput = searchEnabled ? (
        <div className="flex w-full justify-end">
            <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                allowClear
                size="large"
                className={isMobile ? 'w-full' : 'w-full max-w-md'}
            />
        </div>
    ) : null;

    if (!isMobile) {
        return (
            <div className="space-y-3">
                {searchInput}
                <div className="purchase-ant-table">
                <Table<T>
                    rowKey={rowKey}
                    columns={columns}
                    dataSource={filteredDataSource}
                    rowSelection={rowSelection}
                    pagination={pagination}
                    expandable={expandable}
                    size={size}
                    scroll={scroll}
                    rowClassName={rowClassName}
                    onRow={onRow}
                    locale={locale}
                />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {searchInput}

            {paginatedMobileRecords.length > 0 ? (
                <div className="space-y-3">
                    {paginatedMobileRecords.map((record) => {
                        const key = getRecordKey(record);
                        const isSelected = selectedKeys.some(
                            (selectedKey) => String(selectedKey) === String(key),
                        );
                        const selectionDisabled = Boolean(
                            rowSelection?.getCheckboxProps?.(record).disabled,
                        );

                        return mobileRenderCard(record, {
                            key,
                            isSelected,
                            rowSelectionEnabled: Boolean(rowSelection),
                            selectionDisabled,
                            toggleSelected: (checked: boolean) => {
                                if (!rowSelection || selectionDisabled) {
                                    return;
                                }

                                const nextKeys = checked
                                    ? Array.from(
                                          new Map(
                                              [...selectedKeys, key].map((item) => [
                                                  String(item),
                                                  item,
                                              ]),
                                          ).values(),
                                      )
                                    : selectedKeys.filter(
                                          (selectedKey) =>
                                              String(selectedKey) !== String(key),
                                      );

                                rowSelection.onChange?.(nextKeys, selectedRowsByKeys(nextKeys), {
                                    type: 'single',
                                });
                            },
                            selectedKeys,
                            dataSource,
                        });
                    })}
                </div>
            ) : (
                <div className="rounded-[26px] border border-white/80 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)]">
                    {typeof locale?.emptyText === 'function'
                        ? locale.emptyText()
                        : (locale?.emptyText ?? 'Nenhum registro encontrado.')}
                </div>
            )}

            {pagination !== false && filteredDataSource.length > resolvedMobilePageSize ? (
                <div className="flex justify-center pt-2">
                    <Pagination
                        current={mobilePage}
                        pageSize={resolvedMobilePageSize}
                        total={filteredDataSource.length}
                        onChange={setMobilePage}
                        showSizeChanger={false}
                        simple
                    />
                </div>
            ) : null}
        </div>
    );
}
