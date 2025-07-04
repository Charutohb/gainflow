import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// --- Componente Interno para a Barra de Progresso ---
const ProgressBar = ({ value, max }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    const displayPercentage = Math.min(percentage, 100);

    let barColor = 'bg-blue-600';
    if (percentage >= 100) {
        barColor = 'bg-green-500';
    }

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${displayPercentage}%` }}></div>
        </div>
    );
};

const AcompanhamentoEquipe = () => {
    const { currentUser } = useAuth();
    const [acompanhamentoData, setAcompanhamentoData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAcompanhamento = useCallback(async () => {
        if (!currentUser?.franquiaId) return;

        try {
            // 1. Definir o período (Mês ATUAL)
            const hoje = new Date();
            const mesId = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
            const inicioDoMes = Timestamp.fromDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
            const fimDoMes = Timestamp.fromDate(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59));

            // 2. Buscar as Metas e a Distribuição para o mês atual
            const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', mesId);
            const metaDocSnap = await getDoc(metaDocRef);
            const distribuicaoMetas = metaDocSnap.exists() ? metaDocSnap.data().distribuicao : {};

            // 3. Buscar todos os agentes ativos da franquia
            const agentesQuery = query(collection(db, "usuarios"), where("franquiaId", "==", currentUser.franquiaId), where("perfil", "==", "agente"), where("status", "==", "ativo"));
            const agentesSnapshot = await getDocs(agentesQuery);
            const agentesList = agentesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 4. Buscar TODAS as atividades da franquia no mês atual
            const atividadesQuery = query(
                collection(db, "atividades"),
                where("franquiaId", "==", currentUser.franquiaId),
                where("data", ">=", inicioDoMes),
                where("data", "<=", fimDoMes)
            );
            const atividadesSnapshot = await getDocs(atividadesQuery);
            
            // 5. Calcular o realizado de cada agente
            const realizadosPorAgente = {};
            atividadesSnapshot.forEach(doc => {
                const atividade = doc.data();
                const agenteId = atividade.agenteId;
                if (!realizadosPorAgente[agenteId]) {
                    realizadosPorAgente[agenteId] = { realizadosAtivos: 0, realizadosMigracao: 0, realizadosTpv: 0 };
                }
                if (atividade.tipo === 'Ativação de Conta') {
                    realizadosPorAgente[agenteId].realizadosAtivos += atividade.valor || 1;
                }
                // Adicione aqui a lógica para somar Migração e TPV das atividades
            });

            // 6. Montar o objeto final para exibição
            const dataFinal = agentesList.map(agente => {
                const metas = distribuicaoMetas[agente.id] || { metaAtivos: 0, metaMigracao: 0, metaTpvTransacionado: 0 };
                const realizados = realizadosPorAgente[agente.id] || { realizadosAtivos: 0, realizadosMigracao: 0, realizadosTpv: 0 };
                return {
                    id: agente.id,
                    nome: agente.nome,
                    ...metas,
                    ...realizados
                };
            });

            setAcompanhamentoData(dataFinal);

        } catch (error) {
            console.error("Erro ao buscar dados de acompanhamento:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAcompanhamento();
    }, [fetchAcompanhamento]);

    if (loading) {
        return <p>Carregando dados de acompanhamento...</p>;
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Acompanhamento da Equipe (Mês Atual)</h3>
            <div className="space-y-6">
                {acompanhamentoData.map(agente => (
                    <div key={agente.id} className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-bold text-lg text-gray-900">{agente.nome}</h4>
                        <div className="mt-4 space-y-3">
                            {/* Progresso de Novos Ativos */}
                            <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>Novos Ativos</span>
                                    <span>{agente.realizadosAtivos} / {agente.metaAtivos}</span>
                                </div>
                                <ProgressBar value={agente.realizadosAtivos} max={agente.metaAtivos} />
                            </div>
                            {/* Progresso de Migração */}
                            <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>Migração</span>
                                    <span>{agente.realizadosMigracao}% / {agente.metaMigracao}%</span>
                                </div>
                                <ProgressBar value={agente.realizadosMigracao} max={agente.metaMigracao} />
                            </div>
                            {/* Progresso de TPV */}
                            <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>TPV (R$)</span>
                                    <span>{agente.realizadosTpv.toLocaleString('pt-BR')} / {agente.metaTpvTransacionado.toLocaleString('pt-BR')}</span>
                                </div>
                                <ProgressBar value={agente.realizadosTpv} max={agente.metaTpvTransacionado} />
                            </div>
                        </div>
                    </div>
                ))}
                {acompanhamentoData.length === 0 && (
                    <p className="text-gray-500 italic">Nenhum agente ativo com metas distribuídas para este mês.</p>
                )}
            </div>
        </div>
    );
};

export default AcompanhamentoEquipe;