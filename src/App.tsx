import React, { useState, useEffect } from 'react';
import { Match, DashboardConfig, AppTab } from './types';
import { INITIAL_MATCHES, DEFAULT_DASHBOARD_CONFIG } from './data/mockData';
import { AndroidFrame } from './components/AndroidFrame';
import { DashboardView } from './components/DashboardView';
import { BallByBallScorer } from './components/BallByBallScorer';
import { FixMatchesModal } from './components/FixMatchesModal';
import { CustomiseDashboardModal } from './components/CustomiseDashboardModal';
import { ScorecardModal } from './components/ScorecardModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { InstallAppModal } from './components/InstallAppModal';
import { CustomTeamsModal } from './components/CustomTeamsModal';
import { GoogleAccountModal } from './components/GoogleAccountModal';

const STORAGE_KEY_MATCHES = 'criclive_matches_v1';
const STORAGE_KEY_CONFIG = 'criclive_dashboard_config_v1';

export default function App() {
  // Load matches from localStorage or default seed
  const [matches, setMatches] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved matches', e);
        }
      }
    }
    return INITIAL_MATCHES;
  });

  // Load dashboard configuration
  const [config, setConfig] = useState<DashboardConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        try {
          return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse saved config', e);
        }
      }
    }
    return DEFAULT_DASHBOARD_CONFIG;
  });

  // Active match selection
  const [activeMatchId, setActiveMatchId] = useState<string>(() => {
    return matches[0]?.id || 'match-ind-pak-live';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.warn('Storage quota exceeded for matches', e);
    }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Storage quota exceeded for config', e);
    }
  }, [config]);

  // Current active match
  const activeMatch = matches.find((m) => m.id === activeMatchId) || matches[0] || null;

  // Handler to update active match state (e.g. ball recorded, wicket, over end)
  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
    );
  };

  // Handler to create/schedule a fixed match
  const handleCreateMatch = (newMatch: Match) => {
    setMatches((prev) => [newMatch, ...prev]);
    setActiveMatchId(newMatch.id);
  };

  // Handler to delete a match
  const handleDeleteMatch = (matchId: string) => {
    setMatches((prev) => {
      const filtered = prev.filter((m) => m.id !== matchId);
      if (activeMatchId === matchId && filtered.length > 0) {
        setActiveMatchId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    setActiveTab('dashboard');
  };

  const handleImportMatch = (importedMatch: Match) => {
    setMatches((prev) => {
      const exists = prev.some((m) => m.id === importedMatch.id);
      if (exists) {
        return prev.map((m) => (m.id === importedMatch.id ? importedMatch : m));
      }
      return [importedMatch, ...prev];
    });
    setActiveMatchId(importedMatch.id);
    setActiveTab('dashboard');
  };

  const handleImportAllMatches = (importedMatches: Match[]) => {
    if (Array.isArray(importedMatches) && importedMatches.length > 0) {
      setMatches(importedMatches);
      setActiveMatchId(importedMatches[0].id);
    }
    setActiveTab('dashboard');
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      config={config}
      updateConfig={setConfig}
      activeMatch={activeMatch}
      onOpenFixModal={() => setActiveTab('fixtures')}
    >
      {/* Dynamic Tab Views */}
      {activeTab === 'dashboard' && (
        <DashboardView
          match={activeMatch}
          allMatches={matches}
          config={config}
          onSelectMatch={(id) => setActiveMatchId(id)}
          onNavigateToScorer={() => setActiveTab('scorer')}
          onOpenFixModal={() => setActiveTab('fixtures')}
          onOpenCustomise={() => setActiveTab('customize')}
          onOpenScorecard={() => setActiveTab('scorecard')}
          onOpenDrive={() => setActiveTab('drive')}
          onOpenInstall={() => setActiveTab('install')}
          onOpenTeams={() => setActiveTab('custom_teams')}
          onOpenAccount={() => setActiveTab('account')}
        />
      )}

      {activeTab === 'scorer' && activeMatch && (
        <BallByBallScorer
          match={activeMatch}
          onUpdateMatch={handleUpdateMatch}
          config={config}
          onOpenScorecard={() => setActiveTab('scorecard')}
        />
      )}

      {activeTab === 'fixtures' && (
        <FixMatchesModal
          matches={matches}
          activeMatchId={activeMatchId}
          onSelectMatch={handleSelectMatch}
          onCreateMatch={handleCreateMatch}
          onDeleteMatch={handleDeleteMatch}
          onUpdateMatch={handleUpdateMatch}
          onClose={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'customize' && (
        <CustomiseDashboardModal
          config={config}
          updateConfig={setConfig}
          matches={matches}
          onClose={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'scorecard' && activeMatch && (
        <ScorecardModal
          match={activeMatch}
          onClose={() => setActiveTab('dashboard')}
          onExportToDrive={() => setActiveTab('drive')}
        />
      )}

      {activeTab === 'drive' && (
        <GoogleDriveModal
          currentMatch={activeMatch}
          allMatches={matches}
          onImportMatch={handleImportMatch}
          onImportAllMatches={handleImportAllMatches}
          onClose={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'install' && (
        <InstallAppModal
          onClose={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'custom_teams' && (
        <CustomTeamsModal
          onClose={() => setActiveTab('dashboard')}
          onSelectTeamForMatch={() => {
            setActiveTab('fixtures');
          }}
        />
      )}

      {activeTab === 'account' && (
        <GoogleAccountModal
          onClose={() => setActiveTab('dashboard')}
          onOpenDrive={() => setActiveTab('drive')}
        />
      )}
    </AndroidFrame>
  );
}
