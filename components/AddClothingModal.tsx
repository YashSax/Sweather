import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Sparkles } from 'lucide-react';
import { ClothingItem } from '../types';
import { analyzeClothingImage } from '../services/gemini';
import { resizeImage, fileToBase64 } from '../utils/image';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: ClothingItem) => void;
}

export const AddClothingModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [insulation, setInsulation] = useState(5);
  const [tags, setTags] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const resized = await resizeImage(base64, 400); // Resize for storage/API
        setImage(resized);
      } catch (error) {
        console.error("Error processing image", error);
      }
    }
  };

  const handleAutoClassify = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeClothingImage(image);
      setName(result.name);
      setInsulation(result.insulation);
      setTags(result.tags.join(', '));
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again or fill manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ClothingItem = {
      id: crypto.randomUUID(),
      imageData: image || '',
      name,
      type: 'Custom', // Simplification for demo
      insulation,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
    };
    onAdd(newItem);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setImage(null);
    setName('');
    setInsulation(5);
    setTags('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Add to Wardrobe</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Image Upload Section */}
          <div className="flex flex-col items-center">
             <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden
                ${image ? 'border-transparent' : 'border-gray-300 hover:border-indigo-400 bg-gray-50'}`}
            >
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500 font-medium">Tap to take photo or upload</p>
                </>
              )}
              
              {image && (
                <div className="absolute bottom-2 right-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAutoClassify();
                    }}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? <LoadingSpinner /> : <><Sparkles size={14} /> Auto-Fill</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <form id="add-clothing-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input 
                required
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Blue Denim Jacket"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Insulation Level</span>
                <span className="text-indigo-600 font-bold">{insulation}/10</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={insulation} 
                onChange={e => setInsulation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Light</span>
                <span>Medium</span>
                <span>Heavy</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tags} 
                onChange={e => setTags(e.target.value)}
                placeholder="hoodie, cotton, grey"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button 
            form="add-clothing-form"
            type="submit" 
            disabled={!image || !name}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
};