import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app'; // Importação correta do getApp
import { db } from '../firebase/config';

// --- Componente para a Aba de Gerenciar Franquias ---
const GerenciarFranquias = ({ franquias, loading, onUpdate }) => {
    const [nomeFranquia, setNomeFranquia] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeFranquia) return;
        await addDoc(collection(db, "franquias"), {
            nome: nomeFranquia,
            createdAt: serverTimestamp()
        });
        setNomeFranquia('');
        onUpdate(); 
        alert(`Franquia "${nomeFranquia}" criada com sucesso!`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Adicionar Nova Franquia</h3>
                <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-grow">
                        <label htmlFor="nome-franquia" className="block text-sm font-medium text-gray-700">Nome da Franquia</label>
                        <input type="text" id="nome-franquia" value={nomeFranquia} onChange={(e) => setNomeFranquia(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">Salvar Franquia</button>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Franquias Existentes</h3>
                <div className="mt-2 bg-white rounded-lg shadow overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {loading ? <li className="p-4 text-center text-gray-500">Carregando...</li> : franquias.map(franquia => (
                            <li key={franquia.id} className="p-4"><p className="font-medium text-gray-900">{franquia.nome}</p></li>
                        ))}
                        {!loading && franquias.length === 0 && <li className="p-4 text-center text-gray-500">Nenhuma franquia cadastrada.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// --- Componente para a Aba de Gerenciar Franqueados ---
const GerenciarFranqueados = ({ franquias, onUpdate }) => {
    const [franqueados, setFranqueados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [franquiaId, setFranquiaId] = useState('');

    const fetchFranqueados = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, "usuarios"), where("perfil", "==", "franqueado"));
        const querySnapshot = await getDocs(q);
        const franqueadosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const comNomesDeFranquia = await Promise.all(franqueadosList.map(async franqueado => {
            let nomeFranquia = 'Não associada';
            if (franqueado.franquiaId) {
                const franquiaDoc = await getDoc(doc(db, 'franquias', franqueado.franquiaId));
                if (franquiaDoc.exists()) nomeFranquia = franquiaDoc.data().nome;
            }
            return { ...franqueado, nomeFranquia };
        }));
        setFranqueados(comNomesDeFranquia);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFranqueados();
        if (franquias.length > 0 && !franquiaId) {
            setFranquiaId(franquias[0].id);
        }
    }, [franquias, franquiaId, fetchFranqueados]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const functions = getFunctions(getApp(), 'southamerica-east1');
            const criarNovoFranqueado = httpsCallable(functions, 'criarNovoFranqueado');
            await criarNovoFranqueado({ nome, email, senha, franquiaId });
            alert('Franqueado criado com sucesso!');
            onUpdate(); 
            setNome(''); setEmail(''); setSenha('');
        } catch (error) {
            console.error("Erro ao criar franqueado:", error);
            alert(`Erro: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Adicionar Novo Franqueado</h3>
                <form onSubmit={handleSubmit} className="mt-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Nome</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Senha Provisória</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Associar à Franquia</label><select value={franquiaId} onChange={e => setFranquiaId(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">{franquias.length > 0 ? franquias.map(f => <option key={f.id} value={f.id}>{f.nome}</option>) : <option disabled>Crie uma franquia primeiro</option>}</select></div>
                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">Salvar Franqueado</button>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Franqueados Existentes</h3>
                <div className="mt-2 bg-white rounded-lg shadow overflow-hidden"><ul className="divide-y divide-gray-200">{loading ? <li className="p-4 text-center">Carregando...</li> : franqueados.map(f => (<li key={f.id} className="p-4 flex justify-between items-center"><div><p className="font-medium text-gray-900">{f.nome}</p><p className="text-sm text-gray-500">{f.email}</p></div><span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{f.nomeFranquia}</span></li>))}</ul></div>
            </div>
        </div>
    );
};

// --- Componente Principal do Painel Super Admin ---
const PainelSuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('franquias');
  const [franquias, setFranquias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchDadosIniciais = useCallback(async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "franquias"));
      setFranquias(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
  }, []);
  
  useEffect(() => { fetchDadosIniciais(); }, [fetchDadosIniciais]);

  const renderContent = () => {
    switch (activeTab) {
      case 'franquias':
        return <GerenciarFranquias onUpdate={fetchDadosIniciais} loading={loading} franquias={franquias} />;
      case 'franqueados':
        return <GerenciarFranqueados franquias={franquias} onUpdate={fetchDadosIniciais} />;
      default:
        return null;
    }
  };

  const getTabClass = (tabName) => {
    return `px-4 py-3 font-semibold text-sm transition-colors duration-200 focus:outline-none ${ activeTab === tabName ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Painel do Super Administrador</h2>
      <div className="flex border-b border-gray-200">
        <button className={getTabClass('franquias')} onClick={() => setActiveTab('franquias')}>Gerenciar Franquias</button>
        <button className={getTabClass('franqueados')} onClick={() => setActiveTab('franqueados')}>Gerenciar Franqueados</button>
      </div>
      <div className="mt-6">{renderContent()}</div>
    </div>
  );
};

export default PainelSuperAdmin;