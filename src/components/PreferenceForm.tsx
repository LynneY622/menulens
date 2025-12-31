import React, { useState } from 'react';
import { UserPreferences, SpicyLevel } from '../types';
import { Flame, Users,  Utensils, Heart } from 'lucide-react';

interface PreferenceFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const PreferenceForm: React.FC<PreferenceFormProps> = ({ onSubmit, isLoading }) => {
  const [partySize, setPartySize] = useState(2);
  const [spicyLevel, setSpicyLevel] = useState<string>(SpicyLevel.MILD);
  const [dietary, setDietary] = useState('');
  const [favorites, setFavorites] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      partySize,
      spicyLevel,
      dietaryRestrictions: dietary,
      favorites
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Utensils className="text-orange-500" size={24} />
        Preferences
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Party Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Users size={16} /> Party Size
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={partySize} 
              onChange={(e) => setPartySize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-lg font-bold w-8 text-center">{partySize}</span>
          </div>
        </div>

        {/* Spicy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Flame size={16} /> Spice Level
          </label>
          <select 
            value={spicyLevel}
            onChange={(e) => setSpicyLevel(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            {Object.values(SpicyLevel).map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Dietary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dietary Restrictions
          </label>
          <input 
            type="text"
            placeholder="e.g., No Pork, Vegetarian, Peanut Allergy"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Favorites */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Heart size={16} /> Cravings / Favorites
          </label>
          <input 
            type="text"
            placeholder="e.g., Seafood, Noodles, Sweet"
            value={favorites}
            onChange={(e) => setFavorites(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-300 font-medium rounded-xl text-sm px-5 py-3 text-center shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Thinking...' : 'Get Recommendations'}
        </button>

      </form>
    </div>
  );
};

export default PreferenceForm;