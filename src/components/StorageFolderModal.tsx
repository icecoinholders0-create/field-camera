import React, { useState } from 'react';
import { X, FolderCheck, FolderPlus, Smartphone, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  isFolderAccessSupported,
  requestPhoneStorageFolder,
  clearDirectoryHandle,
} from '../utils/deviceStorage';

interface StorageFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderName: string | null;
  onFolderConnected: (folderName: string | null) => void;
}

export const StorageFolderModal: React.FC<StorageFolderModalProps> = ({
  isOpen,
  onClose,
  currentFolderName,
  onFolderConnected,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supported = isFolderAccessSupported();

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestPhoneStorageFolder();
      if (res.success && res.folderName) {
        onFolderConnected(res.folderName);
        onClose();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not select folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await clearDirectoryHandle();
    onFolderConnected(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold tracking-wide uppercase">
              Phone Storage Access
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {supported ? (
            <>
              {currentFolderName ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <FolderCheck className="w-5 h-5" />
                    <span>Connected to: {currentFolderName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Photos and videos are saved <strong>straight into this folder</strong> on your device without any cloud uploads or extra steps.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <FolderPlus className="w-5 h-5" />
                    <span>Save Straight to Phone</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Grant the app access to a folder on your phone (such as <strong>Pictures</strong> or <strong>DCIM</strong>) once. Every capture will write directly to your device storage.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSelectFolder}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Selecting folder...</span>
                    </>
                  ) : currentFolderName ? (
                    <>
                      <FolderCheck className="w-4 h-4" />
                      <span>Change Phone Storage Folder</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>Select Phone Storage Folder</span>
                    </>
                  )}
                </button>

                {currentFolderName && (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 text-[11px] font-semibold text-zinc-400 hover:text-red-400 cursor-pointer text-center"
                  >
                    Disconnect Folder Access
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Direct Device Saving Active</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Your browser directly downloads all captured photos and inspection videos straight to your phone's storage / Camera Roll upon pressing the shutter. No cloud accounts or libraries used.
              </p>
            </div>
          )}

          <div className="text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-3">
            🔒 100% Local & Private. Files never leave your physical device.
          </div>
        </div>
      </div>
    </div>
  );
};
