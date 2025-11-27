
import React, { useState, useEffect, useRef } from 'react';

interface TimeSliderProps {
  minTime: number;
  maxTime: number;
  initialMin: number;
  initialMax: number;
  onChange: (min: number, max: number) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ 
  minTime, 
  maxTime, 
  initialMin, 
  initialMax, 
  onChange 
}) => {
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);
  const [isExpanded, setIsExpanded] = useState(true);
  const minValRef = useRef(initialMin);
  const maxValRef = useRef(initialMax);
  const range = useRef<HTMLDivElement>(null);

  // Auto-collapse on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
        setIsExpanded(false);
    }
  }, []);

  const getPercent = (value: number) => {
    return Math.round(((value - minTime) / (maxTime - minTime)) * 100);
  };

  useEffect(() => {
    if (!isExpanded) return;
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);
    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, minTime, maxTime, isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);
    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, minTime, maxTime, isExpanded]);

  useEffect(() => {
    onChange(minVal, maxVal);
  }, [minVal, maxVal, onChange]);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
    });
  };

  if (!isExpanded) {
    return (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[900] bg-neutral-900/90 backdrop-blur border border-neutral-700 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white hover:border-blue-500 transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="tracking-widest">TIMELINE FILTER</span>
        </button>
    );
  }

  return (
    <div className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-[900] w-[92%] max-w-lg bg-neutral-900/95 backdrop-blur-md border border-neutral-700 rounded-lg shadow-2xl px-4 py-3 flex flex-col gap-1 animate-fade-in-up">
      <button 
        onClick={() => setIsExpanded(false)}
        className="absolute top-2 right-2 text-neutral-500 hover:text-white p-1"
        title="Minimize"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="flex justify-between items-end pb-2">
        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest font-bold">Timeline</span>
        <div className="flex gap-2 items-center text-xs font-mono bg-black/30 px-2 py-0.5 rounded">
            <span className="text-blue-400">{formatDate(minVal)}</span>
            <span className="text-neutral-600">-</span>
            <span className="text-blue-400">{formatDate(maxVal)}</span>
        </div>
      </div>
      
      <div className="relative h-2 w-full mt-2 mb-1 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1 bg-neutral-700 rounded z-0"></div>
        {/* Range */}
        <div ref={range} className="absolute h-1 bg-blue-500 rounded z-10"></div>
        
        {/* Thumbs */}
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={minVal}
          onChange={(e) => {
            const value = Math.min(Number(e.target.value), maxVal - 1);
            setMinVal(value);
            minValRef.current = value;
          }}
          className="thumb absolute z-20 w-full h-0 outline-none pointer-events-none appearance-none"
        />
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={maxVal}
          onChange={(e) => {
            const value = Math.max(Number(e.target.value), minVal + 1);
            setMaxVal(value);
            maxValRef.current = value;
          }}
          className="thumb absolute z-20 w-full h-0 outline-none pointer-events-none appearance-none"
        />
      </div>

      <style>{`
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #171717;
          border: 2px solid #3b82f6;
          cursor: pointer;
          margin-top: -7px;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .thumb::-moz-range-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #171717;
          border: 2px solid #3b82f6;
          cursor: pointer;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default TimeSlider;
