import React, { useState } from 'react';

// --- IMPORTAÇÕES DOS COMPONENTES EXTERNOS ---
import RankingAgentes from '../components/RankingAgentes.jsx';
import GerenciadorMetas from '../components/GerenciadorMetas.jsx';
import GerenciarEquipe from '../components/GerenciarEquipe.jsx';
import HistoricoFranquia from '../components/HistoricoFranquia.jsx';
import AcompanhamentoEquipe from '../components/AcompanhamentoEquipe.jsx'; // <-- IMPORTAÇÃO DO NOVO ARQUIVO

const DashboardFranqueado = () => {
  // A tela principal agora será a de Acompanhamento
  const [activeTab, setActiveTab] = useState('acompanhamento');

  const renderContent = () => {
    switch (activeTab) {
      case 'acompanhamento':
        return <AcompanhamentoEquipe />; // <-- RENDERIZA O NOVO COMPONENTE
      case 'ranking':
        return <RankingAgentes />;
      case 'metas':
        return <GerenciadorMetas />;
      case 'equipe':
        return <GerenciarEquipe />;
      case 'historico':
        return <HistoricoFranquia />;
      default:
        return null;
    }
  };

  const getTabClass = (tabName) => {
    return `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
      activeTab === tabName
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-blue-600'
    }`;
  };

  return (
    <div className="w-full">
      {/* BOTÃO DA NOVA ABA ADICIONADO AQUI */}
      <div className="flex border-b border-gray-200">
        <button className={getTabClass('acompanhamento')} onClick={() => setActiveTab('acompanhamento')}>Acompanhamento da Equipe</button>
        <button className={getTabClass('ranking')} onClick={() => setActiveTab('ranking')}>Ranking de Agentes</button>
        <button className={getTabClass('metas')} onClick={() => setActiveTab('metas')}>Gerenciar Metas</button>
        <button className={getTabClass('equipe')} onClick={() => setActiveTab('equipe')}>Gerenciar Equipe</button>
        <button className={getTabClass('historico')} onClick={() => setActiveTab('historico')}>Histórico da Franquia</button>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardFranqueado;