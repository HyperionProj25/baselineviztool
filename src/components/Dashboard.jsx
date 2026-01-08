import React, { useState, useMemo } from 'react';
import { Users, User, Presentation, RotateCcw, TrendingUp, Activity, Target } from 'lucide-react';
import BaselineLogo from './BaselineLogo';
import MetricChart from './MetricChart';
import { aggregateBySession } from '../utils/csvParser';

const BLAST_METRICS = [
  { key: 'Bat Speed mph', label: 'Bat Speed', unit: 'mph', category: 'power' },
  { key: 'Power kW', label: 'Power', unit: 'kW', category: 'power' },
  { key: 'Peak Hand Speed mph', label: 'Peak Hand Speed', unit: 'mph', category: 'power' },
  { key: 'Attack Angle deg', label: 'Attack Angle', unit: 'deg', category: 'mechanics' },
  { key: 'Plane Score', label: 'Plane Score', unit: '', category: 'mechanics' },
  { key: 'Connection Score', label: 'Connection Score', unit: '', category: 'mechanics' },
  { key: 'Rotation Score', label: 'Rotation Score', unit: '', category: 'mechanics' },
  { key: 'On Plane Efficiency %', label: 'On Plane Efficiency', unit: '%', category: 'mechanics' },
  { key: 'Time to Contact sec', label: 'Time to Contact', unit: 'sec', category: 'timing' },
  { key: 'Rotational Acceleration g', label: 'Rotational Acceleration', unit: 'g', category: 'power' },
];

const HITTRAX_METRICS = [
  { key: 'AvgV', label: 'Avg Exit Velocity', unit: 'mph', category: 'velocity' },
  { key: 'MaxV', label: 'Max Exit Velocity', unit: 'mph', category: 'velocity' },
  { key: 'Dist', label: 'Distance', unit: 'ft', category: 'results' },
  { key: 'AVG', label: 'Batting Average', unit: '', category: 'results' },
  { key: 'SLG', label: 'Slugging', unit: '', category: 'results' },
  { key: 'LD %', label: 'Line Drive %', unit: '%', category: 'batted_ball' },
  { key: 'FB %', label: 'Fly Ball %', unit: '%', category: 'batted_ball' },
  { key: 'GB %', label: 'Ground Ball %', unit: '%', category: 'batted_ball' },
  { key: 'Points', label: 'Points', unit: '', category: 'results' },
];

const TABS = [
  { id: 'blast', label: 'Blast Motion', icon: Activity },
  { id: 'hittrax', label: 'HitTrax', icon: Target },
];

const Dashboard = ({ data, onReset, onPresentationMode }) => {
  const [activeTab, setActiveTab] = useState('blast');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showTrendLines, setShowTrendLines] = useState(true);
  const [viewBySession, setViewBySession] = useState(true);

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

  const metrics = activeTab === 'blast' ? BLAST_METRICS : HITTRAX_METRICS;

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

              <div className="space-y-2">
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
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
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

            {/* Charts */}
            {hasDataForTab(activeTab) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {metrics.map((metric) => (
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
