import React, { useState } from 'react';
import { X, Check, FileText } from 'lucide-react';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotes: string;
  onSaveNotes: (notes: string) => void;
}

const COMMON_QUICK_TAGS = [
  'Visual integrity confirmed',
  'Corrosion detected on bracket',
  'Cable tension compliant',
  'Work completed per spec',
  'Secondary inspection needed',
  'Safety lock-out applied',
];

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  currentNotes,
  onSaveNotes,
}) => {
  const [text, setText] = useState(currentNotes);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveNotes(text);
    onClose();
  };

  const handleTagClick = (tag: string) => {
    if (!text.trim()) {
      setText(tag);
    } else {
      setText(`${text.trim()}; ${tag}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Site Observation Notes</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-2">
          This text is baked directly into the photo or video metadata watermark.
        </p>

        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter on-site notes, defect description, or survey findings..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
          autoFocus
        />

        {/* Quick Click Tags */}
        <div className="my-3">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block mb-1.5">
            Quick Remarks
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
          >
            <Check className="w-4 h-4" />
            Apply to Stamp
          </button>
        </div>
      </div>
    </div>
  );
};
