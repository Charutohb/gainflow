import React, { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditarAgenteModal = ({ isOpen, onClose, agente, onUpdate, planosCarreira }) => {
  const [status, setStatus] = useState('');
  const [planoCarreiraId, setPlanoCarreiraId] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agente) {
      setStatus(agente.status || 'ativo');
      setPlanoCarreiraId(agente.planoCarreiraId || '');
    }
  }, [agente]);

  if (!isOpen || !agente) return null;

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Guarda o ID do plano de carreira original antes de qualquer mudança
      const planoOriginalId = agente.planoCarreiraId;

      const agenteRef = doc(db, 'usuarios', agente.id);
      const dadosParaAtualizar = {
        status: status,
        planoCarreiraId: planoCarreiraId,
      };
      await updateDoc(agenteRef, dadosParaAtualizar);
      
      // --- LÓGICA DA NOTIFICAÇÃO DE PROMOÇÃO ---
      // Verifica se o plano de carreira mudou e se o novo plano existe
      if (planoCarreiraId && planoCarreiraId !== planoOriginalId) {
        // Encontra o nome do novo nível de carreira
        const novoPlano = planosCarreira.find(p => p.id === planoCarreiraId);
        const nomeNovoNivel = novoPlano ? novoPlano.nomeNivel : 'um novo nível';

        // Cria a notificação no banco de dados
        await addDoc(collection(db, "notificacoes"), {
            agenteId: agente.id,
            tipo: 'promocao',
            mensagem: `Parabéns! Você foi promovido(a) para ${nomeNovoNivel}.`,
            lida: false,
            createdAt: serverTimestamp(),
        });
      }
      
      alert('Agente atualizado com sucesso!');
      onUpdate(); // Avisa o componente pai para recarregar a lista
      onClose();  // Fecha o modal
    } catch (error) {
      console.error("Erro ao atualizar agente:", error);
      alert("Falha ao atualizar o agente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Editar Agente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Agente</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{agente.nome}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Contratação</label>
            <p className="mt-1 text-sm text-gray-800">
              {agente.dataContratacao ? agente.dataContratacao.toDate().toLocaleDateString('pt-BR') : 'Não informada'}
            </p>
          </div>
          <div>
            <label htmlFor="plano-select" className="block text-sm font-medium text-gray-700">Nível de Carreira</label>
            <select
              id="plano-select"
              value={planoCarreiraId}
              onChange={(e) => setPlanoCarreiraId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Selecione um nível</option>
              {planosCarreira.map(plano => (
                <option key={plano.id} value={plano.id}>{plano.nomeNivel}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="ferias">Férias</option>
              <option value="atestado">Atestado</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarAgenteModal;