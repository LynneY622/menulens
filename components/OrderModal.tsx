import React, { useState, useEffect } from 'react';
import { X, Trash2, Utensils, MessageSquare, Calculator, Percent, Users, ChevronRight, Copy, Check } from 'lucide-react';
import { MenuItem } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Map<string, number>; // OriginalName -> Quantity
  menuItems: MenuItem[];
  onUpdateOrder: (originalName: string, delta: number) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, order, menuItems, onUpdateOrder }) => {
  const [mode, setMode] = useState<'cart' | 'waiter' | 'bill'>('cart');
  const [copied, setCopied] = useState(false);
  
  // Bill Splitter State
  const [tipPercent, setTipPercent] = useState(18);
  const [splitCount, setSplitCount] = useState(1);
  const [customBillAmount, setCustomBillAmount] = useState<string>('');

  // Derive cart items from the map
  const cartItems = Array.from(order.entries()).map(([name, qty]) => {
    const item = menuItems.find(m => m.originalName === name);
    return { item, qty, name };
  }).filter(i => i.item !== undefined);

  // Calculate Cart Total
  const cartTotal = cartItems.reduce((sum, { item, qty }) => {
    if (!item?.price) return sum;
    const match = item.price.match(/(\d+\.?\d*)/);
    const price = match ? parseFloat(match[0]) : 0;
    return sum + (price * qty);
  }, 0);

  // Initialize custom bill amount when opening or cart changes
  useEffect(() => {
    if (isOpen) {
      setCustomBillAmount(cartTotal.toFixed(2));
    }
  }, [isOpen, cartTotal]);

  // Reset copied state when closing or switching modes
  useEffect(() => {
    setCopied(false);
  }, [isOpen, mode]);

  // Helper to extract currency symbol if possible
  const currencySymbol = cartItems[0]?.item?.price?.replace(/\d|\.| /g, '') || '$';

  // Bill Calculations
  const billBase = parseFloat(customBillAmount) || 0;
  const tipAmount = billBase * (tipPercent / 100);
  const finalTotal = billBase + tipAmount;
  
  // Per Person Breakdown
  const splitBy = Math.max(1, splitCount);
  const perPersonTotal = finalTotal / splitBy;
  const perPersonBill = billBase / splitBy;
  const perPersonTip = tipAmount / splitBy;

  const handleCopyOrder = () => {
    // Improved format: "2x Burger (汉堡)"
    const text = cartItems.map(({ item, qty }) => 
      `${qty}x ${item?.originalName} ${item?.translatedName ? `(${item.translatedName})` : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`
        relative z-10 bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto 
        flex flex-col max-h-[90vh] animate-slide-up sm:animate-fade-in overflow-hidden
        ${mode === 'waiter' ? 'h-[90vh]' : ''}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-20 shadow-sm">
           <div className="flex items-center gap-2">
             <div className={`p-2 rounded-lg ${
               mode === 'cart' ? 'bg-orange-100 text-orange-600' :
               mode === 'waiter' ? 'bg-blue-100 text-blue-600' :
               'bg-green-100 text-green-600'
             }`}>
               {mode === 'cart' && <Utensils size={20} />}
               {mode === 'waiter' && <MessageSquare size={20} />}
               {mode === 'bill' && <Calculator size={20} />}
             </div>
             <h3 className="text-lg font-bold text-gray-800">
               {mode === 'cart' && 'Your Order'}
               {mode === 'waiter' && 'Show to Waiter'}
               {mode === 'bill' && 'Bill Splitter'}
             </h3>
           </div>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
             <X size={24} />
           </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 relative z-10">
          
          {/* CART MODE */}
          {mode === 'cart' && (
            <div className="p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cartItems.map(({ item, qty, name }) => (
                  <div key={name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <h4 className="font-bold text-gray-900">{item?.translatedName}</h4>
                      <p className="text-sm text-gray-500 font-medium">{item?.originalName}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">{item?.price}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                      <button 
                        onClick={() => onUpdateOrder(name, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50"
                      >
                        {qty === 1 ? <Trash2 size={14} /> : '-'}
                      </button>
                      <span className="font-bold w-4 text-center text-gray-800">{qty}</span>
                      <button 
                        onClick={() => onUpdateOrder(name, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-blue-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* WAITER MODE */}
          {mode === 'waiter' && (
             <div className="p-6 min-h-full bg-white flex flex-col items-center text-center relative">
                <p className="text-gray-500 mb-8 font-medium">Please show this screen to the waiter</p>
                
                <div className="w-full space-y-6 flex-1">
                   <div className="text-left border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 rounded-r-lg">
                      <p className="text-xl text-blue-900 font-bold">Hi, I would like to order:</p>
                   </div>
                   
                   <div className="space-y-4 text-left px-2">
                      {cartItems.map(({ item, qty }) => (
                        <div key={item?.originalName} className="flex items-baseline justify-between border-b border-gray-100 pb-3">
                           <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight break-words pr-4">
                             {item?.originalName}
                           </span>
                           <span className="text-3xl font-bold text-blue-600 shrink-0 whitespace-nowrap">
                             x{qty}
                           </span>
                        </div>
                      ))}
                   </div>
                   
                   <div className="pt-8 pb-4">
                     <p className="text-2xl font-handwriting text-gray-400">Thank you!</p>
                   </div>
                </div>

                {/* Copy Button Floating Bottom Right */}
                <div className="absolute bottom-6 right-6">
                  <button 
                    onClick={handleCopyOrder}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-full shadow-lg hover:bg-black transition-all font-medium text-sm"
                  >
                    {copied ? <Check size={16} className="text-green-400"/> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
             </div>
          )}

          {/* BILL SPLITTER MODE */}
          {mode === 'bill' && (
            <div className="p-5 space-y-6">
              
              {/* Amount Input */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bill Total</label>
                 <div className="flex items-center">
                    <span className="text-2xl text-gray-400 font-medium mr-2">{currencySymbol}</span>
                    <input 
                      type="number" 
                      value={customBillAmount}
                      onChange={(e) => setCustomBillAmount(e.target.value)}
                      className="w-full text-3xl font-bold text-gray-900 outline-none placeholder-gray-200"
                      placeholder="0.00"
                    />
                 </div>
              </div>

              {/* Tip Selection */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                   <Percent size={12}/> Tip / Gratuity
                 </label>
                 <div className="grid grid-cols-4 gap-2">
                   {[0, 15, 18, 20].map((pct) => (
                     <button
                       key={pct}
                       onClick={() => setTipPercent(pct)}
                       className={`py-2 rounded-lg text-sm font-bold transition-all border ${
                         tipPercent === pct 
                         ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' 
                         : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                       }`}
                     >
                       {pct === 0 ? 'No Tip' : `${pct}%`}
                     </button>
                   ))}
                 </div>
                 <div className="mt-3 flex justify-between items-center text-sm text-gray-500 px-1">
                   <span>Tip Amount:</span>
                   <span className="font-semibold text-green-600">+{currencySymbol}{tipAmount.toFixed(2)}</span>
                 </div>
              </div>

              {/* Split Selection */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                   <Users size={12}/> Split Bill
                 </label>
                 <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                    <button 
                      onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                      className="w-12 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-bold text-gray-900 text-lg">
                      {splitCount} <span className="text-sm font-normal text-gray-400">Person{splitCount > 1 ? 's' : ''}</span>
                    </div>
                    <button 
                      onClick={() => setSplitCount(splitCount + 1)}
                      className="w-12 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
                    >
                      +
                    </button>
                 </div>
              </div>

              {/* Final Result Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl mt-4">
                 <div className="flex justify-between items-center mb-1 opacity-80">
                   <span className="text-sm font-medium">Grand Total</span>
                   <span className="text-sm font-mono">{currencySymbol}{finalTotal.toFixed(2)}</span>
                 </div>
                 
                 {/* Split Breakdown */}
                 {splitBy > 1 && (
                   <div className="my-4 bg-white/10 rounded-lg p-3 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Bill Share</span>
                        <span className="font-mono text-sm">{currencySymbol}{perPersonBill.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Tip Share</span>
                        <span className="font-mono text-sm text-green-400">+{currencySymbol}{perPersonTip.toFixed(2)}</span>
                      </div>
                   </div>
                 )}

                 <div className="h-px bg-white/20 my-3"></div>
                 <div className="flex justify-between items-baseline">
                   <span className="font-bold text-lg">Total / Person</span>
                   <span className="text-4xl font-extrabold tracking-tight">
                     {currencySymbol}{perPersonTotal.toFixed(2)}
                   </span>
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 relative">
          {mode === 'cart' ? (
             <div className="space-y-3">
               <div className="flex justify-between items-end px-1">
                  <span className="text-gray-500 text-sm font-medium">Estimated Subtotal</span>
                  <span className="text-2xl font-bold text-gray-900">{currencySymbol}{cartTotal.toFixed(2)}</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setMode('bill')}
                   disabled={cartItems.length === 0}
                   className="py-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm hover:bg-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Calculator size={18} /> Split Bill
                 </button>
                 <button 
                   onClick={() => setMode('waiter')}
                   disabled={cartItems.length === 0}
                   className="py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Waiter View <ChevronRight size={16} />
                 </button>
               </div>
             </div>
          ) : (
            <button 
               onClick={() => setMode('cart')}
               className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
             >
               Back to Edit Order
             </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderModal;