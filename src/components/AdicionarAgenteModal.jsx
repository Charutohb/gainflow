import React, { useState, useEffect } from 'react';
import { getApp } from 'firebase/app'; // <-- IMPORTAÇÃO ADICIONAL
import { getFunctions, httpsCallable } from 'firebase/functions';

const AdicionarAgenteModal = ({ isOpen, onClose, onUpdate, planosCarreira }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataContratacao, setDataContratacao] = useState('');
  const [planoCarreiraId, setPlanoCarreiraId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen && planosCarreira && planosCarreira.length > 0) {
      if (!planoCarreiraId) {
        setPlanoCarreiraId(planosCarreira[0].id);
      }
    }
  }, [isOpen, planosCarreira, planoCarreiraId]);

  if (!isOpen) return null;

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // --- LINHA CORRIGIDA ---
      // Agora especificamos a região correta ao inicializar as funções
      const functions = getFunctions(getApp(), 'southamerica-east1');
      const criarNovoAgente = httpsCallable(functions, 'criarNovoAgente');
      
      const result = await criarNovoAgente({ 
        nome, 
        email, 
        senha, 
        dataContratacao, 
        planoCarreiraId 
      });

      alert(result.data.message);
      onUpdate();
      handleClose();
    } catch (err) {
      console.error("Erro detalhado recebido do Firebase:", err);
      const errorMessage = err.details?.message || err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
      setNome(''); setEmail(''); setSenha(''); setDataContratacao(''); setError('');
      if (planosCarreira && planosCarreira.length > 0) {
        setPlanoCarreiraId(planosCarreira[0].id);
      }
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Adicionar Novo Agente</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha Provisória</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Contratação</label>
            <input type="date" value={dataContratacao} onChange={(e) => setDataContratacao(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nível de Carreira Inicial</label>
            <select value={planoCarreiraId} onChange={(e) => setPlanoCarreiraId(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              {planosCarreira.length > 0 ? (
                planosCarreira.map(plano => (
                  <option key={plano.id} value={plano.id}>{plano.nomeNivel}</option>
                ))
              ) : (
                <option disabled>Crie um nível de carreira primeiro</option>
              )}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={handleClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
            <button type="submit" disabled={loading || planosCarreira.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300">
              {loading ? 'Salvando...' : 'Salvar Agente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarAgenteModal;