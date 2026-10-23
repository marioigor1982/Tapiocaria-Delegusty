import React, { useState, useMemo, useEffect } from 'react';
import type { MenuItem } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import ProductDetailModal from './ProductDetailModal';
import ThermalReceiptModal from './ThermalReceiptModal';
import { useStoreStatus } from '../hooks/useStoreStatus';
import { STORE_INFO } from '../utils/deliveryCalculator';
import DeliveryForm, { type DeliveryAddressData } from './DeliveryForm';

interface OrderPageProps {
  allItems: MenuItem[];
  onBack: () => void;
  initialItemId?: number | null;
}

// Utility to parse price string 'R$ 12,00' to number 12.00
const parsePrice = (priceStr: string): number => {
  const cleaned = priceStr.replace('R$', '').replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

// Utility to parse typed shipping fee '5,00' or '10'
const parseFee = (feeStr: string): number => {
  if (!feeStr) return 0;
  const cleaned = feeStr.replace('R$', '').replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) || val < 0 ? 0 : val;
};

// Utility to format price number to 'R$ 12,00'
const formatPrice = (val: number): string => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Get greeting according to São Paulo time:
export const getTimeGreeting = (): string => {
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());

    const hourPart = parts.find((p) => p.type === 'hour')?.value;
    const hour = hourPart ? parseInt(hourPart, 10) : new Date().getHours();

    if (hour >= 0 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 19) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  } catch {
    const localHour = new Date().getHours();
    if (localHour >= 0 && localHour < 12) return 'Bom dia';
    if (localHour >= 12 && localHour < 19) return 'Boa tarde';
    return 'Boa noite';
  }
};

const OrderPage: React.FC<OrderPageProps> = ({ allItems, onBack, initialItemId }) => {
  const storeStatus = useStoreStatus();
  
  // Map of itemId -> quantity
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    if (initialItemId) {
      return { [initialItemId]: 1 };
    }
    return {};
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'salgadas' | 'doces' | 'bebidas'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [observations, setObservations] = useState('');
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);

  // Modalidade de Pedido: Retirada ou Entrega
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryAddressData>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    fee: 0,
    feeInput: '',
    fullAddress: '',
  });

  const handleDeliveryDataChange = (updated: Partial<DeliveryAddressData>) => {
    setDeliveryData((prev) => ({ ...prev, ...updated }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (initialItemId) {
      setQuantities((prev) => ({
        ...prev,
        [initialItemId]: (prev[initialItemId] || 0) > 0 ? prev[initialItemId] : 1,
      }));
    }
  }, [initialItemId]);

  const handleQuantityChange = (itemId: number, newQty: number) => {
    const qty = Math.max(0, Math.min(99, newQty));
    setQuantities((prev) => {
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[itemId];
      } else {
        copy[itemId] = qty;
      }
      return copy;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todos os itens selecionados do seu pedido?')) {
      setQuantities({});
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.id.toString() === term
      );
    }
    return list;
  }, [allItems, activeCategory, searchTerm]);

  // Selected items list & subtotal calculations
  const selectedItemsList = useMemo(() => {
    return Object.entries(quantities)
      .map(([idStr, rawQty]) => {
        const id = parseInt(idStr, 10);
        const item = allItems.find((i) => i.id === id);
        const qty = Number(rawQty);
        if (!item || qty <= 0) return null;
        const unitPrice = parsePrice(item.price);
        const subtotal = unitPrice * qty;
        return {
          item,
          quantity: qty,
          unitPrice,
          subtotal,
        };
      })
      .filter(Boolean) as { item: MenuItem; quantity: number; unitPrice: number; subtotal: number }[];
  }, [quantities, allItems]);

  const totalItemCount = useMemo(() => {
    return selectedItemsList.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [selectedItemsList]);

  // Subtotal dos produtos selecionados
  const subtotalProducts = useMemo(() => {
    return selectedItemsList.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [selectedItemsList]);

  // Valor do frete (calculado estritamente pela distância × R$ 2,50/km)
  const deliveryFee = useMemo(() => {
    return orderType === 'delivery' ? deliveryData.fee : 0;
  }, [orderType, deliveryData.fee]);

  // Valor total final: subtotal + frete
  const grandTotalPrice = useMemo(() => {
    return subtotalProducts + deliveryFee;
  }, [subtotalProducts, deliveryFee]);

  // Send WhatsApp order
  const handleSendWhatsApp = () => {
    if (selectedItemsList.length === 0) {
      alert('Por favor, adicione ao menos 1 item com o botão (+) para enviar o pedido!');
      return;
    }

    const isDelivery = orderType === 'delivery';

    if (isDelivery) {
      if (!deliveryData.number.trim()) {
        alert('Por favor, informe ao menos o número da residência/comércio para a entrega (obrigatório).');
        return;
      }
    }

    const greeting = getTimeGreeting();

    let message = `${greeting}! Gostaria de fazer um pedido para *${isDelivery ? 'ENTREGA PRÓPRIA (DELIVERY)' : 'RETIRADA NA LOJA'}* na Tapioca Delegusty:\n\n`;
    message += `📋 *ITENS DO PEDIDO:*\n`;

    selectedItemsList.forEach((entry) => {
      message += `• ${entry.quantity}x ${entry.item.name} (${entry.item.price} un) = ${formatPrice(entry.subtotal)}\n`;
    });

    message += `\n📦 *TOTAL DE ITENS:* ${totalItemCount} un\n`;
    message += `💵 *SUBTOTAL DOS PRODUTOS:* ${formatPrice(subtotalProducts)}\n`;

    if (isDelivery) {
      message += `🛵 *MODALIDADE:* Entrega Própria (Delivery)\n`;
      message += `🚚 *VALOR DO FRETE:* ${deliveryFee > 0 ? formatPrice(deliveryFee) : 'A combinar com a loja via WhatsApp'}\n`;
      message += `💰 *VALOR TOTAL:* ${deliveryFee > 0 ? formatPrice(grandTotalPrice) : `${formatPrice(subtotalProducts)} (+ frete a combinar)`}\n`;
      
      const finalAddress = deliveryData.fullAddress || [
        deliveryData.street ? `${deliveryData.street}, Nº ${deliveryData.number}` : (deliveryData.number ? `Nº ${deliveryData.number}` : ''),
        deliveryData.complement,
        deliveryData.neighborhood,
        `${deliveryData.city} - ${deliveryData.state}`,
        deliveryData.cep ? `CEP ${deliveryData.cep}` : '',
      ].filter(Boolean).join(', ');

      if (finalAddress) {
        message += `\n📍 *Endereço de Entrega:* ${finalAddress}\n`;
      }
      message += `🗺️ *Ver Rota no Google Maps:* https://www.google.com/maps/dir/?api=1&origin=05868-140&destination=${encodeURIComponent(finalAddress || deliveryData.cep || 'São Paulo, SP')}&travelmode=driving\n`;
    } else {
      message += `🏪 *MODALIDADE:* Retirada no Balcão (Frete Grátis)\n`;
      message += `💰 *VALOR TOTAL A PAGAR:* ${formatPrice(grandTotalPrice)}\n`;
      message += `\n📍 *Local de Retirada:* Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140\n`;
    }

    if (customerName.trim()) {
      message += `\n👤 *Nome do Cliente:* ${customerName.trim()}\n`;
    }

    if (customerPhone.trim()) {
      message += `📱 *Telefone / WhatsApp:* ${customerPhone.trim()}\n`;
    }

    if (observations.trim()) {
      message += `📝 *Observações:* ${observations.trim()}\n`;
    }

    const whatsappUrl = `https://wa.me/5511922099496?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-stone-100 pt-24 pb-32">
      {/* Container */}
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-orange-800 hover:text-orange-950 font-bold bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-all text-sm cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar ao Início
          </button>
        </div>

        {/* Hero Title & Description */}
        <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              {storeStatus.isOpen ? 'Simulação & Pedido Rápido' : 'Consulta do Cardápio'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-ubuntu mb-3 tracking-tight">
              Faça seu Pedido
            </h1>
            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              {storeStatus.isOpen ? (
                <>
                  Monte seu pedido facilmente: clique no botão <strong className="text-white bg-green-600 px-2 py-0.5 rounded font-black">+</strong> para adicionar os sabores e quantidades desejadas. Você pode escolher entre <strong>Retirada no Balcão</strong> ou <strong>Entrega (Delivery) com cálculo de frete</strong>!
                </>
              ) : (
                <>
                  Consulte todos os nossos sabores, fotos, ingredientes e preços abaixo. A opção de realizar pedidos é liberada automaticamente no nosso horário de funcionamento (<strong>Segunda, Quarta a Sábado das 18h às 23:59h • Domingo das 17h às 23:59h</strong>).
                </>
              )}
            </p>
          </div>

          <div className="absolute right-4 -bottom-10 opacity-15 pointer-events-none hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-72 h-72 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        </div>

        {/* Closed store hours notice banner */}
        {!storeStatus.isOpen && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 mb-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
                ⏰
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 font-black text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Fechado no momento
                  </span>
                  <span className="text-xs text-amber-900 font-bold">
                    {storeStatus.hoursText}
                  </span>
                </div>
                <p className="text-sm text-stone-700 mt-1.5 leading-relaxed">
                  A emissão e envio de pedidos ficam liberados durante nosso horário de atendimento. <strong>Você pode navegar e visualizar os detalhes, fotos e ingredientes de todos os produtos normalmente!</strong>
                </p>
                <p className="text-xs text-amber-900 font-bold mt-1">
                  📅 {storeStatus.nextOpenText}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="self-stretch md:self-auto px-5 py-3 rounded-2xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <span>Ver Cardápio Principal</span>
            </button>
          </div>
        )}

        {/* Modalidade de Pedido: Botão Toggle Retirada vs Entrega */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Opção de Atendimento
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-ubuntu">
                Como você deseja receber o pedido?
              </h2>
            </div>

            {/* Toggle Button (Retirada vs Entrega) */}
            <div className="inline-flex p-1 bg-stone-100 border border-stone-300 rounded-2xl w-full sm:w-auto shadow-inner">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderType === 'pickup'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <span>🏪 Retirada no Balcão</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  orderType === 'delivery'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <span>🛵 Entrega (Delivery)</span>
              </button>
            </div>
          </div>

          {/* Conditional block depending on orderType */}
          {orderType === 'pickup' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-xs">
                🏪
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Retirada no Balcão da Loja</span>
                  <span className="text-[11px] bg-green-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Frete Grátis
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140. Você envia o pedido pelo WhatsApp e retira quentinho na hora combinada!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-xs">
                    🛵
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-orange-950 flex items-center gap-2">
                      <span>Nossa Entrega Própria (Delivery)</span>
                      <span className="text-[11px] bg-orange-200 text-orange-900 font-bold px-2 py-0.5 rounded-full">
                        Valor a Combinar / Rota no Maps
                      </span>
                    </h3>
                    <p className="text-xs text-stone-600">
                      Informe seu CEP, número e complemento. Você pode abrir o Google Maps para ver a rota e combinar a taxa diretamente pelo WhatsApp!
                    </p>
                  </div>
                </div>

                <div className="text-[11px] bg-white text-stone-600 px-3 py-1.5 rounded-xl border border-orange-200 sm:text-right">
                  <span className="font-bold text-orange-800">Partida:</span> Cohab Adventista (SP)
                </div>
              </div>

              {/* Formulário de Delivery: CEP obrigatório, número, complemento e cálculo estrito */}
              <DeliveryForm
                data={deliveryData}
                onChange={handleDeliveryDataChange}
                onSwitchToPickup={() => setOrderType('pickup')}
              />

              {/* Informações do Cliente (Nome e Telefone como Opcional) */}
              <div className="pt-2 border-t border-orange-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Dados do Cliente (Opcionais):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nome do Cliente (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva (opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Telefone / WhatsApp (opcional):
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (11) 98765-4321 (opcional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Filters & Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-20 z-20 backdrop-blur-md bg-white/95">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todos ({allItems.length})
            </button>
            <button
              onClick={() => setActiveCategory('salgadas')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === 'salgadas'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tapiocas Salgadas
            </button>
            <button
              onClick={() => setActiveCategory('doces')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === 'doces'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tapiocas Doces
            </button>
            <button
              onClick={() => setActiveCategory('bebidas')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === 'bebidas'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Bebidas & Goma
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar sabor ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-stone-100 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Product Items List - Clean Rows for Mobile & Desktop */}
        <div className="space-y-3.5">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 shadow-sm my-6">
              <span className="text-3xl mb-2 block">🔍</span>
              <h3 className="text-lg font-bold text-stone-800">Nenhum produto encontrado</h3>
              <p className="text-sm text-stone-500 mt-1">Tente buscar por outro sabor ou selecione outra categoria.</p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer"
              >
                Ver todos os sabores
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = quantities[item.id] || 0;
              const unitPrice = parsePrice(item.price);
              const subtotal = unitPrice * qty;
              const mainImage = item.images.find((img) => img.isMain) || item.images[0];

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm hover:shadow-md ${
                    qty > 0 ? 'border-orange-400 ring-2 ring-orange-200 bg-orange-50/20' : 'border-stone-200'
                  }`}
                >
                  {/* Left block: Image + Name + Full Description */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                    {/* Image with click-to-view-details */}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailItem(item)}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 shadow-inner group cursor-pointer border border-stone-200 text-left focus:outline-none focus:ring-2 focus:ring-orange-500"
                      title="Clique para ver fotos e detalhes"
                      aria-label={`Ver fotos e detalhes de ${item.name}`}
                    >
                      {mainImage ? (
                        <img
                          src={mainImage.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                          Sem foto
                        </div>
                      )}
                      
                      {/* ID tag */}
                      <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        #{item.id}
                      </span>

                      {/* Zoom hint overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold bg-black/70 px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          🔍 Ver fotos
                        </span>
                      </div>

                      {item.images.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow">
                          +{item.images.length - 1} foto{item.images.length > 2 ? 's' : ''}
                        </span>
                      )}
                    </button>

                    {/* Product Name & Complete Ingredients Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(item)}
                          className="text-left font-ubuntu font-bold text-base sm:text-lg text-stone-900 hover:text-orange-600 transition-colors leading-snug cursor-pointer group"
                        >
                          <span className="group-hover:underline">{item.name}</span>
                        </button>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.category === 'salgadas' ? 'bg-amber-100 text-amber-800' :
                          item.category === 'doces' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category === 'salgadas' ? 'Salgada' : item.category === 'doces' ? 'Doce' : 'Bebida/Goma'}
                        </span>
                      </div>

                      {/* Full description clearly visible on mobile and desktop without truncation */}
                      <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Details trigger button */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors py-0.5 cursor-pointer"
                        >
                          <span>🔍 Ver detalhes e fotos</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Price + Subtotal + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-stone-100 sm:border-t-0 flex-shrink-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-base sm:text-lg font-black text-orange-700">
                        {item.price}
                      </span>
                      {storeStatus.isOpen && qty > 0 && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap mt-0.5">
                          Subtotal: {formatPrice(subtotal)}
                        </span>
                      )}
                    </div>

                    {storeStatus.isOpen ? (
                      /* Quantity Stepper when Open */
                      <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-300 shadow-inner flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, qty - 1)}
                          disabled={qty <= 0}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl transition-all ${
                            qty > 0
                              ? 'bg-white text-stone-700 hover:bg-red-500 hover:text-white shadow-sm active:scale-95 cursor-pointer'
                              : 'text-stone-300 cursor-not-allowed'
                          }`}
                          aria-label="Diminuir quantidade"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleQuantityChange(item.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-10 text-center font-black text-base bg-transparent focus:outline-none focus:bg-white focus:rounded-md py-1 text-stone-900"
                        />

                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, qty + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label="Adicionar quantidade"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      /* Detailed view button when store is closed */
                      <button
                        type="button"
                        onClick={() => setSelectedDetailItem(item)}
                        className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-orange-200 shadow-sm transition-all hover:scale-105 cursor-pointer"
                      >
                        <span>🔍 Ver Detalhes</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Floating Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4 shadow-2xl">
          <div className="container mx-auto max-w-6xl">
            {storeStatus.isOpen ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                      {totalItemCount}
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <span>{totalItemCount === 1 ? '1 item' : `${totalItemCount} itens`}</span>
                        <span>•</span>
                        <span className="font-bold text-orange-800">
                          {orderType === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                        </span>
                        {orderType === 'delivery' && deliveryFee > 0 && (
                          <span className="text-xs text-stone-600">
                            (+ {formatPrice(deliveryFee)} frete)
                          </span>
                        )}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-stone-900">
                        Total: <span className="text-orange-700">{formatPrice(grandTotalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSummaryDrawer(true)}
                      className="sm:hidden text-xs font-bold text-orange-700 underline cursor-pointer"
                    >
                      Ver Resumo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {selectedItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="hidden sm:inline-flex px-3 py-3 text-xs font-bold text-stone-500 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    disabled={selectedItemsList.length === 0}
                    className={`px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border shadow-md transition-all ${
                      selectedItemsList.length > 0
                        ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800 hover:scale-[1.02] cursor-pointer'
                        : 'bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed opacity-70'
                    }`}
                    title="Imprimir cupom de pedido térmico 80mm ou salvar em PDF"
                  >
                    <PrinterIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">Imprimir Cupom (80mm)</span>
                    <span className="sm:hidden">Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSummaryDrawer(true)}
                    disabled={selectedItemsList.length === 0}
                    className={`flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 text-white shadow-xl transition-all ${
                      selectedItemsList.length > 0
                        ? 'bg-green-600 hover:bg-green-700 hover:scale-[1.02] shadow-green-300 cursor-pointer'
                        : 'bg-stone-300 cursor-not-allowed opacity-70'
                    }`}
                  >
                    <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Finalizar Pedido via WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Bottom Bar when closed */
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center font-bold flex-shrink-0">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>Fechado</span>
                      <span className="text-xs font-normal text-stone-500">({storeStatus.badgeOpenText})</span>
                    </div>
                    <div className="text-xs text-stone-600 font-medium">
                      {storeStatus.shortHoursText} • Terça fechado
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Voltar ao Início / Cardápio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal / Drawer for Review & WhatsApp Confirmation */}
        {showSummaryDrawer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-ubuntu">Confirmar e Enviar Pedido</h3>
                  <p className="text-xs text-orange-100">
                    {orderType === 'delivery'
                      ? 'Entrega em Domicílio (com Frete)'
                      : 'Retirada na loja • Travessa Casca Preciosa, 54'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSummaryDrawer(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                  aria-label="Fechar resumo"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Modalidade Toggle Inside Summary Drawer */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Modalidade de Pedido:
                  </label>
                  <div className="bg-stone-100 p-1 rounded-2xl flex items-center border border-stone-300">
                    <button
                      type="button"
                      onClick={() => setOrderType('pickup')}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        orderType === 'pickup'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      <span>🏪 Retirada no Balcão</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        orderType === 'delivery'
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      <span>🛵 Entrega (Delivery)</span>
                    </button>
                  </div>
                </div>

                {/* Se Entrega: Formulário com CEP obrigatório, número, complemento e frete automático */}
                {orderType === 'delivery' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-orange-200">
                      <span className="font-bold text-orange-900">🛵 Entrega Própria</span>
                      <span className="text-[10px] bg-orange-200 text-orange-950 font-bold px-2 py-0.5 rounded-full">
                        A combinar / Maps
                      </span>
                    </div>

                    <DeliveryForm
                      data={deliveryData}
                      onChange={handleDeliveryDataChange}
                      onSwitchToPickup={() => setOrderType('pickup')}
                      compact
                    />
                  </div>
                )}

                {/* Items List */}
                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 space-y-2 max-h-40 overflow-y-auto">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Itens Selecionados ({totalItemCount} un):
                  </div>
                  {selectedItemsList.map((entry) => (
                    <div key={entry.item.id} className="flex justify-between items-center text-xs py-1 border-b border-stone-200 last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-black text-orange-700">{entry.quantity}x</span>{' '}
                        <span className="font-semibold text-stone-900">{entry.item.name}</span>
                      </div>
                      <span className="font-bold text-stone-800 whitespace-nowrap">
                        {formatPrice(entry.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Optional Customer info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nome do Cliente (opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Maria Silva (opcional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Telefone / WhatsApp (opcional):
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex: (11) 98765-4321 (opcional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Observações (opcional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Sem orégano, caprichar no leite condensado..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-stone-600">
                    <span>Subtotal dos Produtos:</span>
                    <span className="font-bold text-stone-800">{formatPrice(subtotalProducts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-stone-600">
                    <span>{orderType === 'delivery' ? 'Taxa de Entrega (Frete):' : 'Frete / Retirada:'}</span>
                    <span className={`font-bold ${orderType === 'delivery' ? 'text-orange-700' : 'text-green-700'}`}>
                      {orderType === 'delivery'
                        ? deliveryFee > 0
                          ? `+ ${formatPrice(deliveryFee)}`
                          : 'R$ 0,00'
                        : 'Grátis (Retirada)'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-orange-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-stone-900">
                      {orderType === 'delivery' ? 'Total com Frete:' : 'Total a Pagar na Retirada:'}
                    </span>
                    <span className="text-2xl font-black text-orange-700">{formatPrice(grandTotalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-300 transition-all text-base cursor-pointer"
                >
                  <WhatsAppIcon className="w-6 h-6 flex-shrink-0" />
                  <span>Enviar para WhatsApp da Loja</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryDrawer(false);
                    setShowPrintModal(true);
                  }}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all text-sm cursor-pointer"
                >
                  <PrinterIcon className="w-5 h-5 flex-shrink-0 text-orange-400" />
                  <span>Imprimir Cupom Térmico (80mm) / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSummaryDrawer(false)}
                  className="w-full py-2 text-xs font-bold text-stone-500 hover:text-stone-700 cursor-pointer"
                >
                  Continuar escolhendo itens
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedDetailItem && (
          <ProductDetailModal
            item={selectedDetailItem}
            currentQuantity={quantities[selectedDetailItem.id] || 0}
            onQuantityChange={handleQuantityChange}
            onClose={() => setSelectedDetailItem(null)}
          />
        )}

        {/* Thermal Receipt Print Modal (80mm / PDF) */}
        <ThermalReceiptModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          items={selectedItemsList}
          customerName={customerName}
          customerPhone={customerPhone}
          observations={observations}
          totalPrice={grandTotalPrice}
          subtotalItems={subtotalProducts}
          totalItemCount={totalItemCount}
          orderType={orderType}
          deliveryFee={deliveryFee}
          deliveryAddress={deliveryData.fullAddress}
        />
      </div>
    </div>
  );
};

export default OrderPage;
