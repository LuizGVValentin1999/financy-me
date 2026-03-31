import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { router, usePage } from '@inertiajs/react';
import { Button, Modal, Collapse, Space, Tag, message } from 'antd';
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
                message.success('Casa alterada com sucesso!');
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
                message.success('Casa criada com sucesso!');
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
                message.success('Você entrou na casa com sucesso!');
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

            {/* Create House Modal */}
            <Modal
                title="Criar Nova Casa"
                open={isCreateModalOpen}
                onCancel={() => {
                    setIsCreateModalOpen(false);
                    setCreateErrors({});
                }}
                footer={null}
                width={500}
            >
                <form onSubmit={handleCreateHouse} className="space-y-4 pt-4">
                    <div>
                        <InputLabel htmlFor="name" value="Nome da Casa" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={createData.name}
                            onChange={(e) =>
                                setCreateData({
                                    ...createData,
                                    name: e.target.value,
                                })
                            }
                            required
                            placeholder="Ex: Casa da Praia"
                        />
                        <InputError
                            className="mt-2"
                            message={createErrors.name}
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="code" value="Código da Casa" />
                        <TextInput
                            id="code"
                            className="mt-1 block w-full"
                            value={createData.code}
                            onChange={(e) =>
                                setCreateData({
                                    ...createData,
                                    code: e.target.value,
                                })
                            }
                            required
                            placeholder="Ex: praia-2024"
                            pattern="^[a-zA-Z0-9_-]+$"
                            title="Apenas letras, números, hífen e underscore"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Código único para entrar nesta casa. Apenas letras,
                            números, hífen e underscore.
                        </p>
                        <InputError
                            className="mt-2"
                            message={createErrors.code}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="house_password"
                            value="Senha da Casa"
                        />
                        <TextInput
                            id="house_password"
                            type="password"
                            className="mt-1 block w-full"
                            value={createData.house_password}
                            onChange={(e) =>
                                setCreateData({
                                    ...createData,
                                    house_password: e.target.value,
                                })
                            }
                            required
                            placeholder="Mínimo 6 caracteres"
                        />
                        <InputError
                            className="mt-2"
                            message={createErrors.house_password}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="house_password_confirmation"
                            value="Confirmar Senha"
                        />
                        <TextInput
                            id="house_password_confirmation"
                            type="password"
                            className="mt-1 block w-full"
                            value={createData.house_password_confirmation}
                            onChange={(e) =>
                                setCreateData({
                                    ...createData,
                                    house_password_confirmation: e.target.value,
                                })
                            }
                            required
                            placeholder="Confirme a senha"
                        />
                        <InputError
                            className="mt-2"
                            message={createErrors.house_password_confirmation}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={isLoadingCreate}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoadingCreate}
                        >
                            Criar Casa
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Join House Modal */}
            <Modal
                title="Entrar em Casa"
                open={isJoinModalOpen}
                onCancel={() => {
                    setIsJoinModalOpen(false);
                    setJoinErrors({});
                }}
                footer={null}
                width={500}
            >
                <form onSubmit={handleJoinHouse} className="space-y-4 pt-4">
                    <div>
                        <InputLabel htmlFor="join_code" value="Código da Casa" />
                        <TextInput
                            id="join_code"
                            className="mt-1 block w-full"
                            value={joinData.code}
                            onChange={(e) =>
                                setJoinData({
                                    ...joinData,
                                    code: e.target.value,
                                })
                            }
                            required
                            placeholder="Ex: praia-2024"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Peça o código da casa ao administrador.
                        </p>
                        <InputError
                            className="mt-2"
                            message={joinErrors.code}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="join_password"
                            value="Senha da Casa"
                        />
                        <TextInput
                            id="join_password"
                            type="password"
                            className="mt-1 block w-full"
                            value={joinData.password}
                            onChange={(e) =>
                                setJoinData({
                                    ...joinData,
                                    password: e.target.value,
                                })
                            }
                            required
                            placeholder="Digite a senha da casa"
                        />
                        <InputError
                            className="mt-2"
                            message={joinErrors.password}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            onClick={() => setIsJoinModalOpen(false)}
                            disabled={isLoadingJoin}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoadingJoin}
                        >
                            Entrar
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
