import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { calculateTrendLine } from '../utils/csvParser';

const PLAYER_COLORS = [
  '#cb6b1e', // Primary orange
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-cream text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-light text-sm">
            {entry.name}: <span className="text-cream font-medium">{entry.value?.toFixed(1)}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const MetricChart = ({
  data,
  metric,
  title,
  unit = '',
  showTrendLine = true,
  height = 300,
  comparisonMode = false,
  selectedPlayers = []
}) => {
  const chartData = useMemo(() => {
    if (!comparisonMode) {
      // Single player mode
      return data.map(d => ({
        date: d.dateStr,
        timestamp: d.timestamp,
        value: d[metric]
      })).filter(d => d.value !== null && d.value !== undefined);
    }

    // Comparison mode - combine all players
    const allDates = new Map();

    selectedPlayers.forEach((player, playerIdx) => {
      player.data.forEach(d => {
        const dateKey = d.dateStr;
        if (!allDates.has(dateKey)) {
          allDates.set(dateKey, { date: dateKey, timestamp: d.timestamp });
        }
        allDates.get(dateKey)[`player${playerIdx}`] = d[metric];
      });
    });

    return Array.from(allDates.values())
      .filter(d => selectedPlayers.some((_, idx) => d[`player${idx}`] !== undefined))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, metric, comparisonMode, selectedPlayers]);

  const trendLineData = useMemo(() => {
    if (!showTrendLine || chartData.length < 2) return null;

    if (!comparisonMode) {
      return calculateTrendLine(chartData, 'timestamp', 'value');
    }
    return null;
  }, [chartData, showTrendLine, comparisonMode]);

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <h3 className="text-cream font-semibold mb-4">{title}</h3>
        <div className="h-[200px] flex items-center justify-center text-muted">
          No data available for this metric
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cream font-semibold">{title}</h3>
        {unit && <span className="text-muted text-sm">{unit}</span>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#a3a3a3', fontSize: 12 }}
            tickLine={{ stroke: '#262626' }}
            axisLine={{ stroke: '#262626' }}
          />
          <YAxis
            tick={{ fill: '#a3a3a3', fontSize: 12 }}
            tickLine={{ stroke: '#262626' }}
            axisLine={{ stroke: '#262626' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />

          {!comparisonMode ? (
            <>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#cb6b1e"
                strokeWidth={2}
                dot={{ fill: '#cb6b1e', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#f9a06c', strokeWidth: 0, r: 6 }}
                name={title}
              />
              {trendLineData && (
                <ReferenceLine
                  segment={[
                    { x: chartData[0]?.date, y: trendLineData[0]?.y },
                    { x: chartData[chartData.length - 1]?.date, y: trendLineData[1]?.y }
                  ]}
                  stroke="#f9a06c"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}
            </>
          ) : (
            selectedPlayers.map((player, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`player${idx}`}
                stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: PLAYER_COLORS[idx % PLAYER_COLORS.length], strokeWidth: 0, r: 4 }}
                activeDot={{ strokeWidth: 0, r: 6 }}
                name={player.playerName}
                connectNulls
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricChart;
