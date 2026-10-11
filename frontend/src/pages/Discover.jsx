import DiscoverFeed from '../components/DiscoverFeed';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

const Discover = () => (
  <div className="space-y-5">
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-ios-purple/15 flex items-center justify-center">
          <Compass className="w-4 h-4 text-ios-purple" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Discover Deals</h1>
      </div>
      <p className="text-ios-gray-1 text-sm">
        Top discounts across categories — updated every hour.
      </p>
    </motion.div>

    <DiscoverFeed />
  </div>
);

export default Discover;
