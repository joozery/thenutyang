import React, { useMemo, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
}

export function DatePicker({ value, defaultValue, onChange, className = '', disabled, ...props }: DatePickerProps) {
  const [internalValue, setInternalValue] = useState(value?.toString() || defaultValue?.toString() || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    if (onChange) onChange(e);
  };

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const displayDate = useMemo(() => {
    if (!internalValue) return 'dd/mm/yyyy';
    const parts = internalValue.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return 'dd/mm/yyyy';
  }, [internalValue]);
  
  return (
    <div className={`relative inline-flex items-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <style>{`
        .native-date-wrapper input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
      
      {/* Hidden native input */}
      <div className="absolute inset-0 w-full h-full z-10 native-date-wrapper">
        <input
          type="date"
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-full opacity-0 cursor-pointer block"
          {...props}
        />
      </div>
      
      {/* Visible formatted date */}
      <div className="flex items-center justify-between w-full pointer-events-none">
        <span className={value ? 'text-inherit' : 'text-slate-400'}>
          {displayDate}
        </span>
        <Calendar size={15} className="text-slate-400 ml-2 shrink-0" />
      </div>
    </div>
  );
}
