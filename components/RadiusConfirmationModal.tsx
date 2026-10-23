import React from 'react';

interface RadiusConfirmationModalProps {
  isOpen: boolean;
  distanceKm: number;
  feeFormatted: string;
  onConfirm: () => void;
  onCancelPickup: () => void;
  onClose: () => void;
}

export const RadiusConfirmationModal: React.FC<RadiusConfirmationModalProps> = ({
  isOpen,
  distanceKm,
  feeFormatted,
  onConfirm,
  onCancelPickup,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 animate-scale-up">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
          ⚠️
        </div>

        <h3 className="text-xl font-bold font-ubuntu text-stone-900 text-center mb-2">
          Entrega Acima de 15 km
        </h3>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 mb-5 space-y-2">
          <p className="leading-relaxed">
            O CEP informado está a aproximadamente <strong className="text-amber-900 text-sm">{distanceKm.toFixed(1).replace('.', ',')} km</strong> de distância da nossa loja (Cohab Adventista).
          </p>
          <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 font-bold text-stone-800 flex justify-between items-center text-xs">
            <span>Valor do Frete (R$ 2,50/km):</span>
            <span className="text-orange-700 text-sm font-black">R$ {feeFormatted}</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-normal">
            Nosso raio padrão de entrega é de até 15 km. <strong>Você tem certeza de que deseja prosseguir com a entrega?</strong>
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✓ Sim, quero prosseguir com a entrega</span>
          </button>

          <button
            type="button"
            onClick={onCancelPickup}
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🏪 Não, prefiro retirar na loja (Frete Grátis)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 text-stone-500 hover:text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Não, quero alterar o CEP
          </button>
        </div>
      </div>
    </div>
  );
};

export default RadiusConfirmationModal;
