import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import MenuGrid from './components/MenuGrid';
import PreferenceForm from './components/PreferenceForm';
import DishDetailModal from './components/DishDetailModal';
import WaiterChat from './components/WaiterChat';
import RestaurantEditModal from './components/RestaurantEditModal';
import OrderModal from './components/OrderModal';
import { MenuItem, AppState, UserPreferences, Recommendation, DishDetail } from './types';
import { parseMenuImage, searchDishInfo, getRecommendations } from './services/geminiService';
import { ChefHat, ArrowLeft, RefreshCw, Camera, MapPin, Edit2, ShoppingBag } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantLocation, setRestaurantLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Order State
  const [order, setOrder] = useState<Map<string, number>>(new Map());
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Other Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDishDetail, setCurrentDishDetail] = useState<DishDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isEditRestaurantOpen, setIsEditRestaurantOpen] = useState(false);

  // -- PERSISTENCE LOGIC --

  // 1. Load state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('menuLensState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.menuItems && parsed.menuItems.length > 0) {
          setMenuItems(parsed.menuItems);
          setRestaurantName(parsed.restaurantName || '');
          setRestaurantLocation(parsed.restaurantLocation || '');
          
          if (parsed.order) {
            setOrder(new Map(parsed.order));
          }
          
          // Restore view if we have data
          setAppState(AppState.MENU_VIEW);
        }
      } catch (e) {
        console.error("Failed to load saved state:", e);
        localStorage.removeItem('menuLensState');
      }
    }
  }, []);

  // 2. Save state on changes
  useEffect(() => {
    // Only save if we have actual data and aren't in the middle of uploading/processing
    if (appState === AppState.UPLOAD || appState === AppState.PROCESSING_MENU) return;
    
    if (menuItems.length > 0) {
      const stateToSave = {
        menuItems,
        restaurantName,
        restaurantLocation,
        order: Array.from(order.entries()) // Map to Array for JSON
      };
      localStorage.setItem('menuLensState', JSON.stringify(stateToSave));
    }
  }, [menuItems, restaurantName, restaurantLocation, order, appState]);


  // -- HANDLERS --

  // 1. Handle File Upload
  const handleFileSelect = async (base64: string) => {
    setLoading(true);
    setAppState(AppState.PROCESSING_MENU);
    try {
      console.log("Starting menu parse...");
      const result = await parseMenuImage(base64);
      console.log("Menu parsed:", result);
      
      if (!result.items || result.items.length === 0) {
        throw new Error("No dishes found in the image.");
      }
      
      setMenuItems(result.items);
      setRestaurantName(result.restaurantName || "Unknown Restaurant");
      setRestaurantLocation(''); // Reset location on new upload
      setOrder(new Map()); // Reset order
      setAppState(AppState.MENU_VIEW);
    } catch (error) {
      console.error("Menu parsing failed:", error);
      alert(`Failed to parse menu: ${(error as Error).message}. Please try a clearer image.`);
      setAppState(AppState.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Dish Detail Request
  const handleDishClick = async (dishName: string) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setCurrentDishDetail(null);
    try {
      // Pass restaurant name AND location to improve search accuracy
      const details = await searchDishInfo(dishName, restaurantName, restaurantLocation);
      setCurrentDishDetail(details);
    } catch (e) {
      console.error(e);
      alert("Failed to get dish details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 3. Handle Recommendation
  const handleGetRecommendations = async (prefs: UserPreferences) => {
    setLoading(true);
    try {
      const recs = await getRecommendations(menuItems, prefs);
      setRecommendations(recs);
      setAppState(AppState.RECOMMENDATION_VIEW);
    } catch (e) {
      console.error(e);
      alert("Could not generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Order Updates
  const handleUpdateOrder = (originalName: string, delta: number) => {
    setOrder(prev => {
      const newOrder = new Map(prev);
      // Fix: Cast the map value to number to avoid 'unknown' type errors during arithmetic
      const currentQty = (newOrder.get(originalName) as number) || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        newOrder.delete(originalName);
      } else {
        newOrder.set(originalName, newQty);
      }
      return newOrder;
    });
  };

  // Navigation handlers
  const goBackToMenu = () => setAppState(AppState.MENU_VIEW);
  
  const resetApp = () => {
    // Clear state and local storage
    localStorage.removeItem('menuLensState');
    setMenuItems([]);
    setRecommendations([]);
    setRestaurantName('');
    setRestaurantLocation('');
    setOrder(new Map());
    setAppState(AppState.UPLOAD);
  };

  const showChat = appState === AppState.MENU_VIEW || appState === AppState.RECOMMENDATION_VIEW;

  // Fix: Use generic for Array.from to ensure the result of reduce is recognized as a number
  const totalItems: number = Array.from<number>(order.values()).reduce((a: number, b: number) => a + b, 0);
  
  // Fix: Explicitly type the accumulator and ensure arithmetic operations are performed on known numbers by using generic in Array.from
  const totalPrice: number = Array.from<[string, number]>(order.entries()).reduce((sum: number, [name, qty]) => {
     const item = menuItems.find(m => m.originalName === name);
     if (!item?.price) return sum;
     const match = item.price.match(/(\d+\.?\d*)/);
     const price = match ? parseFloat(match[0]) : 0;
     return sum + (price * (qty as number));
  }, 0);
  const currencySymbol = menuItems.find(m => m.price)?.price?.replace(/\d|\.| /g, '') || '$';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {appState !== AppState.UPLOAD && (
              <button onClick={resetApp} className="p-2 -ml-2 text-gray-500 hover:text-gray-900" title="Scan New Menu">
                <Camera size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent leading-none">
                MenuLens
              </h1>
              {(restaurantName || appState === AppState.MENU_VIEW) && (
                 <button 
                    onClick={() => setIsEditRestaurantOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 -ml-2 rounded-md transition-all text-left group"
                 >
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate max-w-[180px] font-medium">
                      {restaurantName || "Unknown Restaurant"}
                      {restaurantLocation && <span className="text-gray-400 font-normal">, {restaurantLocation}</span>}
                    </span>
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
              )}
            </div>
          </div>
          {appState === AppState.MENU_VIEW && (
            <button 
              onClick={() => setAppState(AppState.RECOMMENDATION_VIEW)}
              className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition"
            >
              Get Recs ✨
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        
        {appState === AppState.UPLOAD && (
          <FileUpload onFileSelect={handleFileSelect} />
        )}

        {appState === AppState.PROCESSING_MENU && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-600 animate-pulse">Translating Menu...</p>
            <p className="text-sm text-gray-400">This uses AI vision, please wait.</p>
          </div>
        )}

        {appState === AppState.MENU_VIEW && (
          <div className="animate-fade-in">
             <MenuGrid 
               items={menuItems} 
               onDishClick={handleDishClick} 
               order={order}
               onUpdateOrder={handleUpdateOrder}
             />
          </div>
        )}

        {appState === AppState.RECOMMENDATION_VIEW && (
          <div className="animate-fade-in space-y-8">
            <button 
              onClick={goBackToMenu}
              className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Menu
            </button>

            {/* If no recommendations yet, show form */}
            {recommendations.length === 0 ? (
              <PreferenceForm onSubmit={handleGetRecommendations} isLoading={loading} />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold flex items-center gap-2">
                     <ChefHat className="text-orange-500" /> Chef Recommends
                   </h2>
                   <button 
                     onClick={() => setRecommendations([])} 
                     className="text-sm text-blue-600 flex items-center gap-1"
                   >
                     <RefreshCw size={14}/> Adjust Prefs
                   </button>
                </div>
                
                <div className="grid gap-6">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-orange-500">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{rec.dishName}</h3>
                      <p className="text-gray-600 leading-relaxed">{rec.reason}</p>
                      <button 
                        onClick={() => handleDishClick(rec.dishName)}
                        className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        See what this looks like
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Order Summary Bar */}
      {totalItems > 0 && (
         <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center pointer-events-none">
            <button 
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-gray-900 text-white shadow-xl rounded-full px-6 py-3 flex items-center gap-6 pointer-events-auto hover:scale-105 active:scale-95 transition-all max-w-sm w-full justify-between"
            >
               <div className="flex items-center gap-2">
                 <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">{totalItems}</div>
                 <span className="font-semibold text-sm">{currencySymbol}{totalPrice.toFixed(2)}</span>
               </div>
               <div className="flex items-center gap-2 font-bold text-sm">
                 View Order <ShoppingBag size={16} />
               </div>
            </button>
         </div>
      )}
      
      {/* AI Waiter Chat - Only show when menu is loaded */}
      {showChat && <WaiterChat menuItems={menuItems} />}

      <DishDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        detail={currentDishDetail}
        isLoading={isDetailLoading}
      />

      <RestaurantEditModal 
        isOpen={isEditRestaurantOpen}
        onClose={() => setIsEditRestaurantOpen(false)}
        initialName={restaurantName}
        initialLocation={restaurantLocation}
        onSave={(name, loc) => {
          setRestaurantName(name);
          setRestaurantLocation(loc);
        }}
      />
      
      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={order}
        menuItems={menuItems}
        onUpdateOrder={handleUpdateOrder}
      />
    </div>
  );
};

export default App;