import React, { useRef } from 'react';
import type { MenuItem } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';

export interface ReceiptItemEntry {
  item: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReceiptItemEntry[];
  customerName: string;
  observations: string;
  totalPrice: number;
  totalItemCount: number;
  orderNumber?: string;
  orderDate?: Date;
}

// Utility to format price
const formatPrice = (val: number): string => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Generate print HTML for 80mm thermal printer
export const generateThermalReceiptHtml = (data: {
  items: ReceiptItemEntry[];
  customerName: string;
  observations: string;
  totalPrice: number;
  totalItemCount: number;
  orderNumber: string;
  dateStr: string;
  timeStr: string;
}): string => {
  const {
    items,
    customerName,
    observations,
    totalPrice,
    totalItemCount,
    orderNumber,
    dateStr,
    timeStr,
  } = data;

  const itemsHtml = items
    .map(
      (entry) => `
      <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #bbb;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
          <span>${entry.quantity}x ${entry.item.name}</span>
          <span>${formatPrice(entry.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-top: 1px;">
          <span>Unit: ${entry.item.price}</span>
          <span style="text-transform: uppercase; font-size: 10px; color: #666;">(${entry.item.category})</span>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Cupom Pedido #${orderNumber} - Tapioca Delegusty</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            width: 80mm !important;
            min-width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm 3mm !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
          width: 76mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px 6px;
          background: #fff;
          color: #000;
          font-size: 12px;
          line-height: 1.3;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .left { text-align: left; }
        .bold { font-weight: 900; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 2px dashed #000;
          margin: 8px 0;
        }
        .logo-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 2px;
        }
        .subtitle {
          font-size: 11px;
          margin-bottom: 4px;
        }
        .order-badge {
          display: inline-block;
          font-size: 14px;
          font-weight: 900;
          padding: 2px 8px;
          border: 2px solid #000;
          margin: 4px 0;
        }
        .info-table {
          width: 100%;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .info-table td {
          padding: 1px 0;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 2px;
        }
        .grand-total {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 900;
          padding-top: 4px;
          margin-top: 4px;
          border-top: 2px solid #000;
        }
        .obs-box {
          border: 1px dashed #000;
          padding: 6px;
          margin: 6px 0;
          font-size: 11px;
          background: #fafafa;
        }
        .footer-note {
          font-size: 10px;
          margin-top: 10px;
          text-align: center;
          line-height: 1.4;
        }
        .cut-line {
          border-top: 1px dotted #888;
          margin-top: 16px;
          margin-bottom: 4px;
          text-align: center;
          font-size: 9px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="logo-title">TAPIOCA DELEGUSTY</div>
        <div class="subtitle">O Sabor Autêntico da Tapioca</div>
        <div style="font-size: 10px;">WhatsApp: (11) 92209-9496</div>
        <div class="order-badge">PEDIDO #${orderNumber}</div>
        <div style="font-size: 11px; font-weight: bold;">*** RETIRADA NO BALCÃO ***</div>
      </div>

      <div class="divider"></div>

      <table class="info-table">
        <tr>
          <td class="bold">DATA/HORA:</td>
          <td class="right">${dateStr} às ${timeStr}</td>
        </tr>
        <tr>
          <td class="bold">CLIENTE:</td>
          <td class="right bold">${customerName.trim() || 'NÃO INFORMADO (BALCÃO)'}</td>
        </tr>
        <tr>
          <td class="bold">TIPO:</td>
          <td class="right">RETIRADA NA LOJA</td>
        </tr>
      </table>

      <div class="double-divider"></div>

      <div style="font-weight: 900; font-size: 12px; margin-bottom: 6px; display: flex; justify-content: space-between;">
        <span>ITEM / DESCRIÇÃO</span>
        <span>TOTAL</span>
      </div>

      <div class="divider"></div>

      ${itemsHtml}

      <div class="divider"></div>

      <div class="total-row">
        <span>TOTAL DE ITENS:</span>
        <span class="bold">${totalItemCount} un</span>
      </div>
      <div class="total-row">
        <span>SUBTOTAL:</span>
        <span>${formatPrice(totalPrice)}</span>
      </div>
      <div class="grand-total">
        <span>VALOR TOTAL:</span>
        <span>${formatPrice(totalPrice)}</span>
      </div>

      ${
        observations.trim()
          ? `
        <div class="obs-box">
          <div class="bold" style="text-decoration: underline; margin-bottom: 2px;">OBSERVAÇÕES:</div>
          <div>${observations.trim().replace(/\n/g, '<br/>')}</div>
        </div>
      `
          : ''
      }

      <div class="divider"></div>

      <div class="footer-note">
        <div class="bold">LOCAL DE RETIRADA:</div>
        <div>Travessa Casca Preciosa, 54</div>
        <div>Cohab Adventista, São Paulo - SP</div>
        <div>CEP: 05868-140</div>
        <div style="margin-top: 6px; font-weight: bold;">AGRADECEMOS A PREFERÊNCIA!</div>
        <div>Acompanhe seu pedido pelo WhatsApp</div>
      </div>

      <div class="cut-line">
        - - - - - - - - CORTE AQUI - - - - - - - -
      </div>
    </body>
    </html>
  `;
};

// Global printing function with fallback
export const triggerPrintThermalReceipt = (data: {
  items: ReceiptItemEntry[];
  customerName: string;
  observations: string;
  totalPrice: number;
  totalItemCount: number;
  orderNumber: string;
  dateStr: string;
  timeStr: string;
}) => {
  const html = generateThermalReceiptHtml(data);

  // Use an iframe for printing
  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Trigger print after resources load
    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.open:', err);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      }
    }, 250);
  }
};

const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  customerName,
  observations,
  totalPrice,
  totalItemCount,
  orderNumber,
  orderDate,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const now = orderDate || new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Format order number: e.g. DLG-260831-45
  const displayOrderNumber =
    orderNumber ||
    `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
      .getDate()
      .toString()
      .padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

  const handlePrint = () => {
    triggerPrintThermalReceipt({
      items,
      customerName,
      observations,
      totalPrice,
      totalItemCount,
      orderNumber: displayOrderNumber,
      dateStr,
      timeStr,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cupom Térmico (80mm)</h3>
              <p className="text-xs text-stone-300">Impressora Térmica ou Salvar em PDF</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
            aria-label="Fechar prévia"
          >
            ✕
          </button>
        </div>

        {/* Tip Box */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-2 flex-shrink-0">
          <span className="text-sm">🖨️</span>
          <span>
            <strong>Dica de Impressão:</strong> Na janela do navegador, selecione sua <strong>impressora térmica 80mm</strong> ou escolha <strong>"Salvar como PDF"</strong> caso não tenha impressora física.
          </span>
        </div>

        {/* Receipt Container simulating 80mm thermal paper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[320px] bg-white p-5 shadow-md border border-stone-300 rounded-sm font-mono text-xs text-stone-900 leading-relaxed relative"
            style={{
              fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
            }}
          >
            {/* Top Serrated Edge Pattern */}
            <div className="text-center mb-3">
              <div className="font-black text-base uppercase tracking-wider text-stone-950">
                TAPIOCA DELEGUSTY
              </div>
              <div className="text-[10px] text-stone-600">O Sabor Autêntico da Tapioca</div>
              <div className="text-[10px] text-stone-600">WhatsApp: (11) 92209-9496</div>
              <div className="inline-block border-2 border-stone-900 px-2 py-0.5 my-2 font-black text-xs">
                PEDIDO #{displayOrderNumber}
              </div>
              <div className="text-[11px] font-bold text-stone-900">*** RETIRADA NO BALCÃO ***</div>
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            <div className="text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="font-bold">DATA/HORA:</span>
                <span>{dateStr} às {timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">CLIENTE:</span>
                <span className="font-bold truncate max-w-[170px] text-right">
                  {customerName.trim() || 'Balcão / Retirada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">TIPO:</span>
                <span>Retirada na Loja</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-stone-800 my-2.5"></div>

            {/* Items */}
            <div className="font-black text-[11px] flex justify-between mb-1 pb-1 border-b border-dashed border-stone-400">
              <span>ITEM / DESCRIÇÃO</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-2 my-2">
              {items.map((entry) => (
                <div key={entry.item.id} className="border-b border-dashed border-stone-200 pb-1.5 last:border-0">
                  <div className="flex justify-between font-bold text-stone-950">
                    <span>{entry.quantity}x {entry.item.name}</span>
                    <span>{formatPrice(entry.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Unit: {entry.item.price}</span>
                    <span className="uppercase text-[9px]">({entry.item.category})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2"></div>

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>TOTAL DE ITENS:</span>
                <span className="font-bold">{totalItemCount} un</span>
              </div>
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-stone-950 pt-1 border-t-2 border-stone-900 mt-1">
                <span>VALOR TOTAL:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Observations */}
            {observations.trim() && (
              <div className="mt-3 p-2 bg-stone-50 border border-dashed border-stone-400 text-[10px] rounded">
                <span className="font-bold block underline mb-0.5">OBSERVAÇÕES:</span>
                <p className="whitespace-pre-wrap text-stone-800">{observations.trim()}</p>
              </div>
            )}

            <div className="border-t border-dashed border-stone-400 my-3"></div>

            {/* Footer info */}
            <div className="text-center text-[10px] text-stone-600 leading-tight space-y-0.5">
              <div className="font-bold text-stone-900">LOCAL DE RETIRADA:</div>
              <div>Travessa Casca Preciosa, 54</div>
              <div>Cohab Adventista, São Paulo - SP</div>
              <div>CEP: 05868-140</div>
              <div className="font-bold text-stone-900 mt-2">AGRADECEMOS A PREFERÊNCIA!</div>
            </div>

            <div className="text-center text-[9px] text-stone-400 mt-3 pt-2 border-t border-dotted border-stone-300">
              - - - - - CORTE DO CUPOM 80MM - - - - -
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-200 transition-all text-sm cursor-pointer"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Imprimir Cupom / Salvar PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
