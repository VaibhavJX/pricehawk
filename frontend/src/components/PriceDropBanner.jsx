import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

/**
 * PriceDropBanner — animated banner that slides down from the top
 * when a WebSocket price drop event arrives. Auto-dismisses after 8s.
 */
const PriceDropBanner = () => {
  const priceDrop = useStore((s) => s.priceDrop);
  const clearPriceDrop = useStore((s) => s.clearPriceDrop);
  const navigate = useNavigate();

  useEffect(() => {
    if (!priceDrop) return;
    const timer = setTimeout(() => clearPriceDrop(), 8000);
    return () => clearTimeout(timer);
  }, [priceDrop, clearPriceDrop]);

  const handleView = () => {
    clearPriceDrop();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {priceDrop && (
        <motion.div
          key="price-drop-banner"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed top-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-lg"
          style={{ translateX: '-50%' }}
        >
          <div
            className="relative rounded-apple overflow-hidden shadow-apple-xl"
            style={{
              background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
            }}
          >
            {/* Frosted overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

            <div className="relative flex items-center gap-4 p-4 pr-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">
                  🎉 Price Drop Alert!
                </p>
                <p className="text-white/90 text-xs mt-0.5 truncate font-medium">
                  {priceDrop.productName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white font-bold text-base">
                    {formatPrice(priceDrop.currentPrice)}
                  </span>
                  <span className="text-white/70 text-xs line-through">
                    {formatPrice(priceDrop.previousPrice)}
                  </span>
                  <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    -{Math.abs(priceDrop.priceChangePercent).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleView}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  View
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={clearPriceDrop}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              className="h-0.5 bg-white/40"
              initial={{ scaleX: 1, originX: 0 }}
              animate={{ scaleX: 0, originX: 0 }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PriceDropBanner;
