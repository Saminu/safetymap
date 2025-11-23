
import React, { useState } from 'react';
import { Coordinates, ZoneType } from '../types';
import { getZoneLabel } from './Legend';

interface AddReportModalProps {
  position: Coordinates;
  onClose: () => void;
  onAdd: (data: { title: string; description: string; type: ZoneType; radius: number; abductedCount?: number; sourceUrl?: string }) => void;
}

const AddReportModal: React.FC<AddReportModalProps> = ({ position, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ZoneType>(ZoneType.EVENT_GATHERING);
  const [radius, setRadius] = useState(500);
  const [abductedCount, setAbductedCount] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ 
        title, 
        description, 
        type, 
        radius, 
        abductedCount: abductedCount ? parseInt(abductedCount) : undefined,
        sourceUrl: sourceUrl || undefined
    });
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6 rounded-xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">New Intelligence Report</h2>
        <p className="text-xs text-neutral-500 mb-4 font-mono">
          LOC: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Classification</label>
                <select 
                value={type} 
                onChange={(e) => setType(e.target.value as ZoneType)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded p-2 focus:border-blue-500 outline-none text-sm"
                >
                {Object.values(ZoneType).map((t) => (
                    <option key={t} value={t}>{getZoneLabel(t)}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Abducted Count (Est.)</label>
                <input 
                  type="number"
                  min="0"
                  value={abductedCount}
                  onChange={(e) => setAbductedCount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded p-2 focus:border-blue-500 outline-none text-sm"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Radius (Meters)</label>
            <input 
              type="range" 
              min="100" 
              max="10000" 
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="text-right text-xs text-blue-400 font-mono">{radius}m</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Title / Code</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Suspicious Activity"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded p-2 focus:border-blue-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Source URL (Optional)</label>
            <input 
              type="url" 
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded p-2 focus:border-blue-500 outline-none text-sm placeholder-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Details</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event or threat..."
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded p-2 focus:border-blue-500 outline-none text-sm h-20"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors shadow-lg shadow-blue-900/20"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReportModal;
