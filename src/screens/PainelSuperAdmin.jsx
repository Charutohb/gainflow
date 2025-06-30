import React, { useState } from 'react';
import GerenciadorFranquias from '../components/GerenciadorFranquias';
import GerenciadorFranqueados from '../components/GerenciadorFranqueados';

const styles = {
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid #ccc',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '1rem',
  },
  activeTab: {
    borderBottom: '3px solid #007bff',
    fontWeight: 'bold',
  }
};

const PainelSuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('franquias');

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '1.5rem' }}>
        Painel do Super Administrador
      </h2>
      
      <div style={styles.tabsContainer}>
        <button style={{ ...styles.tab, ...(activeTab === 'franquias' ? styles.activeTab : {}) }} onClick={() => setActiveTab('franquias')}>
          Gerenciar Franquias
        </button>
        <button style={{ ...styles.tab, ...(activeTab === 'franqueados' ? styles.activeTab : {}) }} onClick={() => setActiveTab('franqueados')}>
          Gerenciar Franqueados
        </button>
      </div>

      <div>
        {activeTab === 'franquias' && <GerenciadorFranquias />}
        {activeTab === 'franqueados' && <GerenciadorFranqueados />}
      </div>
    </div>
  );
};

export default PainelSuperAdmin;