import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  Package,
  SortAsc,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  BadgePercent,
} from 'lucide-react';
import useStore from '../store/useStore';
import ProductCard from '../components/ProductCard';
import AddTrackerModal from '../components/AddTrackerModal';
import { checkProductNow } from '../api/products';
import toast from 'react-hot-toast';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const SORT_OPTIONS = [
  { id: 'recent', label: 'Recently Added', icon: Clock },
  { id: 'drop', label: 'Price Drop %', icon: TrendingDown },
  { id: 'price_asc', label: 'Price: Low → High', icon: TrendingDown },
  { id: 'price_desc', label: 'Price: High → Low', icon: TrendingUp },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Hawk SVG illustration for empty state
const HawkIllustration = () => (
  <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40 mx-auto opacity-80">
    <ellipse cx="100" cy="160" rx="60" ry="8" fill="rgba(0,122,255,0.08)" />
    <path d="M100 20 C80 40, 50 60, 40 90 C35 110, 45 130, 60 140 C70 147, 90 148, 100 145 C110 148, 130 147, 140 140 C155 130, 165 110, 160 90 C150 60, 120 40, 100 20Z" fill="#E5E5EA" className="dark:fill-[#3a3a3c]" />
    <path d="M100 20 C90 50, 70 70, 60 100 L100 145 L140 100 C130 70, 110 50, 100 20Z" fill="#D1D1D6" className="dark:fill-[#2c2c2e]" />
    <circle cx="82" cy="75" r="8" fill="white" />
    <circle cx="118" cy="75" r="8" fill="white" />
    <circle cx="83" cy="76" r="5" fill="#1c1c1e" />
    <circle cx="119" cy="76" r="5" fill="#1c1c1e" />
    <circle cx="84" cy="75" r="2" fill="white" />
    <circle cx="120" cy="75" r="2" fill="white" />
    <path d="M90 95 Q100 100 110 95" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 70 C20 60, 10 80, 30 90 C40 95, 55 88, 60 80Z" fill="#C7C7CC" className="dark:fill-[#3a3a3c]" />
    <path d="M160 70 C180 60, 190 80, 170 90 C160 95, 145 88, 140 80Z" fill="#C7C7CC" className="dark:fill-[#3a3a3c]" />
    <path d="M85 140 L80 160 M100 145 L100 162 M115 140 L120 160" stroke="#C7C7CC" strokeWidth="3" strokeLinecap="round" className="dark:stroke-[#3a3a3c]" />
    <path d="M78 155 L82 155 M98 157 L102 157 M118 155 L122 155" stroke="#A0A0A5" strokeWidth="2" strokeLinecap="round" />
    <path d="M95 20 C85 5, 70 0, 75 15 C78 22, 90 20, 95 20Z" fill="#FF9500" />
    <path d="M105 20 C115 5, 130 0, 125 15 C122 22, 110 20, 105 20Z" fill="#FF9500" />
    <path d="M96 95 L100 100 L104 95 L100 97Z" fill="#FF9500" />
  </svg>
);

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay }}
    className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple flex items-center gap-3"
  >
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-ios-gray-1 font-medium">{label}</p>
    </div>
  </motion.div>
);

/**
 * Dashboard — main page showing stats, product grid, and empty state.
 */
const Dashboard = () => {
  const products = useStore((s) => s.products);
  const loading = useStore((s) => s.loading);
  const fetchProducts = useStore((s) => s.fetchProducts);
  const removeProduct = useStore((s) => s.removeProduct);
  const user = useStore((s) => s.user);

  const [sortBy, setSortBy] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleCheckNow = useCallback(async (productId) => {
    try {
      await checkProductNow(productId);
      toast.success('Checking price now...');
    } catch {
      toast.error('Failed to trigger check');
    }
  }, []);

  const handleRemove = useCallback(async (productId) => {
    try {
      await removeProduct(productId);
      toast.success('Tracker removed');
    } catch {
      toast.error('Failed to remove tracker');
    }
  }, [removeProduct]);

  // Compute stats
  const activeDrops = products.filter((p) => p.priceChange < 0).length;
  const totalSavings = products.reduce((sum, p) => {
    if (p.priceChange < 0 && p.previousPrice) {
      return sum + (p.previousPrice - p.currentPrice);
    }
    return sum;
  }, 0);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'drop':
        return (a.priceChangePercent || 0) - (b.priceChangePercent || 0);
      case 'price_asc':
        return (a.currentPrice || 0) - (b.currentPrice || 0);
      case 'price_desc':
        return (b.currentPrice || 0) - (a.currentPrice || 0);
      default: // recent
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const currentSort = SORT_OPTIONS.find((s) => s.id === sortBy);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          {getGreeting()} {user?.name ? `${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-ios-gray-1 text-sm mt-0.5">
          {products.length > 0
            ? `You're tracking ${products.length} product${products.length !== 1 ? 's' : ''}`
            : 'Start tracking prices to save money'}
        </p>
      </motion.div>

      {/* Stats Row */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Package} label="Tracked" value={products.length} color="#007AFF" delay={0.05} />
          <StatCard icon={BadgePercent} label="Price Drops" value={activeDrops} color="#34C759" delay={0.1} />
          <StatCard
            icon={TrendingDown}
            label="Total Saved"
            value={totalSavings > 0 ? `₹${(totalSavings / 1000).toFixed(1)}k` : '₹0'}
            color="#FF9500"
            delay={0.15}
          />
        </div>
      )}

      {/* Sort / Filter Bar */}
      {products.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1c1c1e] shadow-apple text-sm font-semibold text-[var(--text-primary)] hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/20 transition-colors"
            >
              <SortAsc className="w-4 h-4 text-ios-blue" />
              {currentSort?.label}
              <Filter className="w-3.5 h-3.5 text-ios-gray-1" />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute left-0 top-11 z-30 w-52 glass dark:bg-[#2c2c2e]/95 rounded-apple shadow-apple-lg overflow-hidden"
                >
                  {SORT_OPTIONS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setSortBy(id); setSortOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors ${
                        sortBy === id
                          ? 'text-ios-blue bg-ios-blue/10'
                          : 'text-[var(--text-primary)] hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-ios-blue font-semibold px-3 py-1.5 rounded-xl bg-ios-blue/10 hover:bg-ios-blue/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {/* Product Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple">
              <div className="flex gap-3">
                <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-4 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-6 w-1/3 rounded" />
                </div>
              </div>
              <div className="skeleton h-px w-full my-3" />
              <div className="skeleton h-6 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      ) : sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sortedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onEdit={() => {}}
                onRemove={handleRemove}
                onCheckNow={handleCheckNow}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <HawkIllustration />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-2">
            Start tracking prices
          </h2>
          <p className="text-ios-gray-1 text-sm max-w-xs mb-8">
            Add a product URL from Amazon, Flipkart, or any supported store and we'll alert you when the price drops.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Your First Tracker
          </motion.button>
        </motion.div>
      )}

      {/* Mobile FAB */}
      {products.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
          onClick={() => setAddModalOpen(true)}
          className="md:hidden fixed bottom-24 right-5 z-30 w-14 h-14 bg-ios-blue rounded-full shadow-apple-lg flex items-center justify-center"
          style={{ boxShadow: '0 4px 24px rgba(0,122,255,0.45)' }}
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>
      )}

      <AddTrackerModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
