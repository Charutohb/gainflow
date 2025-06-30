// CÓDIGO COMPLETO PARA: src/components/ListaClientes.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const ListaClientes = () => {
    const { currentUser } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tpvEditValues, setTpvEditValues] = useState({});

    useEffect(() => {
        if (!currentUser || !currentUser.uid) { setLoading(false); return; }
        const q = query(collection(db, "clientes"), where("agenteId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClientes(clientesData);
            const initialTpvValues = {};
            clientesData.forEach(cliente => {
                initialTpvValues[cliente.id] = String(cliente.tpvTransacionado || '0').replace('.', ',');
            });
            setTpvEditValues(initialTpvValues);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar clientes: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleTpvChange = (clienteId, value) => {
        const valorLimpo = value.replace(/[^0-9,]/g, '');
        setTpvEditValues(prev => ({ ...prev, [clienteId]: valorLimpo }));
    };

    const handleUpdateTpv = async (clienteId) => {
        const clienteRef = doc(db, "clientes", clienteId);
        const valorNumerico = parseFloat(String(tpvEditValues[clienteId]).replace(',', '.')) || 0;
        try {
            await updateDoc(clienteRef, { tpvTransacionado: valorNumerico });
            alert('TPV atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar o TPV: ", error);
            alert('Erro ao atualizar o TPV.');
        }
    };

    const handleUpdateAtivo = async (clienteId, isAtivo) => {
        const clienteRef = doc(db, "clientes", clienteId);
        try {
            await updateDoc(clienteRef, { isAtivo });
        } catch (error) {
            console.error("Erro ao atualizar o status de ativo: ", error);
        }
    };

    const TabelaClientes = ({ lista, titulo, isM1 = false }) => (
        <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{titulo}</h3>
            {lista.length === 0 ? <p>Nenhum cliente nesta categoria.</p> : (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
                                <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>Ativo</th>
                                <th style={{ padding: '12px' }}>Nome do Cliente</th>
                                {isM1 && <th style={{ padding: '12px', minWidth: '220px' }}>TPV Transacionado (R$)</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((cliente) => (
                                <tr key={cliente.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <input type="checkbox" checked={cliente.isAtivo} onChange={(e) => handleUpdateAtivo(cliente.id, e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                    </td>
                                    <td style={{ padding: '12px' }}>{cliente.nomeCliente}</td>
                                    {isM1 && (
                                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input type="text" inputMode="decimal" value={tpvEditValues[cliente.id] || ''} onChange={(e) => handleTpvChange(cliente.id, e.target.value)} placeholder="0,00" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '120px' }} />
                                            <button onClick={() => handleUpdateTpv(cliente.id)} style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Atualizar</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    if (loading) return <p>Carregando clientes...</p>;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const clientesM0 = clientes.filter(c => c.createdAt && c.createdAt.toDate() >= startOfMonth);
    const clientesM1 = clientes.filter(c => c.createdAt && c.createdAt.toDate() >= startOfLastMonth && c.createdAt.toDate() < startOfMonth);
    
    return (
        <div>
            <TabelaClientes lista={clientesM0} titulo={`Aquisições de ${now.toLocaleString('pt-BR', { month: 'long' })} (M0)`} />
            <TabelaClientes lista={clientesM1} titulo={`Carteira de ${new Date(now.setMonth(now.getMonth() - 1)).toLocaleString('pt-BR', { month: 'long' })} (M1)`} isM1={true} />
        </div>
    );
};

export default ListaClientes;