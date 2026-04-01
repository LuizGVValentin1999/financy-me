import { router } from '@inertiajs/react';
import { Button, Collapse, Space, Tag } from 'antd';
import { useAntdApp } from '@/hooks/useAntdApp';
import CreateHouseModal from '@/Pages/Profile/Partials/components/CreateHouseModal';
import JoinHouseModal from '@/Pages/Profile/Partials/components/JoinHouseModal';
import { useState } from 'react';
import { FormEventHandler } from 'react';

interface House {
    id: number;
    code: string;
    name: string;
    description?: string;
    role: 'admin' | 'member';
    is_active: boolean;
}

interface ManageHousesFormProps {
    houses: House[];
    active_house_id: number | null;
    className?: string;
}

export default function ManageHousesForm({
    houses,
    active_house_id,
    className = '',
}: ManageHousesFormProps) {
    const { message } = useAntdApp();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [createData, setCreateData] = useState({
        name: '',
        code: '',
        house_password: '',
        house_password_confirmation: '',
    });
    const [joinData, setJoinData] = useState({
        code: '',
        password: '',
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
    const [isLoadingCreate, setIsLoadingCreate] = useState(false);
    const [isLoadingJoin, setIsLoadingJoin] = useState(false);

    const handleSetActive = (houseId: number) => {
        router.patch(route('house.set-active', houseId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Casa alterada com sucesso!');
                // Reload the page to ensure all data is fresh
                router.reload();
            },
        });
    };

    const handleCreateHouse: FormEventHandler = (e) => {
        e.preventDefault();
        setCreateErrors({});
        setIsLoadingCreate(true);

        router.post(route('house.store'), createData, {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Casa criada com sucesso!');
                setIsCreateModalOpen(false);
                setCreateData({
                    name: '',
                    code: '',
                    house_password: '',
                    house_password_confirmation: '',
                });
            },
            onError: (errors) => {
                setCreateErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setIsLoadingCreate(false);
            },
        });
    };

    const handleJoinHouse: FormEventHandler = (e) => {
        e.preventDefault();
        setJoinErrors({});
        setIsLoadingJoin(true);

        router.post(route('house.join'), joinData, {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Você entrou na casa com sucesso!');
                setIsJoinModalOpen(false);
                setJoinData({
                    code: '',
                    password: '',
                });
            },
            onError: (errors) => {
                setJoinErrors(errors as Record<string, string>);
            },
            onFinish: () => {
                setIsLoadingJoin(false);
            },
        });
    };

    const items = [
        {
            key: '1',
            label: `Suas Casas (${houses.length})`,
            children: (
                <div className="space-y-4">
                    {houses.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Você ainda não criou ou entrou em nenhuma casa.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {houses.map((house) => (
                                <div
                                    key={house.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {house.name}
                                            </h3>
                                            <Tag
                                                color={
                                                    house.role === 'admin'
                                                        ? 'red'
                                                        : 'blue'
                                                }
                                            >
                                                {house.role === 'admin'
                                                    ? 'Admin'
                                                    : 'Membro'}
                                            </Tag>
                                            {house.is_active && (
                                                <Tag color="gold">Ativa</Tag>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Código: <code>{house.code}</code>
                                        </p>
                                        {house.description && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                {house.description}
                                            </p>
                                        )}
                                    </div>
                                    {!house.is_active && (
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                handleSetActive(house.id)
                                            }
                                            className="ml-2"
                                        >
                                            Mudar para esta casa
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Gerenciar Casas
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Crie uma nova casa ou entre em uma existente.
                </p>
            </header>

            <div className="mt-6 space-y-4">
                <Collapse items={items} />

                <Space wrap>
                    <Button
                        type="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Criar Nova Casa
                    </Button>
                    <Button
                        onClick={() => setIsJoinModalOpen(true)}
                    >
                        Entrar em Casa
                    </Button>
                </Space>
            </div>

            <CreateHouseModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateErrors({});
                }}
                onSubmit={handleCreateHouse}
                isLoading={isLoadingCreate}
                data={createData}
                setData={setCreateData}
                errors={createErrors}
            />

            <JoinHouseModal
                isOpen={isJoinModalOpen}
                onClose={() => {
                    setIsJoinModalOpen(false);
                    setJoinErrors({});
                }}
                onSubmit={handleJoinHouse}
                isLoading={isLoadingJoin}
                data={joinData}
                setData={setJoinData}
                errors={joinErrors}
            />
        </section>
    );
}
