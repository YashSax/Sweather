import { ClothingItem } from '../types';

const STORAGE_KEY = 'sweather_wardrobe_v1';

// Mock initial data if empty
const INITIAL_DATA: ClothingItem[] = [
  {
    id: '1',
    name: 'Favorite Grey Hoodie',
    type: 'Hoodie',
    insulation: 7,
    tags: ['casual', 'grey', 'comfortable'],
    imageData: 'https://picsum.photos/id/1005/300/300' // Placeholder for demo
  },
  {
    id: '2',
    name: 'Denim Jacket',
    type: 'Jacket',
    insulation: 6,
    tags: ['denim', 'blue', 'layer'],
    imageData: 'https://picsum.photos/id/1025/300/300'
  },
  {
    id: '3',
    name: 'Winter Coat',
    type: 'Coat',
    insulation: 10,
    tags: ['heavy', 'winter', 'warm'],
    imageData: 'https://picsum.photos/id/1024/300/300'
  },
   {
    id: '4',
    name: 'Basic White Tee',
    type: 'T-Shirt',
    insulation: 2,
    tags: ['white', 'basic', 'layer'],
    imageData: 'https://picsum.photos/id/1060/300/300'
  }
];

export const getWardrobe = (): ClothingItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Seed with initial data for better UX on first load
      saveWardrobe(INITIAL_DATA);
      return INITIAL_DATA;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load wardrobe", e);
    return [];
  }
};

export const saveWardrobe = (items: ClothingItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save wardrobe (likely storage limit)", e);
    alert("Storage limit reached. Try deleting some items or using smaller images.");
  }
};

export const addClothingItem = (item: ClothingItem): ClothingItem[] => {
  const current = getWardrobe();
  const updated = [...current, item];
  saveWardrobe(updated);
  return updated;
};

export const deleteClothingItem = (id: string): ClothingItem[] => {
  const current = getWardrobe();
  const updated = current.filter(i => i.id !== id);
  saveWardrobe(updated);
  return updated;
};