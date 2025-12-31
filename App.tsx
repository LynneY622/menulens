import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import MenuGrid from './components/MenuGrid';
import PreferenceForm from './components/PreferenceForm';
import DishDetailModal from './components/DishDetailModal';
import WaiterChat from './components/WaiterChat';
import RestaurantEditModal from './components/RestaurantEditModal';
import OrderModal from './components/OrderModal';
import { MenuItem, AppState, UserPreferences, Recommendation, DishDetail } from './types';
import { parseMenuImage, searchDishInfo, getRecommendations } from './geminiService';
import { Camera, MapPin, ShoppingBag, ArrowLeft, ChefHat } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantLocation, setRestaurantLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [order, setOrder] = useState<Map<string, number>>(new Map());
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDishDetail, setCurrentDishDetail] = useState<DishDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isEditRestaurantOpen, setIsEditRestaurantOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('menuLensState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.menuItems?.length) {
          setMenuItems(parsed.menuItems);
          setRestaurantName(parsed.restaurantName || '');
          setRestaurantLocation(parsed.restaurantLocation || '');
          if (parsed.order) setOrder(new Map(parsed.order));
          setAppState(AppState.MENU_VIEW);
        }
      } catch (e) {
        localStorage.removeItem('menuLensState');
      }
    }
  }, []);

  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem('menuLensState', JSON.stringify({
        menuItems,
        restaurantName,
        restaurantLocation,
        order: Array.from(order.entries())
      }));
    }
  }, [menuItems, restaurantName, restaurantLocation, order]);

  const handleFileSelect = async (base64: string) => {
    setLoading(true);
    setAppState(AppState.PROCESSING_MENU);
    try {
      const result = await parseMenuImage(base64);
      setMenuItems(result.items);
      setRestaurantName(result.restaurantName || "Unknown Restaurant");
      setOrder(new Map());
      setAppState(AppState.MENU_VIEW);
    } catch (error) {
      alert("Parsing failed. Please try a clearer photo.");
      setAppState(AppState.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const handleDishClick = async (dishName: string) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    try {
      const details = await searchDishInfo(dishName, restaurantName, restaurantLocation);
      setCurrentDishDetail(details);
    } catch (e) {
      alert("Failed to get details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateOrder = (name: string, delta: number) => {
    setOrder(prev => {
      const next = new Map(prev);
      const currentQty = (next.get(name) as number) || 0;
      const qty = currentQty + delta;
      qty <= 0 ? next.delete(name) : next.set(name, qty);
      return next;
    });
  };

  // Fix: Explicitly type totalItems and use a generic for Array.from to ensure the result is a number
  const totalItems: number = Array.from<number>(order.values()).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {appState !== AppState.UPLOAD && (
            <button onClick={() => { localStorage.removeItem('menuLensState'); setMenuItems([]); setAppState(AppState.UPLOAD); }} className="p-2 text-gray-400 hover:text-gray-900">
              <Camera size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">MenuLens</h1>
            {restaurantName && <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 cursor-pointer" onClick={() => setIsEditRestaurantOpen(true)}><MapPin size={10}/>{restaurantName}</div>}
          </div>
        </div>
        {appState === AppState.MENU_VIEW && (
          <button onClick={() => setAppState(AppState.RECOMMENDATION_VIEW)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
            Get Recs ✨
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {appState === AppState.UPLOAD && <FileUpload onFileSelect={handleFileSelect} />}
        {appState === AppState.PROCESSING_MENU && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="animate-pulse text-gray-500 font-medium">Translating Menu...</p>
          </div>
        )}
        {appState === AppState.MENU_VIEW && <MenuGrid items={menuItems} onDishClick={handleDishClick} order={order} onUpdateOrder={handleUpdateOrder} />}
        {appState === AppState.RECOMMENDATION_VIEW && (
          <div className="space-y-6">
            <button onClick={() => setAppState(AppState.MENU_VIEW)} className="flex items-center text-sm text-gray-500"><ArrowLeft size={16} /> Back</button>
            {recommendations.length === 0 ? (
              <PreferenceForm onSubmit={async (p) => { setLoading(true); setRecommendations(await getRecommendations(menuItems, p)); setLoading(false); }} isLoading={loading} />
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2"><ChefHat className="text-orange-500"/> Chef Recommends</h2>
                {recommendations.map((rec, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-orange-500">
                    <h3 className="font-bold text-lg mb-1">{rec.dishName}</h3>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-4">
          <button onClick={() => setIsOrderModalOpen(true)} className="bg-gray-900 text-white px-6 py-3 rounded-full flex justify-between w-full max-w-sm shadow-2xl font-bold active:scale-95 transition-transform">
            <span>{totalItems} items</span>
            <span className="flex items-center gap-2">View Order <ShoppingBag size={18}/></span>
          </button>
        </div>
      )}

      {menuItems.length > 0 && <WaiterChat menuItems={menuItems} />}
      <DishDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} detail={currentDishDetail} isLoading={isDetailLoading} />
      <RestaurantEditModal isOpen={isEditRestaurantOpen} onClose={() => setIsEditRestaurantOpen(false)} initialName={restaurantName} initialLocation={restaurantLocation} onSave={(n, l) => {setRestaurantName(n); setRestaurantLocation(l);}} />
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} order={order} menuItems={menuItems} onUpdateOrder={handleUpdateOrder} />
    </div>
  );
};

export default App;