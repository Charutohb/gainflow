import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const RankingAgentes = () => {
  const { currentUser } = useAuth();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("Usuário atual no Ranking:", currentUser);
    if (!currentUser || !currentUser.franquiaId) {
      setLoading(false);
      setError("Não foi possível identificar a sua franquia. Verifique seu perfil.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const agentesQuery = query(collection(db, "usuarios"), where("franquiaId", "==", currentUser.franquiaId), where("perfil", "==", "agente"));
        const agentesSnapshot = await getDocs(agentesQuery);
        const agentesList = agentesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const dataPromises = agentesList.map(async (agente) => {
          const mes = 'Julho'; const ano = 2025;
          const startOfLastMonth = new Date(ano, new Date().getMonth() - 1, 1);
          const endOfLastMonth = new Date(ano, new Date().getMonth(), 0, 23, 59, 59);

          const clientesQuery = query(collection(db, "clientes"), where("agenteId", "==", agente.id), where("createdAt", ">=", startOfLastMonth), where("createdAt", "<=", endOfLastMonth));
          const metaDocId = `${agente.id}_${startOfLastMonth.toLocaleString('pt-BR', { month: 'long' }).toLowerCase()}_${ano}`;
          
          const [clientesSnapshot, metaSnap] = await Promise.all([ getDocs(clientesQuery), getDoc(doc(db, "metas", metaDocId)) ]);
          
          const clientes = clientesSnapshot.docs.map(doc => doc.data());
          const metas = metaSnap.exists() ? metaSnap.data() : null;

          if (!metas) return { ...agente, pontuacaoGeral: 0, performance: { percAtivos: 0, taxaMigracao: 0, percTpvTransacionado: 0 } };
          
          const totalAtivos = clientes.filter(c => c.isAtivo).length;
          const tpvPrecificadoM1 = clientes.reduce((sum, c) => sum + (c.tpvPrecificado || 0), 0);
          const totalTpvTransacionado = clientes.reduce((sum, c) => sum + (c.tpvTransacionado || 0), 0);
          const taxaMigracao = tpvPrecificadoM1 > 0 ? (totalTpvTransacionado / tpvPrecificadoM1) : 0;

          const percAtivos = (metas.objetivoAtivos || 1) > 0 ? (totalAtivos / metas.objetivoAtivos) : 0;
          const percMigracao = (metas.objetivoMigracao || 1) > 0 ? (taxaMigracao / metas.objetivoMigracao) : 0;
          const percTpvTransacionado = (metas.objetivoTpvTransacionado || 1) > 0 ? (totalTpvTransacionado / metas.objetivoTpvTransacionado) : 0;
          
          const remunAtivos = percAtivos >= (metas.setpointAtivos || 0) ? percAtivos : 0;
          const remunMigracao = taxaMigracao >= (metas.setpointMigracao || 0) ? percMigracao : 0;
          const remunTpvTransacionado = percTpvTransacionado >= (metas.setpointTpvTransacionado || 0) ? percTpvTransacionado : 0;
          
          const pontuacaoGeral = (remunAtivos * 0.30) + (remunMigracao * 0.30) + (remunTpvTransacionado * 0.40);

          return { ...agente, pontuacaoGeral, performance: { percAtivos, taxaMigracao, percTpvTransacionado } };
        });

        const calculatedData = await Promise.all(dataPromises);
        calculatedData.sort((a, b) => b.pontuacaoGeral - a.pontuacaoGeral);
        setRankingData(calculatedData);
      } catch (err) {
        console.error("Erro ao calcular o ranking:", err);
        setError("Não foi possível carregar o ranking. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) return <p>Calculando ranking da equipe...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;

  return (
    <div style={{ marginTop: '2rem', borderTop: '2px solid #007bff', paddingTop: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
        🏆 Ranking de Performance 🏆
      </h2>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px', width: '50px' }}>#</th>
              <th style={{ padding: '12px' }}>Agente</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Pontuação Geral</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>% Ativos</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>% Migração</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>% Transacionado</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((agente, index) => (
              <tr key={agente.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</td>
                <td style={{ padding: '12px' }}>{agente.nome}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{`${(agente.pontuacaoGeral * 100).toFixed(1)}%`}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{`${((agente.performance.percAtivos || 0) * 100).toFixed(0)}%`}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{`${((agente.performance.taxaMigracao || 0) * 100).toFixed(0)}%`}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{`${((agente.performance.percTpvTransacionado || 0) * 100).toFixed(0)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingAgentes;