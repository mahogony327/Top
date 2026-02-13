import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../services/api';
import toast from 'react-hot-toast';

const ICONS = ['📋', '🎬', '🎵', '📚', '🎮', '🍔', '✈️', '👤', '💼', '🏆', '⭐', '❤️', '🎯', '🌍', '🐾', '☕', '🏠', '👟', '💄', '🎨'];
const COLORS = ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'teal', 'indigo'];

// Suggested category templates
const CATEGORY_TEMPLATES = [
  { name: 'Movies', icon: '🎬', description: 'My all-time favorite films', image: 'cinema,film' },
  { name: 'Music', icon: '🎵', description: 'Greatest albums and songs', image: 'music,vinyl' },
  { name: 'Books', icon: '📚', description: 'Must-read books', image: 'books,library' },
  { name: 'Video Games', icon: '🎮', description: 'Best games I\'ve played', image: 'gaming,videogame' },
  { name: 'Food', icon: '🍔', description: 'Favorite restaurants and dishes', image: 'food,restaurant' },
  { name: 'Travel', icon: '✈️', description: 'Places I want to visit', image: 'travel,destination' },
  { name: 'People', icon: '👤', description: 'Inspiring people', image: 'portrait,people' },
  { name: 'Work', icon: '💼', description: 'Career and productivity', image: 'office,business' },
  { name: 'Sports', icon: '🏆', description: 'Athletes and teams', image: 'sports,athlete' },
  { name: 'Places', icon: '🌍', description: 'Favorite locations', image: 'landscape,places' },
  { name: 'Pets', icon: '🐾', description: 'Cute animals', image: 'pets,animals' },
  { name: 'Goals', icon: '🎯', description: 'Things to achieve', image: 'goals,target' },
];

export default function CreateCategory() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('blue');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxItems, setMaxItems] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const selectTemplate = (template: typeof CATEGORY_TEMPLATES[0]) => {
    setName(template.name);
    setDescription(template.description);
    setIcon(template.icon);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await categoriesApi.create({
        name,
        description: description || undefined,
        icon,
        color,
        isPrivate,
        maxItems
      });
      toast.success('Category created!');
      navigate(`/categories/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Create New Category</h1>
      <p className="text-gray-500 mb-6">Choose from popular templates or create your own</p>

      {/* Category Templates */}
      {showTemplates && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Popular Categories</h2>
            <button 
              onClick={() => setShowTemplates(false)} 
              className="text-sm text-primary-600 hover:underline"
            >
              Skip, create custom
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORY_TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => selectTemplate(template)}
                className="group relative rounded-xl overflow-hidden h-28 text-left"
              >
                <img 
                  src={`https://source.unsplash.com/300x200/?${template.image}`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{template.icon}</span>
                    <span className="font-medium text-white text-sm">{template.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show selected template or form */}
      {!showTemplates && (
        <button 
          type="button"
          onClick={() => setShowTemplates(true)} 
          className="text-sm text-primary-600 hover:underline mb-4 flex items-center gap-1"
        >
          ← Back to templates
        </button>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Category Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g., Top Movies, Best Albums, Favorite Books"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[100px]"
            placeholder="What's this category about?"
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                  icon === i
                    ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Maximum Items: {maxItems}</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={maxItems}
            onChange={(e) => setMaxItems(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Top 5</span>
            <span>Top 100</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isPrivate" className="text-sm">
            Make this category private (only you can see it)
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
