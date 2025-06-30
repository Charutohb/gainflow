import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const GerenciadorMetas = () => {
  const { currentUser } = useAuth();
  const [metas, setMetas] = useState({
    metaAtivos: 0,
    metaMigracao: 0, // Novo campo
    metaTpvTransacionado: 0,
    valorReferencia: 0,
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentUser || !currentUser.franquiaId) return;
    const fetchMetas = async () => {
      const docRef = doc(db, 'franquias', currentUser.franquiaId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Garante que o estado tenha os campos novos para evitar erros
        const data = docSnap.data();
        setMetas({
          metaAtivos: data.metaAtivos || 0,
          metaMigracao: data.metaMigracao || 0,
          metaTpvTransacionado: data.metaTpvTransacionado || 0,
          valorReferencia: data.valorReferencia || 0,
        });
      }
      setLoading(false);
    };
    fetchMetas();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorNumerico = value.replace(/[^0-9]/g, '');
    // Para a meta de migração, tratamos como porcentagem
    if (name === 'metaMigracao') {
      setMetas(prev => ({ ...prev, [name]: Number(valorNumerico) / 100 }));
    } else {
      setMetas(prev => ({ ...prev, [name]: Number(valorNumerico) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    const docRef = doc(db, 'franquias', currentUser.franquiaId);
    try {
      await updateDoc(docRef, metas);
      setSuccess('Metas da franquia atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Erro ao atualizar metas: ", error);
    }
  };

  if (loading) return <p>Carregando gerenciador de metas...</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Meta Geral da Franquia</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Meta de Novos Ativos (unidades):</label>
          <input type="text" inputMode="numeric" name="metaAtivos" value={metas.metaAtivos} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Meta de Migração (%):</label>
          <input type="text" inputMode="numeric" name="metaMigracao" value={metas.metaMigracao * 100} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Meta de TPV Transacionado (R$):</label>
          <input type="text" inputMode="numeric" name="metaTpvTransacionado" value={metas.metaTpvTransacionado.toLocaleString('pt-BR')} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label>Valor de Referência da Meta (R$):</label>
          <input type="text" inputMode="numeric" name="valorReferencia" value={metas.valorReferencia.toLocaleString('pt-BR')} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar Metas da Franquia</button>
        {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
      </form>
    </div>
  );
};

export default GerenciadorMetas;