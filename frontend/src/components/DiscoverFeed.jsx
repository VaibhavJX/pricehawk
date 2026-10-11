import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Tag, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeals, getCategories } from '../api/discover';
import useStore from '../store/useStore';

const FALLBACK_CATEGORIES = [
  { id: 'all', label: 'All Deals', emoji: '🔥' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'books', label: 'Books', emoji: '📚' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const DealCardSkeleton = () => (
  <div className="bg-white dark:bg-[#1c1c1e] rounded-apple p-3 shadow-apple">
    <div className="skeleton w-full aspect-square rounded-xl mb-3" />
    <div className="skeleton h-3 w-3/4 rounded mb-2" />
    <div className="skeleton h-3 w-1/2 rounded mb-3" />
    <div className="skeleton h-8 w-full rounded-xl" />
  </div>
);

const DealCard = ({ deal, index, onTrack }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const discount = deal.originalPrice && deal.currentPrice
    ? Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100)
    : deal.discountPercent || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
      className="bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-ios-gray-6 dark:bg-ios-gray-1/10 overflow-hidden">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        {deal.image ? (
          <img
            src={deal.image}
            alt={deal.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-ios-red text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
            -{discount}%
          </div>
        )}

        {/* Hot deal indicator */}
        {discount >= 40 && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-ios-orange rounded-full flex items-center justify-center shadow">
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-snug mb-2">
          {deal.name}
        </p>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-[var(--text-primary)]">
            {formatPrice(deal.currentPrice)}
          </span>
          {deal.originalPrice && deal.originalPrice > deal.currentPrice && (
            <span className="text-xs text-ios-gray-2 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          )}
        </div>

        <button
          onClick={() => onTrack(deal)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Track This
        </button>
      </div>
    </motion.div>
  );
};

/**
 * DiscoverFeed — deal discovery grid with animated category tabs.
 */
const DiscoverFeed = ({ onTrackDeal }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const tabsRef = useRef(null);
  const indicatorRef = useRef(null);
  const addProduct = useStore((s) => s.addProduct);

  // Load categories
  useEffect(() => {
    getCategories()
      .then((data) => {
        if (data?.length) setCategories(data);
      })
      .catch(() => {}); // fallback to FALLBACK_CATEGORIES
  }, []);

  // Load deals when category changes
  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const data = await getDeals(activeCategory);
        setDeals(data?.deals || data || []);
      } catch {
        // Use mock deals for demo
        setDeals(getMockDeals(activeCategory));
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, [activeCategory]);

  const handleTrack = async (deal) => {
    if (onTrackDeal) {
      onTrackDeal(deal);
      return;
    }
    try {
      await addProduct({ url: deal.url, targetPrice: null, checkInterval: 60 });
      toast.success('Added to tracker!');
    } catch {
      toast.error('Failed to add tracker');
    }
  };

  const handleRefresh = () => {
    const cat = activeCategory;
    setActiveCategory('__refresh__');
    setTimeout(() => setActiveCategory(cat), 50);
  };

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="relative">
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-ios-blue text-white shadow-glow'
                  : 'bg-white dark:bg-[#1c1c1e] text-[var(--text-secondary)] hover:bg-ios-gray-5 dark:hover:bg-ios-gray-1/20'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-ios-orange" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {loading ? 'Loading deals...' : `${deals.length} deals found`}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-ios-blue font-semibold px-3 py-1.5 rounded-full bg-ios-blue/10 hover:bg-ios-blue/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Deals grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <DealCardSkeleton key={i} />)
          : deals.map((deal, i) => (
              <DealCard
                key={deal.id || deal.url || i}
                deal={deal}
                index={i}
                onTrack={handleTrack}
              />
            ))}
      </div>

      {!loading && deals.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[var(--text-primary)] font-semibold">No deals found</p>
          <p className="text-ios-gray-1 text-sm mt-1">Try a different category</p>
        </div>
      )}
    </div>
  );
};

// Mock deals for demo/fallback
function getMockDeals(category) {
  const base = [
    { id: '1', name: 'Apple AirPods Pro (2nd Gen)', currentPrice: 19990, originalPrice: 26900, image: null, url: '#', discountPercent: 26 },
    { id: '2', name: 'Samsung Galaxy S24 128GB Phantom Black', currentPrice: 64999, originalPrice: 79999, image: null, url: '#', discountPercent: 19 },
    { id: '3', name: 'Sony WH-1000XM5 Wireless Headphones', currentPrice: 24990, originalPrice: 34990, image: null, url: '#', discountPercent: 29 },
    { id: '4', name: 'boAt Airdopes 141 TWS Earbuds', currentPrice: 699, originalPrice: 2990, image: null, url: '#', discountPercent: 77 },
    { id: '5', name: 'Logitech MX Master 3S Mouse', currentPrice: 7495, originalPrice: 10495, image: null, url: '#', discountPercent: 29 },
    { id: '6', name: 'ASUS VivoBook 15 Core i5 Laptop', currentPrice: 45990, originalPrice: 55990, image: null, url: '#', discountPercent: 18 },
    { id: '7', name: 'Kindle Paperwhite (16 GB)', currentPrice: 12999, originalPrice: 17999, image: null, url: '#', discountPercent: 28 },
    { id: '8', name: 'Realme Buds Air 5 Pro', currentPrice: 3499, originalPrice: 6499, image: null, url: '#', discountPercent: 46 },
  ];
  if (category === 'all' || !category || category === '__refresh__') return base;
  return base.slice(0, 4);
}

export default DiscoverFeed;
