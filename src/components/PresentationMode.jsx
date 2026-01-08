import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Settings } from 'lucide-react';
import BaselineLogo from './BaselineLogo';
import MetricChart from './MetricChart';
import { aggregateBySession } from '../utils/csvParser';

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

const PresentationMode = ({ data, onExit }) => {
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Set default player
  useEffect(() => {
    if (!selectedPlayer && allPlayers.length > 0) {
      setSelectedPlayer(allPlayers[0].playerName);
    }
  }, [allPlayers, selectedPlayer]);

  const currentPlayer = allPlayers.find(p => p.playerName === selectedPlayer);

  // Get available metrics for current player
  const availableMetrics = useMemo(() => {
    if (!currentPlayer) return [];

    const metrics = [];
    if (currentPlayer.blast) {
      BLAST_METRICS.forEach(m => metrics.push({ ...m, source: 'blast' }));
    }
    if (currentPlayer.hittrax) {
      HITTRAX_METRICS.forEach(m => metrics.push({ ...m, source: 'hittrax' }));
    }
    return metrics;
  }, [currentPlayer]);

  // Toggle metric selection
  const toggleMetric = (metricKey) => {
    if (selectedMetrics.includes(metricKey)) {
      setSelectedMetrics(prev => prev.filter(k => k !== metricKey));
    } else {
      setSelectedMetrics(prev => [...prev, metricKey]);
    }
  };

  // Get data for current slide
  const slideData = useMemo(() => {
    if (!currentPlayer || selectedMetrics.length === 0) return null;

    const metric = availableMetrics.find(m => m.key === selectedMetrics[currentSlide]);
    if (!metric) return null;

    const source = metric.source === 'blast' ? currentPlayer.blast : currentPlayer.hittrax;
    if (!source) return null;

    return {
      metric,
      data: aggregateBySession(source.data)
    };
  }, [currentPlayer, selectedMetrics, currentSlide, availableMetrics]);

  // Keyboard navigation
  useEffect(() => {
    if (isSetupMode) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, selectedMetrics.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSetupMode, selectedMetrics.length, onExit]);

  // Setup mode
  if (isSetupMode) {
    return (
      <div className="fixed inset-0 bg-bg-base z-50 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <BaselineLogo size="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold text-cream">Presentation Setup</h1>
                <p className="text-muted">Select a player and choose metrics to present</p>
              </div>
            </div>
            <button
              onClick={onExit}
              className="p-2 hover:bg-border rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-muted hover:text-cream" />
            </button>
          </div>

          {/* Player Selection */}
          <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-cream mb-4">Select Player</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allPlayers.map((player) => (
                <button
                  key={player.playerName}
                  onClick={() => {
                    setSelectedPlayer(player.playerName);
                    setSelectedMetrics([]);
                  }}
                  className={`text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedPlayer === player.playerName
                      ? 'bg-primary text-white'
                      : 'bg-bg-elevated text-light hover:bg-border'
                  }`}
                >
                  <span className="font-medium">{player.playerName}</span>
                  <div className="flex gap-2 mt-1">
                    {player.blast && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">Blast</span>
                    )}
                    {player.hittrax && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">HitTrax</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selection */}
          {selectedPlayer && (
            <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-cream mb-4">Select Metrics to Present</h2>

              {currentPlayer?.blast && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
                    Blast Motion
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {BLAST_METRICS.map((metric) => (
                      <button
                        key={metric.key}
                        onClick={() => toggleMetric(metric.key)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                          selectedMetrics.includes(metric.key)
                            ? 'bg-primary text-white'
                            : 'bg-bg-elevated text-light hover:bg-border'
                        }`}
                      >
                        {selectedMetrics.includes(metric.key) && (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{metric.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentPlayer?.hittrax && (
                <div>
                  <h3 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
                    HitTrax
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {HITTRAX_METRICS.map((metric) => (
                      <button
                        key={metric.key}
                        onClick={() => toggleMetric(metric.key)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                          selectedMetrics.includes(metric.key)
                            ? 'bg-primary text-white'
                            : 'bg-bg-elevated text-light hover:bg-border'
                        }`}
                      >
                        {selectedMetrics.includes(metric.key) && (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{metric.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (selectedMetrics.length > 0) {
                  setCurrentSlide(0);
                  setIsSetupMode(false);
                }
              }}
              disabled={selectedMetrics.length === 0}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedMetrics.length > 0
                  ? 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/30'
                  : 'bg-border text-muted cursor-not-allowed'
              }`}
            >
              Start Presentation ({selectedMetrics.length} slides)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Presentation mode
  return (
    <div className="fixed inset-0 bg-bg-deep z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <BaselineLogo size="w-10 h-10" />
          <div>
            <h1 className="text-xl font-bold text-cream">{selectedPlayer}</h1>
            <p className="text-sm text-muted">
              Slide {currentSlide + 1} of {selectedMetrics.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSetupMode(true)}
            className="p-2 hover:bg-border rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-muted hover:text-cream" />
          </button>
          <button
            onClick={onExit}
            className="p-2 hover:bg-border rounded-lg transition-colors"
            title="Exit (Esc)"
          >
            <X className="w-5 h-5 text-muted hover:text-cream" />
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {slideData && (
          <div className="w-full max-w-5xl animate-fade-in">
            <MetricChart
              data={slideData.data}
              metric={slideData.metric.key}
              title={slideData.metric.label}
              unit={slideData.metric.unit}
              showTrendLine={true}
              height={450}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border">
        <button
          onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentSlide === 0
              ? 'bg-border text-muted cursor-not-allowed'
              : 'bg-bg-elevated text-light hover:text-cream'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {/* Slide indicators */}
        <div className="flex gap-2">
          {selectedMetrics.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentSlide ? 'bg-primary' : 'bg-border hover:bg-muted'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide(prev => Math.min(prev + 1, selectedMetrics.length - 1))}
          disabled={currentSlide === selectedMetrics.length - 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentSlide === selectedMetrics.length - 1
              ? 'bg-border text-muted cursor-not-allowed'
              : 'bg-bg-elevated text-light hover:text-cream'
          }`}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center py-2 text-muted text-sm">
        Use arrow keys or spacebar to navigate
      </div>
    </div>
  );
};

export default PresentationMode;
