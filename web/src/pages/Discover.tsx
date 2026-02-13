import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedApi } from '../services/api';
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
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://source.unsplash.com/400x300/?${keyword}&sig=${hash}`;
}


interface TrendingItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  likeCount: number;
  category: { id: string; name: string };
  user: { username: string; displayName: string };
}

interface DiscoverCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  submissionCount: number;
  totalLikes: number;
  user: { username: string; displayName: string };
}

export default function Discover() {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<DiscoverCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'discover'>('trending');
  const [period, setPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [trendingRes, discoverRes] = await Promise.all([
        feedApi.trending(period, 20),
        feedApi.discover(20)
      ]);
      setTrending(trendingRes.data);
      setCategories(discoverRes.data);
    } catch (error) {
      toast.error('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;

    try {
      const response = await feedApi.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-40">
        <img 
          src="https://source.unsplash.com/1200x400/?explore,discover,travel" 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-pink-900/60"></div>
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
            <p className="text-white/80">Explore trending rankings from the community</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length < 2) setSearchResults(null);
            }}
            className="input pl-10"
            placeholder="Search rankings and categories..."
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {/* Search Results */}
      {searchResults && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Search Results</h2>
            <button onClick={() => setSearchResults(null)} className="text-sm text-gray-500 hover:text-gray-700">
              Clear
            </button>
          </div>
          
          {searchResults.categories?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {searchResults.categories.map((cat: any) => (
                  <Link key={cat.id} to={`/categories/${cat.id}`} className="card p-4 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(cat.id)} flex items-center justify-center text-white`}>
                        {cat.icon || cat.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">{cat.name}</h4>
                        <p className="text-sm text-gray-500">@{cat.username} · {cat.submissionCount} items</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchResults.submissions?.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Items</h3>
              <div className="space-y-2">
                {searchResults.submissions.map((sub: any) => (
                  <Link key={sub.id} to={`/categories/${sub.categoryId}`} className="card p-4 flex items-center gap-4 hover:shadow-md">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(sub.id)} flex items-center justify-center text-white font-bold`}>
                      #{sub.rank}
                    </div>
                    <div>
                      <h4 className="font-medium">{sub.title}</h4>
                      <p className="text-sm text-gray-500">{sub.categoryName} · @{sub.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!searchResults.categories?.length && !searchResults.submissions?.length && (
            <p className="text-gray-500 text-center py-8">No results found</p>
          )}
        </div>
      )}

      {/* Tabs */}
      {!searchResults && (
        <>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('trending')}
              className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'trending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔥 Trending
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'discover' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ✨ Discover
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : activeTab === 'trending' ? (
            <div>
              <div className="flex gap-2 mb-4">
                {['day', 'week', 'month'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      period === p ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {trending.map((item) => (
                  <Link key={item.id} to={`/categories/${item.category.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradient(item.id)} flex items-center justify-center text-white font-bold text-lg`}>
                        {item.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {item.category.name} · @{item.user.username}
                      </p>
                    </div>
                    <span className="text-primary-600">❤️ {item.likeCount}</span>
                  </Link>
                ))}
                {trending.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No trending items yet</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/categories/${cat.id}`} className="card hover:shadow-lg overflow-hidden group">
                  {/* Category Image */}
                  <div className="h-32 overflow-hidden relative">
                    <img 
                      src={getCategoryImage(cat.name, cat.id)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                      <span className="text-2xl drop-shadow">{cat.icon || '📁'}</span>
                      <span className="text-white font-semibold drop-shadow">{cat.name}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">@{cat.user.username}</p>
                    {cat.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{cat.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{cat.submissionCount} items</span>
                      <span>❤️ {cat.totalLikes}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 text-center py-8 col-span-full">No categories to discover yet</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
