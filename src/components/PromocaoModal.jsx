import React from 'react';

const PromocaoModal = ({ isOpen, onClose, mensagem }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      {/* Container do modal com confetes (simulados) */}
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative overflow-hidden">
        {/* Confetes (elementos decorativos) */}
        <div className="absolute top-0 left-0 -mt-4 -ml-4 w-16 h-16 bg-yellow-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-0 right-0 -mb-4 -mr-4 w-24 h-24 bg-green-300 rounded-full opacity-50"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-300 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">PROMOÇÃO!</h2>
            <p className="text-lg text-gray-600 mb-6">
                {mensagem}
            </p>
            <button 
                onClick={onClose} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-full text-lg transition-transform transform hover:scale-105"
            >
                Continuar
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromocaoModal;