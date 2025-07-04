import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const parseFromBRL = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, '').replace(',', '.'));
};

const AcompanhamentoClientes = () => {
    const { currentUser } = useAuth();
    const [clientesParaAtivar, setClientesParaAtivar] = useState([]);
    const [clientesEmAcompanhamento, setClientesEmAcompanhamento] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tpvInputs, setTpvInputs] = useState({});

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        
        const hoje = new Date();

        // 1. Busca Clientes pendentes de ativação (de qualquer período)
        const paraAtivarQuery = query(
            collection(db, "Clientes"),
            where("agenteId", "==", currentUser.uid),
            where("isAtivo", "==", false)
        );
        const paraAtivarSnapshot = await getDocs(paraAtivarQuery);
        setClientesParaAtivar(paraAtivarSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. Busca Clientes ATIVADOS na Safra do Mês Anterior para Acompanhamento em M1
        const inicioMesAnterior = Timestamp.fromDate(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
        const fimMesAnterior = Timestamp.fromDate(new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59));
        
        const acompanhamentoQuery = query(
            collection(db, "Clientes"),
            where("agenteId", "==", currentUser.uid),
            where("isAtivo", "==", true),
            where("dataAtivacao", ">=", inicioMesAnterior),
            where("dataAtivacao", "<=", fimMesAnterior)
        );
        const acompanhamentoSnapshot = await getDocs(acompanhamentoQuery);
        const acompanhamentoList = acompanhamentoSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setClientesEmAcompanhamento(acompanhamentoList);

        const inputs = {};
        acompanhamentoList.forEach(cliente => {
            if (cliente.tpvTransacionado > 0) {
                inputs[cliente.id] = cliente.tpvTransacionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
        });
        setTpvInputs(inputs);

        setLoading(false);
    }, [currentUser]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAtivarCliente = async (clienteId) => {
        const clienteRef = doc(db, 'Clientes', clienteId);
        await updateDoc(clienteRef, { isAtivo: true, dataAtivacao: serverTimestamp() });
        fetchData(); 
    };

    const handleTpvChange = (clienteId, valor) => {
        let onlyDigits = valor.replace(/\D/g, '');
        if (onlyDigits === '') {
            setTpvInputs(prev => ({ ...prev, [clienteId]: '' }));
            return;
        }
        let numberValue = Number(onlyDigits) / 100;
        let formattedValue = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setTpvInputs(prev => ({ ...prev, [clienteId]: formattedValue }));
    };

    const handleSalvarTpv = async (clienteId) => {
        const valorNumerico = parseFromBRL(tpvInputs[clienteId]);
        const clienteRef = doc(db, 'Clientes', clienteId);
        await updateDoc(clienteRef, { tpvTransacionado: valorNumerico });
        alert('TPV Salvo com sucesso!');
    };

    if (loading) return <p className="text-gray-500">Carregando seus clientes...</p>;

    return (
        <div className="space-y-8">
            {/* Seção 1: M0 */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Acompanhamento M0 (Clientes do Mês Atual)</h3>
                <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
                    {clientesParaAtivar.length > 0 ? clientesParaAtivar.map(cliente => (
                        <div key={cliente.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                            <div>
                                <p className="font-semibold text-gray-900">{cliente.nomeCliente}</p>
                                {cliente.createdAt && <p className="text-xs text-gray-500">Credenciado em: {cliente.createdAt.toDate().toLocaleDateString('pt-BR')}</p>}
                            </div>
                            <button onClick={() => handleAtivarCliente(cliente.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors">Marcar como Ativo</button>
                        </div>
                    )) : <p className="text-gray-500 italic text-center py-4">Nenhum cliente pendente de ativação.</p>}
                </div>
            </div>

            {/* Seção 2: M1 */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Acompanhamento M1 (Clientes da Safra Anterior)</h3>
                <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
                    {clientesEmAcompanhamento.length > 0 ? clientesEmAcompanhamento.map(cliente => (
                        <div key={cliente.id} className="p-3 border-b last:border-b-0">
                            <p className="font-semibold text-gray-900">{cliente.nomeCliente}</p>
                            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <label className="block text-sm font-medium text-gray-700">TPV Realizado (M1):</label>
                                <input type="text" inputMode="tel" className="block w-full sm:w-1/2 rounded-md border-gray-300 shadow-sm" placeholder="R$ 0,00" value={tpvInputs[cliente.id] || ''} onChange={(e) => handleTpvChange(cliente.id, e.target.value)} />
                                <button onClick={() => handleSalvarTpv(cliente.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors">Salvar</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 italic text-center py-4">Nenhum cliente da safra anterior para acompanhar.</p>}
                </div>
            </div>
        </div>
    );
};

export default AcompanhamentoClientes;