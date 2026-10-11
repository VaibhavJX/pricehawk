import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TimerBadge from './TimerBadge';
import PriceChart from './PriceChart';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const PLATFORM_COLORS = {
  amazon: { bg: '#FF9900', text: '#000' },
  flipkart: { bg: '#2874F0', text: '#fff' },
  myntra: { bg: '#FF3F6C', text: '#fff' },
  snapdeal: { bg: '#E40046', text: '#fff' },
  meesho: { bg: '#9B2177', text: '#fff' },
  default: { bg: '#8E8E93', text: '#fff' },
};

const getPlatformColor = (platform = '') => {
  const key = platform.toLowerCase();
  return PLATFORM_COLORS[key] || PLATFORM_COLORS.default;
};

const ImageSkeleton = () => (
  <div className="w-full h-full skeleton rounded-xl" />
);

/**
 * ProductCard — Apple-style card showing product info, price change, timer, and mini chart.
 */
const ProductCard = ({ product, index = 0, onEdit, onRemove, onCheckNow }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef(null);

  const {
    id,
    name,
    image,
    currentPrice,
    previousPrice,
    targetPrice,
    platform,
    nextCheckAt,
    checkInterval,
    priceChange,
    priceChangePercent,
    history = [],
  } = product;

  const isPriceDrop = priceChange < 0;
  const isPriceRise = priceChange > 0;
  const isUnchanged = priceChange === 0 || priceChange == null;

  const platformColor = getPlatformColor(platform);

  const handleMenuAction = (action) => {
    setMenuOpen(false);
    if (action === 'edit') onEdit?.(product);
    if (action === 'remove') onRemove?.(id);
    if (action === 'check') onCheckNow?.(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: index * 0.06,
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
      className={`relative bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden cursor-pointer select-none ${
        isPriceDrop ? 'ring-1 ring-ios-green/20' : ''
      }`}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Price drop glow */}
      {isPriceDrop && (
        <div className="absolute inset-0 rounded-apple pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgba(52,199,89,0.3)' }}
        />
      )}

      <div className="p-4">
        <div className="flex gap-3">
          {/* Product Image */}
          <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-ios-gray-6 dark:bg-ios-gray-1/10">
            {!imgLoaded && <ImageSkeleton />}
            {image && (
              <img
                src={image}
                alt={name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
            {!image && imgLoaded === false && (
              <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Platform badge */}
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md mb-1"
                  style={{ background: platformColor.bg, color: platformColor.text }}
                >
                  {platform || 'Unknown'}
                </span>

                {/* Product name */}
                <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {name}
                </p>
              </div>

              {/* Three-dot menu */}
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/20 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-ios-gray-1" />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-9 z-50 w-44 glass dark:bg-[#2c2c2e]/95 rounded-apple shadow-apple-lg overflow-hidden"
                    >
                      {[
                        { icon: Edit3, label: 'Edit Target', action: 'edit' },
                        { icon: RefreshCw, label: 'Check Now', action: 'check' },
                        { icon: ExternalLink, label: 'Open Link', action: 'open' },
                        { icon: Trash2, label: 'Remove', action: 'remove', danger: true },
                      ].map(({ icon: Icon, label, action, danger }) => (
                        <button
                          key={action}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (action === 'open') {
                              window.open(product.url, '_blank');
                              setMenuOpen(false);
                            } else {
                              handleMenuAction(action);
                            }
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors ${
                            danger
                              ? 'text-ios-red hover:bg-ios-red/10'
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
            </div>

            {/* Price row */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {formatPrice(currentPrice)}
              </span>

              {/* Price change badge */}
              {!isUnchanged && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                    isPriceDrop
                      ? 'bg-ios-green/15 text-ios-green'
                      : 'bg-ios-red/15 text-ios-red'
                  }`}
                  style={isPriceDrop ? { boxShadow: '0 0 12px rgba(52,199,89,0.25)' } : {}}
                >
                  {isPriceDrop ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {Math.abs(priceChangePercent || 0).toFixed(1)}%
                </motion.span>
              )}

              {isUnchanged && (
                <span className="flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-ios-gray-5 dark:bg-ios-gray-1/20 text-ios-gray-1">
                  <Minus className="w-3 h-3" />
                  Unchanged
                </span>
              )}
            </div>

            {/* Previous price */}
            {previousPrice && previousPrice !== currentPrice && (
              <p className="text-xs text-ios-gray-1 mt-0.5">
                was{' '}
                <span className="line-through">{formatPrice(previousPrice)}</span>
                {isPriceDrop && (
                  <span className="text-ios-green font-semibold ml-1">
                    Save {formatPrice(Math.abs(currentPrice - previousPrice))}!
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Timer + expand */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ios-gray-5 dark:border-ios-gray-1/10">
          <TimerBadge nextCheckAt={nextCheckAt} intervalMinutes={checkInterval} />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((e) => !e);
            }}
            className="flex items-center gap-1 text-xs text-ios-gray-1 hover:text-ios-blue transition-colors"
          >
            {expanded ? (
              <>
                Hide chart <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Price history <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable mini chart */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <PriceChart
                data={history}
                targetPrice={targetPrice}
                compact={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductCard;
