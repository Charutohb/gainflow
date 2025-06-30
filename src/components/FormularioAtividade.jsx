import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config'; // Não precisamos mais do 'auth' aqui

// O componente agora espera receber 'user'
const FormularioAtividade = ({ user }) => {
  const [nomeCliente, setNomeCliente] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Verificação para garantir que temos os dados do usuário antes de submeter
    if (!user || !user.uid || !user.franquiaId) {
        setError('Erro: Dados do usuário não encontrados. Faça o login novamente.');
        return;
    }

    if (!nomeCliente) {
      setError('O nome do cliente é obrigatório.');
      return;
    }

    try {
      await addDoc(collection(db, 'atividades'), {
        agenteId: user.uid, // CORRIGIDO: Usa o UID do 'user' recebido
        franquiaId: user.franquiaId, // CORRIGIDO: Usa o franquiaId do 'user' recebido
        nomeCliente: nomeCliente,
        tipo: 'Ativação de Conta',
        valor: 1,
        data: serverTimestamp()
      });
      setSuccess('Atividade lançada com sucesso!');
      setNomeCliente('');
      setTimeout(() => setSuccess(''), 3000); // Limpa a mensagem de sucesso após 3 segundos
    } catch (err) {
      setError('Erro ao lançar atividade. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '2rem', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Lançar Nova Atividade</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ margin: '1rem 0' }}>
          <label>Nome do Cliente:</label>
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Salvar Atividade
        </button>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
      </form>
    </div>
  );
};

export default FormularioAtividade;