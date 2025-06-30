import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { db } from '../firebase/config';

const GerenciadorFranqueados = () => {
  const [franquias, setFranquias] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [franquiaId, setFranquiaId] = useState('');
  const [feedback, setFeedback] = useState({ message: '', error: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const q = collection(db, 'franquias');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFranquias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!franquiaId) {
        setFeedback({ message: 'Por favor, selecione uma franquia.', error: true });
        return;
    }
    setIsSubmitting(true);
    setFeedback({ message: 'Criando franqueado...', error: false });

    const functions = getFunctions(getApp(), 'southamerica-east1');
    const createFranchisee = httpsCallable(functions, 'createFranchisee');
    
    try {
        const result = await createFranchisee({ nome, email, senha, franquiaId });
        setFeedback({ message: result.data.message, error: false });
        // Limpa o formulário
        setNome('');
        setEmail('');
        setSenha('');
        setFranquiaId('');
    } catch (error) {
        setFeedback({ message: error.message, error: true });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Criar Novo Franqueado</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{display: 'block', marginBottom: '0.5rem'}}>Nome do Franqueado:</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{display: 'block', marginBottom: '0.5rem'}}>E-mail de Login:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{display: 'block', marginBottom: '0.5rem'}}>Senha Provisória:</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength="6" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{display: 'block', marginBottom: '0.5rem'}}>Atribuir à Franquia:</label>
            <select value={franquiaId} onChange={(e) => setFranquiaId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Selecione a franquia --</option>
              {franquias.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isSubmitting ? 'Criando...' : 'Criar Franqueado'}
          </button>
          {feedback.message && <p style={{ color: feedback.error ? 'red' : 'green', marginTop: '1rem' }}>{feedback.message}</p>}
        </form>
      </div>
    </div>
  );
};

export default GerenciadorFranqueados;