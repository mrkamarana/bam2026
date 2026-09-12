import React from 'react';
import { Calendar, Filter, Clock, CalendarDays, RefreshCw } from 'lucide-react';
import { DateFilterState, FilterMode } from '../types';
import { getCurrentMonthString, getTodayDateString } from '../utils/formatters';

interface DateFilterBarProps {
  filter: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  title?: string;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  filter,
  onChange,
  title = 'Filter Periode Data',
}) => {
  const handleModeChange = (mode: FilterMode) => {
    const today = getTodayDateString();
    const curMonth = getCurrentMonthString();
    onChange({
      mode,
      date: filter?.date || today,
      month: filter?.month || curMonth,
      startDate: filter?.startDate || today,
      endDate: filter?.endDate || today,
    });
  };

  const setPresetToday = () => {
    const today = getTodayDateString();
    onChange({
      mode: 'harian',
      date: today,
      month: getCurrentMonthString(),
      startDate: today,
      endDate: today,
    });
  };

  const setPresetThisMonth = () => {
    const curMonth = getCurrentMonthString();
    const today = getTodayDateString();
    const [y, m] = curMonth.split('-');
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    onChange({
      mode: 'bulanan',
      date: today,
      month: curMonth,
      startDate: `${curMonth}-01`,
      endDate: `${curMonth}-${String(lastDay).padStart(2, '0')}`,
    });
  };

  const setPresetLast7Days = () => {
    const today = new Date();
    const past7 = new Date();
    past7.setDate(today.getDate() - 7);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    onChange({
      mode: 'periode',
      date: getTodayDateString(),
      month: getCurrentMonthString(),
      startDate: formatDate(past7),
      endDate: formatDate(today),
    });
  };

  const resetAll = () => {
    const today = getTodayDateString();
    const curMonth = getCurrentMonthString();
    onChange({
      mode: 'semua',
      date: today,
      month: curMonth,
      startDate: today,
      endDate: today,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-2 sm:p-2.5 shadow-2xs mb-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>{title}:</span>
          </div>

          <div className="inline-flex p-0.5 bg-slate-100 rounded border border-slate-200">
            <button
              id="filter-mode-all"
              type="button"
              onClick={() => handleModeChange('semua')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filter.mode === 'semua'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Semua Data
            </button>
            <button
              id="filter-mode-daily"
              type="button"
              onClick={() => handleModeChange('harian')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filter.mode === 'harian'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Harian
            </button>
            <button
              id="filter-mode-monthly"
              type="button"
              onClick={() => handleModeChange('bulanan')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filter.mode === 'bulanan'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Bulanan
            </button>
            <button
              id="filter-mode-period"
              type="button"
              onClick={() => handleModeChange('periode')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filter.mode === 'periode'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Periode Rentang
            </button>
          </div>
        </div>

        {/* Middle: Inputs based on selected mode */}
        <div className="flex flex-wrap items-center gap-2">
          {filter.mode === 'harian' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-slate-600 font-medium">Tanggal:</span>
              <input
                id="filter-input-date"
                type="date"
                value={filter.date}
                onChange={(e) => onChange({ ...filter, date: e.target.value })}
                className="bg-white text-slate-800 text-xs border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {filter.mode === 'bulanan' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-slate-600 font-medium">Bulan:</span>
              <input
                id="filter-input-month"
                type="month"
                value={filter.month}
                onChange={(e) => onChange({ ...filter, month: e.target.value })}
                className="bg-white text-slate-800 text-xs border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {filter.mode === 'periode' && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-slate-600 font-medium">Dari:</span>
              <input
                id="filter-input-start-date"
                type="date"
                value={filter.startDate}
                onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
                className="bg-white text-slate-800 text-xs border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-600 font-medium">s/d:</span>
              <input
                id="filter-input-end-date"
                type="date"
                value={filter.endDate}
                onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
                className="bg-white text-slate-800 text-xs border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {/* Quick presets buttons */}
          <div className="flex items-center gap-1">
            <button
              id="preset-btn-today"
              type="button"
              onClick={setPresetToday}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium"
              title="Hari Ini"
            >
              Hari Ini
            </button>
            <button
              id="preset-btn-month"
              type="button"
              onClick={setPresetThisMonth}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium"
              title="Bulan Ini"
            >
              Bulan Ini
            </button>
            <button
              id="preset-btn-7days"
              type="button"
              onClick={setPresetLast7Days}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium"
              title="7 Hari Terakhir"
            >
              7 Hari
            </button>
            <button
              id="preset-btn-reset"
              type="button"
              onClick={resetAll}
              className="text-xs p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-blue-600 border border-slate-200 transition"
              title="Reset Filter"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
