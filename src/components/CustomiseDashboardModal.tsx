import React from 'react';
import { 
  Sliders, 
  Palette, 
  Layout, 
  Eye, 
  Volume2, 
  RotateCcw, 
  Check, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { DashboardConfig, ThemeKey, Match } from '../types';
import { cricketSound } from '../utils/audio';

interface CustomiseDashboardModalProps {
  config: DashboardConfig;
  updateConfig: (updater: (prev: DashboardConfig) => DashboardConfig) => void;
  matches: Match[];
  onClose: () => void;
}

export const CustomiseDashboardModal: React.FC<CustomiseDashboardModalProps> = ({
  config,
  updateConfig,
  matches,
  onClose,
}) => {
  const themes: { key: ThemeKey; name: string; gradient: string; accent: string }[] = [
    { key: 'emerald', name: 'Emerald Turf', gradient: 'from-emerald-950 to-slate-900', accent: 'bg-emerald-500' },
    { key: 'sapphire', name: 'Sapphire IPL', gradient: 'from-sky-950 to-indigo-950', accent: 'bg-sky-500' },
    { key: 'crimson', name: 'Crimson Heat', gradient: 'from-rose-950 to-slate-900', accent: 'bg-rose-500' },
    { key: 'amber', name: 'Cyber Amber', gradient: 'from-amber-950 to-slate-900', accent: 'bg-amber-500' },
    { key: 'onyx', name: 'Onyx Dark', gradient: 'from-slate-900 to-black', accent: 'bg-slate-400' },
  ];

  const handleThemeChange = (theme: ThemeKey) => {
    updateConfig((prev) => ({ ...prev, theme }));
    if (config.soundEnabled) cricketSound.playClick();
  };

  const handleCardStyleChange = (cardStyle: DashboardConfig['cardStyle']) => {
    updateConfig((prev) => ({ ...prev, cardStyle }));
    if (config.soundEnabled) cricketSound.playClick();
  };

  const handleDensityChange = (density: DashboardConfig['density']) => {
    updateConfig((prev) => ({ ...prev, density }));
    if (config.soundEnabled) cricketSound.playClick();
  };

  const toggleWidget = (widgetKey: keyof DashboardConfig['widgets']) => {
    updateConfig((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetKey]: !prev.widgets[widgetKey],
      },
    }));
    if (config.soundEnabled) cricketSound.playClick();
  };

  const resetDefaults = () => {
    updateConfig((prev) => ({
      ...prev,
      theme: 'emerald',
      cardStyle: 'broadcast',
      density: 'comfortable',
      widgets: {
        heroScorecard: true,
        liveBallTicker: true,
        partnershipBar: true,
        currentOverCard: true,
        commentaryStream: true,
        miniFixturesCarousel: true,
        statsHighlight: true,
        runRateTracker: true,
      },
    }));
    if (config.soundEnabled) cricketSound.playClick();
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Customise Dashboard</h2>
            <p className="text-[11px] text-slate-400">Personalize themes, widgets, layout density, and audio</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Section 1: Themes */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          Stadium Color Theme
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {themes.map((t) => {
            const isSelected = config.theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleThemeChange(t.key)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-white/80 bg-slate-800 shadow-md ring-1 ring-white/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${t.accent} shadow-sm shrink-0 flex items-center justify-center`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />}
                </div>
                <span className="text-xs font-medium text-slate-200 truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Card Layout Style */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Layout className="w-3.5 h-3.5 text-sky-400" />
          Scorecard Presentation
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'broadcast', label: 'Broadcast TV', desc: 'Live Scorebug style' },
            { id: 'detailed', label: 'Detailed', desc: 'Expanded statistics' },
            { id: 'compact', label: 'Compact Strip', desc: 'Minimalist view' },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => handleCardStyleChange(style.id as any)}
              className={`p-2 rounded-xl border text-left transition-all ${
                config.cardStyle === style.id
                  ? 'border-sky-500 bg-sky-950/40 text-white ring-1 ring-sky-500/40'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">{style.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: Layout Density */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Display Density
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleDensityChange('comfortable')}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              config.density === 'comfortable'
                ? 'border-purple-500 bg-purple-950/40 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}
          >
            Comfortable (Spacious)
          </button>
          <button
            onClick={() => handleDensityChange('compact')}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              config.density === 'compact'
                ? 'border-purple-500 bg-purple-950/40 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}
          >
            Compact (Data Dense)
          </button>
        </div>
      </div>

      {/* Section 4: Widget Visibility Checklist */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          Dashboard Widgets (Show / Hide)
        </label>

        <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          {[
            { key: 'heroScorecard', label: 'Hero Live Scoreboard & Target Equation' },
            { key: 'liveBallTicker', label: 'Recent Balls Over Strip (Colored dots)' },
            { key: 'partnershipBar', label: 'Active Batsmen Partnership Meter' },
            { key: 'currentOverCard', label: 'Current Bowler Figures & Over Dots' },
            { key: 'commentaryStream', label: 'Live Ball-by-Ball Commentary Feed' },
            { key: 'miniFixturesCarousel', label: 'Quick Fixtures Carousel' },
            { key: 'runRateTracker', label: 'Run Rate & Over Comparison' },
          ].map((w) => {
            const isChecked = config.widgets[w.key as keyof DashboardConfig['widgets']];
            return (
              <div
                key={w.key}
                onClick={() => toggleWidget(w.key as any)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <span className="text-xs font-medium text-slate-300">{w.label}</span>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 bg-slate-950 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Pinned Match & Preferences */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          Active Highlight Match
        </label>
        <select
          value={config.pinnedMatchId || ''}
          onChange={(e) => {
            updateConfig((prev) => ({ ...prev, pinnedMatchId: e.target.value || null }));
          }}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.teamA.name} vs {m.teamB.name} ({m.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Sound & Frame Toggles */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => {
            updateConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
            if (!config.soundEnabled) cricketSound.playBatHit();
          }}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            config.soundEnabled
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          {config.soundEnabled ? 'Match Audio: ON' : 'Match Audio: MUTE'}
        </button>

        <button
          onClick={() => {
            updateConfig((prev) => ({ ...prev, showAndroidFrame: !prev.showAndroidFrame }));
          }}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            config.showAndroidFrame
              ? 'bg-sky-950/40 border-sky-500/50 text-sky-400'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          {config.showAndroidFrame ? 'Phone Frame: ON' : 'Phone Frame: OFF'}
        </button>
      </div>

      {/* Reset & Apply */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={resetDefaults}
          className="py-2 px-3 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>

        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          Apply Customizations
        </button>
      </div>
    </div>
  );
};
