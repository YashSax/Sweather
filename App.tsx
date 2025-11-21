import React, { useState, useEffect } from 'react';
import { Shirt, MapPin, CloudSun, Plus, Search, CloudRain, Thermometer, Sparkles, ExternalLink } from 'lucide-react';
import { getWardrobe, addClothingItem, deleteClothingItem } from './services/db';
import { getRecommendation } from './services/gemini';
import { ClothingItem, AppView, Recommendation } from './types';
import { ClothingCard } from './components/ClothingCard';
import { AddClothingModal } from './components/AddClothingModal';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dashboard State
  const [location, setLocation] = useState('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    setWardrobe(getWardrobe());
  }, []);

  const handleAdd = (item: ClothingItem) => {
    const updated = addClothingItem(item);
    setWardrobe(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Remove this item?")) {
      const updated = deleteClothingItem(id);
      setWardrobe(updated);
    }
  };

  const handleGetRecommendation = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location.trim()) return;
    
    setLoadingRecommendation(true);
    setRecommendation(null);
    try {
      const result = await getRecommendation(location, wardrobe);
      setRecommendation(result);
    } catch (error) {
      console.error(error);
      alert("Could not get recommendation. Please check your connection or API Key.");
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleGeoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        // Simple reverse geocode or just use coordinates string which Gemini understands well
        // Using less precision for coordinates display
        setLocation(`${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`);
      }, (err) => {
        alert("Geolocation failed. Please enter manually.");
      });
    } else {
      alert("Geolocation not supported");
    }
  };

  const recommendedItems = wardrobe.filter(item => recommendation?.selectedItemIds.includes(item.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0">
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
          <CloudSun size={28} strokeWidth={2.5} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sweather</h1>
        </div>
        <nav className="hidden md:flex gap-6 font-medium text-sm text-slate-500">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className={`hover:text-indigo-600 transition-colors ${view === AppView.DASHBOARD ? 'text-indigo-600' : ''}`}
          >
            Assistant
          </button>
          <button 
             onClick={() => setView(AppView.WARDROBE)}
             className={`hover:text-indigo-600 transition-colors ${view === AppView.WARDROBE ? 'text-indigo-600' : ''}`}
          >
            My Wardrobe ({wardrobe.length})
          </button>
        </nav>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* DASHBOARD VIEW */}
        {view === AppView.DASHBOARD && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Hero / Input Section */}
            <section className="text-center space-y-6 py-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800">
                Is it Sweater Weather?
              </h2>
              <p className="text-slate-500 max-w-lg mx-auto">
                Enter your location to check the weather and get a personalized outfit recommendation from your own wardrobe.
              </p>
              
              <form onSubmit={handleGetRecommendation} className="max-w-md mx-auto relative flex items-center">
                <MapPin className="absolute left-4 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="City, Zip, or 'Current Location'" 
                  className="w-full pl-12 pr-12 py-4 rounded-full border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-lg transition-all"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleGeoLocate}
                  className="absolute right-14 text-slate-400 hover:text-indigo-600 p-2"
                  title="Use Current Location"
                >
                  <Search size={20} className="opacity-0 pointer-events-none" /> {/* Spacer */}
                </button>
                 <button 
                  type="submit"
                  className="absolute right-2 bg-indigo-600 p-2.5 rounded-full text-white hover:bg-indigo-700 transition-colors shadow-md"
                  disabled={!location || loadingRecommendation}
                >
                  {loadingRecommendation ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Search size={20} />}
                </button>
              </form>
              <button 
                type="button" 
                onClick={handleGeoLocate}
                className="text-sm text-indigo-600 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <MapPin size={14} /> Use my current location
              </button>
            </section>

            {/* Recommendation Result */}
            {recommendation && (
              <div className="space-y-6 animate-slide-up">
                
                {/* Weather Summary Card */}
                <div className={`rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden
                  ${recommendation.weather.isSweaterWeather ? 'bg-gradient-to-r from-orange-400 to-amber-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`}>
                  
                  <div className="text-center md:text-left z-10">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-white/80 font-medium uppercase tracking-wider text-sm mb-1">
                      <MapPin size={16} /> {recommendation.weather.location}
                    </div>
                    <h3 className="text-4xl font-bold mb-2">{recommendation.weather.temperature}</h3>
                    <p className="text-xl font-medium text-white/90 mb-4">{recommendation.weather.summary}</p>
                    
                    {recommendation.weather.sources && recommendation.weather.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                        {recommendation.weather.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 transition-colors text-white/90"
                          >
                            <ExternalLink size={10} />
                            Source {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center min-w-[140px] z-10">
                    <span className="block text-sm font-medium text-white/80 uppercase tracking-wider mb-1">Verdict</span>
                    <span className="text-2xl font-bold">
                      {recommendation.weather.isSweaterWeather ? "Yes! 🧣" : "No 👕"}
                    </span>
                    <p className="text-xs text-white/70 mt-1">
                      {recommendation.weather.isSweaterWeather ? "It's sweater weather." : "Not sweater weather."}
                    </p>
                  </div>
                </div>

                {/* Reasoning & Items */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-500"/> Assistant's Advice
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {recommendation.reasoning}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-bold text-slate-800 pl-1">Suggested Outfit</h4>
                    {recommendedItems.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {recommendedItems.map(item => (
                          <ClothingCard 
                            key={item.id} 
                            item={item} 
                            onDelete={handleDelete}
                            selected={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-500 border-2 border-dashed border-slate-200">
                        <Shirt className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No suitable items found in your wardrobe.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">
                          Add some clothes!
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!recommendation && !loadingRecommendation && (
              <div className="text-center pt-12 opacity-50">
                <CloudRain size={64} className="mx-auto text-slate-300 mb-4" />
                <p>Ready to check the weather.</p>
              </div>
            )}
          </div>
        )}

        {/* WARDROBE VIEW */}
        {view === AppView.WARDROBE && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">My Wardrobe</h2>
              <span className="text-slate-500 text-sm">{wardrobe.length} items</span>
            </div>
            
            {wardrobe.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Shirt size={64} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your wardrobe is empty</h3>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">Add some clothes so I can help you decide what to wear.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wardrobe.map(item => (
                  <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
                ))}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Add New</span>
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView(AppView.DASHBOARD)}
          className={`flex flex-col items-center text-xs font-medium ${view === AppView.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <CloudSun size={24} className="mb-1" />
          Assistant
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white p-3 rounded-full -mt-8 shadow-lg ring-4 ring-slate-50"
        >
          <Plus size={24} />
        </button>
        <button 
          onClick={() => setView(AppView.WARDROBE)}
          className={`flex flex-col items-center text-xs font-medium ${view === AppView.WARDROBE ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Shirt size={24} className="mb-1" />
          Wardrobe
        </button>
      </div>

      <AddClothingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAdd}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default App;