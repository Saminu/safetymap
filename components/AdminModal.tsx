
import React, { useState } from 'react';

interface AdminModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strict access code check
    if (password === '231125') {
      onLogin();
      onClose();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm p-6 rounded-xl shadow-2xl relative overflow-hidden">
        {/* Decorative tactical elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-neutral-500"></div>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-neutral-500"></div>

        <h2 className="text-lg font-bold text-white mb-1 tracking-wider uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Command Access
        </h2>
        <p className="text-xs text-neutral-500 mb-6 font-mono">Restricted to authorized personnel only.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1 uppercase tracking-wider">Access Code</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="••••••"
              autoFocus
              className={`w-full bg-neutral-800 border ${error ? 'border-red-500' : 'border-neutral-600'} text-white rounded p-2 focus:border-blue-500 outline-none text-sm font-mono tracking-widest`}
            />
            {error && <p className="text-red-500 text-[10px] mt-1 font-mono">ACCESS DENIED: INVALID CREDENTIALS</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors shadow-lg shadow-blue-900/20 uppercase tracking-wide"
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;
