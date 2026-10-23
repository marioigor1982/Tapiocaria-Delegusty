import React, { useState } from 'react';
import {
  fetchAddressByCep,
  formatCepString,
  getGoogleMapsRouteUrl,
  STORE_INFO,
} from '../utils/deliveryCalculator';

export interface DeliveryAddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  fee: number;
  feeInput: string;
  fullAddress: string;
}

interface DeliveryFormProps {
  data: DeliveryAddressData;
  onChange: (updated: Partial<DeliveryAddressData>) => void;
  onSwitchToPickup: () => void;
  compact?: boolean;
}

// Utility to parse typed shipping fee (e.g. "5,00" or "7.5" -> 5 or 7.5)
export const parseManualFee = (feeStr: string): number => {
  if (!feeStr) return 0;
  const cleaned = feeStr.replace('R$', '').replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) || val < 0 ? 0 : parseFloat(val.toFixed(2));
};

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  data,
  onChange,
  onSwitchToPickup,
  compact = false,
}) => {
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Opens Google Maps directions in a new tab from store origin (05868-140) to client destination
  const handleOpenGoogleMapsRoute = () => {
    const clean = data.cep.replace(/\D/g, '');
    const dest =
      data.fullAddress ||
      (data.street
        ? `${data.street}, ${data.number || ''}, ${data.neighborhood || ''}, São Paulo - SP`
        : data.cep || 'São Paulo, SP');

    const mapsUrl = getGoogleMapsRouteUrl(clean || data.cep, dest);
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper to fetch address via ViaCEP for convenience
  const handleLookupCep = async (rawCep: string) => {
    const clean = rawCep.replace(/\D/g, '');
    if (clean.length !== 8) {
      setSearchFeedback('Digite os 8 dígitos do CEP.');
      return;
    }

    setIsSearchingCep(true);
    setSearchFeedback(null);

    try {
      const res = await fetchAddressByCep(clean);
      if (res) {
        const fullAddr = [
          res.street ? `${res.street}${data.number ? ', Nº ' + data.number : ''}` : (data.number ? `Nº ${data.number}` : ''),
          data.complement ? data.complement.trim() : '',
          res.neighborhood,
          `${res.city || 'São Paulo'} - ${res.state || 'SP'}`,
          `CEP ${formatCepString(clean)}`,
        ]
          .filter(Boolean)
          .join(', ');

        onChange({
          cep: formatCepString(clean),
          street: res.street || data.street,
          neighborhood: res.neighborhood || data.neighborhood,
          city: res.city || data.city || 'São Paulo',
          state: res.state || data.state || 'SP',
          fullAddress: fullAddr,
        });
        setSearchFeedback('✓ Endereço preenchido com sucesso!');
      } else {
        setSearchFeedback('CEP não localizado automaticamente. Por favor, digite o endereço manualmente.');
      }
    } catch {
      setSearchFeedback('Não foi possível consultar o CEP no momento. Você pode preencher manualmente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCepString(e.target.value);
    const clean = formatted.replace(/\D/g, '');
    onChange({ cep: formatted });

    if (clean.length === 8) {
      handleLookupCep(formatted);
    }
  };

  const updateFullAddress = (overrides: Partial<DeliveryAddressData>) => {
    const current = { ...data, ...overrides };
    const fullAddr = [
      current.street ? `${current.street}${current.number ? ', Nº ' + current.number : ''}` : (current.number ? `Nº ${current.number}` : ''),
      current.complement ? current.complement.trim() : '',
      current.neighborhood,
      `${current.city || 'São Paulo'} - ${current.state || 'SP'}`,
      current.cep ? `CEP ${current.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    onChange({
      ...overrides,
      fullAddress: fullAddr,
    });
  };

  const handleFeeInputChange = (val: string) => {
    const num = parseManualFee(val);
    onChange({
      feeInput: val,
      fee: num,
    });
  };

  return (
    <div className={`space-y-3.5 ${compact ? 'text-xs' : ''}`}>
      {/* Informações da Loja */}
      <div className="bg-white/80 p-2.5 rounded-xl border border-orange-200 flex items-center justify-between gap-2 text-xs text-stone-700">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-shrink-0">📍</span>
          <span className="truncate">
            <strong>Partida da Loja:</strong> {STORE_INFO.address} (CEP {STORE_INFO.cep})
          </span>
        </div>
        <button
          type="button"
          onClick={onSwitchToPickup}
          className="text-[11px] text-orange-700 font-bold hover:underline cursor-pointer whitespace-nowrap"
        >
          Mudar p/ Retirada
        </button>
      </div>

      {/* Seção de Endereço do Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* CEP com preenchimento automático */}
        <div className="sm:col-span-5 space-y-1">
          <label className="block font-bold text-stone-800 text-xs flex items-center justify-between">
            <span>CEP de Entrega:</span>
            {isSearchingCep && <span className="text-orange-600 font-normal text-[11px]">Buscando...</span>}
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              maxLength={9}
              value={data.cep}
              onChange={handleCepChange}
              className="flex-1 px-3 py-2 text-sm font-bold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 tracking-wider shadow-inner"
            />
            <button
              type="button"
              onClick={() => handleLookupCep(data.cep)}
              disabled={isSearchingCep || data.cep.replace(/\D/g, '').length !== 8}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer ${
                isSearchingCep
                  ? 'bg-orange-300 text-white cursor-wait'
                  : data.cep.replace(/\D/g, '').length !== 8
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
              title="Buscar rua pelo CEP"
            >
              {isSearchingCep ? '⏳' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Número da Residência */}
        <div className="sm:col-span-3 space-y-1">
          <label className="block font-bold text-stone-800 text-xs">
            Número <span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            placeholder="Ex: 123"
            value={data.number}
            onChange={(e) => updateFullAddress({ number: e.target.value })}
            className="w-full px-3 py-2 text-sm font-semibold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 shadow-inner"
          />
        </div>

        {/* Complemento */}
        <div className="sm:col-span-4 space-y-1">
          <label className="block font-bold text-stone-800 text-xs">
            Complemento <span className="text-stone-400 font-normal">(Opcional)</span>:
          </label>
          <input
            type="text"
            placeholder="Ex: Apto 42, Bloco B"
            value={data.complement}
            onChange={(e) => updateFullAddress({ complement: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
          />
        </div>
      </div>

      {/* Rua e Bairro */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 space-y-1">
          <label className="block text-xs font-semibold text-stone-700">
            Rua / Logradouro:
          </label>
          <input
            type="text"
            placeholder="Ex: Rua João Florêncio de Sales Gomes"
            value={data.street}
            onChange={(e) => updateFullAddress({ street: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label className="block text-xs font-semibold text-stone-700">
            Bairro:
          </label>
          <input
            type="text"
            placeholder="Ex: Jardim Ipê / Capão Redondo"
            value={data.neighborhood}
            onChange={(e) => updateFullAddress({ neighborhood: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {searchFeedback && (
        <div className="bg-stone-100 border border-stone-300 rounded-xl p-2 text-xs text-stone-800">
          {searchFeedback}
        </div>
      )}

      {/* Botão Ver Rota no Google Maps */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={handleOpenGoogleMapsRoute}
          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer bg-[#25d366] hover:bg-[#128c7e] text-white hover:scale-[1.01]"
          title="Abrir rota no Google Maps para ver a distância exata a partir do nosso CEP 05868-140"
        >
          <span>🗺️</span>
          <span>Ver Distância no Google Maps (Origem CEP: 05868-140)</span>
          <span className="text-xs opacity-80">↗</span>
        </button>
      </div>

      {/* Campo Manual de Frete (combinar ou digitar) */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-orange-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="text-xs font-bold text-stone-900 block">
              Valor do Frete (R$) - Ajuste Manual:
            </label>
            <p className="text-[11px] text-stone-500">
              Digite o valor acertado ou deixe em branco para combinar pelo WhatsApp.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-500 block">Frete somado:</span>
            <span className="text-base sm:text-lg font-black text-orange-600 font-ubuntu">
              {data.fee > 0 ? `+ R$ ${data.fee.toFixed(2).replace('.', ',')}` : 'A combinar'}
            </span>
          </div>
        </div>

        {/* Input manual de valor */}
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-stone-500 font-bold text-sm">
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00 (ou deixe em branco para combinar com a loja)"
            value={data.feeInput}
            onChange={(e) => handleFeeInputChange(e.target.value)}
            className="w-full pl-11 pr-3 py-2 text-sm font-bold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 shadow-inner"
          />
        </div>

        {/* Atalhos rápidos de valor de frete */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-stone-500">Atalhos:</span>
          {['2,50', '5,00', '7,50', '10,00', '15,00'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleFeeInputChange(chip)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                data.feeInput === chip
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-orange-50 hover:border-orange-300'
              }`}
            >
              R$ {chip}
            </button>
          ))}
          {data.feeInput && (
            <button
              type="button"
              onClick={() => handleFeeInputChange('')}
              className="text-[11px] text-red-500 hover:underline ml-auto cursor-pointer"
            >
              Zerar / A Combinar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryForm;
