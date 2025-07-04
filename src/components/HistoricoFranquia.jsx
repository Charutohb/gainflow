import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const HistoricoFranquia = () => {
  const { currentUser } = useAuth();
  const [historicoMetas, setHistoricoMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!currentUser?.franquiaId) return;

      try {
        const metasRef = collection(db, 'franquias', currentUser.franquiaId, 'metas');
        const q = query(metasRef, orderBy('__name__', 'desc')); 
        
        const querySnapshot = await getDocs(q);
        const metasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistoricoMetas(metasData);
      } catch (error) {
        console.error("Erro ao buscar histórico de metas: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [currentUser]);

  const formatMonthYear = (id) => {
    if (!id || !id.includes('-')) return 'Data Inválida';
    const [year, month] = id.split('-');
    const date = new Date(year, month - 1, 1);
    const formattedDate = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };
  
  const formatBRL = (value) => {
      if (isNaN(Number(value))) return 'R$ 0,00';
      return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (loading) {
    return <p className="text-gray-500">Carregando histórico...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Histórico de Metas da Franquia</h3>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta de Ativos</th>
              {/* COLUNA CORRIGIDA/ADICIONADA */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta de Migração (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta de TPV</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historicoMetas.map((meta) => (
              <tr key={meta.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatMonthYear(meta.id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meta.metaAtivos}</td>
                {/* DADO DA COLUNA CORRIGIDA/ADICIONADA */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meta.metaMigracao || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBRL(meta.metaTpvTransacionado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {historicoMetas.length === 0 && (
            <p className="text-center py-4 text-gray-500">Nenhum histórico de metas encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default HistoricoFranquia;