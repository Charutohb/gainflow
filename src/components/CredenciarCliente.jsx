import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Função auxiliar para converter string formatada em número
const parseFromBRL = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, '').replace(',', '.'));
};

const CredenciarCliente = () => {
    const { currentUser } = useAuth();
    
    const [nomeCliente, setNomeCliente] = useState('');
    const [tpvPrecificado, setTpvPrecificado] = useState(''); // Guardará o valor formatado
    const [isAtivo, setIsAtivo] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // --- NOVA FUNÇÃO handleChange ---
    const handleChange = (e) => {
        let onlyDigits = e.target.value.replace(/\D/g, '');
        if (onlyDigits === '') {
            setTpvPrecificado('');
            return;
        }
        let numberValue = Number(onlyDigits) / 100;
        let formattedValue = numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        setTpvPrecificado(formattedValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        setSuccess('');

        try {
            const clienteData = {
                agenteId: currentUser.uid,
                franquiaId: currentUser.franquiaId,
                createdAt: serverTimestamp(),
                nomeCliente: nomeCliente,
                tpvPrecificado: parseFromBRL(tpvPrecificado), // Converte de volta para número
                isAtivo: isAtivo,
                tpvTransacionado: 0,
            };

            await addDoc(collection(db, 'Clientes'), clienteData);
            
            setSuccess(`Cliente "${nomeCliente}" credenciado com sucesso!`);
            setNomeCliente('');
            setTpvPrecificado('');
            setIsAtivo(false);
            setTimeout(() => setSuccess(''), 4000);

        } catch (error) {
            console.error("Erro ao credenciar cliente: ", error);
            alert("Ocorreu um erro ao credenciar o cliente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Credenciar Novo Cliente</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="nomeCliente" className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                    <input
                        type="text" id="nomeCliente" value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="tpvPrecificado" className="block text-sm font-medium text-gray-700">TPV Precificado (Meta R$)</label>
                    <input
                        type="text" inputMode="tel" id="tpvPrecificado" value={tpvPrecificado}
                        onChange={handleChange} // Usa a nova função
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="1.000,00"
                    />
                </div>
                <div className="relative flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            id="isAtivo" name="isAtivo" type="checkbox"
                            checked={isAtivo} onChange={(e) => setIsAtivo(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="isAtivo" className="font-medium text-gray-700">Cliente já ativou?</label>
                        <p className="text-gray-500">Marque se a primeira transação já ocorreu.</p>
                    </div>
                </div>
                <div>
                    <button type="submit" disabled={loading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
                        {loading ? 'Credenciando...' : 'Credenciar Cliente'}
                    </button>
                    {success && <p className="text-green-600 mt-2 text-sm text-center">{success}</p>}
                </div>
            </form>
        </div>
    );
};

export default CredenciarCliente;