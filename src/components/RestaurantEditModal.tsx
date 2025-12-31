import React, { useState, useEffect } from 'react';
import { X, MapPin, Store } from 'lucide-react';

interface RestaurantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialLocation: string;
  onSave: (name: string, location: string) => void;
}

const RestaurantEditModal: React.FC<RestaurantEditModalProps> = ({ isOpen, onClose, initialName, initialLocation, onSave }) => {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setLocation(initialLocation);
    }
  }, [isOpen, initialName, initialLocation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-gray-800 mb-4">Restaurant Details</h3>
        <p className="text-sm text-gray-500 mb-6">
          Add specific location details to help us find the exact photos for this menu (e.g. city, street, or branch).
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Store size={14} /> Restaurant Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JoJo Coffeehouse"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin size={14} /> Location (City/Area)
            </label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Scottsdale, AZ"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <button 
            onClick={() => {
              onSave(name, location);
              onClose();
            }}
            className="w-full mt-2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Update & Search Better
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantEditModal;