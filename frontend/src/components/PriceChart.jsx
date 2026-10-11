import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-apple px-3 py-2.5 shadow-apple-lg border border-white/20 dark:border-white/10">
      <p className="text-xs text-ios-gray-1 dark:text-ios-gray-3 mb-1 font-medium">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name ? `${entry.name}: ` : ''}{formatPrice(entry.value)}
        </p>
      ))}
    </div>
  );
};

/**
 * PriceChart — Recharts AreaChart for product price history.
 * @param {Array} data - Array of { date, price } objects
 * @param {number|null} targetPrice - Optional target price for reference line
 * @param {boolean} compact - If true, shows compact version for product cards
 * @param {Array|null} compareData - Second dataset for comparison mode
 * @param {string} compareColor - Color for the second line
 */
const PriceChart = ({
  data = [],
  targetPrice = null,
  compact = false,
  compareData = null,
  compareColor = '#AF52DE',
  productAName = 'Product A',
  productBName = 'Product B',
}) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const base = data.map((d) => ({
      date: d.date || d.timestamp,
      price: d.price || d.currentPrice,
      displayDate: (() => {
        try {
          const parsed = typeof d.date === 'string' ? parseISO(d.date) : new Date(d.date || d.timestamp);
          return format(parsed, compact ? 'MMM d' : 'MMM d, yyyy');
        } catch {
          return d.date || '';
        }
      })(),
    }));

    if (compareData?.length) {
      return base.map((point, i) => ({
        ...point,
        priceA: point.price,
        priceB: compareData[i]?.price || compareData[i]?.currentPrice || null,
      }));
    }

    return base;
  }, [data, compareData, compact]);

  const isCompare = Boolean(compareData?.length);

  if (!chartData.length) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'h-16' : 'h-48'} text-ios-gray-2 text-sm`}>
        No history data yet
      </div>
    );
  }

  const height = compact ? 70 : 220;
  const marginBottom = compact ? 5 : 30;

  return (
    <div style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: compact ? 0 : 16, left: compact ? -20 : 0, bottom: marginBottom }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="comparePriceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={compareColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={compareColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {!compact && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(142,142,147,0.15)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: compact ? 9 : 11, fill: '#8E8E93' }}
            axisLine={false}
            tickLine={false}
            interval={compact ? 'preserveStartEnd' : 'preserveEnd'}
          />

          {!compact && (
            <YAxis
              tick={{ fontSize: 11, fill: '#8E8E93' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              width={45}
            />
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,122,255,0.3)', strokeWidth: 1.5 }} />

          {isCompare && !compact && (
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}

          {/* Target price reference line */}
          {targetPrice && !compact && (
            <ReferenceLine
              y={targetPrice}
              stroke="#34C759"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Target: ${formatPrice(targetPrice)}`,
                fill: '#34C759',
                fontSize: 11,
                position: 'insideTopRight',
              }}
            />
          )}

          {isCompare ? (
            <>
              <Area
                type="monotone"
                dataKey="priceA"
                name={productAName}
                stroke="#007AFF"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="priceB"
                name={productBName}
                stroke={compareColor}
                strokeWidth={2}
                fill="url(#comparePriceGradient)"
                dot={false}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="price"
              stroke="#007AFF"
              strokeWidth={compact ? 1.5 : 2.5}
              fill="url(#priceGradient)"
              dot={false}
              animationDuration={900}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
