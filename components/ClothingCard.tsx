import React from 'react';
import { ClothingItem } from '../types';
import { Trash2, ThermometerSun, ThermometerSnowflake } from 'lucide-react';

interface Props {
  item: ClothingItem;
  onDelete: (id: string) => void;
  selected?: boolean;
}

export const ClothingCard: React.FC<Props> = ({ item, onDelete, selected }) => {
  return (
    <div className={`relative group rounded-xl overflow-hidden shadow-sm border transition-all duration-200 
      ${selected ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 transform scale-105 shadow-md bg-indigo-50' : 'bg-white border-gray-200 hover:shadow-md'}
    `}>
      <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
        {item.imageData ? (
          <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
        
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
           {item.insulation >= 8 ? <ThermometerSnowflake size={12} className="text-blue-500"/> : 
            item.insulation <= 3 ? <ThermometerSun size={12} className="text-orange-500"/> : 
            <span className="w-2 h-2 rounded-full bg-green-500"></span>}
           Lvl {item.insulation}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        title="Delete Item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};