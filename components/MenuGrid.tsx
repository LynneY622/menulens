import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Info, Sparkles, Volume2, AlertTriangle, Leaf, Flame, Ban, Fish, Plus, Minus } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onDishClick: (dishName: string) => void;
  order: Map<string, number>;
  onUpdateOrder: (originalName: string, delta: number) => void;
}

type FilterType = 'vegetarian' | 'nutAllergy' | 'noPork' | 'spicy';

const MenuGrid: React.FC<MenuGridProps> = ({ items, onDishClick, order, onUpdateOrder }) => {
  const [activeFilters, setActiveFilters] = useState<Record<FilterType, boolean>>({
    vegetarian: false,
    nutAllergy: false,
    noPork: false,
    spicy: false
  });

  // Toggle filter state
  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  // Group by category if possible
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper to check for tags safely
  const hasTag = (item: MenuItem, tag: string) => item.tags?.includes(tag);

  // Helper to render standard tags
  const renderTags = (tags?: string[]) => {
    if (!tags) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.includes('Vegetarian') && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
            <Leaf size={10} className="mr-1"/> Veg
          </span>
        )}
        {tags.includes('Spicy') && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
            <Flame size={10} className="mr-1"/> Spicy
          </span>
        )}
        {tags.includes('Contains Nuts') && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">
            🥜 Nuts
          </span>
        )}
         {tags.includes('Contains Seafood') && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
            <Fish size={10} className="mr-1"/> Seafood
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Filters Bar */}
      <div className="sticky top-[64px] z-20 bg-slate-50/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-200 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
           <button 
             onClick={() => toggleFilter('vegetarian')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilters.vegetarian ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
           >
             <Leaf size={14} /> Vegetarian Only
           </button>

           <button 
             onClick={() => toggleFilter('nutAllergy')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilters.nutAllergy ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
           >
             <Ban size={14} /> Nut Allergy
           </button>

           <button 
             onClick={() => toggleFilter('noPork')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilters.noPork ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
           >
             <Ban size={14} /> No Pork
           </button>
           
           <button 
             onClick={() => toggleFilter('spicy')}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilters.spicy ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
           >
             <Flame size={14} /> Highlight Spicy
           </button>
        </div>
      </div>

      {Object.entries(grouped).map(([category, dishes]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
              {category}
            </h3>
            <div className="h-px bg-gray-200 flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(dishes as MenuItem[]).map((dish, idx) => {
              
              // Logic for visual alerts
              const isVeg = hasTag(dish, 'Vegetarian') || hasTag(dish, 'Vegan');
              const hasNuts = hasTag(dish, 'Contains Nuts');
              const hasPork = hasTag(dish, 'Contains Pork');
              const isSpicy = hasTag(dish, 'Spicy');

              // 1. Should we dim this card? (Vegetarian Filter)
              const isDimmed = activeFilters.vegetarian && !isVeg;

              // 2. Should we warn? (Allergy Filters)
              const showNutWarning = activeFilters.nutAllergy && hasNuts;
              const showPorkWarning = activeFilters.noPork && hasPork;
              const isUnsafe = showNutWarning || showPorkWarning;

              // 3. Highlight Spicy
              const highlightSpicy = activeFilters.spicy && isSpicy;

              // 4. Order State
              const quantity = order.get(dish.originalName) || 0;

              return (
                <div 
                  key={`${dish.originalName}-${idx}`} 
                  className={`
                    bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full transition-all duration-300 relative group
                    ${isDimmed ? 'opacity-40 grayscale-[0.8] scale-[0.98]' : 'hover:shadow-lg'}
                    ${isUnsafe ? 'border-red-500 ring-1 ring-red-500 bg-red-50/30' : highlightSpicy ? 'border-orange-400 ring-1 ring-orange-200' : 'border-gray-100'}
                  `}
                >
                  
                  {/* Warning Overlay */}
                  {isUnsafe && (
                    <div className="absolute -top-3 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 z-10">
                      <AlertTriangle size={12} fill="white" />
                      {showNutWarning ? 'CONTAINS NUTS' : 'CONTAINS PORK'}
                    </div>
                  )}

                  {/* Add to Order Button (Top Right) */}
                  <div className="absolute top-4 right-4 z-10">
                     {quantity > 0 ? (
                       <div className="flex items-center bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                         <button 
                           onClick={() => onUpdateOrder(dish.originalName, -1)}
                           className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                         >
                           <Minus size={14} />
                         </button>
                         <span className="w-6 text-center text-sm font-bold text-blue-600">{quantity}</span>
                         <button 
                           onClick={() => onUpdateOrder(dish.originalName, 1)}
                           className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                         >
                           <Plus size={14} />
                         </button>
                       </div>
                     ) : (
                       <button 
                         onClick={() => onUpdateOrder(dish.originalName, 1)}
                         className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white hover:scale-110 hover:shadow-md transition-all flex items-center justify-center"
                         title="Add to Order"
                       >
                         <Plus size={18} />
                       </button>
                     )}
                  </div>

                  {/* Header: Translated Name + Price */}
                  <div className="flex justify-between items-start gap-3 mb-1 pr-12">
                    <h4 className="text-lg font-bold text-gray-900 leading-snug break-words">
                      {dish.translatedName}
                    </h4>
                  </div>
                  {dish.price && (
                      <span className="inline-block bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-md text-sm whitespace-nowrap mb-2 w-fit">
                        {dish.price}
                      </span>
                   )}

                  {/* Subheader: Original Name + TTS */}
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm text-gray-500 font-medium font-mono uppercase tracking-wide break-all line-clamp-1">
                      {dish.originalName}
                    </p>
                    <button 
                      onClick={(e) => handleSpeak(e, dish.originalName)}
                      className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                      title="Pronounce"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>

                  {/* Tags */}
                  {renderTags(dish.tags)}
                  
                  {/* Description Body */}
                  <div className="flex-grow mb-5">
                    <div className={`p-3 rounded-lg border ${isUnsafe ? 'bg-white border-red-100' : 'bg-orange-50/50 border-orange-100/50'}`}>
                      <p className="text-sm text-gray-700 leading-relaxed">
                         {dish.translatedDescription || dish.description || "暂无介绍 (No description)"}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => onDishClick(`${dish.originalName} ${dish.translatedName}`)}
                    className="w-full py-2.5 px-3 bg-white text-blue-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all border border-blue-200 shadow-sm hover:shadow active:scale-[0.98]"
                  >
                    <Sparkles size={16} className="text-blue-500" />
                    <span>Images & Info</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuGrid;