import React, { useState } from 'react';
import AdicionarClienteForm from '../components/AdicionarClienteForm';
import ListaClientes from '../components/ListaClientes';
import CardMetas from '../components/CardMetas';

const TabButton = ({ children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out 
                ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
  >
    {children}
  </button>
);

const DashboardAgente = () => {
  const [activeTab, setActiveTab] = useState('metas');

  const renderContent = () => {
    switch (activeTab) {
      case 'metas':
        return <CardMetas />;
      case 'clientes':
        return (
          <>
            <AdicionarClienteForm />
            <ListaClientes />
          </>
        );
      case 'historico':
        return <div className="p-4 bg-slate-50 rounded-lg"><p className="text-slate-500">A funcionalidade de histórico será implementada em breve.</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton isActive={activeTab === 'metas'} onClick={() => setActiveTab('metas')}>
              Card de Metas
            </TabButton>
            <TabButton isActive={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')}>
              Clientes
            </TabButton>
            <TabButton isActive={activeTab === 'historico'} onClick={() => setActiveTab('historico')}>
              Histórico
            </TabButton>
          </nav>
        </div>
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardAgente;