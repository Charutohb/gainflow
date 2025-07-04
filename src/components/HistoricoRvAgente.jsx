import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Função auxiliar para o Cálculo da RV
const parseFromBRL = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, '').replace(',', '.'));
};

const HistoricoRvAgente = () => {
    const { currentUser } = useAuth();
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistorico = useCallback(async () => {
        if (!currentUser?.franquiaId) return;

        try {
            const historicoData = [];
            const hoje = new Date();

            // Loop para calcular a RV dos últimos 6 meses
            for (let i = 1; i <= 6; i++) {
                const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
                const mesId = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, '0')}`;
                
                // 1. Buscar Metas e Parâmetros do mês em questão
                const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', mesId);
                const metaDocSnap = await getDoc(metaDocRef);
                
                // Se não houver metas definidas para este mês, pula para o próximo
                if (!metaDocSnap.exists()) continue;

                const parametros = metaDocSnap.data();
                const metasIndividuais = parametros.distribuicao?.[currentUser.uid];
                
                // Se não houver metas individuais para o agente neste mês, pula para o próximo
                if (!metasIndividuais) continue;

                // 2. Buscar Atividades do Agente no mês em questão
                const inicioDoMes = Timestamp.fromDate(mesReferencia);
                const fimDoMes = Timestamp.fromDate(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0, 23, 59, 59));

                const atividadesQuery = query(collection(db, "atividades"), where("agenteId", "==", currentUser.uid), where("data", ">=", inicioDoMes), where("data", "<=", fimDoMes));
                const atividadesSnapshot = await getDocs(atividadesQuery);

                let realizados = { ativos: 0, migracao: 0, tpv: 0 };
                atividadesSnapshot.forEach(doc => {
                    const atividade = doc.data();
                    if (atividade.tipo === 'Ativação de Conta') realizados.ativos += atividade.valor || 1;
                });

                // 3. Calcular a RV para o mês em questão
                const calcularPilar = (meta, realizado, setpoint, peso, valorRefTotal) => {
                    if (!meta || meta === 0) return 0;
                    const atingimento = realizado / meta;
                    if (atingimento * 100 < setpoint) return 0;
                    const rvReferenciaPilar = valorRefTotal * (peso / 100);
                    return rvReferenciaPilar * atingimento;
                };

                const valorRefTotal = parseFromBRL(parametros.valorReferenciaTotal);
                const rvCalculada = 
                    calcularPilar(metasIndividuais.metaAtivos, realizados.ativos, parametros.setpointAtivos, parametros.pesoAtivos, valorRefTotal) +
                    calcularPilar(metasIndividuais.metaMigracao, realizados.migracao, parametros.setpointMigracao, parametros.pesoMigracao, valorRefTotal) +
                    calcularPilar(metasIndividuais.metaTpvTransacionado, realizados.tpv, parametros.setpointTpv, parametros.pesoTpv, valorRefTotal);
                
                // 4. Aplicar regra do Colchão
                let rvFinal = rvCalculada;
                let valorColchao = 0;
                let complemento = 0;
                const dataCriacao = currentUser.createdAt?.toDate();

                if (dataCriacao) {
                    let mesesDeCasa = (mesReferencia.getFullYear() - dataCriacao.getFullYear()) * 12;
                    mesesDeCasa -= dataCriacao.getMonth();
                    mesesDeCasa += mesReferencia.getMonth();
                    const mesDeContratacao = mesesDeCasa + 1;

                    if (mesDeContratacao === 1) valorColchao = 900;
                    if (mesDeContratacao === 2) valorColchao = 750;
                    if (mesDeContratacao === 3) valorColchao = 450;
                }

                if (rvCalculada < valorColchao) {
                    complemento = valorColchao - rvCalculada;
                    rvFinal = valorColchao;
                }
                
                // Adiciona os dados calculados ao array de histórico
                historicoData.push({
                    mes: mesReferencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
                    rvCalculada,
                    valorColchao,
                    complemento,
                    rvFinal
                });
            }
            
            setHistorico(historicoData);

        } catch (error) {
            console.error("Erro ao buscar histórico de RV: ", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]);

    const formatBRL = (value) => {
        if (isNaN(Number(value))) return 'R$ 0,00';
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (loading) {
        return <p className="text-gray-500">Carregando histórico de RV...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Seu Histórico de Remuneração Variável</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês de Referência</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RV por Desempenho</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Garantia (Colchão)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complemento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RV Final Paga</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {historico.map((item) => (
                            <tr key={item.mes}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{item.mes}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBRL(item.rvCalculada)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBRL(item.valorColchao)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{formatBRL(item.complemento)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatBRL(item.rvFinal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {historico.length === 0 && (
                    <p className="text-center py-4 text-gray-500">Nenhum histórico de RV encontrado para os últimos 6 meses.</p>
                )}
            </div>
        </div>
    );
};

export default HistoricoRvAgente;