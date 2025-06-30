import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const GerenciadorFranquias = () => {
  const [franquias, setFranquias] = useState([]);
  const [nomeFranquia, setNomeFranquia] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para buscar e ouvir as franquias em tempo real
  useEffect(() => {
    const q = query(collection(db, 'franquias'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaFranquias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFranquias(listaFranquias);
      setLoading(false);
    });
    // Limpa o "ouvinte" quando o componente é desmontado para evitar vazamento de memória
    return () => unsubscribe();
  }, []);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeFranquia.trim()) {
      setFeedback('O nome da franquia não pode estar em branco.');
      return;
    }
    setIsSubmitting(true);
    setFeedback(`Criando a franquia "${nomeFranquia}"...`);

    try {
      // Adiciona um novo documento na coleção 'franquias'
      await addDoc(collection(db, 'franquias'), {
        nome: nomeFranquia,
        createdAt: serverTimestamp(),
        // Adicionamos as metas já zeradas para o franqueado poder editar depois
        metaAtivos: 10,
        metaMigracao: 0.8,
        metaTpvTransacionado: 100000,
        valorReferencia: 1200
      });
      setFeedback(`Franquia "${nomeFranquia}" criada com sucesso!`);
      setNomeFranquia('');
      setTimeout(() => setFeedback(''), 4000);
    } catch (error) {
      console.error("Erro ao criar franquia: ", error);
      setFeedback('Erro ao criar franquia. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>Criar Nova Franquia</h3>
        <form onSubmit={handleSubmit}>
          <label style={{display: 'block', marginBottom: '0.5rem'}}>Nome da Franquia:</label>
          <input
            type="text"
            value={nomeFranquia}
            onChange={(e) => setNomeFranquia(e.target.value)}
            placeholder="Ex: Stone Campinas"
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}
          />
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isSubmitting ? 'Criando...' : 'Criar Franquia'}
          </button>
          {feedback && <p style={{ marginTop: '1rem' }}>{feedback}</p>}
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>Franquias Existentes</h3>
        {loading ? <p>Carregando franquias...</p> : (
          franquias.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {franquias.map(franquia => (
                <li key={franquia.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '4px', marginBottom: '0.5rem' }}>
                  <span>{franquia.nome}</span>
                  <span style={{fontSize: '0.8rem', color: '#666'}}>ID: {franquia.id}</span>
                </li>
              ))}
            </ul>
          ) : <p>Nenhuma franquia cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
};

export default GerenciadorFranquias;