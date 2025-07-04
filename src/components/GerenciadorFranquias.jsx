import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const GerenciadorFranquias = () => {
  const [franquias, setFranquias] = useState([]);
  const [nomeFranquia, setNomeFranquia] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'franquias'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFranquias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeFranquia.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'franquias'), {
        nome: nomeFranquia,
        createdAt: serverTimestamp(),
        metaAtivos: 10, metaMigracao: 0.8, metaTpvTransacionado: 100000, valorReferencia: 1200
      });
      setFeedback(`Franquia "${nomeFranquia}" criada com sucesso!`);
      setNomeFranquia('');
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedback('Erro ao criar franquia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-dark-text mb-4">Criar Nova Franquia</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="franchise-name" className="block text-sm font-medium text-slate-700">Nome da Franquia</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="franchise-name"
              value={nomeFranquia}
              onChange={(e) => setNomeFranquia(e.target.value)}
              placeholder="Ex: Stone Campinas"
              required
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-primary-green focus:border-primary-green sm:text-sm px-3 py-2"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-r-md text-white bg-primary-green hover:bg-secondary-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green disabled:bg-slate-400"
            >
              {isSubmitting ? '...' : 'Criar Franquia'}
            </button>
          </div>
          {feedback && <p className="mt-2 text-sm text-gray-600">{feedback}</p>}
        </form>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-dark-text">Franquias Existentes</h3>
        </div>
        <ul className="divide-y divide-slate-200">
          {loading ? <li className="p-4 text-center text-light-text">Carregando...</li> : (
            franquias.map(franquia => (
              <li key={franquia.id} className="p-4 flex justify-between items-center">
                <span className="font-medium text-slate-900">{franquia.nome}</span>
                <span className="text-xs text-light-text bg-slate-100 px-2 py-1 rounded-full">ID: {franquia.id}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default GerenciadorFranquias;