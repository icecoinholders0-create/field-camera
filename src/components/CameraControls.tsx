import React from 'react';
import { FolderCheck, Folder, Edit3 } from 'lucide-react';
import { CaptureMode } from '../types/camera';

interface CameraControlsProps {
  captureMode: CaptureMode;
  onSetCaptureMode: (mode: CaptureMode) => void;
  isRecording: boolean;
  onShutterPress: () => void;
  phoneFolderName: string | null;
  onConfigureStorage: () => void;
  onOpenQuickNote: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  captureMode,
  onSetCaptureMode,
  isRecording,
  onShutterPress,
  phoneFolderName,
  onConfigureStorage,
  onOpenQuickNote,
}) => {
  return (
    <div className="bg-black/95 border-t border-white/10 px-4 pt-3 pb-6 flex flex-col items-center justify-center gap-3.5 select-none z-30">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-6 text-xs font-bold tracking-widest uppercase">
        <button
          onClick={() => !isRecording && onSetCaptureMode('photo')}
          disabled={isRecording}
          className={`py-1 px-3 transition-colors relative cursor-pointer ${
            captureMode === 'photo' ? 'text-amber-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'
          } ${isRecording ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Photo
          {captureMode === 'photo' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => !isRecording && onSetCaptureMode('video')}
          disabled={isRecording}
          className={`py-1 px-3 transition-colors relative cursor-pointer ${
            captureMode === 'video' ? 'text-red-500 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'
          } ${isRecording ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Video
          {captureMode === 'video' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Primary Shutter Row */}
      <div className="w-full max-w-sm flex items-center justify-between px-2">
        {/* Left slot: Direct Phone Storage Access */}
        <div className="w-20 flex items-center justify-start">
          <button
            onClick={onConfigureStorage}
            className="relative w-12 h-12 rounded-xl border border-white/25 bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer shadow-md group"
            title={
              phoneFolderName
                ? `Direct Phone Storage: [${phoneFolderName}]. Captures save straight here. Tap to change.`
                : 'Grant phone storage access once to save photos directly to a device folder.'
            }
          >
            {phoneFolderName ? (
              <>
                <FolderCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
                <span className="text-[8px] font-bold text-emerald-300 truncate max-w-[42px]">
                  {phoneFolderName}
                </span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-black rounded-full" />
              </>
            ) : (
              <>
                <Folder className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-0.5" />
                <span className="text-[8px] font-semibold text-zinc-400">Phone</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Tactile Shutter Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onShutterPress}
            aria-label={
              captureMode === 'photo'
                ? 'Take Geotagged Photo'
                : isRecording
                ? 'Stop Recording'
                : 'Start Recording Geotagged Video'
            }
            className={`relative rounded-full flex items-center justify-center transition-all cursor-pointer ${
              captureMode === 'photo'
                ? 'w-18 h-18 border-4 border-white/40 p-1 active:scale-95'
                : isRecording
                ? 'w-18 h-18 border-4 border-red-500/70 p-1.5 animate-pulse'
                : 'w-18 h-18 border-4 border-white/40 p-1 active:scale-95'
            }`}
          >
            {captureMode === 'photo' ? (
              <div className="w-full h-full rounded-full bg-white transition-transform active:scale-90 shadow-inner" />
            ) : isRecording ? (
              <div className="w-6 h-6 rounded-md bg-red-600 transition-all shadow-md" />
            ) : (
              <div className="w-full h-full rounded-full bg-red-600 transition-transform active:scale-90 shadow-inner" />
            )}
          </button>
        </div>

        {/* Right slot: Field Remarks Note button */}
        <div className="w-20 flex items-center justify-end">
          <button
            onClick={onOpenQuickNote}
            className="w-12 h-12 rounded-xl border border-white/25 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer shadow-md"
            title="Edit Field Remarks"
          >
            <Edit3 className="w-5 h-5 text-amber-400 mb-0.5" />
            <span className="text-[9px] font-semibold text-zinc-400">Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
