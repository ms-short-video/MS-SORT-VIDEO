import React from 'react';
import { UploadProgress } from '../types';
import { Upload, CheckCircle2 } from 'lucide-react';

interface HeaderProgressBadgeProps {
  uploadProgress: UploadProgress;
}

export const HeaderProgressBadge: React.FC<HeaderProgressBadgeProps> = ({
  uploadProgress,
}) => {
  if (!uploadProgress.isUploading && uploadProgress.percentage === 0) {
    return null;
  }

  const isFinished = uploadProgress.percentage >= 100;

  return (
    <div
      id="top-upload-badge"
      className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/85 border border-indigo-500/50 backdrop-blur-md text-white shadow-2xl transition-all duration-300 animate-slide-down"
    >
      <div className="relative flex items-center justify-center">
        {isFinished ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
        ) : (
          <div className="relative w-5 h-5">
            <Upload className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3 text-xs font-bold">
          <span className={isFinished ? 'text-emerald-400' : 'text-indigo-300'}>
            {isFinished ? 'Video Live!' : 'Uploading Video...'}
          </span>
          <span className="font-mono text-[11px] text-indigo-200">
            {uploadProgress.percentage}%
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-200 ${
              isFinished ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-pink-500'
            }`}
            style={{ width: `${uploadProgress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
