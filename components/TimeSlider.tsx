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
  const minValRef = useRef(initialMin);
  const maxValRef = useRef(initialMax);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = (value: number) => {
    return Math.round(((value - minTime) / (maxTime - minTime)) * 100);
  };

  // Update selection bar position
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, minTime, maxTime]);

  // Update selection bar width
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, minTime, maxTime]);

  // Notify parent
  useEffect(() => {
    onChange(minVal, maxVal);
  }, [minVal, maxVal, onChange]);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] sm:w-96 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-lg shadow-2xl p-4 flex flex-col gap-2">
      <div className="flex justify-between items-end border-b border-neutral-700 pb-2">
        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest font-bold">Timeline Filter</span>
        <div className="flex gap-2 items-center text-xs font-mono">
            <span className="text-blue-400">{formatDate(minVal)}</span>
            <span className="text-neutral-600">to</span>
            <span className="text-blue-400">{formatDate(maxVal)}</span>
        </div>
      </div>
      
      <div className="relative h-4 w-full mt-3 mb-1 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-neutral-800 rounded z-0 border border-neutral-700"></div>
        
        {/* Selected Range */}
        <div ref={range} className="absolute h-1.5 bg-blue-600 rounded z-10 opacity-80"></div>
        
        {/* Left Thumb Input */}
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={minVal}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - 1);
            setMinVal(value);
            minValRef.current = value;
          }}
          className="thumb absolute z-20 w-full h-0 outline-none pointer-events-none appearance-none"
          style={{ zIndex: minVal > maxTime - 100 ? 50 : 30 }}
        />
        
        {/* Right Thumb Input */}
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={maxVal}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + 1);
            setMaxVal(value);
            maxValRef.current = value;
          }}
          className="thumb absolute z-20 w-full h-0 outline-none pointer-events-none appearance-none"
          style={{ zIndex: 40 }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-1 uppercase">
        <span>Oldest Intel</span>
        <span>Live Feed</span>
      </div>

      <style>{`
        /* Webkit Thumb */
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: all;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #171717; /* neutral-900 */
          border: 2px solid #3b82f6; /* blue-500 */
          cursor: pointer;
          margin-top: -5px; /* Centers thumb on h-1.5 track */
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        
        .thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }

        /* Firefox Thumb */
        .thumb::-moz-range-thumb {
          pointer-events: all;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #171717;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          transform: translateY(2px); /* Firefox adjustment */
        }

        .thumb::-moz-range-thumb:hover {
          transform: scale(1.1) translateY(2px);
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default TimeSlider;
