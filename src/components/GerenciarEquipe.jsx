import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import AdicionarAgenteModal from './AdicionarAgenteModal.jsx';
import EditarAgenteModal from './EditarAgenteModal.jsx';

// Componente para o "badge" de status
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  const statusClasses = {
    ativo: "bg-green-100 text-green-800",
    inativo: "bg-red-100 text-red-800",
  };
  return (
    <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const GerenciarEquipe = () => {
  const { currentUser } = useAuth();
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planosCarreira, setPlanosCarreira] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState(null);

  const fetchData = useCallback(async () => {
    if (!currentUser?.franquiaId) return;
    setLoading(true);

    // Busca agentes
    const agentesQuery = query(
        collection(db, "usuarios"), 
        where("franquiaId", "==", currentUser.franquiaId), 
        where("perfil", "==", "agente")
    );
    const agentesSnapshot = await getDocs(agentesQuery);
    const agentesList = agentesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Para cada agente, busca o nome do plano de carreira
    const agentesComPlano = await Promise.all(agentesList.map(async (agente) => {
        let nomePlano = 'Não definido';
        if (agente.planoCarreiraId) {
            const planoDocRef = doc(db, 'franquias', currentUser.franquiaId, 'planosDeCarreira', agente.planoCarreiraId);
            const planoDocSnap = await getDoc(planoDocRef);
            if (planoDocSnap.exists()) {
                nomePlano = planoDocSnap.data().nomeNivel;
            }
        }
        return { ...agente, nomePlano };
    }));
    setAgentes(agentesComPlano);

    // Busca Planos de Carreira para passar para os modais
    const planosQuery = query(collection(db, 'franquias', currentUser.franquiaId, 'planosDeCarreira'));
    const planosSnapshot = await getDocs(planosQuery);
    const planosList = planosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPlanosCarreira(planosList);

    setLoading(false);
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenEditModal = (agente) => {
    setSelectedAgente(agente);
    setIsEditModalOpen(true);
  };

  if (loading) return <p className="text-gray-500">Carregando equipe...</p>;

  return (
    <div>
      <AdicionarAgenteModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onUpdate={fetchData}
        planosCarreira={planosCarreira}
      />
      <EditarAgenteModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        agente={selectedAgente}
        onUpdate={fetchData}
        planosCarreira={planosCarreira}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Sua Equipe de Agentes</h2>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
          + Adicionar Novo Agente
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível de Carreira</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agentes.map((agente) => (
              <tr key={agente.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agente.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agente.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agente.nomePlano}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><StatusBadge status={agente.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenEditModal(agente)} className="text-blue-600 hover:text-blue-900">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {agentes.length === 0 && (
            <p className="text-center py-4 text-gray-500">Nenhum agente encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default GerenciarEquipe;