import React from 'react';
import {
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Play,
  Camera,
  Film,
  RotateCw,
} from 'lucide-react';
import { MediaItem, SyncQueueState } from '../types/camera';

interface SyncQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncQueueState;
  mediaItems: MediaItem[];
  onTriggerSync: () => void;
  onRetryFailed: () => void;
  onToggleSimulatedOffline: () => void;
}

export const SyncQueueDrawer: React.FC<SyncQueueDrawerProps> = ({
  isOpen,
  onClose,
  syncState,
  mediaItems,
  onTriggerSync,
  onRetryFailed,
  onToggleSimulatedOffline,
}) => {
  if (!isOpen) return null;

  const {
    effectiveOnline,
    isSimulatedOffline,
    isOnline,
    isSyncing,
    pendingCount,
    syncedCount,
    failedCount,
    currentSyncingItem,
  } = syncState;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '---';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Offline Storage & Sync Manager
              </h2>
              <p className="text-[10px] text-zinc-400">
                Local IndexedDB buffer with auto-sync on reconnect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Status & Mode Banner */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 space-y-3 shrink-0">
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  effectiveOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {effectiveOnline ? (
                  <Wifi className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">
                  {effectiveOnline ? 'Device Online' : 'Device Offline / Standalone'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {isSimulatedOffline
                    ? 'Field Simulation: Working offline without network.'
                    : isOnline
                    ? 'Connected to cloud backup pipeline.'
                    : 'No hardware internet connection detected.'}
                </div>
              </div>
            </div>

            {/* Toggle switch for simulated offline */}
            <button
              onClick={onToggleSimulatedOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isSimulatedOffline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/40'
              }`}
            >
              {isSimulatedOffline ? 'Go Online' : 'Work Offline'}
            </button>
          </div>

          {/* Sync Stats Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-lg font-bold font-mono text-amber-400">
                {pendingCount}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                Queued Offline
              </div>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-lg font-bold font-mono text-emerald-400">
                {syncedCount}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                Synced to Cloud
              </div>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-lg font-bold font-mono text-zinc-300">
                {failedCount}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                Failed Syncs
              </div>
            </div>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-1">
            <span>Local Buffer Items ({mediaItems.length})</span>
            {effectiveOnline && pendingCount > 0 && (
              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync All Now'}
              </button>
            )}
          </div>

          {mediaItems.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No photos or videos recorded yet.
            </div>
          ) : (
            mediaItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-700">
                  <img
                    src={item.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    {item.type === 'video' ? (
                      <Film className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-zinc-200" />
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 text-xs truncate">
                      {item.metadata.siteId || 'Site Survey'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {formatFileSize(item.sizeBytes)}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-400 truncate">
                    {item.metadata.timestampStr}
                  </div>

                  {/* Sync Status Badge */}
                  <div className="mt-1 flex items-center gap-1.5">
                    {item.syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Synced to Cloud
                      </span>
                    ) : item.syncStatus === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Uploading...
                      </span>
                    ) : item.syncStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                        <AlertCircle className="w-3 h-3" /> Sync Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Queued Locally
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-400">
            {isSyncing ? (
              <span className="text-cyan-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Uploading queued files...
              </span>
            ) : !effectiveOnline ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <CloudOff className="w-3.5 h-3.5" />
                Queued until connection restores
              </span>
            ) : pendingCount > 0 ? (
              <span>{pendingCount} files ready for upload</span>
            ) : (
              <span className="text-emerald-400">All local data backed up</span>
            )}
          </div>

          <div className="flex gap-2">
            {failedCount > 0 && (
              <button
                onClick={onRetryFailed}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Retry Failed
              </button>
            )}

            {pendingCount > 0 && effectiveOnline && (
              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
