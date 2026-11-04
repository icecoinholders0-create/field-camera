import React from 'react';
import {
  Settings,
  RotateCcw,
  Grid3X3,
  Zap,
  ZapOff,
  Navigation,
  MapPin,
  Compass,
  FileText,
} from 'lucide-react';
import { GeoData, StampConfig, SyncQueueState } from '../types/camera';
import { formatCoordinates, formatHeading, formatFieldDateTime } from '../utils/geo';
import { SyncStatusBadge } from './SyncStatusBadge';
import { PWAInstallButton } from './PWAInstallButton';

interface CameraHUDProps {
  geoData: GeoData;
  stampConfig: StampConfig;
  syncState: SyncQueueState;
  mapTileCanvas: HTMLCanvasElement | null;
  isRecording: boolean;
  recordingSeconds: number;
  hasTorch: boolean;
  torchActive: boolean;
  showGrid: boolean;
  onToggleTorch: () => void;
  onToggleGrid: () => void;
  onSwitchCamera: () => void;
  onOpenSettings: () => void;
  onOpenQuickNote: () => void;
  onOpenSyncDrawer: () => void;
  onToggleSimulatedOffline: () => void;
  onOpenGoogleMaps?: () => void;
  isSimulatedCamera: boolean;
  onRetryPhysicalCamera: () => void;
}

export const CameraHUD: React.FC<CameraHUDProps> = ({
  geoData,
  stampConfig,
  syncState,
  mapTileCanvas,
  isRecording,
  recordingSeconds,
  hasTorch,
  torchActive,
  showGrid,
  onToggleTorch,
  onToggleGrid,
  onSwitchCamera,
  onOpenSettings,
  onOpenQuickNote,
  onOpenSyncDrawer,
  onToggleSimulatedOffline,
  onOpenGoogleMaps,
  isSimulatedCamera,
  onRetryPhysicalCamera,
}) => {
  const formattedHeading = formatHeading(geoData.heading);
  const currentTimeStr = formatFieldDateTime();

  const formatRecDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Status color for GPS accuracy
  const getGpsStatusColor = () => {
    if (!geoData.isLocked || geoData.accuracy === null) return 'bg-rose-500';
    if (geoData.accuracy <= 10) return 'bg-emerald-400';
    if (geoData.accuracy <= 30) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20 overflow-hidden">
      {/* Simulation banner if physical camera is not active */}
      {isSimulatedCamera && (
        <div className="pointer-events-auto bg-amber-500/90 text-slate-950 px-3 py-1.5 text-xs font-semibold flex items-center justify-between backdrop-blur-sm">
          <span>Simulation Mode: Virtual camera feed active.</span>
          <button
            onClick={onRetryPhysicalCamera}
            className="underline hover:text-black font-bold ml-2 cursor-pointer"
          >
            Switch to Physical Camera
          </button>
        </div>
      )}

      {/* Top Bar HUD */}
      <div
        className="pointer-events-auto flex items-center justify-between px-3.5 pt-3.5 pb-2"
        style={{ color: '#ffffff' }}
      >
        {/* Left actions: Settings, Torch, Notes, Google Maps */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-md hover:bg-black/80 cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>

          <PWAInstallButton variant="hud" />

          {hasTorch && (
            <button
              onClick={onToggleTorch}
              aria-label="Toggle Torch"
              className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer ${
                torchActive ? 'bg-amber-400 text-black border-amber-300' : 'bg-black/60 text-white'
              }`}
            >
              {torchActive ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onOpenQuickNote}
            aria-label="Field Notes"
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-md hover:bg-black/80 cursor-pointer"
            title="Field Observation Notes"
          >
            <FileText className="w-4 h-4 text-amber-300" />
          </button>

          {onOpenGoogleMaps && (
            <button
              onClick={onOpenGoogleMaps}
              aria-label="Google Maps Data"
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center active:scale-95 transition-all shadow-md hover:bg-black/80 cursor-pointer"
              title="Ground Site with Google Maps"
            >
              <MapPin className="w-4 h-4 fill-red-500/20" />
            </button>
          )}
        </div>

        {/* Center: Recording Indicator or Title */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-red-400 shadow-lg animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span className="text-white text-xs font-mono font-bold tracking-wider">
                REC {formatRecDuration(recordingSeconds)}
              </span>
            </div>
          ) : (
            <div className="bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1.2 rounded-full flex items-center gap-1.5 text-white/90 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${getGpsStatusColor()}`} />
              <span>
                {geoData.accuracy !== null ? `±${Math.round(geoData.accuracy)}m` : 'GPS'}
              </span>
              {geoData.isSimulated && <span className="text-amber-400 text-[10px] font-sans">[SIM]</span>}
            </div>
          )}

          {/* Sync Status Badge */}
          <SyncStatusBadge
            syncState={syncState}
            onOpenSyncDrawer={onOpenSyncDrawer}
            onToggleSimulatedOffline={onToggleSimulatedOffline}
          />
        </div>

        {/* Right actions: Grid & Switch Camera */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGrid}
            aria-label="Toggle Reticle Grid"
            className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer ${
              showGrid ? 'bg-amber-400/25 text-amber-300 border-amber-400/50' : 'bg-black/60 text-white'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>

          <button
            onClick={onSwitchCamera}
            aria-label="Switch Camera Facing"
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-md hover:bg-black/80 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offline Alert Strip */}
      {!syncState.effectiveOnline && (
        <div className="pointer-events-auto mx-3.5 mb-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-between text-xs text-amber-200 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-medium">
              Offline Storage Active · Captures saved to local storage ({syncState.pendingCount} queued for cloud upload)
            </span>
          </div>
          <button
            onClick={onToggleSimulatedOffline}
            className="text-[11px] font-bold underline text-amber-300 hover:text-white ml-2 cursor-pointer"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Syncing Progress Strip */}
      {syncState.effectiveOnline && syncState.isSyncing && (
        <div className="pointer-events-auto mx-3.5 mb-1 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 backdrop-blur-md flex items-center justify-between text-xs text-cyan-200 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="font-mono">
              Syncing to Cloud: {syncState.currentSyncingItem ? syncState.currentSyncingItem.siteId : 'Processing'} ({syncState.pendingCount} remaining)
            </span>
          </div>
          <button
            onClick={onOpenSyncDrawer}
            className="text-[11px] font-bold text-cyan-300 hover:underline cursor-pointer"
          >
            View Queue
          </button>
        </div>
      )}

      {/* Grid Reticle Viewfinder Overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/10">
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15 relative flex items-center justify-center">
              {/* Level Horizon & Crosshair */}
              <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
              </div>
              <div className="absolute w-14 h-0.5 bg-white/40"></div>
              <div className="absolute h-14 w-0.5 bg-white/40"></div>
            </div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-white/15"></div>
            <div className="border-r border-white/15"></div>
            <div></div>
          </div>
        </div>
      )}

      {/* Bottom Live Watermark Preview Box */}
      <div className="p-3">
        <div
          className={`pointer-events-none p-2.5 rounded-xl border flex items-end justify-between gap-3 text-left transition-all ${
            stampConfig.backgroundStyle === 'transparent' ||
            stampConfig.backgroundStyle === 'minimal' ||
            stampConfig.backgroundOpacity === 0
              ? 'bg-transparent border-transparent'
              : stampConfig.backgroundStyle === 'solid-dark'
              ? 'bg-slate-950/90 border-white/20 shadow-2xl'
              : stampConfig.backgroundStyle === 'glass'
              ? 'bg-white/10 backdrop-blur-md border-white/30 shadow-xl'
              : 'bg-black/70 backdrop-blur-sm border-white/20 shadow-xl'
          }`}
          style={{
            color: stampConfig.stampColor,
            textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.95)',
          }}
        >
          {/* Text block */}
          <div
            className={`space-y-0.5 leading-snug flex-1 min-w-0 transition-all ${
              (stampConfig.showTextBackdrop ?? true)
                ? 'bg-black/60 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 shadow-lg'
                : 'p-1'
            }`}
          >
            {stampConfig.companyTitle && (
              <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {stampConfig.companyTitle}
              </div>
            )}

            {stampConfig.showSiteDetails && (
              <div className="text-[11px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                <span className="text-amber-300">Site:</span> {stampConfig.siteId || 'N/A'}{' '}
                <span className="text-white/40">|</span> {stampConfig.workStatus}
              </div>
            )}

            {stampConfig.showTechnician && stampConfig.technicianName && (
              <div className="text-[10px] sm:text-[11px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Tech: {stampConfig.technicianName}
              </div>
            )}

            {stampConfig.showDateTime && (
              <div className="text-[10px] sm:text-[11px] font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {currentTimeStr}
              </div>
            )}

            {stampConfig.showAddress && (
              <div className="text-[10px] sm:text-[11px] text-white/95 line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {geoData.address || 'Locating address...'}
              </div>
            )}

            {stampConfig.showCoordinates && (
              <div className="text-[10px] sm:text-[11px] font-mono text-white/90 flex flex-wrap items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                <span>{formatCoordinates(geoData.latitude, geoData.longitude)}</span>
                {geoData.accuracy !== null && (
                  <span className="text-white/60">±{Math.round(geoData.accuracy)}m</span>
                )}
                {stampConfig.showAltitude && geoData.altitude !== null && (
                  <span>· Alt: {Math.round(geoData.altitude)}m</span>
                )}
              </div>
            )}

            {stampConfig.showHeading && (
              <div className="text-[10px] sm:text-[11px] font-mono flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                <Compass className="w-3 h-3 inline-block" />
                <span>{formattedHeading.full}</span>
              </div>
            )}

            {stampConfig.showNotes && stampConfig.customNotes && (
              <div className="text-[10px] sm:text-[11px] text-amber-200 line-clamp-1 italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Note: {stampConfig.customNotes}
              </div>
            )}
          </div>

          {/* Mini-Map Preview Tile */}
          {stampConfig.showMap && (
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-white/60 bg-slate-900 shadow-md relative">
              {mapTileCanvas ? (
                <img
                  src={mapTileCanvas.toDataURL()}
                  alt="Field Location Map"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/40 text-[9px]">
                  <MapPin className="w-4 h-4 text-red-500 mb-0.5 animate-bounce" />
                  <span>Map</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
