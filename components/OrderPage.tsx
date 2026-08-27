import React, { useState, useMemo, useEffect } from 'react';
import type { MenuItem } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SearchIcon } from './icons/SearchIcon';

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

// Utility to format price number to 'R$ 12,00'
const formatPrice = (val: number): string => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Get greeting according to São Paulo time:
// 00:00 às 12:00 -> Bom dia
// 13:00 às 18:00 -> Boa tarde
// 19:00 às 23:59 -> Boa noite
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
  const [observations, setObservations] = useState('');
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);

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

  // Selected items list & totals
  const selectedItemsList = useMemo(() => {
    return Object.entries(quantities)
      .map(([idStr, qty]) => {
        const id = parseInt(idStr, 10);
        const item = allItems.find((i) => i.id === id);
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

  const totalPrice = useMemo(() => {
    return selectedItemsList.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [selectedItemsList]);

  // Send WhatsApp order
  const handleSendWhatsApp = () => {
    if (selectedItemsList.length === 0) {
      alert('Por favor, adicione ao menos 1 item com o botão (+) para enviar o pedido!');
      return;
    }

    const greeting = getTimeGreeting();
    let message = `${greeting}! Gostaria de fazer um pedido para *RETIRADA NA LOJA* na Tapioca Delegusty:\n\n`;
    message += `📋 *ITENS DO PEDIDO:*\n`;

    selectedItemsList.forEach((entry) => {
      message += `• ${entry.quantity}x ${entry.item.name} (${entry.item.price} un) = ${formatPrice(entry.subtotal)}\n`;
    });

    message += `\n💰 *VALOR TOTAL:* ${formatPrice(totalPrice)}\n`;
    message += `📦 *TOTAL DE ITENS:* ${totalItemCount}\n`;

    if (customerName.trim()) {
      message += `\n👤 *Nome do Cliente:* ${customerName.trim()}\n`;
    }

    if (observations.trim()) {
      message += `📝 *Observações:* ${observations.trim()}\n`;
    }

    message += `\n📍 *Local de Retirada:* Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140`;

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
            className="flex items-center gap-2 text-orange-800 hover:text-orange-950 font-bold bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-all text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar ao Início
          </button>
        </div>

        {/* Hero Title & Description */}
        <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Simulação & Pedido Rápido
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-ubuntu mb-3 tracking-tight">
              Faça seu Pedido
            </h1>
            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              Monte seu pedido facilmente: clique no botão <strong className="text-white bg-green-600 px-2 py-0.5 rounded font-black">+</strong> para adicionar os sabores e quantidades desejadas. O total é calculado automaticamente e você envia direto para nosso WhatsApp!
            </p>
          </div>

          <div className="absolute right-4 -bottom-10 opacity-15 pointer-events-none hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-72 h-72 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        </div>

        {/* Notice Info Box: Retirada vs iFood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Retirada notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
              🏪
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Exclusivo para Retirada na Loja</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Travessa Casca Preciosa, 54 - Cohab Adventista, São Paulo - SP, CEP 05868-140.
              </p>
            </div>
          </div>

          {/* Delivery on iFood */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 font-bold p-1">
                <img src="https://i.imgur.com/yf7wkik.png" alt="iFood" className="w-full h-full object-contain rounded-full" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950">Quer Entrega em Domicílio?</h3>
                <p className="text-xs text-red-800 mt-0.5">
                  Para receber quentinho na sua casa, faça o pedido pelo iFood!
                </p>
              </div>
            </div>
            <a
              href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shadow-sm"
            >
              Pedir no iFood
            </a>
          </div>
        </div>

        {/* Category Filters & Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-20 z-20 backdrop-blur-md bg-white/95">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todos ({allItems.length})
            </button>
            <button
              onClick={() => setActiveCategory('salgadas')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeCategory === 'salgadas'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tapiocas Salgadas
            </button>
            <button
              onClick={() => setActiveCategory('doces')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeCategory === 'doces'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Tapiocas Doces
            </button>
            <button
              onClick={() => setActiveCategory('bebidas')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
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
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Product Items List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const qty = quantities[item.id] || 0;
            const unitPrice = parsePrice(item.price);
            const subtotal = unitPrice * qty;
            const mainImage = item.images.find((img) => img.isMain) || item.images[0];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                  qty > 0 ? 'border-orange-400 ring-2 ring-orange-200 bg-orange-50/20' : 'border-stone-200'
                }`}
              >
                {/* Image on left */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 shadow-inner">
                  {mainImage ? (
                    <img
                      src={mainImage.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                      Sem foto
                    </div>
                  )}
                  <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                    #{item.id}
                  </span>
                </div>

                {/* Name & Ingredients in middle */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-stone-900 truncate leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm sm:text-base font-black text-orange-700">
                      {item.price}
                    </span>
                    {qty > 0 && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Subtotal: {formatPrice(subtotal)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Stepper on Right */}
                <div className="flex flex-col items-center justify-center flex-shrink-0">
                  <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-300 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, qty - 1)}
                      disabled={qty <= 0}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${
                        qty > 0
                          ? 'bg-white text-stone-700 hover:bg-red-500 hover:text-white shadow-sm'
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
                      className="w-9 h-9 flex items-center justify-center rounded-lg font-bold text-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all hover:scale-105"
                      aria-label="Adicionar quantidade"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Floating Bottom Bar for Checkout */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-4 shadow-2xl">
          <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  {totalItemCount}
                </div>
                <div>
                  <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    {totalItemCount === 1 ? '1 item selecionado' : `${totalItemCount} itens selecionados`}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    Total: <span className="text-orange-700">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {selectedItemsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSummaryDrawer(true)}
                  className="sm:hidden text-xs font-bold text-orange-700 underline"
                >
                  Ver Resumo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {selectedItemsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hidden sm:inline-flex px-3 py-3 text-xs font-bold text-stone-500 hover:text-red-600 rounded-xl transition-colors"
                >
                  Limpar
                </button>
              )}
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
                  <p className="text-xs text-orange-100">Retirada na loja • Travessa Casca Preciosa, 54</p>
                </div>
                <button
                  onClick={() => setShowSummaryDrawer(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Items List */}
                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 space-y-2 max-h-48 overflow-y-auto">
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
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Seu Nome (opcional - para identificar na retirada):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
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

                {/* Total */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-stone-700">Total a Pagar na Retirada:</span>
                  <span className="text-2xl font-black text-orange-700">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-green-300 transition-all text-base"
                >
                  <WhatsAppIcon className="w-6 h-6 flex-shrink-0" />
                  <span>Enviar para WhatsApp da Loja</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSummaryDrawer(false)}
                  className="w-full py-2 text-xs font-bold text-stone-500 hover:text-stone-700"
                >
                  Continuar escolhendo itens
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
