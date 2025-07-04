import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// --- FUNÇÕES AUXILIARES COMPLETAS ---
const generateMonthOptions = () => {
  const options = [];
  const date = new Date();
  for (let i = -3; i <= 3; i++) {
    const targetDate = new Date(date.getFullYear(), date.getMonth() + i, 1);
    const month = targetDate.toLocaleString('pt-BR', { month: 'long' });
    const year = targetDate.getFullYear();
    const id = `${year}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    const text = `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
    options.push({ id, text });
  }
  return options;
};

const formatToBRL = (value) => {
    if (isNaN(Number(value)) || value === null || value === undefined) return '';
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseFromBRL = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(/\./g, '').replace(',', '.'));
};
// --- FIM DAS FUNÇÕES AUXILIARES ---


const GerenciadorMetas = () => {
  const { currentUser } = useAuth();
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions.find(opt => opt.id.startsWith(new Date().getFullYear().toString()) && opt.id.endsWith(String(new Date().getMonth() + 1).padStart(2, '0'))).id);

  const [metas, setMetas] = useState({
    metaAtivos: '',
    metaMigracao: '',
    metaTpvTransacionado: '',
    valorReferenciaTotal: '',
    pesoAtivos: '',
    pesoMigracao: '',
    pesoTpv: '',
    setpointAtivos: '',
    setpointMigracao: '',
    setpointTpv: '',
    colchaoMes1: '',
    colchaoMes2: '',
    colchaoMes3: '',
  });
  
  const [agentes, setAgentes] = useState([]);
  const [distribuicao, setDistribuicao] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  const [planosCarreira, setPlanosCarreira] = useState([]);
  const [novoPlanoNome, setNovoPlanoNome] = useState('');
  const [novoPlanoValor, setNovoPlanoValor] = useState('');


  const fetchDados = useCallback(async () => {
    if (!currentUser?.franquiaId) return;
    setLoading(true);

    const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', selectedMonth);
    const metaDocSnap = await getDoc(metaDocRef);
    if (metaDocSnap.exists()) {
      const data = metaDocSnap.data();
      setMetas({
        metaAtivos: data.metaAtivos || '',
        metaMigracao: data.metaMigracao || '',
        metaTpvTransacionado: formatToBRL(data.metaTpvTransacionado),
        valorReferenciaTotal: formatToBRL(data.valorReferenciaTotal),
        pesoAtivos: data.pesoAtivos || '',
        pesoMigracao: data.pesoMigracao || '',
        pesoTpv: data.pesoTpv || '',
        setpointAtivos: data.setpointAtivos || '',
        setpointMigracao: data.setpointMigracao || '',
        setpointTpv: data.setpointTpv || '',
        colchaoMes1: formatToBRL(data.colchaoMes1),
        colchaoMes2: formatToBRL(data.colchaoMes2),
        colchaoMes3: formatToBRL(data.colchaoMes3),
      });
      const distribuicaoFormatada = {};
      if (data.distribuicao) {
        for (const agenteId in data.distribuicao) {
            distribuicaoFormatada[agenteId] = {
                ...data.distribuicao[agenteId],
                metaTpvTransacionado: formatToBRL(data.distribuicao[agenteId].metaTpvTransacionado),
            }
        }
      }
      setDistribuicao(distribuicaoFormatada);
    } else {
      setMetas({
        metaAtivos: '', metaMigracao: '', metaTpvTransacionado: '',
        valorReferenciaTotal: '', pesoAtivos: '', pesoMigracao: '', pesoTpv: '',
        setpointAtivos: '', setpointMigracao: '', setpointTpv: '',
        colchaoMes1: '', colchaoMes2: '', colchaoMes3: '',
      });
      setDistribuicao({});
    }

    const planosQuery = query(collection(db, 'franquias', currentUser.franquiaId, 'planosDeCarreira'));
    const planosSnapshot = await getDocs(planosQuery);
    const planosList = planosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPlanosCarreira(planosList);

    try {
      const q = query(collection(db, "usuarios"), where("franquiaId", "==", currentUser.franquiaId), where("perfil", "==", "agente"), where("status", "==", "ativo"));
      const querySnapshot = await getDocs(q);
      const agentesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgentes(agentesList);
    } catch (error) { console.error("Erro ao buscar agentes:", error); }
    
    setLoading(false);
  }, [currentUser, selectedMonth]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const handleSalvarPlano = async (e) => {
    e.preventDefault();
    if (!novoPlanoNome || !novoPlanoValor || !currentUser?.franquiaId) return;
    const novoPlano = {
        nomeNivel: novoPlanoNome,
        valorReferenciaRV: parseFromBRL(novoPlanoValor)
    };
    await addDoc(collection(db, 'franquias', currentUser.franquiaId, 'planosDeCarreira'), novoPlano);
    setNovoPlanoNome('');
    setNovoPlanoValor('');
    fetchDados(); 
  };

  const handlePlanoValorChange = (e) => {
    let onlyDigits = e.target.value.replace(/\D/g, '');
    if (onlyDigits === '') {
        setNovoPlanoValor('');
        return;
    }
    let numberValue = Number(onlyDigits) / 100;
    setNovoPlanoValor(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('valorReferencia') || name === 'metaTpvTransacionado' || name.startsWith('colchao')) {
        let onlyDigits = value.replace(/\D/g, '');
        if (onlyDigits === '') {
            setMetas(prev => ({ ...prev, [name]: '' }));
            return;
        }
        let numberValue = Number(onlyDigits) / 100;
        setMetas(prev => ({ ...prev, [name]: numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }));
    } else {
        const filteredValue = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        setMetas(prev => ({ ...prev, [name]: filteredValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.franquiaId || !selectedMonth) return;
    const metasParaSalvar = {
      metaAtivos: Number(metas.metaAtivos) || 0,
      metaMigracao: Number(metas.metaMigracao) || 0,
      metaTpvTransacionado: parseFromBRL(metas.metaTpvTransacionado),
      pesoAtivos: Number(metas.pesoAtivos) || 0,
      pesoMigracao: Number(metas.pesoMigracao) || 0,
      pesoTpv: Number(metas.pesoTpv) || 0,
      setpointAtivos: Number(metas.setpointAtivos) || 0,
      setpointMigracao: Number(metas.setpointMigracao) || 0,
      setpointTpv: Number(metas.setpointTpv) || 0,
    };
    const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', selectedMonth);
    try {
      await setDoc(metaDocRef, metasParaSalvar, { merge: true });
      setSuccess('Metas e Parâmetros salvos com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      console.error("Erro ao salvar metas:", error);
    }
  };

  const handleSalvarColchao = async () => {
    if (!currentUser?.franquiaId || !selectedMonth) return;
    const colchaoParaSalvar = {
        colchaoMes1: parseFromBRL(metas.colchaoMes1),
        colchaoMes2: parseFromBRL(metas.colchaoMes2),
        colchaoMes3: parseFromBRL(metas.colchaoMes3),
    };
    const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', selectedMonth);
    try {
      await setDoc(metaDocRef, colchaoParaSalvar, { merge: true });
      setSuccess('Parâmetros da RV Colchão salvos com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
      console.error("Erro ao salvar RV Colchão:", error);
    }
  };

  const handleDistribuicaoChange = (agenteId, campo, valor) => {
    const valorAtualAgente = distribuicao[agenteId] || {};
    let valorFinal = valor;
    if (campo === 'metaTpvTransacionado') {
        let onlyDigits = valor.replace(/\D/g, '');
        if (onlyDigits === '') { valorFinal = ''; } 
        else {
            let numberValue = Number(onlyDigits) / 100;
            valorFinal = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    } else {
        valorFinal = valor.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    }
    setDistribuicao(prev => ({ ...prev, [agenteId]: { ...valorAtualAgente, [campo]: valorFinal }}));
  };

  const handleSalvarDistribuicao = async () => {
    if (!currentUser?.franquiaId || !selectedMonth) return;
    const distribuicaoParaSalvar = {};
    for (const agenteId in distribuicao) {
        distribuicaoParaSalvar[agenteId] = {
            metaAtivos: Number(distribuicao[agenteId]?.metaAtivos) || 0,
            metaMigracao: Number(distribuicao[agenteId]?.metaMigracao) || 0,
            metaTpvTransacionado: parseFromBRL(distribuicao[agenteId]?.metaTpvTransacionado),
        };
    }
    const metaDocRef = doc(db, 'franquias', currentUser.franquiaId, 'metas', selectedMonth);
    try {
        await setDoc(metaDocRef, { distribuicao: distribuicaoParaSalvar }, { merge: true });
        setSuccess('Distribuição de metas salva com sucesso!');
        setTimeout(() => setSuccess(''), 4000);
    } catch (error) {
        console.error("Erro ao salvar distribuição:", error);
    }
  };

  const totalPeso = Number(metas.pesoAtivos || 0) + Number(metas.pesoMigracao || 0) + Number(metas.pesoTpv || 0);

  if (!currentUser) return <p>Carregando...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-700 mb-4">Gerenciar Metas da Franquia</h2>
      
      <div className="mb-8 p-4 border border-dashed rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Plano de Carreira e RV de Referência</h3>
          <p className="text-sm text-gray-600 my-2">Defina os níveis de carreira e o valor base da RV para cada um.</p>
          <div className="space-y-2 my-4">
              {planosCarreira.map(plano => (
                  <div key={plano.id} className="flex justify-between items-center bg-slate-100 p-2 rounded">
                      <span className="font-medium">{plano.nomeNivel}</span>
                      <span className="font-bold">{formatToBRL(plano.valorReferenciaRV)}</span>
                  </div>
              ))}
          </div>
          <form onSubmit={handleSalvarPlano} className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-2 sm:space-y-0">
              <div className="flex-grow">
                  <label className="block text-xs font-medium text-gray-600">Nome do Nível</label>
                  <input type="text" value={novoPlanoNome} onChange={(e) => setNovoPlanoNome(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: Aspira"/>
              </div>
              <div className="flex-grow">
                  <label className="block text-xs font-medium text-gray-600">Valor de Referência RV (R$)</label>
                  <input type="text" inputMode="tel" value={novoPlanoValor} onChange={handlePlanoValorChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="1.200,00"/>
              </div>
              {/* BOTÃO CORRIGIDO PARA VERDE */}
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto">Adicionar Nível</button>
          </form>
      </div>

      <div className="mb-6 max-w-xs">
        <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Selecione o Mês dos Parâmetros</label>
        <select id="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          {monthOptions.map(option => (<option key={option.id} value={option.id}>{option.text}</option>))}
        </select>
      </div>

      {loading ? (<p>Carregando metas...</p>) : (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Parâmetros e Metas do Mês</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Meta de Novos Ativos (unidades)</label>
                    <input type="text" inputMode="numeric" name="metaAtivos" value={metas.metaAtivos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Meta de Migração (%)</label>
                    <input type="text" inputMode="numeric" name="metaMigracao" value={metas.metaMigracao} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 7.5" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Meta de TPV Transacionado (R$)</label>
                    <input type="text" inputMode="tel" name="metaTpvTransacionado" value={metas.metaTpvTransacionado} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="1.000,00" />
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Divisão de Peso da RV Total (%)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-medium text-gray-600">Peso Novos Ativos</label><input type="text" inputMode="numeric" name="pesoAtivos" value={metas.pesoAtivos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 30" /></div>
                        <div><label className="block text-xs font-medium text-gray-600">Peso Migração</label><input type="text" inputMode="numeric" name="pesoMigracao" value={metas.pesoMigracao} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 30" /></div>
                        <div><label className="block text-xs font-medium text-gray-600">Peso TPV</label><input type="text" inputMode="numeric" name="pesoTpv" value={metas.pesoTpv} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 40" /></div>
                    </div>
                    {totalPeso !== 100 && totalPeso > 0 && (<p className="text-xs text-red-600 mt-2">A soma dos pesos deve ser 100%. Soma atual: {totalPeso}%</p>)}
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Atingimento Mínimo para Receber RV (%)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-medium text-gray-600">Mínimo Ativos</label><input type="text" inputMode="numeric" name="setpointAtivos" value={metas.setpointAtivos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 80" /></div>
                        <div><label className="block text-xs font-medium text-gray-600">Mínimo Migração</label><input type="text" inputMode="numeric" name="setpointMigracao" value={metas.setpointMigracao} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 80" /></div>
                        <div><label className="block text-xs font-medium text-gray-600">Mínimo TPV</label><input type="text" inputMode="numeric" name="setpointTpv" value={metas.setpointTpv} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 80" /></div>
                    </div>
                </div>

                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Salvar Metas e Parâmetros</button>
            </form>
            
            <div className="p-4 bg-blue-50 rounded-lg my-6">
              <label className="block text-lg font-semibold text-gray-700 mb-2">RV Colchão para Novos Agentes (Opcional)</label>
              <p className="text-sm text-gray-600 mb-3">Defina uma garantia de RV para os 3 primeiros meses de um agente.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-medium text-gray-600">Garantia Mês 1 (R$)</label><input type="text" inputMode="tel" name="colchaoMes1" value={metas.colchaoMes1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 900,00" /></div>
                  <div><label className="block text-xs font-medium text-gray-600">Garantia Mês 2 (R$)</label><input type="text" inputMode="tel" name="colchaoMes2" value={metas.colchaoMes2} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 750,00" /></div>
                  <div><label className="block text-xs font-medium text-gray-600">Garantia Mês 3 (R$)</label><input type="text" inputMode="tel" name="colchaoMes3" value={metas.colchaoMes3} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 450,00" /></div>
              </div>
              <button onClick={handleSalvarColchao} type="button" className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  Salvar Parâmetros
              </button>
            </div>
        </>
      )}
      
      <div className="mt-12 pt-6 border-t">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">Distribuição de Metas para Agentes</h2>
            <button onClick={handleSalvarDistribuicao} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Salvar Distribuição</button>
        </div>
        {loading ? <p>Carregando agentes...</p> : (
            <div className="space-y-4">
                {agentes.map(agente => (
                    <div key={agente.id} className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-1"><p className="font-bold text-gray-800">{agente.nome}</p><p className="text-sm text-gray-500">{agente.email}</p></div>
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">Meta Novos Ativos</label><input type="text" inputMode="numeric" value={distribuicao[agente.id]?.metaAtivos || ''} onChange={(e) => handleDistribuicaoChange(agente.id, 'metaAtivos', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                             <div><label className="block text-sm font-medium text-gray-700">Meta Migração (%)</label><input type="text" inputMode="numeric" value={distribuicao[agente.id]?.metaMigracao || ''} onChange={(e) => handleDistribuicaoChange(agente.id, 'metaMigracao', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ex: 7.5" /></div>
                             <div><label className="block text-sm font-medium text-gray-700">Meta de TPV (R$)</label><input type="text" inputMode="tel" value={distribuicao[agente.id]?.metaTpvTransacionado || ''} onChange={(e) => handleDistribuicaoChange(agente.id, 'metaTpvTransacionado', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="1.000,00"/></div>
                        </div>
                    </div>
                ))}
                {agentes.length === 0 && <p className="text-center py-4 text-gray-500 italic">Nenhum agente ativo encontrado para este mês.</p>}
            </div>
        )}
        {success && <p className="text-green-600 mt-4 text-sm">{success}</p>}
      </div>
    </div>
  );
};

export default GerenciadorMetas;