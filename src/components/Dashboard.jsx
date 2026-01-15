import React, { useState, useMemo, useEffect } from 'react';
import { Users, User, Presentation, RotateCcw, TrendingUp, Activity, Target, ChevronDown, Check, X } from 'lucide-react';
import BaselineLogo from './BaselineLogo';
import MetricChart from './MetricChart';
import { aggregateBySession } from '../utils/csvParser';

const METRICS_STORAGE_KEY = 'baseline-metrics-preferences';

const loadSavedMetrics = () => {
  try {
    const saved = localStorage.getItem(METRICS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore parse errors, use defaults
  }
  return null;
};

const BLAST_METRICS = [
  { key: 'Bat Speed mph', label: 'Bat Speed', unit: 'mph', category: 'Power' },
  { key: 'Power kW', label: 'Power', unit: 'kW', category: 'Power' },
  { key: 'Peak Hand Speed mph', label: 'Peak Hand Speed', unit: 'mph', category: 'Power' },
  { key: 'Rotational Acceleration g', label: 'Rotational Acceleration', unit: 'g', category: 'Power' },
  { key: 'Attack Angle deg', label: 'Attack Angle', unit: 'deg', category: 'Mechanics' },
  { key: 'Plane Score', label: 'Plane Score', unit: '', category: 'Scores' },
  { key: 'Connection Score', label: 'Connection Score', unit: '', category: 'Scores' },
  { key: 'Rotation Score', label: 'Rotation Score', unit: '', category: 'Scores' },
  { key: 'On Plane Efficiency %', label: 'On Plane Efficiency', unit: '%', category: 'Mechanics' },
  { key: 'Early Connection deg', label: 'Early Connection', unit: 'deg', category: 'Connection' },
  { key: 'Connection at Impact deg', label: 'Connection at Impact', unit: 'deg', category: 'Connection' },
  { key: 'Vertical Bat Angle deg', label: 'Vertical Bat Angle', unit: 'deg', category: 'Mechanics' },
  { key: 'Time to Contact sec', label: 'Time to Contact', unit: 'sec', category: 'Timing' },
  { key: 'Exit Velocity mph', label: 'Exit Velocity (Blast)', unit: 'mph', category: 'Results' },
  { key: 'Launch Angle deg', label: 'Launch Angle (Blast)', unit: 'deg', category: 'Results' },
  { key: 'Estimated Distance feet', label: 'Estimated Distance', unit: 'ft', category: 'Results' },
];

const HITTRAX_METRICS = [
  { key: 'AvgV', label: 'Avg Exit Velocity', unit: 'mph', category: 'Velocity' },
  { key: 'MaxV', label: 'Max Exit Velocity', unit: 'mph', category: 'Velocity' },
  { key: 'Dist', label: 'Distance', unit: 'ft', category: 'Results' },
  { key: 'AVG', label: 'Batting Average', unit: '', category: 'Stats' },
  { key: 'SLG', label: 'Slugging', unit: '', category: 'Stats' },
  { key: 'AB', label: 'At Bats', unit: '', category: 'Counting' },
  { key: 'H', label: 'Hits', unit: '', category: 'Counting' },
  { key: 'EBH', label: 'Extra Base Hits', unit: '', category: 'Counting' },
  { key: 'HR', label: 'Home Runs', unit: '', category: 'Counting' },
  { key: 'HHA', label: 'Hard Hit Average', unit: '', category: 'Stats' },
  { key: 'LPH', label: 'Line Drive Pull %', unit: '', category: 'Batted Ball' },
  { key: 'Points', label: 'Points', unit: '', category: 'Results' },
  { key: 'LD %', label: 'Line Drive %', unit: '%', category: 'Batted Ball' },
  { key: 'FB %', label: 'Fly Ball %', unit: '%', category: 'Batted Ball' },
  { key: 'GB %', label: 'Ground Ball %', unit: '%', category: 'Batted Ball' },
];

const TABS = [
  { id: 'blast', label: 'Blast Motion', icon: Activity },
  { id: 'hittrax', label: 'HitTrax', icon: Target },
];

// Get unique categories
const getCategories = (metrics) => {
  return [...new Set(metrics.map(m => m.category))];
};

const MetricSelector = ({ metrics, selectedMetrics, onToggle, onSelectAll, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const categories = getCategories(metrics);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border rounded-lg text-cream hover:border-primary/50 transition-colors"
      >
        <span>Metrics ({selectedMetrics.length}/{metrics.length})</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-bg-card border border-border rounded-xl shadow-xl z-50 animate-fade-in">
            <div className="sticky top-0 bg-bg-card border-b border-border p-3 flex gap-2">
              <button
                onClick={onSelectAll}
                className="flex-1 px-3 py-1.5 text-sm bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={onClearAll}
                className="flex-1 px-3 py-1.5 text-sm bg-bg-elevated text-light hover:text-cream rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="p-3 space-y-4">
              {categories.map(category => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {metrics
                      .filter(m => m.category === category)
                      .map(metric => (
                        <button
                          key={metric.key}
                          onClick={() => onToggle(metric.key)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            selectedMetrics.includes(metric.key)
                              ? 'bg-primary/20 text-cream'
                              : 'bg-bg-elevated text-light hover:bg-border'
                          }`}
                        >
                          <span className="text-sm">{metric.label}</span>
                          {selectedMetrics.includes(metric.key) && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SelectedMetricTags = ({ metrics, selectedMetrics, onRemove }) => {
  const selected = metrics.filter(m => selectedMetrics.includes(m.key));

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map(metric => (
        <span
          key={metric.key}
          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary-soft text-sm rounded-lg"
        >
          {metric.label}
          <button
            onClick={() => onRemove(metric.key)}
            className="hover:text-cream transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
};

const Dashboard = ({ data, onReset, onPresentationMode }) => {
  const [activeTab, setActiveTab] = useState('blast');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showTrendLines, setShowTrendLines] = useState(true);
  const [viewBySession, setViewBySession] = useState(true);

  // Selected metrics for each tab - load from localStorage if available
  const [selectedBlastMetrics, setSelectedBlastMetrics] = useState(() => {
    const saved = loadSavedMetrics();
    return saved?.blast ?? BLAST_METRICS.slice(0, 6).map(m => m.key);
  });
  const [selectedHittraxMetrics, setSelectedHittraxMetrics] = useState(() => {
    const saved = loadSavedMetrics();
    return saved?.hittrax ?? HITTRAX_METRICS.slice(0, 6).map(m => m.key);
  });

  // Persist metrics selection to localStorage
  useEffect(() => {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify({
      blast: selectedBlastMetrics,
      hittrax: selectedHittraxMetrics
    }));
  }, [selectedBlastMetrics, selectedHittraxMetrics]);

  // Get all players
  const allPlayers = useMemo(() => {
    const players = {};

    data.blast.forEach(p => {
      if (!players[p.playerName]) {
        players[p.playerName] = { playerName: p.playerName, blast: null, hittrax: null };
      }
      players[p.playerName].blast = p;
    });

    data.hittrax.forEach(p => {
      if (!players[p.playerName]) {
        players[p.playerName] = { playerName: p.playerName, blast: null, hittrax: null };
      }
      players[p.playerName].hittrax = p;
    });

    return Object.values(players);
  }, [data]);

  // Set default selected player
  useMemo(() => {
    if (!selectedPlayer && allPlayers.length > 0) {
      setSelectedPlayer(allPlayers[0].playerName);
    }
  }, [allPlayers, selectedPlayer]);

  const currentPlayer = allPlayers.find(p => p.playerName === selectedPlayer);

  const currentData = useMemo(() => {
    if (!currentPlayer) return [];

    const source = activeTab === 'blast' ? currentPlayer.blast : currentPlayer.hittrax;
    if (!source) return [];

    return viewBySession ? aggregateBySession(source.data) : source.data;
  }, [currentPlayer, activeTab, viewBySession]);

  const comparisonPlayers = useMemo(() => {
    return selectedForComparison
      .map(name => {
        const player = allPlayers.find(p => p.playerName === name);
        if (!player) return null;

        const source = activeTab === 'blast' ? player.blast : player.hittrax;
        if (!source) return null;

        return {
          playerName: name,
          data: viewBySession ? aggregateBySession(source.data) : source.data
        };
      })
      .filter(Boolean);
  }, [selectedForComparison, allPlayers, activeTab, viewBySession]);

  const toggleComparison = (playerName) => {
    if (selectedForComparison.includes(playerName)) {
      setSelectedForComparison(prev => prev.filter(n => n !== playerName));
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison(prev => [...prev, playerName]);
    }
  };

  // Current metrics and selection handlers
  const currentMetrics = activeTab === 'blast' ? BLAST_METRICS : HITTRAX_METRICS;
  const selectedMetrics = activeTab === 'blast' ? selectedBlastMetrics : selectedHittraxMetrics;
  const setSelectedMetrics = activeTab === 'blast' ? setSelectedBlastMetrics : setSelectedHittraxMetrics;

  const toggleMetric = (key) => {
    if (selectedMetrics.includes(key)) {
      setSelectedMetrics(prev => prev.filter(k => k !== key));
    } else {
      setSelectedMetrics(prev => [...prev, key]);
    }
  };

  const selectAllMetrics = () => {
    setSelectedMetrics(currentMetrics.map(m => m.key));
  };

  const clearAllMetrics = () => {
    setSelectedMetrics([]);
  };

  const displayedMetrics = currentMetrics.filter(m => selectedMetrics.includes(m.key));

  const hasDataForTab = (tab) => {
    if (comparisonMode) {
      return comparisonPlayers.length > 0;
    }
    if (!currentPlayer) return false;
    return tab === 'blast' ? currentPlayer.blast !== null : currentPlayer.hittrax !== null;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="bg-bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BaselineLogo size="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-cream">Player Analytics</h1>
                <p className="text-sm text-muted">{allPlayers.length} players loaded</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  comparisonMode
                    ? 'bg-primary text-white'
                    : 'bg-bg-elevated text-light hover:text-cream'
                }`}
              >
                {comparisonMode ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {comparisonMode ? 'Comparing' : 'Compare'}
              </button>

              <button
                onClick={onPresentationMode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated text-light hover:text-cream transition-colors"
              >
                <Presentation className="w-4 h-4" />
                Present
              </button>

              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated text-light hover:text-cream transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-bg-card border border-border rounded-xl p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-cream mb-3">
                {comparisonMode ? 'Select Players (max 3)' : 'Select Player'}
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allPlayers.map((player) => (
                  <button
                    key={player.playerName}
                    onClick={() => {
                      if (comparisonMode) {
                        toggleComparison(player.playerName);
                      } else {
                        setSelectedPlayer(player.playerName);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      comparisonMode
                        ? selectedForComparison.includes(player.playerName)
                          ? 'bg-primary text-white'
                          : 'bg-bg-elevated text-light hover:bg-border'
                        : selectedPlayer === player.playerName
                          ? 'bg-primary text-white'
                          : 'bg-bg-elevated text-light hover:bg-border'
                    }`}
                  >
                    <span className="text-sm font-medium">{player.playerName}</span>
                    <div className="flex gap-2 mt-1">
                      {player.blast && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary-soft">
                          Blast
                        </span>
                      )}
                      {player.hittrax && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                          HitTrax
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Options */}
              <div className="mt-6 pt-4 border-t border-border space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTrendLines}
                    onChange={(e) => setShowTrendLines(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-light">Show Trend Lines</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewBySession}
                    onChange={(e) => setViewBySession(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-light">Average by Session</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs and Metric Selector */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex gap-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'bg-bg-card text-light hover:text-cream'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <MetricSelector
                metrics={currentMetrics}
                selectedMetrics={selectedMetrics}
                onToggle={toggleMetric}
                onSelectAll={selectAllMetrics}
                onClearAll={clearAllMetrics}
              />
            </div>

            {/* Selected Metric Tags */}
            <div className="mb-6">
              <SelectedMetricTags
                metrics={currentMetrics}
                selectedMetrics={selectedMetrics}
                onRemove={toggleMetric}
              />
            </div>

            {/* Charts */}
            {hasDataForTab(activeTab) ? (
              displayedMetrics.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {displayedMetrics.map((metric) => (
                    <MetricChart
                      key={metric.key}
                      data={currentData}
                      metric={metric.key}
                      title={metric.label}
                      unit={metric.unit}
                      showTrendLine={showTrendLines && !comparisonMode}
                      comparisonMode={comparisonMode}
                      selectedPlayers={comparisonPlayers}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                  <h3 className="text-cream font-semibold mb-2">No Metrics Selected</h3>
                  <p className="text-muted">
                    Use the "Metrics" dropdown above to select which metrics to display
                  </p>
                </div>
              )
            ) : (
              <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-cream font-semibold mb-2">No Data Available</h3>
                <p className="text-muted">
                  {comparisonMode
                    ? 'Select players with ' + activeTab + ' data to compare'
                    : 'This player does not have ' + activeTab + ' data'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
