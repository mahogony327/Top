import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../services/api';
import toast from 'react-hot-toast';

// Random gradient colors
const gradients = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
  'from-green-500 to-lime-500',
  'from-yellow-500 to-orange-500',
  'from-orange-500 to-red-500',
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
];

function getGradient(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// Get a category-relevant image from Unsplash
function getCategoryImage(name: string, id: string) {
  const keyword = encodeURIComponent(name.toLowerCase().split(' ')[0]);
  // Use id hash for consistent but varied images
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://source.unsplash.com/400x300/?${keyword}&sig=${hash}`;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isPrivate: boolean;
  submissionCount: number;
  maxItems: number;
  createdAt: string;
}

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoriesApi.delete(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48">
        <img 
          src="https://source.unsplash.com/1200x400/?collection,favorites,aesthetic" 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-purple-900/60"></div>
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Rankings</h1>
            <p className="text-white/80">Curate and rank your favorites</p>
          </div>
          <Link to="/categories/new" className="btn-primary bg-white text-indigo-600 hover:bg-gray-100">
            + New Category
          </Link>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">No rankings yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first category to start ranking your favorites!
          </p>
          <Link to="/categories/new" className="btn-primary">
            Create Category
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="card hover:shadow-lg transition-all group overflow-hidden relative"
            >
              {/* Category Image */}
              <div className="h-32 overflow-hidden relative">
                <img 
                  src={getCategoryImage(category.name, category.id)} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent`}></div>
                {category.isPrivate && (
                  <span className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private
                  </span>
                )}
              </div>
              <div className="p-4">
              <div className="flex items-start justify-between relative">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(category.id)} flex items-center justify-center text-white text-lg`}>
                    {category.icon || category.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.submissionCount}/{category.maxItems} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteCategory(category.id);
                    }}
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {category.description}
                </p>
              )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
