import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Trash2,
  Play,
  Film,
  Camera,
  MapPin,
  Calendar,
  Compass,
  User,
  Building,
  CheckCircle,
  Copy,
  Check,
  Cloud,
  CloudOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { MediaItem } from '../types/camera';
import { formatCoordinates, formatHeading } from '../utils/geo';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onOpenSyncQueue?: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onDeleteItem,
  onClearAll,
  onOpenSyncQueue,
}) => {
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const filteredItems = mediaItems.filter((item) => {
    if (filter === 'photo') return item.type === 'photo';
    if (filter === 'video') return item.type === 'video';
    return true;
  });

  const handleDownload = (item: MediaItem) => {
    const a = document.createElement('a');
    a.href = item.previewUrl;
    const dateFormatted = new Date(item.timestamp).toISOString().replace(/[:.]/g, '-');
    const ext = item.type === 'photo' ? 'jpg' : 'webm';
    a.download = `FIELD_${item.metadata.siteId || 'INSPECT'}_${dateFormatted}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (item: MediaItem) => {
    if (navigator.share) {
      try {
        const file = new File(
          [item.blob],
          `Field_${item.metadata.siteId}_${item.type}.${item.type === 'photo' ? 'jpg' : 'webm'}`,
          { type: item.blob.type }
        );
        await navigator.share({
          title: `Field Inspection - ${item.metadata.siteId}`,
          text: `Verified at ${item.metadata.address} on ${item.metadata.timestampStr}`,
          files: [file],
        });
      } catch (err) {
        // Fallback to text share
        navigator.clipboard.writeText(
          `Site: ${item.metadata.siteId} | Coordinates: ${formatCoordinates(
            item.metadata.latitude,
            item.metadata.longitude
          )} | Address: ${item.metadata.address}`
        );
      }
    } else {
      navigator.clipboard.writeText(
        `Site: ${item.metadata.siteId} | Coordinates: ${formatCoordinates(
          item.metadata.latitude,
          item.metadata.longitude
        )} | Address: ${item.metadata.address}`
      );
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const handleCopyCoordinates = (item: MediaItem) => {
    const text = formatCoordinates(item.metadata.latitude, item.metadata.longitude);
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-wider text-zinc-100 uppercase">
              Field Media Library
            </h2>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {mediaItems.length} {mediaItems.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {mediaItems.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('photo')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'photo'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Photos
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'video'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Videos
            </button>
          </div>
        </div>

        {/* Main Content: Grid or Detail View */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <Camera className="w-12 h-12 mb-3 text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-400">No media captured yet</div>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Take geotagged photos or record inspection videos using the camera shutter to build
                your site verification library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-amber-400/70 transition-all cursor-pointer shadow-md"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt="Capture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Top badges */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {item.type === 'video' ? (
                      <span className="bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {item.durationSeconds ? `${item.durationSeconds}s` : 'Video'}
                      </span>
                    ) : (
                      <span className="bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Photo
                      </span>
                    )}
                  </div>

                  {/* Top-Right Sync Status Badge */}
                  <div className="absolute top-1.5 right-1.5">
                    {item.syncStatus === 'synced' ? (
                      <span
                        className="w-5 h-5 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center backdrop-blur-sm shadow"
                        title="Synced to Cloud"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    ) : item.syncStatus === 'syncing' ? (
                      <span
                        className="w-5 h-5 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center backdrop-blur-sm shadow animate-spin"
                        title="Uploading..."
                      >
                        <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    ) : item.syncStatus === 'failed' ? (
                      <span
                        className="w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow"
                        title="Sync Failed"
                      >
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span
                        className="px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[9px] font-bold flex items-center gap-1 backdrop-blur-sm shadow"
                        title="Stored locally in IndexedDB (Queued for upload)"
                      >
                        <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                        Queued
                      </span>
                    )}
                  </div>

                  {/* Bottom scrim label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 text-left">
                    <div className="text-zinc-200 font-bold text-[11px] truncate">
                      {item.metadata.siteId || 'SITE SURVEY'}
                    </div>
                    <div className="text-zinc-400 text-[10px] truncate">
                      {item.metadata.workStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full text-center">
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-100">Clear Entire Library?</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-4">
                This will permanently delete all {mediaItems.length} stored photos and videos from
                local device memory.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Inspector Drawer / Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-60 bg-black/95 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-150">
            {/* Media Canvas / Player Viewport */}
            <div className="flex-1 relative flex items-center justify-center bg-black p-2 sm:p-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedItem.type === 'photo' ? (
                <img
                  src={selectedItem.previewUrl}
                  alt="Captured inspection"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <video
                  src={selectedItem.previewUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Side Metadata Inspector Panel */}
            <div className="w-full md:w-80 lg:w-96 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col h-auto md:h-full shrink-0">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {selectedItem.type.toUpperCase()} METADATA INSPECTOR
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedItem.metadata.siteId}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDownload(selectedItem)}
                    title="Download File"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShare(selectedItem)}
                    title="Share / Export"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    title="Delete"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-red-900/50 text-red-400 border border-zinc-800 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail fields */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-zinc-300">
                {/* Cloud Sync Status */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-amber-400" />
                      Cloud Sync & Storage
                    </span>
                    {onOpenSyncQueue && (
                      <button
                        onClick={onOpenSyncQueue}
                        className="text-amber-400 hover:underline text-[10px] cursor-pointer"
                      >
                        Queue Manager
                      </button>
                    )}
                  </div>

                  <div>
                    {selectedItem.syncStatus === 'synced' ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <div>
                          <div>Backed Up to Cloud</div>
                          {selectedItem.syncedAt && (
                            <div className="text-[10px] font-normal text-zinc-400">
                              Synced at {new Date(selectedItem.syncedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedItem.syncStatus === 'syncing' ? (
                      <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs animate-pulse">
                        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                        <span>Uploading to Cloud Server...</span>
                      </div>
                    ) : selectedItem.syncStatus === 'failed' ? (
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <div>
                          <div>Upload Failed</div>
                          <div className="text-[10px] font-normal text-red-300">
                            {selectedItem.syncError || 'Network timeout'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                        <Clock className="w-4 h-4 shrink-0" />
                        <div>
                          <div>Queued in Local Storage (IndexedDB)</div>
                          <div className="text-[10px] font-normal text-zinc-400">
                            Will automatically upload when online
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organization / Header */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    Organization & Site
                  </div>
                  <div className="font-bold text-zinc-100 text-sm">
                    {selectedItem.metadata.companyTitle || 'Field Inspection Camera'}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-zinc-300 font-semibold text-[11px]">
                    <span className="text-amber-400">ID:</span> {selectedItem.metadata.siteId}
                    <span className="text-zinc-600">·</span>
                    <span className="text-emerald-400">{selectedItem.metadata.workStatus}</span>
                  </div>
                </div>

                {/* Coordinates & Accuracy */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      GPS Geolocation
                    </span>
                    <button
                      onClick={() => handleCopyCoordinates(selectedItem)}
                      className="text-amber-400 hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-zinc-100 font-bold text-xs">
                    {formatCoordinates(selectedItem.metadata.latitude, selectedItem.metadata.longitude)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                    {selectedItem.metadata.accuracy !== null && (
                      <span>Accuracy: ±{Math.round(selectedItem.metadata.accuracy)}m</span>
                    )}
                    {selectedItem.metadata.altitude !== null && (
                      <span>Alt: {Math.round(selectedItem.metadata.altitude)}m</span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    Verified Address
                  </div>
                  <div className="text-zinc-200 font-medium text-xs leading-relaxed">
                    {selectedItem.metadata.address || 'Address unrecorded'}
                  </div>
                </div>

                {/* Compass & Timestamp */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-zinc-400 text-[10px] uppercase font-semibold mb-0.5">
                      <Compass className="w-3 h-3 text-cyan-400" />
                      Bearing
                    </div>
                    <div className="font-mono font-bold text-zinc-200 text-xs">
                      {formatHeading(selectedItem.metadata.heading).full.replace('Heading: ', '')}
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-zinc-400 text-[10px] uppercase font-semibold mb-0.5">
                      <User className="w-3 h-3 text-amber-400" />
                      Inspector
                    </div>
                    <div className="font-semibold text-zinc-200 text-xs truncate">
                      {selectedItem.metadata.technician || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Timestamp & Timezone
                  </div>
                  <div className="font-mono text-zinc-200 text-xs">
                    {selectedItem.metadata.timestampStr}
                  </div>
                </div>

                {/* Field Notes */}
                {selectedItem.metadata.notes && (
                  <div className="bg-amber-400/10 border border-amber-400/20 p-3 rounded-xl">
                    <div className="text-amber-400 text-[10px] uppercase font-bold mb-1">
                      Field Observation Notes
                    </div>
                    <div className="text-zinc-200 text-xs italic">
                      "{selectedItem.metadata.notes}"
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Download CTA */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download Verified {selectedItem.type.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
