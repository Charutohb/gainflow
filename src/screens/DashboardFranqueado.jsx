import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import GerenciadorMetas from '../components/GerenciadorMetas';
import RankingAgentes from '../components/RankingAgentes';

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

// --- Sub-componente para GERENCIAR A EQUIPE ---
const GerenciadorEquipe = () => {
    const { currentUser } = useAuth();
    const [agentes, setAgentes] = useState([]);
    const [email, setEmail] = useState('');
    const [feedback, setFeedback] = useState({ message: '', error: false });

    useEffect(() => {
        if (!currentUser || !currentUser.franquiaId) return;
        const q = query(collection(db, "usuarios"), where("franquiaId", "==", currentUser.franquiaId), where("perfil", "==", "agente"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAgentes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleAddAgent = async (e) => {
        e.preventDefault();
        setFeedback({ message: 'Adicionando...', error: false });
        const functions = getFunctions(getApp(), 'southamerica-east1');
        const addAgentToFranchise = httpsCallable(functions, 'addAgentToFranchise');
        try {
            const result = await addAgentToFranchise({ email });
            setFeedback({ message: result.data.message, error: false });
            setEmail('');
        } catch (error) {
            setFeedback({ message: error.message, error: true });
        }
    };

    const handleRemoveAgent = async (agentId, agentName) => {
        if (!window.confirm(`Tem certeza que deseja remover o agente "${agentName}" da sua equipe?`)) { return; }
        setFeedback({ message: 'Removendo agente...', error: false });
        const functions = getFunctions(getApp(), 'southamerica-east1');
        const removeAgentFromFranchise = httpsCallable(functions, 'removeAgentFromFranchise');
        try {
            const result = await removeAgentFromFranchise({ agentId });
            setFeedback({ message: result.data.message, error: false });
        } catch (error) {
            setFeedback({ message: error.message, error: true });
        }
    };

    return (
        <div>
            <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Adicionar Agente à Equipe</h3>
                <form onSubmit={handleAddAgent}>
                    <label>E-mail do Agente:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email.do.agente@exemplo.com" required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', margin: '0.5rem 0' }} />
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Adicionar</button>
                    {feedback.message && <p style={{ color: feedback.error ? 'red' : 'green', marginTop: '1rem' }}>{feedback.message}</p>}
                </form>
            </div>
            <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>Agentes Atuais</h3>
                {agentes.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                      {agentes.map(agente => (
                          <li key={agente.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', marginBottom: '0.5rem' }}>
                              <span>{agente.nome} ({agente.email})</span>
                              <button onClick={() => handleRemoveAgent(agente.id, agente.nome)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Remover</button>
                          </li>
                      ))}
                  </ul>
                ) : <p>Nenhum agente na equipe no momento.</p>}
            </div>
        </div>
    );
};

// --- Sub-componente para DISTRIBUIR as metas ---
const DistribuidorDeMetas = () => {
    const { currentUser } = useAuth();
    const [agentes, setAgentes] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [metasAgente, setMetasAgente] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!currentUser || !currentUser.franquiaId) return;
        const fetchAgentes = async () => {
            const q = query(collection(db, "usuarios"), where("franquiaId", "==", currentUser.franquiaId), where("perfil", "==", "agente"));
            const querySnapshot = await getDocs(q);
            setAgentes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchAgentes();
    }, [currentUser]);

    useEffect(() => {
        if (!selectedAgentId) { setMetasAgente(null); return; }
        const fetchMetas = async () => {
            setLoading(true);
            const mes = 'Julho'; const ano = 2025;
            const metaDocId = `${selectedAgentId}_${mes.toLowerCase()}_${ano}`;
            const docRef = doc(db, "metas", metaDocId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMetasAgente(docSnap.data());
            } else {
                setMetasAgente({
                    agenteId: selectedAgentId, franquiaId: currentUser.franquiaId, mes, ano,
                    objetivoAtivos: 0, objetivoMigracao: 0, objetivoTpvTransacionado: 0,
                    setpointAtivos: 0.5, setpointMigracao: 0.5, setpointTpvTransacionado: 0.5
                });
            }
            setLoading(false);
        };
        fetchMetas();
    }, [selectedAgentId, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const valorNumerico = value.replace(/[^0-9]/g, '');
        if (name === 'objetivoMigracao') {
            setMetasAgente(prev => ({ ...prev, [name]: Number(valorNumerico) / 100 }));
        } else {
            setMetasAgente(prev => ({ ...prev, [name]: Number(valorNumerico) }));
        }
    };
    const handleSetpointChange = (e) => {
        const { name, value } = e.target;
        const valorNumerico = value.replace(/[^0-9]/g, '');
        setMetasAgente(prev => ({ ...prev, [name]: Number(valorNumerico) / 100 }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        if (!metasAgente) return;
        const metaDocId = `${selectedAgentId}_${metasAgente.mes.toLowerCase()}_${metasAgente.ano}`;
        const docRef = doc(db, 'metas', metaDocId);
        try {
            await setDoc(docRef, metasAgente, { merge: true });
            setSuccess('Metas salvas com sucesso para o agente selecionado!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Erro ao salvar metas do agente: ", error);
        }
    };

    return (
        <div style={{ marginTop: '2rem', borderTop: '2px solid #ccc', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Distribuição de Metas por Agente</h2>
            <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="agente-select" style={{ display: 'block', marginBottom: '0.5rem' }}>1. Selecione um Agente:</label>
                <select id="agente-select" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px' }}>
                    <option value="">-- Escolha um agente --</option>
                    {agentes.map(agente => <option key={agente.id} value={agente.id}>{agente.nome}</option>)}
                </select>
            </div>
            {loading && <p>Carregando...</p>}
            {selectedAgentId && metasAgente && (
                <form onSubmit={handleSubmit}>
                    <h3 style={{ marginTop: 0 }}>2. Defina as Metas e Setpoints para o Agente Selecionado</h3>
                    <h4>Objetivos (100%)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label>Novos Ativos:</label><input type="text" inputMode="numeric" name="objetivoAtivos" value={metasAgente.objetivoAtivos} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label>Meta de Migração (%):</label><input type="text" inputMode="numeric" name="objetivoMigracao" value={(metasAgente.objetivoMigracao || 0) * 100} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label>Meta de TPV Transacionado (R$):</label><input type="text" inputMode="numeric" name="objetivoTpvTransacionado" value={metasAgente.objetivoTpvTransacionado.toLocaleString('pt-BR')} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    </div>
                    <h4 style={{ marginTop: '2rem' }}>Setpoint Mínimo (%)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label>Ativos (%):</label><input type="text" inputMode="numeric" name="setpointAtivos" value={(metasAgente.setpointAtivos || 0) * 100} onChange={handleSetpointChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label>Migração (%):</label><input type="text" inputMode="numeric" name="setpointMigracao" value={(metasAgente.setpointMigracao || 0) * 100} onChange={handleSetpointChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label>Transacionado (%):</label><input type="text" inputMode="numeric" name="setpointTpvTransacionado" value={(metasAgente.setpointTpvTransacionado || 0) * 100} onChange={handleSetpointChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    </div>
                    <button type="submit" style={{ marginTop: '2rem', padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' }}>Salvar Metas para este Agente</button>
                    {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
                </form>
            )}
        </div>
    );
};

// --- Componente Principal da Tela do Franqueado ---
const DashboardFranqueado = () => {
    const [activeTab, setActiveTab] = useState('equipe');
    const renderContent = () => {
        switch (activeTab) {
            case 'gestao':
                return (
                    <>
                        <GerenciadorMetas />
                        <DistribuidorDeMetas />
                    </>
                );
            case 'ranking':
                return <RankingAgentes />;
            case 'equipe':
                return <GerenciadorEquipe />;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                Painel do Franqueado
            </h2>
            <div style={styles.tabsContainer}>
                <button style={{ ...styles.tab, ...(activeTab === 'gestao' ? styles.activeTab : {}) }} onClick={() => setActiveTab('gestao')}>Gestão de Metas</button>
                <button style={{ ...styles.tab, ...(activeTab === 'ranking' ? styles.activeTab : {}) }} onClick={() => setActiveTab('ranking')}>Ranking da Equipe</button>
                <button style={{ ...styles.tab, ...(activeTab === 'equipe' ? styles.activeTab : {}) }} onClick={() => setActiveTab('equipe')}>Gerenciar Equipe</button>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default DashboardFranqueado;