import React, { useState } from 'react';
import {
  calculateDeliveryByCep,
  formatCepString,
  STORE_INFO,
  type DeliveryCalculationResult,
} from '../utils/deliveryCalculator';

export interface DeliveryAddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  distanceKm: number;
  fee: number;
  feeFormatted: string;
  explanation: string;
  isOverRadius: boolean;
  confirmedOverRadius: boolean;
  fullAddress: string;
}

interface DeliveryFormProps {
  data: DeliveryAddressData;
  onChange: (updated: Partial<DeliveryAddressData>) => void;
  onSwitchToPickup: () => void;
  compact?: boolean;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  data,
  onChange,
  onSwitchToPickup,
  compact = false,
}) => {
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Helper to trigger calculation by CEP + number + complement
  const triggerCalculation = async (
    targetCep: string,
    targetNumber = data.number,
    targetComplement = data.complement
  ) => {
    const clean = targetCep.replace(/\D/g, '');
    if (clean.length !== 8) {
      setSearchError('Digite os 8 dígitos do CEP.');
      return;
    }

    setIsSearchingCep(true);
    setSearchError(null);

    try {
      const res: DeliveryCalculationResult = await calculateDeliveryByCep(
        clean,
        targetNumber,
        targetComplement
      );

      if (res.success) {
        const fullAddr = [
          (res.street || data.street)
            ? `${res.street || data.street}${targetNumber ? ', Nº ' + targetNumber : ''}`
            : (targetNumber ? `Nº ${targetNumber}` : ''),
          targetComplement ? targetComplement.trim() : '',
          res.neighborhood || data.neighborhood,
          `${res.city || data.city || 'São Paulo'} - ${res.state || data.state || 'SP'}`,
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
          distanceKm: res.distanceKm,
          fee: res.fee,
          feeFormatted: res.feeFormatted,
          explanation: res.explanation,
          isOverRadius: res.isOverRadius,
          // Reset confirmation if CEP changed to >15km
          confirmedOverRadius: res.isOverRadius ? data.confirmedOverRadius : false,
          fullAddress: fullAddr,
        });
      } else {
        setSearchError(res.error || 'CEP não localizado. Por favor, verifique.');
      }
    } catch (err) {
      console.warn('Erro ao buscar CEP:', err);
      setSearchError('Erro de conexão ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCepString(e.target.value);
    const clean = formatted.replace(/\D/g, '');
    onChange({ cep: formatted });

    if (clean.length === 8) {
      triggerCalculation(formatted);
    }
  };

  const handleNumberChange = (newNumber: string) => {
    const fullAddr = [
      data.street ? `${data.street}, Nº ${newNumber}` : (newNumber ? `Nº ${newNumber}` : ''),
      data.complement ? data.complement.trim() : '',
      data.neighborhood,
      `${data.city || 'São Paulo'} - ${data.state || 'SP'}`,
      data.cep ? `CEP ${data.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    onChange({
      number: newNumber,
      fullAddress: fullAddr,
    });
  };

  const handleComplementChange = (newComplement: string) => {
    const fullAddr = [
      data.street ? `${data.street}, Nº ${data.number}` : (data.number ? `Nº ${data.number}` : ''),
      newComplement ? newComplement.trim() : '',
      data.neighborhood,
      `${data.city || 'São Paulo'} - ${data.state || 'SP'}`,
      data.cep ? `CEP ${data.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    onChange({
      complement: newComplement,
      fullAddress: fullAddr,
    });
  };

  const handleStreetChange = (newStreet: string) => {
    const fullAddr = [
      newStreet ? `${newStreet}, Nº ${data.number}` : (data.number ? `Nº ${data.number}` : ''),
      data.complement ? data.complement.trim() : '',
      data.neighborhood,
      `${data.city || 'São Paulo'} - ${data.state || 'SP'}`,
      data.cep ? `CEP ${data.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    onChange({
      street: newStreet,
      fullAddress: fullAddr,
    });
  };

  const handleNeighborhoodChange = (newNeighborhood: string) => {
    const fullAddr = [
      data.street ? `${data.street}, Nº ${data.number}` : (data.number ? `Nº ${data.number}` : ''),
      data.complement ? data.complement.trim() : '',
      newNeighborhood,
      `${data.city || 'São Paulo'} - ${data.state || 'SP'}`,
      data.cep ? `CEP ${data.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    onChange({
      neighborhood: newNeighborhood,
      fullAddress: fullAddr,
    });
  };

  return (
    <div className={`space-y-3.5 ${compact ? 'text-xs' : ''}`}>
      {/* Header store origin note */}
      <div className="bg-white/80 p-2.5 rounded-xl border border-orange-200 flex items-center justify-between gap-2 text-xs text-stone-700">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-shrink-0">📍</span>
          <span className="truncate">
            <strong>Origem da Loja:</strong> {STORE_INFO.address} (CEP {STORE_INFO.cep})
          </span>
        </div>
        <span className="bg-orange-600 text-white font-black px-2 py-0.5 rounded-md text-[11px] flex-shrink-0 shadow-xs">
          R$ 2,50/km
        </span>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* CEP (Obrigatório) */}
        <div className="sm:col-span-5 space-y-1">
          <label className="block font-bold text-stone-800 text-xs flex items-center justify-between">
            <span>CEP do Destino <span className="text-red-500">* (Obrigatório)</span>:</span>
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
              onBlur={() => {
                if (data.cep.replace(/\D/g, '').length === 8 && !data.distanceKm) {
                  triggerCalculation(data.cep);
                }
              }}
              className="flex-1 px-3 py-2 text-sm font-bold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 tracking-wider shadow-inner"
            />
            <button
              type="button"
              onClick={() => triggerCalculation(data.cep)}
              disabled={isSearchingCep || data.cep.replace(/\D/g, '').length !== 8}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer ${
                isSearchingCep
                  ? 'bg-orange-300 text-white cursor-wait'
                  : data.cep.replace(/\D/g, '').length !== 8
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-[1.02]'
              }`}
              title="Calcular automaticamente a rota e o frete"
            >
              {isSearchingCep ? '⏳' : '⚡ Buscar'}
            </button>
          </div>
        </div>

        {/* Número (Obrigatório, manual) */}
        <div className="sm:col-span-3 space-y-1">
          <label className="block font-bold text-stone-800 text-xs">
            Número <span className="text-red-500">* (Obrigatório)</span>:
          </label>
          <input
            type="text"
            placeholder="Ex: 123"
            value={data.number}
            onChange={(e) => handleNumberChange(e.target.value)}
            className="w-full px-3 py-2 text-sm font-semibold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 shadow-inner"
          />
        </div>

        {/* Complemento (Opcional, manual) */}
        <div className="sm:col-span-4 space-y-1">
          <label className="block font-bold text-stone-800 text-xs">
            Complemento <span className="text-stone-400 font-normal">(Opcional)</span>:
          </label>
          <input
            type="text"
            placeholder="Ex: Apto 42, Bloco B, Casa 2"
            value={data.complement}
            onChange={(e) => handleComplementChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
          />
        </div>
      </div>

      {/* Street and Neighborhood (auto-filled from CEP) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 space-y-1">
          <label className="block text-xs font-semibold text-stone-700">
            Rua / Logradouro (auto-preenchido pelo CEP):
          </label>
          <input
            type="text"
            placeholder="Preenchido automaticamente pelo CEP"
            value={data.street}
            onChange={(e) => handleStreetChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label className="block text-xs font-semibold text-stone-700">
            Bairro / Cidade:
          </label>
          <input
            type="text"
            placeholder="Bairro / Cidade"
            value={
              data.neighborhood
                ? `${data.neighborhood}${data.city ? ' - ' + data.city : ''}`
                : data.city || ''
            }
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {searchError && (
        <div className="bg-amber-100 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
          <span>⚠️</span>
          <span>{searchError}</span>
        </div>
      )}

      {/* Strict Calculated Fee Banner (Manual editing disabled) */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-orange-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛵</span>
            <div>
              <div className="text-xs font-bold text-stone-900">
                Valor do Frete (Cálculo Automático)
              </div>
              <div className="text-[11px] text-stone-500">
                Taxa fixa de <strong>R$ 2,50 por km</strong> percorrido (inclusão manual desabilitada)
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-500 block">Total do Frete:</span>
            <span className="text-lg sm:text-xl font-black text-orange-600 font-ubuntu">
              {data.distanceKm > 0 ? `R$ ${data.feeFormatted}` : 'Aguardando CEP'}
            </span>
          </div>
        </div>

        {data.distanceKm > 0 ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-950 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-800">
                Distância calculada: ~{data.distanceKm.toFixed(1).replace('.', ',')} km
              </span>
              <span className="bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded text-[11px]">
                {data.distanceKm.toFixed(1).replace('.', ',')} km × R$ 2,50 = R$ {data.feeFormatted}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
              ✓ Frete automático aplicado
            </span>
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-[11px] text-stone-600 text-center">
            💡 Digite o seu CEP acima para o sistema calcular automaticamente a distância e o frete exato (R$ 2,50/km).
          </div>
        )}
      </div>

      {/* Radius Warning: If distance > 15 km */}
      {data.isOverRadius && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-xs text-amber-950 space-y-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <span className="text-2xl leading-none flex-shrink-0">⚠️</span>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-amber-900 text-sm">
                Atenção: Endereço fora do raio padrão de 15 km!
              </h4>
              <p className="leading-relaxed">
                O seu CEP está a aproximadamente{' '}
                <strong className="text-amber-950">
                  {data.distanceKm.toFixed(1).replace('.', ',')} km
                </strong>{' '}
                da nossa loja (Cohab Adventista). O valor do frete calculado é de{' '}
                <strong className="text-orange-700 font-bold">R$ {data.feeFormatted}</strong>.
              </p>
              <p className="font-bold text-stone-800 pt-1">
                Tem certeza de que deseja prosseguir com a entrega?
              </p>
            </div>
          </div>

          {/* Confirmation Choices: SIM / NÃO */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-amber-200">
            {data.confirmedOverRadius ? (
              <div className="flex-1 bg-emerald-100 border border-emerald-400 text-emerald-950 px-3 py-2 rounded-xl font-bold flex items-center justify-between">
                <span>✓ Você confirmou que deseja a entrega (~{data.distanceKm.toFixed(1).replace('.', ',')} km).</span>
                <button
                  type="button"
                  onClick={() => onChange({ confirmedOverRadius: false })}
                  className="text-xs text-emerald-800 underline hover:text-emerald-950 ml-2 cursor-pointer font-normal"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onChange({ confirmedOverRadius: true })}
                className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
              >
                <span>✓ Sim, tenho certeza e quero prosseguir</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSwitchToPickup}
              className="py-2.5 px-3 bg-white hover:bg-stone-100 border border-amber-300 text-stone-800 font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>🏪 Não, prefiro retirar na loja</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChange({
                  cep: '',
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  distanceKm: 0,
                  fee: 0,
                  feeFormatted: '0,00',
                  isOverRadius: false,
                  confirmedOverRadius: false,
                  fullAddress: '',
                });
              }}
              className="py-2.5 px-3 text-stone-500 hover:text-stone-800 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              Trocar CEP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryForm;
