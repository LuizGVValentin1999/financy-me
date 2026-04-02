import { Grid, Pagination, Table } from 'antd';
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
    mobileHint?: ReactNode;
    mobileRenderCard: (record: T, meta: MobileRenderMeta<T>) => ReactNode;
}

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
    mobileHint,
    mobileRenderCard,
}: ResponsiveDataTableProps<T>) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [mobilePage, setMobilePage] = useState(1);

    const selectedKeys = rowSelection?.selectedRowKeys ?? [];
    const resolvedMobilePageSize =
        mobilePageSize ??
        (pagination && typeof pagination === 'object' && 'pageSize' in pagination
            ? Number(pagination.pageSize ?? 10)
            : 10);

    useEffect(() => {
        setMobilePage(1);
    }, [dataSource.length]);

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
        return dataSource.slice(startIndex, startIndex + resolvedMobilePageSize);
    }, [dataSource, mobilePage, pagination, resolvedMobilePageSize]);

    if (!isMobile) {
        return (
            <div className="purchase-ant-table">
                <Table<T>
                    rowKey={rowKey}
                    columns={columns}
                    dataSource={dataSource}
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
        );
    }

    return (
        <div className="space-y-4">
            {mobileHint ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(241,245,249,0.75)_100%)] px-4 py-3 text-sm leading-6 text-slate-500">
                    {mobileHint}
                </div>
            ) : null}

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

            {pagination !== false && dataSource.length > resolvedMobilePageSize ? (
                <div className="flex justify-center pt-2">
                    <Pagination
                        current={mobilePage}
                        pageSize={resolvedMobilePageSize}
                        total={dataSource.length}
                        onChange={setMobilePage}
                        showSizeChanger={false}
                        simple
                    />
                </div>
            ) : null}
        </div>
    );
}
