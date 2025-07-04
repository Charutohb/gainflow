import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const CredenciarCliente = ({ onClienteAdicionado }) => {
    const { currentUser } = useAuth();
    const [nomeCliente, setNomeCliente] = useState('');
    const [tpvPrecificado, setTpvPrecificado] = useState('');
    const [dataCredenciamento, setDataCredenciamento] = useState(new Date().toISOString().split('T')[0]); // <-- NOVO ESTADO

    const handleTpvChange = (e) => {
        let onlyDigits = e.target.value.replace(/\D/g, '');
        if (onlyDigits === '') {
            setTpvPrecificado('');
            return;
        }
        let numberValue = Number(onlyDigits) / 100;
        setTpvPrecificado(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const parseFromBRL = (value) => {
        if (!value) return 0;
        return Number(String(value).replace(/\./g, '').replace(',', '.'));
    };

    const handleCredenciar = async (e) => {
        e.preventDefault();
        if (!nomeCliente || !tpvPrecificado || !dataCredenciamento) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const novoCliente = {
            agenteId: currentUser.uid,
            franquiaId: currentUser.franquiaId,
            nomeCliente: nomeCliente,
            tpvPrecificado: parseFromBRL(tpvPrecificado),
            tpvTransacionado: 0,
            isAtivo: false,
            dataCredenciamento: Timestamp.fromDate(new Date(dataCredenciamento)), // <-- SALVA A DATA
            dataAtivacao: null,
        };

        try {
            await addDoc(collection(db, 'Clientes'), novoCliente);
            alert('Cliente credenciado com sucesso! Ele está pendente de ativação na aba de Acompanhamento.');
            setNomeCliente('');
            setTpvPrecificado('');
            setDataCredenciamento(new Date().toISOString().split('T')[0]);
            if (onClienteAdicionado) onClienteAdicionado();
        } catch (error) {
            console.error("Erro ao credenciar cliente:", error);
            alert('Ocorreu um erro ao credenciar o cliente.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Credenciar Novo Cliente</h3>
            <form onSubmit={handleCredenciar} className="space-y-4">
                <div>
                    <label htmlFor="nome-cliente" className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                    <input type="text" id="nome-cliente" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label htmlFor="tpv-precificado" className="block text-sm font-medium text-gray-700">TPV Precificado (R$)</label>
                    <input type="text" inputMode="tel" id="tpv-precificado" value={tpvPrecificado} onChange={handleTpvChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="10.000,00" />
                </div>
                {/* NOVO CAMPO DE DATA */}
                <div>
                    <label htmlFor="data-credenciamento" className="block text-sm font-medium text-gray-700">Data do Credenciamento</label>
                    <input type="date" id="data-credenciamento" value={dataCredenciamento} onChange={(e) => setDataCredenciamento(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
                    Credenciar Cliente
                </button>
            </form>
        </div>
    );
};

export default CredenciarCliente;