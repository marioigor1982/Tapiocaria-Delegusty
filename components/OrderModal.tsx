import React, { useState, useMemo } from 'react';
import type { MenuItem } from '../types';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import ThermalReceiptModal from './ThermalReceiptModal';
import { STORE_INFO } from '../utils/deliveryCalculator';
import DeliveryForm, { type DeliveryAddressData } from './DeliveryForm';
import RadiusConfirmationModal from './RadiusConfirmationModal';

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShoppingBagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: MenuItem[];
  initialSelectedItemId?: number | null;
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

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  allItems,
  initialSelectedItemId,
}) => {
  // Map of itemId -> quantity
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    if (initialSelectedItemId) {
      return { [initialSelectedItemId]: 1 };
    }
    return {};
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'salgadas' | 'doces' | 'bebidas'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [observations, setObservations] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modalidade: Retirada vs Entrega
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryAddressData>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    distanceKm: 0,
    fee: 0,
    feeFormatted: '0,00',
    explanation: '',
    isOverRadius: false,
    confirmedOverRadius: false,
    fullAddress: '',
  });
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  const handleDeliveryDataChange = (updated: Partial<DeliveryAddressData>) => {
    setDeliveryData((prev) => ({ ...prev, ...updated }));
  };

  // If initial item changes, add it
  React.useEffect(() => {
    if (initialSelectedItemId) {
      setQuantities((prev) => ({
        ...prev,
        [initialSelectedItemId]: (prev[initialSelectedItemId] || 0) > 0 ? prev[initialSelectedItemId] : 1,
      }));
    }
  }, [initialSelectedItemId]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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

  const handleToggleItem = (item: MenuItem) => {
    setQuantities((prev) => {
      const copy = { ...prev };
      if (copy[item.id] && copy[item.id] > 0) {
        delete copy[item.id];
      } else {
        copy[item.id] = 1;
      }
      return copy;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todos os itens selecionados do pedido?')) {
      setQuantities({});
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }
    if (showOnlySelected) {
      list = list.filter((item) => (quantities[item.id] || 0) > 0);
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
  }, [allItems, activeCategory, showOnlySelected, searchTerm, quantities]);

  // Selected items list & totals
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

  const subtotalProducts = useMemo(() => {
    return selectedItemsList.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [selectedItemsList]);

  const deliveryFee = useMemo(() => {
    return orderType === 'delivery' ? deliveryData.fee : 0;
  }, [orderType, deliveryData.fee]);

  const grandTotalPrice = useMemo(() => {
    return subtotalProducts + deliveryFee;
  }, [subtotalProducts, deliveryFee]);

  // Send WhatsApp order
  const handleSendWhatsApp = () => {
    if (selectedItemsList.length === 0) {
      alert('Por favor, selecione ao menos 1 item para realizar o pedido!');
      return;
    }

    const isDelivery = orderType === 'delivery';

    if (isDelivery) {
      const cleanCep = deliveryData.cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        alert('Por favor, preencha o CEP de entrega (obrigatório com 8 dígitos) para calcularmos o frete.');
        return;
      }

      if (!deliveryData.number.trim()) {
        alert('Por favor, informe o número da residência/comércio para a entrega (obrigatório).');
        return;
      }

      // Se a distância for maior que 15 km e o cliente ainda não confirmou
      if (deliveryData.isOverRadius && !deliveryData.confirmedOverRadius) {
        setShowRadiusModal(true);
        return;
      }
    }

    const greeting = getTimeGreeting();

    let message = `${greeting}! Gostaria de fazer um pedido para *${isDelivery ? 'ENTREGA PRÓPRIA (DELIVERY)' : 'RETIRADA NA LOJA'}* na Tapioca Delegusty:\n\n`;
    message += `📋 *ITENS DO PEDIDO:*\n`;

    selectedItemsList.forEach((entry) => {
      message += `• ${entry.quantity}x ${entry.item.name} (${entry.item.price} cada) = ${formatPrice(entry.subtotal)}\n`;
    });

    message += `\n📦 *TOTAL DE ITENS:* ${totalItemCount} un\n`;
    message += `💵 *SUBTOTAL DOS PRODUTOS:* ${formatPrice(subtotalProducts)}\n`;

    if (isDelivery) {
      message += `🛵 *MODALIDADE:* Entrega Própria (Delivery)\n`;
      message += `🚚 *VALOR DO FRETE:* ${deliveryFee > 0 ? formatPrice(deliveryFee) : 'A calcular pelo CEP'}\n`;
      if (deliveryData.distanceKm > 0) {
        message += `📏 *Cálculo do Frete:* ${deliveryData.explanation || `~${deliveryData.distanceKm.toFixed(1).replace('.', ',')} km × R$ 2,50/km = R$ ${deliveryData.feeFormatted}`}\n`;
      }
      if (deliveryData.isOverRadius) {
        message += `⚠️ *Aviso de Raio Estendido (>15 km):* Cliente confirmou ciência da distância (~${deliveryData.distanceKm.toFixed(1).replace('.', ',')} km).\n`;
      }
      message += `💰 *VALOR TOTAL COM FRETE:* ${formatPrice(grandTotalPrice)}\n`;

      const finalAddress = deliveryData.fullAddress || [
        deliveryData.street ? `${deliveryData.street}, Nº ${deliveryData.number}` : `Nº ${deliveryData.number}`,
        deliveryData.complement,
        deliveryData.neighborhood,
        `${deliveryData.city} - ${deliveryData.state}`,
        `CEP ${deliveryData.cep}`,
      ].filter(Boolean).join(', ');

      message += `\n📍 *Endereço de Entrega:* ${finalAddress}\n`;
      message += `🗺️ *Rota no Google Maps:* https://www.google.com/maps/dir/?api=1&origin=05868-140&destination=${encodeURIComponent(finalAddress || deliveryData.cep)}&travelmode=driving\n`;
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div
        className="relative bg-white w-full max-w-5xl h-[94vh] max-h-[900px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 sm:p-5 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="order-modal-title" className="text-xl sm:text-2xl font-bold font-ubuntu flex items-center gap-2">
                Faça o seu Pedido
                <span className="text-xs bg-orange-800/80 font-normal px-2.5 py-0.5 rounded-full uppercase tracking-wider text-orange-200">
                  {orderType === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão'}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-orange-100 font-light">
                Escolha os sabores, configure a entrega ou retirada e envie direto para o WhatsApp!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            aria-label="Fechar modal de pedido"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Notice Banners: Retirada vs Delivery info */}
        <div className="bg-orange-50 border-b border-orange-200 p-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm flex-shrink-0">
          <div className="flex items-center gap-2 text-orange-950">
            <span className="text-base">{orderType === 'delivery' ? '🛵' : '🏪'}</span>
            <div>
              {orderType === 'delivery' ? (
                <span>
                  Pedido para <strong className="text-orange-700">ENTREGA (DELIVERY)</strong>. O valor do frete é somado ao total.
                </span>
              ) : (
                <span>
                  Pedido para <strong className="text-orange-700">RETIRADA NA LOJA</strong> (Travessa Casca Preciosa, 54 - Cohab Adventista).
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm text-xs"
              title="Pedir pelo iFood"
            >
              <img src="https://i.imgur.com/g4cIv92.png" alt="iFood" className="w-4 h-4 rounded-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span>iFood</span>
            </a>
            <a
              href="https://url-eu.mykeeta.com/BtpUQ7rz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#FFCC00] hover:bg-[#E6B800] text-stone-900 font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm text-xs"
              title="Pedir pela Keeta"
            >
              <img src="https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkzgXbFvdsyiw3NgBcq0sS-0H144BA8Z_626ZwmIe_3UFgOfErxvI3DHV2hCPd07XxRyzblFYyWCmZKwXbRNz5rSRrrjs5hiV53z9rKB1g7TC3D4laADo9WECHCnxgky5IXHQaCXzzRiT1E=s680-w680-h510-rw" alt="Keeta" className="w-4 h-4 rounded-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span>Keeta</span>
            </a>
            <a
              href="https://oia.99app.com/dlp9/47Uaqz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#FF8100] hover:bg-[#E67400] text-white font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm text-xs"
              title="Pedir no 99Food"
            >
              <img src="https://lh3.googleusercontent.com/NtNx2nyQjK48xy204TjKl9baFxjgkWT5437f35kyewTYsUauxW9kyJNbQEZ47_pa8JVoIyfUkEYSYNhX4w=w1420" alt="99Food" className="w-4 h-4 rounded-full object-cover bg-white" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span>99Food</span>
            </a>
          </div>
        </div>

        {/* Main Content Layout (Grid of items + Sticky order summary sidebar) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-50">
          {/* Left Column: Menu Items & Filter */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
            {/* Category tabs & Search */}
            <div className="p-3 sm:p-4 bg-white border-b border-gray-200 space-y-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => { setActiveCategory('all'); setShowOnlySelected(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'all' && !showOnlySelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos ({allItems.length})
                  </button>
                  <button
                    onClick={() => { setActiveCategory('salgadas'); setShowOnlySelected(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'salgadas' && !showOnlySelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Salgadas
                  </button>
                  <button
                    onClick={() => { setActiveCategory('doces'); setShowOnlySelected(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'doces' && !showOnlySelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Doces
                  </button>
                  <button
                    onClick={() => { setActiveCategory('bebidas'); setShowOnlySelected(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategory === 'bebidas' && !showOnlySelected
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bebidas & Goma
                  </button>
                  <button
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      showOnlySelected
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    }`}
                  >
                    <span>Selecionados ({selectedItemsList.length})</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    placeholder="Buscar sabor ou nº..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-gray-100 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-base font-semibold">Nenhum item encontrado.</p>
                  <p className="text-xs text-gray-400 mt-1">Tente ajustar a busca ou a categoria selecionada.</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const qty = quantities[item.id] || 0;
                  const isSelected = qty > 0;
                  const unitPrice = parsePrice(item.price);
                  const subtotal = unitPrice * qty;
                  const mainImage = item.images.find((img) => img.isMain) || item.images[0];

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-orange-50/80 border-orange-300 ring-1 ring-orange-300 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                      }`}
                    >
                      {/* Checkbox + Image + Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          id={`modal-check-${item.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleItem(item)}
                          className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer accent-orange-600"
                        />
                        {mainImage && (
                          <img
                            src={mainImage.url}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                          />
                        )}
                        <label htmlFor={`modal-check-${item.id}`} className="cursor-pointer flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-orange-700">#{item.id}</span>
                            <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                          <span className="text-xs font-bold text-orange-600 sm:hidden">
                            {item.price}
                          </span>
                        </label>
                      </div>

                      {/* Controls (Price + Quantity Stepper + Subtotal) */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                        <div className="hidden sm:block text-right">
                          <div className="text-xs text-gray-400">Unitário</div>
                          <div className="text-sm font-bold text-gray-800">{item.price}</div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-300">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, qty - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-orange-600 rounded font-bold transition-colors cursor-pointer"
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
                            className="w-10 text-center font-bold text-sm bg-transparent focus:outline-none focus:bg-white focus:rounded py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, qty + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white hover:text-orange-600 rounded font-bold transition-colors cursor-pointer"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        {/* Calculated Subtotal */}
                        <div className="w-20 text-right">
                          <div className="text-[10px] text-gray-400 uppercase">Subtotal</div>
                          <div className="text-sm font-black text-orange-700">
                            {isSelected ? formatPrice(subtotal) : 'R$ 0,00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Order Summary, Toggle & WhatsApp Dispatch */}
          <div className="w-full lg:w-96 bg-white flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-5 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5 text-orange-600" />
                  Resumo do Pedido
                </h3>
                {selectedItemsList.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>

              {/* Botão Toggle: Retirada vs Entrega */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Modalidade do Pedido:
                </label>
                <div className="bg-stone-100 p-1 rounded-2xl flex items-center border border-stone-300">
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orderType === 'pickup'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <span>🏪 Retirada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orderType === 'delivery'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <span>🛵 Entrega</span>
                  </button>
                </div>
              </div>

              {/* Se entrega, formulário com CEP obrigatório, número, complemento e frete automático estrito */}
              {orderType === 'delivery' && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-orange-200">
                    <span className="font-bold text-orange-900">🛵 Entrega Própria</span>
                    <span className="text-[10px] bg-orange-200 text-orange-950 font-bold px-2 py-0.5 rounded-full">
                      R$ 2,50/km
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

              {/* Items List in Summary */}
              {selectedItemsList.length === 0 ? (
                <div className="py-5 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 mb-4">
                  <p className="text-xs font-medium">Nenhum item selecionado</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Marque os sabores ao lado e defina as quantidades.
                  </p>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 mb-3 pr-1">
                  {selectedItemsList.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-gray-100"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-bold text-orange-700">{entry.quantity}x</span>{' '}
                        <span className="font-medium text-gray-800 truncate">{entry.item.name}</span>
                      </div>
                      <div className="font-bold text-gray-900 whitespace-nowrap">
                        {formatPrice(entry.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Input Fields (Nome e Telefone Opcionais) */}
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome do Cliente (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva (opcional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Telefone / WhatsApp (opcional):
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 98765-4321 (opcional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Observações / Preferências (opcional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Sem orégano, caprichar no leite condensado..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Total calculation and WhatsApp Submit Button */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-gray-500">
                  <span>Subtotal ({totalItemCount} un):</span>
                  <span className="font-semibold text-gray-700">{formatPrice(subtotalProducts)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>{orderType === 'delivery' ? 'Frete / Entrega:' : 'Modalidade:'}</span>
                  <span className={`font-bold ${orderType === 'delivery' ? 'text-orange-700' : 'text-green-700'}`}>
                    {orderType === 'delivery'
                      ? deliveryFee > 0
                        ? `+ ${formatPrice(deliveryFee)}`
                        : 'R$ 0,00'
                      : 'Grátis (Retirada)'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-800">Total a Pagar:</span>
                  <span className="text-xl sm:text-2xl font-black text-orange-700">{formatPrice(grandTotalPrice)}</span>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={selectedItemsList.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all transform text-sm ${
                    selectedItemsList.length > 0
                      ? 'bg-green-600 hover:bg-green-700 hover:scale-[1.02] shadow-green-200 cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Enviar Pedido pelo WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  disabled={selectedItemsList.length === 0}
                  className={`w-full py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all border ${
                    selectedItemsList.length > 0
                      ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800 shadow-md cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70'
                  }`}
                  title="Imprimir cupom de pedido térmico 80mm ou salvar em PDF"
                >
                  <PrinterIcon className="w-4 h-4 flex-shrink-0 text-orange-400" />
                  <span>Imprimir Cupom (80mm / PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

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

        {/* Modal de Confirmação de Raio > 15 km */}
        <RadiusConfirmationModal
          isOpen={showRadiusModal}
          distanceKm={deliveryData.distanceKm}
          feeFormatted={deliveryData.feeFormatted}
          onConfirm={() => {
            setDeliveryData((prev) => ({ ...prev, confirmedOverRadius: true }));
            setShowRadiusModal(false);
            // Trigger order after confirmation
            setTimeout(() => {
              handleSendWhatsApp();
            }, 100);
          }}
          onCancelPickup={() => {
            setOrderType('pickup');
            setShowRadiusModal(false);
          }}
          onClose={() => setShowRadiusModal(false)}
        />
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default OrderModal;
