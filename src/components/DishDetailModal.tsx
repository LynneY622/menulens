import React from 'react';
import { X, ExternalLink, Search, Sparkles, Image as ImageIcon, BookOpen } from 'lucide-react';
import { DishDetail } from '../types';

interface DishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: DishDetail | null;
  isLoading: boolean;
}

const DishDetailModal: React.FC<DishDetailModalProps> = ({ isOpen, onClose, detail, isLoading }) => {
  if (!isOpen) return null;

  // Logic to determine which image to show
  const showRealImage = detail?.realImageUrl && detail.realImageUrl.startsWith('http');
  const showGeneratedImage = !showRealImage && detail?.generatedImage;

  // Construct Google Image Search URL
  const googleImageSearchUrl = detail 
    ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(detail.dishName + " real food photo")}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-bold text-gray-800 pr-8 truncate">
             {detail?.dishName || "Dish Details"}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors absolute right-2 top-2"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 animate-pulse font-medium">Searching & Generating...</p>
              <p className="text-xs text-gray-400">Consulting Google Search and AI Imaging</p>
            </div>
          ) : detail ? (
            <div className="pb-6">
              
              {/* Image Section */}
              <div className="relative w-full h-56 bg-gray-100 overflow-hidden group">
                 {showRealImage ? (
                   <>
                    <img 
                      src={detail.realImageUrl} 
                      alt={detail.dishName} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        // If real image fails to load, fallback to generated if available, or placeholder
                        const target = e.target as HTMLImageElement;
                        if (detail.generatedImage) {
                           target.src = `data:image/jpeg;base64,${detail.generatedImage}`;
                           // Hide the "Image from Web" label if we fallback
                           const badge = target.nextElementSibling as HTMLElement;
                           if (badge) badge.style.display = 'none';
                        } else {
                           target.style.display = 'none'; // Hide broken image
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
                      <ImageIcon size={12} className="text-white" />
                      Image from Web
                    </div>
                   </>
                 ) : showGeneratedImage ? (
                   <>
                    <img 
                      src={`data:image/jpeg;base64,${detail.generatedImage}`} 
                      alt={detail.dishName} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
                      <Sparkles size={12} className="text-yellow-400" />
                      AI Generated Preview
                    </div>
                   </>
                 ) : (
                   <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                      <Search size={32} className="mb-2 opacity-50"/>
                      <span className="text-sm">No image available</span>
                   </div>
                 )}
                 
                 {/* Fallback Search Button Overlay */}
                 <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={googleImageSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/90 backdrop-blur hover:bg-white text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/50"
                    >
                      <Search size={10} /> Find specific photo
                    </a>
                 </div>
              </div>

              <div className="px-6 mt-6 space-y-6">
                
                {/* Fallback Search Link (Mobile Friendly) */}
                <a 
                  href={googleImageSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 transition-colors"
                >
                  <Search size={14} /> Search "{detail.dishName}" photos on Google
                </a>

                {/* Summary */}
                <div>
                   <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                     <BookOpen size={16} className="text-blue-600"/> 
                     Dish Encyclopedia <span className="text-xs text-gray-400 font-normal">(菜品百科)</span>
                   </h4>
                   <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-gray-700 leading-relaxed text-sm text-justify">
                        {detail.summary}
                      </p>
                   </div>
                </div>

                {/* External Links */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    Sources & Reviews
                  </h4>
                  {detail.imageLinks.length > 0 ? (
                    <ul className="space-y-2">
                      {detail.imageLinks.map((link, idx) => (
                        <li key={idx}>
                          <a 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group bg-white shadow-sm hover:shadow-md"
                          >
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[85%] group-hover:text-blue-700">
                              {link.title}
                            </span>
                            <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No direct links found.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
             <div className="p-10 text-center text-gray-500">No information available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishDetailModal;