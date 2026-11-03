import React from 'react';
import {
  CloudOff,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';
import { SyncQueueState } from '../types/camera';

interface SyncStatusBadgeProps {
  syncState: SyncQueueState;
  onOpenSyncDrawer: () => void;
  onToggleSimulatedOffline: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  syncState,
  onOpenSyncDrawer,
  onToggleSimulatedOffline,
}) => {
  const {
    effectiveOnline,
    isSimulatedOffline,
    isSyncing,
    pendingCount,
    failedCount,
    currentSyncingItem,
  } = syncState;

  return (
    <div className="flex items-center gap-1.5 pointer-events-auto">
      {/* Primary Status Pill */}
      <button
        onClick={onOpenSyncDrawer}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-semibold shadow-lg transition-all cursor-pointer active:scale-95 ${
          !effectiveOnline
            ? 'bg-amber-500/90 hover:bg-amber-500 text-slate-950 border-amber-300'
            : isSyncing
            ? 'bg-cyan-900/90 hover:bg-cyan-900 text-cyan-200 border-cyan-400 animate-pulse'
            : failedCount > 0
            ? 'bg-red-900/90 hover:bg-red-900 text-red-200 border-red-400'
            : pendingCount > 0
            ? 'bg-zinc-900/80 hover:bg-zinc-800 text-amber-300 border-amber-400/50'
            : 'bg-black/60 hover:bg-black/80 text-emerald-400 border-emerald-500/30'
        }`}
        title="Click to view Cloud Upload Queue"
      >
        {!effectiveOnline ? (
          <>
            <CloudOff className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">
              OFFLINE {pendingCount > 0 ? `· ${pendingCount} queued` : ''}
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-cyan-300" />
            <span className="font-mono text-[11px] truncate max-w-[130px]">
              Syncing {currentSyncingItem ? currentSyncingItem.siteId : `${pendingCount} left`}
            </span>
          </>
        ) : failedCount > 0 ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span>{failedCount} failed upload</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
            <span>{pendingCount} queued</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="text-[11px] text-zinc-300">Cloud Synced</span>
          </>
        )}
      </button>

      {/* Quick Offline Simulation Toggle Button */}
      <button
        onClick={onToggleSimulatedOffline}
        aria-label="Toggle offline simulation"
        className={`w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-md ${
          isSimulatedOffline
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20'
            : 'bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-white border-white/20'
        }`}
        title={
          isSimulatedOffline
            ? 'Simulated Offline Mode Active. Click to go Online and sync queued data.'
            : 'Click to simulate Offline Field Mode (test offline capture & queueing).'
        }
      >
        {isSimulatedOffline ? (
          <WifiOff className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <Wifi className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
