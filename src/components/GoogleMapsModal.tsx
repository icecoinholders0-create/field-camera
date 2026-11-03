import React, { useState } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Check,
  Navigation,
} from 'lucide-react';
import { GeoData } from '../types/camera';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geoData: GeoData;
  onApplyAddressToStamp: (address: string) => void;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose,
  geoData,
  onApplyAddressToStamp,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    mapsLinks: { title: string; uri: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleFetchMapsGrounding = async () => {
    if (geoData.latitude === null || geoData.longitude === null) {
      setError('Coordinates not available.');
      return;
    }

    setLoading(true);
    setError(null);
    setApplied(false);

    try {
      const res = await fetch('/api/maps/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch Google Maps data');
      }

      setResult({
        summary: data.summary,
        mapsLinks: data.mapsLinks || [],
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to query Google Maps intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result?.summary) {
      // Extract first concise line
      const firstLine = result.summary.split('\n')[0].replace(/^#+\s*/, '').trim();
      onApplyAddressToStamp(firstLine || geoData.address);
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Google Maps Grounding
              </h2>
              <p className="text-[10px] text-zinc-400">
                Grounding with live Google Maps place data
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-300">
          {/* Coordinates Bar */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                Target Coordinates
              </div>
              <div className="font-mono text-xs font-bold text-zinc-200 mt-0.5">
                {geoData.latitude?.toFixed(5)}°, {geoData.longitude?.toFixed(5)}°
              </div>
            </div>
            <button
              onClick={handleFetchMapsGrounding}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Querying Maps...' : result ? 'Re-Query Maps' : 'Verify Location'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Results View */}
          {result ? (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Site Verification Intelligence
                </div>
                <div className="text-zinc-200 leading-relaxed whitespace-pre-line text-xs font-medium">
                  {result.summary}
                </div>
              </div>

              {/* Google Maps Links (Mandatory extraction as required by skill) */}
              {result.mapsLinks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                    Verified Google Maps Links
                  </div>
                  <div className="space-y-1.5">
                    {result.mapsLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 text-zinc-200 hover:text-white transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="font-semibold text-xs truncate">{link.title}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !loading && (
            <div className="p-6 text-center text-zinc-500 space-y-2 border border-dashed border-zinc-800 rounded-xl">
              <MapPin className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-xs font-semibold text-zinc-400">
                Ground Site Coordinates with Google Maps
              </div>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Queries Google Maps data grounded via gemini-3.8-flash to identify official building
                names, postal addresses, and nearby infrastructure landmarks.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Powered by Google Maps Grounding
          </span>
          {result && (
            <button
              onClick={handleApply}
              disabled={applied}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              {applied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" /> Applied to Watermark
                </>
              ) : (
                'Apply to Watermark Address'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
