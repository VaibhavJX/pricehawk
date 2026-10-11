import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link,
  DollarSign,
  Clock,
  Bell,
  Mail,
  MessageCircle,
  Clipboard,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';

const INTERVALS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '3 hr', value: 180 },
  { label: '6 hr', value: 360 },
  { label: '12 hr', value: 720 },
  { label: '24 hr', value: 1440 },
];

const PLATFORM_PATTERNS = [
  { pattern: /amazon\./i, name: 'Amazon', emoji: '📦', color: '#FF9900' },
  { pattern: /flipkart\./i, name: 'Flipkart', emoji: '🛒', color: '#2874F0' },
  { pattern: /myntra\./i, name: 'Myntra', emoji: '👗', color: '#FF3F6C' },
  { pattern: /snapdeal\./i, name: 'Snapdeal', emoji: '🔴', color: '#E40046' },
  { pattern: /meesho\./i, name: 'Meesho', emoji: '🛍️', color: '#9B2177' },
];

const detectPlatform = (url) => {
  if (!url) return null;
  return PLATFORM_PATTERNS.find((p) => p.pattern.test(url)) || null;
};

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * AddTrackerModal — bottom sheet modal for adding a new product tracker.
 */
const AddTrackerModal = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [interval, setInterval] = useState(60);
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    telegram: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  const addProduct = useStore((s) => s.addProduct);
  const urlInputRef = useRef(null);

  const detectedPlatform = detectPlatform(url);
  const urlValid = isValidUrl(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setUrlError('');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  const toggleNotification = (type) => {
    setNotifications((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setUrlError('Please enter a product URL');
      return;
    }
    if (!urlValid) {
      setUrlError('Invalid URL — please enter a full product link');
      return;
    }

    setSubmitting(true);
    try {
      await addProduct({
        url: url.trim(),
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        checkInterval: interval,
        notifications,
      });
      toast.success('Tracker added! We\'ll monitor the price 🎯');
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add tracker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setTargetPrice('');
    setInterval(60);
    setNotifications({ push: true, email: false, telegram: false });
    setUrlError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1c1c1e] rounded-t-apple-xl shadow-apple-xl max-h-[92vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-ios-gray-4 dark:bg-ios-gray-1/40" />
            </div>

            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Track a Product
                  </h2>
                  <p className="text-sm text-ios-gray-1 mt-0.5">
                    Paste a product URL to start monitoring
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-ios-gray-6 dark:bg-ios-gray-1/20 flex items-center justify-center hover:bg-ios-gray-5 transition-colors"
                >
                  <X className="w-4 h-4 text-ios-gray-1" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Product URL
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {detectedPlatform ? (
                        <span className="text-lg">{detectedPlatform.emoji}</span>
                      ) : (
                        <Link className="w-4 h-4 text-ios-gray-2" />
                      )}
                    </div>
                    <input
                      ref={urlInputRef}
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setUrlError('');
                      }}
                      placeholder="https://www.amazon.in/..."
                      className="input-apple pl-10 pr-20 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Clipboard className="w-3 h-3" />
                      Paste
                    </button>
                  </div>

                  {/* Platform detected */}
                  <AnimatePresence>
                    {detectedPlatform && urlValid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 flex items-center gap-2 text-xs text-ios-green font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span
                          className="font-semibold"
                          style={{ color: detectedPlatform.color }}
                        >
                          {detectedPlatform.name}
                        </span>
                        <span className="text-ios-gray-1">product detected</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* URL error */}
                  {urlError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-ios-red"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {urlError}
                    </motion.p>
                  )}
                </div>

                {/* Target Price */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Target Price{' '}
                    <span className="text-ios-gray-1 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-gray-1 text-sm font-medium">
                      ₹
                    </div>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="Notify me when price drops below..."
                      min="0"
                      step="1"
                      className="input-apple pl-7 text-sm"
                    />
                  </div>
                </div>

                {/* Check Interval */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Check Interval
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERVALS.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setInterval(value)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                          interval === value
                            ? 'bg-ios-blue text-white shadow-glow'
                            : 'bg-ios-gray-6 dark:bg-ios-gray-1/20 text-[var(--text-secondary)] hover:bg-ios-gray-5 dark:hover:bg-ios-gray-1/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Toggles */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Alert me via
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'push', icon: Bell, label: 'Push Notification', desc: 'In-app & browser' },
                      { key: 'email', icon: Mail, label: 'Email', desc: 'Sent to your inbox' },
                      { key: 'telegram', icon: MessageCircle, label: 'Telegram', desc: 'Bot message' },
                    ].map(({ key, icon: Icon, label, desc }) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-3 rounded-xl bg-ios-gray-6 dark:bg-ios-gray-1/10 cursor-pointer hover:bg-ios-gray-5 dark:hover:bg-ios-gray-1/20 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-ios-blue" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                          <p className="text-xs text-ios-gray-1">{desc}</p>
                        </div>
                        {/* iOS-style toggle */}
                        <div
                          onClick={() => toggleNotification(key)}
                          className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            notifications[key] ? 'bg-ios-green' : 'bg-ios-gray-4 dark:bg-ios-gray-1/40'
                          }`}
                        >
                          <motion.div
                            animate={{ x: notifications[key] ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={submitting || !url.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary w-full mt-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding Tracker...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Start Tracking
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddTrackerModal;
