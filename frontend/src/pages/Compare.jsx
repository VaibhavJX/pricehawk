import CompareView from '../components/CompareView';
import { motion } from 'framer-motion';
import { GitCompare } from 'lucide-react';

const Compare = () => (
  <div className="space-y-5">
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-ios-teal/15 flex items-center justify-center">
          <GitCompare className="w-4 h-4 text-ios-teal" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Compare Prices</h1>
      </div>
      <p className="text-ios-gray-1 text-sm">
        Paste two product URLs to compare prices, history, and find the best deal.
      </p>
    </motion.div>

    <CompareView />
  </div>
);

export default Compare;
