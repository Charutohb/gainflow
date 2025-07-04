import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// --- Componente Interno para a Barra de Progresso ---
const ProgressBar = ({ value, max, setpoint }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);

    let barColor = 'bg-red-500';
    if (percentage >= setpoint) barColor = 'bg-orange-500';
    if (percentage >= 100) barColor = 'bg-green-500';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${displayPercentage}%` }}></div>
        <p className="text-right text-xs font-semibold text-gray-600 mt-1">{Math.round(percentage)}%</p>
      </div>
    );
};

// --- Função Auxiliar para o Cálculo da RV ---
const parseFromBRL = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, '').replace(',', '.'));
};

const CardMetasAgente = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rvData, setRvData] = useState(null);
    const [mesReferencia, setMesReferencia] = useState('');

    const calcularRV = useCallback(async () => {
        if (!currentUser?.franquiaId || !currentUser?.planoCarreiraId || !currentUser?.dataContratacao) {
            setError("Dados do agente incompletos (Plano de Carreira ou Data de Contratação). Contate seu gestor.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Definir o período (Mês Anterior - M0)
            const hoje = new Date();
            const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
            const mesId = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`;
            setMesReferencia(mesAnterior.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));

            // 2. Buscar o Plano de Carreira do Agente para pegar o Valor de Referência
            const planoRef = doc(db, 'franquias', currentUser.franquiaId, 'planosDeCarreira', currentUser.planoCarreiraId);
            const planoSnap = await getDoc(planoRef);
            if (!planoSnap.exists()) throw new Error("Não foi possível encontrar seu plano de carreira. Contate seu gestor.");
            const valorRefTotal = planoSnap.data().valorReferenciaRV;

            // 3. Buscar os Parâmetros e Metas do Mês
            const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', mesId);
            const metaDocSnap = await getDoc(metaDocRef);
            if (!metaDocSnap.exists()) throw new Error("As metas para o período de apuração ainda não foram definidas pelo seu gestor.");
            
            const parametros = metaDocSnap.data();
            const metasIndividuais = parametros.distribuicao?.[currentUser.uid];
            if (!metasIndividuais) throw new Error("Suas metas individuais não foram distribuídas para este período.");

            // 4. Buscar as Atividades do Agente no período
            const inicioDoMes = Timestamp.fromDate(mesAnterior);
            const fimDoMes = Timestamp.fromDate(new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59));
            
            const atividadesQuery = query(collection(db, "atividades"), where("agenteId", "==", currentUser.uid), where("data", ">=", inicioDoMes), where("data", "<=", fimDoMes));
            const atividadesSnapshot = await getDocs(atividadesQuery);

            // 5. Calcular o Desempenho (Realizado)
            let realizados = { ativos: 0, migracao: 0, tpv: 0 };
            atividadesSnapshot.forEach(doc => {
                const atividade = doc.data();
                if (atividade.tipo === 'Ativação de Conta') realizados.ativos += atividade.valor || 1;
            });

            // 6. Calcular a RV baseada em performance
            const calcularPilar = (meta, realizado, setpoint, peso) => {
                if (!meta || meta === 0) return 0;
                const atingimento = realizado / meta;
                if (atingimento * 100 < setpoint) return 0;
                const rvReferenciaPilar = valorRefTotal * (peso / 100);
                return rvReferenciaPilar * atingimento;
            };

            const rvAtivos = calcularPilar(metasIndividuais.metaAtivos, realizados.ativos, parametros.setpointAtivos, parametros.pesoAtivos);
            const rvMigracao = calcularPilar(metasIndividuais.metaMigracao, realizados.migracao, parametros.setpointMigracao, parametros.pesoMigracao);
            const rvTpv = calcularPilar(metasIndividuais.metaTpvTransacionado, realizados.tpv, parametros.setpointTpv, parametros.pesoTpv);
            const rvCalculada = rvAtivos + rvMigracao + rvTpv;

            // 7. Aplicar regra da RV Colchão
            let rvFinal = rvCalculada;
            let valorColchao = 0;
            let complemento = 0;
            const dataContratacao = currentUser.dataContratacao.toDate();
            
            let mesesDeCasa = (mesAnterior.getFullYear() - dataContratacao.getFullYear()) * 12;
            mesesDeCasa -= dataContratacao.getMonth();
            mesesDeCasa += mesAnterior.getMonth();
            const mesDeContratacao = mesesDeCasa + 1;

            if (mesDeContratacao === 1) valorColchao = parseFromBRL(parametros.colchaoMes1);
            if (mesDeContratacao === 2) valorColchao = parseFromBRL(parametros.colchaoMes2);
            if (mesDeContratacao === 3) valorColchao = parseFromBRL(parametros.colchaoMes3);

            if (rvCalculada < valorColchao) {
                complemento = valorColchao - rvCalculada;
                rvFinal = valorColchao;
            }

            setRvData({
                total: rvFinal, complemento, valorColchao,
                pilares: [
                    { nome: "Novos Clientes", meta: metasIndividuais.metaAtivos, realizado: realizados.ativos, rv: rvAtivos, setpoint: parametros.setpointAtivos },
                    { nome: "Migração de Contas", meta: metasIndividuais.metaMigracao, realizado: realizados.migracao, rv: rvMigracao, setpoint: parametros.setpointMigracao },
                    { nome: "Volume de Vendas (TPV)", meta: metasIndividuais.metaTpvTransacionado, realizado: realizados.tpv, rv: rvTpv, isCurrency: true, setpoint: parametros.setpointTpv },
                ]
            });

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        calcularRV();
    }, [calcularRV]);

    if (loading) {
        return <div className="p-6"><p>Calculando sua RV...</p></div>;
    }
    if (error) {
        return <div className="p-6 bg-red-100 text-red-700 rounded-lg text-center"><p className="font-bold">Ocorreu um erro</p><p className="text-sm">{error}</p></div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <p className="text-sm font-semibold text-gray-500 uppercase">Sua RV Total (Referente a {mesReferencia})</p>
                <p className="text-5xl font-bold text-green-600 mt-2">
                    {rvData?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {rvData?.complemento > 0 && (
                    <p className="text-sm text-blue-600 font-semibold mt-2 bg-blue-100 p-2 rounded-lg">
                        Você recebeu um complemento de {rvData.complemento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para atingir a garantia de {rvData.valorColchao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deste mês.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rvData?.pilares.map(pilar => {
                    const atingiuMeta = pilar.realizado >= pilar.meta;
                    return (
                        <div key={pilar.nome} className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="font-bold text-lg text-gray-800">{pilar.nome}</h3>
                            {atingiuMeta && <p className="text-sm font-bold text-green-600 bg-green-100 p-2 rounded-md text-center my-2">🎉 Meta Batida! Parabéns!</p>}
                            <div className="flex justify-between items-end mt-4">
                                <div>
                                    <p className="text-xs text-gray-500">Realizado</p>
                                    <p className="text-2xl font-bold">{pilar.isCurrency ? pilar.realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : pilar.realizado}</p>
                                </div>
                                <p className="text-sm text-gray-500">/ {pilar.isCurrency ? pilar.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : pilar.meta}</p>
                            </div>
                            <ProgressBar value={pilar.realizado} max={pilar.meta} setpoint={pilar.setpoint} />
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs text-gray-500">Ganhos da Categoria</p>
                                <p className="font-semibold text-green-700">{pilar.rv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CardMetasAgente;