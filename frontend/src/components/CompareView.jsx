import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Trophy,
  TrendingDown,
  Star,
  Truck,
  RotateCcw,
  MessageSquare,
  CheckCircle,
  Loader2,
  Link,
  ChevronDown,
  X,
} from 'lucide-react';
import useStore from '../store/useStore';
import PriceChart from './PriceChart';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const isValidUrl = (str) => {
  try { new URL(str); return true; } catch { return false; }
};

/**
 * ProductSelector — pick a product by URL or from the tracked list.
 */
const ProductSelector = ({ slot, label, trackedProducts, onSelect, selected, onClear }) => {
  const [urlInput, setUrlInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  if (selected) {
    return (
      <div className="bg-ios-gray-6 dark:bg-ios-gray-1/10 rounded-apple p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1c1c1e] overflow-hidden flex-shrink-0">
            {selected.image ? (
              <img src={selected.image} alt={selected.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{selected.name}</p>
            <p className="text-lg font-bold text-ios-blue">{formatPrice(selected.currentPrice)}</p>
          </div>
          <button onClick={onClear} className="w-7 h-7 rounded-full bg-ios-gray-5 dark:bg-ios-gray-1/20 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-ios-gray-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ios-gray-1">{label}</p>

      {/* URL input */}
      <div className="relative">
        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-gray-2" />
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste product URL..."
          className="input-apple pl-9 text-sm"
        />
      </div>

      {urlInput && isValidUrl(urlInput) && (
        <button
          onClick={() => onSelect({ url: urlInput, name: urlInput, currentPrice: null, isUrl: true })}
          className="btn-primary w-full py-2.5 text-sm"
        >
          Use this URL
        </button>
      )}

      {/* Or pick from tracked */}
      {trackedProducts?.length > 0 && (
        <div>
          <button
            onClick={() => setShowDropdown((o) => !o)}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-ios-gray-6 dark:bg-ios-gray-1/10 text-sm text-[var(--text-secondary)] font-medium hover:bg-ios-gray-5 transition-colors"
          >
            <span className="flex-1 text-left">Pick from tracked products</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {trackedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { onSelect(p); setShowDropdown(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-ios-gray-6 dark:bg-ios-gray-1/10 hover:bg-ios-blue/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1c1c1e] overflow-hidden flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : <span className="text-sm flex items-center justify-center h-full">🛍️</span>}
                      </div>
                      <span className="flex-1 text-xs font-medium text-[var(--text-primary)] line-clamp-1">{p.name}</span>
                      <span className="text-xs font-bold text-ios-blue flex-shrink-0">{formatPrice(p.currentPrice)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

/**
 * ComparisonRow — single row in the feature comparison table.
 */
const ComparisonRow = ({ label, icon: Icon, valueA, valueB, higherIsBetter = true }) => {
  const numA = parseFloat(String(valueA).replace(/[^0-9.]/g, ''));
  const numB = parseFloat(String(valueB).replace(/[^0-9.]/g, ''));
  const aWins = !isNaN(numA) && !isNaN(numB) && (higherIsBetter ? numA > numB : numA < numB);
  const bWins = !isNaN(numA) && !isNaN(numB) && (higherIsBetter ? numB > numA : numB < numA);

  return (
    <div className="grid grid-cols-3 gap-2 py-3 border-b border-ios-gray-5 dark:border-ios-gray-1/10 last:border-none">
      <div className="flex items-center gap-2 text-xs font-medium text-ios-gray-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div className={`text-center text-sm font-semibold ${aWins ? 'text-ios-green' : 'text-[var(--text-primary)]'}`}>
        {valueA || '—'}
        {aWins && <CheckCircle className="w-3 h-3 inline ml-1 text-ios-green" />}
      </div>
      <div className={`text-center text-sm font-semibold ${bWins ? 'text-ios-green' : 'text-[var(--text-primary)]'}`}>
        {valueB || '—'}
        {bWins && <CheckCircle className="w-3 h-3 inline ml-1 text-ios-green" />}
      </div>
    </div>
  );
};

/**
 * CompareView — side-by-side product comparison with chart overlay.
 */
const CompareView = () => {
  const products = useStore((s) => s.products);
  const compareResult = useStore((s) => s.compareResult);
  const compareLoading = useStore((s) => s.compareLoading);
  const runCompare = useStore((s) => s.runCompare);
  const clearCompare = useStore((s) => s.clearCompare);

  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!productA || !productB) {
      setError('Please select both products to compare');
      return;
    }
    setError('');
    try {
      await runCompare({
        urlA: productA.url || productA.isUrl ? productA.url : undefined,
        urlB: productB.url || productB.isUrl ? productB.url : undefined,
        idA: productA.id,
        idB: productB.id,
      });
    } catch {
      setError('Failed to compare products. Please try again.');
    }
  };

  const result = compareResult;
  const winner = result?.winner; // 'a' | 'b' | 'tie'
  const savings = result
    ? Math.abs((result.productA?.currentPrice || 0) - (result.productB?.currentPrice || 0))
    : 0;

  return (
    <div className="space-y-6">
      {/* Selector grid */}
      {!result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple">
            <ProductSelector
              slot="a"
              label="Product A"
              trackedProducts={products}
              selected={productA}
              onSelect={setProductA}
              onClear={() => setProductA(null)}
            />
          </div>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple">
            <ProductSelector
              slot="b"
              label="Product B"
              trackedProducts={products}
              selected={productB}
              onSelect={setProductB}
              onClear={() => setProductB(null)}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-ios-red text-sm font-medium">{error}</p>
      )}

      {!result && (
        <motion.button
          onClick={handleCompare}
          disabled={compareLoading || !productA || !productB}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full"
        >
          {compareLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Comparing...</>
          ) : (
            <><ArrowLeftRight className="w-5 h-5" /> Compare Products</>
          )}
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            {/* Winner Banner */}
            {winner !== 'tie' && savings > 0 && (
              <div className="flex items-center gap-3 bg-ios-green/10 border border-ios-green/20 rounded-apple p-4">
                <Trophy className="w-6 h-6 text-ios-green flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-ios-green">
                    Product {winner?.toUpperCase()} is the better deal!
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Saves you {formatPrice(savings)} compared to the other option.
                  </p>
                </div>
              </div>
            )}

            {/* Side-by-side products */}
            <div className="grid grid-cols-2 gap-3">
              {[result.productA, result.productB].map((p, idx) => {
                const isWinner = (idx === 0 && winner === 'a') || (idx === 1 && winner === 'b');
                return (
                  <div
                    key={idx}
                    className={`bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple transition-all ${
                      isWinner ? 'ring-2 ring-ios-green' : ''
                    }`}
                  >
                    {isWinner && (
                      <div className="flex items-center gap-1 text-xs font-bold text-ios-green mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Best Value
                      </div>
                    )}
                    <div className="w-full aspect-square max-h-28 overflow-hidden rounded-xl bg-ios-gray-6 dark:bg-ios-gray-1/10 mb-3 flex items-center justify-center">
                      {p?.image ? (
                        <img src={p.image} alt={p?.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-3xl">🛍️</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 mb-1">
                      {p?.name || '—'}
                    </p>
                    <p className="text-lg font-bold text-ios-blue">
                      {p?.currentPrice ? formatPrice(p.currentPrice) : '—'}
                    </p>
                    <p className="text-[10px] text-ios-gray-1 capitalize mt-0.5">{p?.platform}</p>
                  </div>
                );
              })}
            </div>

            {/* Combined Chart */}
            {result.historyA?.length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1e] rounded-apple p-4 shadow-apple">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Price History Comparison</h3>
                <PriceChart
                  data={result.historyA}
                  compareData={result.historyB}
                  productAName={result.productA?.name?.slice(0, 20) + '...' || 'Product A'}
                  productBName={result.productB?.name?.slice(0, 20) + '...' || 'Product B'}
                />
              </div>
            )}

            {/* Feature Table */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-apple shadow-apple overflow-hidden">
              <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-ios-gray-6 dark:bg-ios-gray-1/10 border-b border-ios-gray-5 dark:border-ios-gray-1/10">
                <span className="text-xs font-semibold text-ios-gray-1">Feature</span>
                <span className="text-xs font-semibold text-center text-[var(--text-primary)]">Product A</span>
                <span className="text-xs font-semibold text-center text-[var(--text-primary)]">Product B</span>
              </div>
              <div className="px-4">
                <ComparisonRow label="Price" icon={TrendingDown} valueA={formatPrice(result.productA?.currentPrice)} valueB={formatPrice(result.productB?.currentPrice)} higherIsBetter={false} />
                <ComparisonRow label="Rating" icon={Star} valueA={result.productA?.rating} valueB={result.productB?.rating} higherIsBetter={true} />
                <ComparisonRow label="Reviews" icon={MessageSquare} valueA={result.productA?.reviewCount} valueB={result.productB?.reviewCount} higherIsBetter={true} />
                <ComparisonRow label="Delivery" icon={Truck} valueA={result.productA?.delivery} valueB={result.productB?.delivery} higherIsBetter={false} />
                <ComparisonRow label="Returns" icon={RotateCcw} valueA={result.productA?.returnPolicy} valueB={result.productB?.returnPolicy} higherIsBetter={true} />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => { clearCompare(); setProductA(null); setProductB(null); }}
              className="w-full py-3 text-sm font-semibold text-ios-blue hover:opacity-80 transition-opacity"
            >
              Compare Different Products
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompareView;
