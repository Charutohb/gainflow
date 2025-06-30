// CÓDIGO COMPLETO PARA: src/components/AdicionarClienteForm.jsx

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const AdicionarClienteForm = () => {
    const { currentUser } = useAuth();
    const [nomeCliente, setNomeCliente] = useState('');
    const [tpvPrecificado, setTpvPrecificado] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!nomeCliente || !tpvPrecificado) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        if (!currentUser || !currentUser.uid || !currentUser.franquiaId) {
            setError('Erro: Não foi possível identificar o usuário. Tente fazer o login novamente.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'clientes'), {
                agenteId: currentUser.uid,
                franquiaId: currentUser.franquiaId,
                nomeCliente: nomeCliente,
                tpvPrecificado: parseFloat(String(tpvPrecificado).replace(',', '.')) || 0,
                tpvTransacionado: 0,
                isAtivo: false,
                createdAt: serverTimestamp(),
            });
            setSuccess(`Cliente "${nomeCliente}" adicionado com sucesso!`);
            setNomeCliente('');
            setTpvPrecificado('');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError('Ocorreu um erro ao salvar o cliente.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Adicionar Novo Cliente</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome do Cliente:</label>
                    <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>TPV Precificado (R$):</label>
                    <input type="text" inputMode="decimal" value={tpvPrecificado} onChange={(e) => setTpvPrecificado(e.target.value.replace(/[^0-9,]/g, ''))} placeholder="Ex: 50000,00" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                </div>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
            </form>
        </div>
    );
};
export default AdicionarClienteForm;