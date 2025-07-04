import React, { useState } from 'react';

// --- IMPORTAÇÕES DAS QUATRO TELAS ---
import CardMetasAgente from './CardMetasAgente.jsx';
import CredenciarCliente from '../components/CredenciarCliente.jsx';
import AcompanhamentoClientes from '../components/AcompanhamentoClientes.jsx';
import HistoricoRvAgente from '../components/HistoricoRvAgente.jsx'; // <-- IMPORTAÇÃO DA NOVA TELA

const DashboardAgente = () => {
  const [activeTab, setActiveTab] = useState('cardMetas');

  const renderContent = () => {
    switch (activeTab) {
      case 'cardMetas':
        return <CardMetasAgente />;
      case 'clientes':
        return <CredenciarCliente />;
      case 'acompanhamento':
        return <AcompanhamentoClientes />;
      case 'historicoRv':
        return <HistoricoRvAgente />; // <-- RENDERIZA A NOVA TELA
      default:
        return null;
    }
  };

  const getTabClass = (tabName) => {
    return `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
      activeTab === tabName
        ? 'bg-slate-100 text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-blue-600'
    }`;
  };

  return (
    <div className="w-full">
      <div className="flex border-b border-gray-200">
        <button className={getTabClass('cardMetas')} onClick={() => setActiveTab('cardMetas')}>Card de Metas</button>
        <button className={getTabClass('clientes')} onClick={() => setActiveTab('clientes')}>Credenciar Cliente</button>
        <button className={getTabClass('acompanhamento')} onClick={() => setActiveTab('acompanhamento')}>Acompanhamento</button>
        {/* BOTÃO DA NOVA ABA ADICIONADO AQUI */}
        <button className={getTabClass('historicoRv')} onClick={() => setActiveTab('historicoRv')}>Histórico de RV</button>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardAgente;