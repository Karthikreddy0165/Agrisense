'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, MapPin, Navigation, AlertCircle, X, Check, Search } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '@/lib/context/LanguageContext';
import { useLocation } from '@/lib/context/LocationContext';
import { STATES, DISTRICTS, MANDIS } from '@/lib/data/geography';
import { ApiService } from '@/lib/services/api';
import { Button } from '@/components/ui/button';

export function TopHeader() {
  const { language, setLanguage, t } = useLanguage();
  const {
    locationLabel,
    status,
    stateId,
    districtId,
    mandiId,
    isPickerOpen,
    openPicker,
    closePicker,
    detectLocation,
    setManualLocation,
    clearLocation,
  } = useLocation();

  const [mounted, setMounted] = useState(false);
  const [tempState, setTempState] = useState<string>(stateId || '');
  const [tempDistrict, setTempDistrict] = useState<string>(districtId || '');
  const [tempMandi, setTempMandi] = useState<string>(mandiId || '');
  const [searchQuery, setSearchQuery] = useState('');

  const [statesList, setStatesList] = useState<any[]>(STATES);
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [mandisList, setMandisList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    ApiService.getStates().then((s) => {
      if (s && s.length > 0) setStatesList(s);
    });
  }, []);

  useEffect(() => {
    if (tempState) {
      ApiService.getDistricts(tempState).then((d) => {
        setDistrictsList(d || []);
      });
      ApiService.getMandis({ stateId: tempState }).then((m) => {
        setMandisList(m || []);
      });
    } else {
      setDistrictsList([]);
      setMandisList([]);
    }
  }, [tempState]);

  useEffect(() => {
    if (tempDistrict) {
      ApiService.getMandis({ districtId: tempDistrict }).then((m) => {
        setMandisList(m || []);
      });
    } else if (tempState) {
      ApiService.getMandis({ stateId: tempState }).then((m) => {
        setMandisList(m || []);
      });
    }
  }, [tempDistrict, tempState]);

  // Synchronize picker state when opened
  useEffect(() => {
    if (isPickerOpen) {
      setTempState(stateId || '');
      setTempDistrict(districtId || '');
      setTempMandi(mandiId || '');
      setSearchQuery('');
    }
  }, [isPickerOpen, stateId, districtId, mandiId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPickerOpen) {
        closePicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPickerOpen, closePicker]);

  const availableDistricts = tempState
    ? (districtsList.length > 0 ? districtsList : DISTRICTS.filter((d) => d.stateId === tempState))
    : [];

  const availableMandis = mandisList.length > 0
    ? mandisList
    : tempDistrict
    ? MANDIS.filter((m) => m.districtId === tempDistrict)
    : tempState
    ? MANDIS.filter((m) => m.stateId === tempState)
    : [];

  const filteredStates = searchQuery
    ? statesList.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : statesList;

  const handleApplyManual = () => {
    if (tempState) {
      const selectedMandiObj = availableMandis.find((m) => m.id === tempMandi);
      const selectedDistrictObj = availableDistricts.find((d) => d.id === tempDistrict);
      const selectedStateObj = statesList.find((s) => s.id === tempState);

      let coords: { lat: number; lon: number } | undefined = undefined;
      let label = selectedStateObj?.name || tempState;

      if (selectedMandiObj && selectedMandiObj.latitude != null && selectedMandiObj.longitude != null) {
        coords = { lat: selectedMandiObj.latitude, lon: selectedMandiObj.longitude };
        label = `${selectedMandiObj.name}, ${selectedStateObj?.name || ''}`;
      } else if (selectedDistrictObj) {
        const firstWithCoords = availableMandis.find((m) => m.latitude != null && m.longitude != null);
        if (firstWithCoords && firstWithCoords.latitude != null && firstWithCoords.longitude != null) {
          coords = { lat: firstWithCoords.latitude, lon: firstWithCoords.longitude };
        }
        label = `${selectedDistrictObj.name}, ${selectedStateObj?.name || ''}`;
      } else if (selectedStateObj) {
        const firstWithCoords = availableMandis.find((m) => m.latitude != null && m.longitude != null);
        if (firstWithCoords && firstWithCoords.latitude != null && firstWithCoords.longitude != null) {
          coords = { lat: firstWithCoords.latitude, lon: firstWithCoords.longitude };
        }
        label = selectedStateObj.name;
      }

      setManualLocation(tempState, tempDistrict || undefined, tempMandi || undefined, coords, label);
    }
    closePicker();
  };

  const modalContent = isPickerOpen && mounted ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePicker();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 id="location-modal-title" className="font-semibold text-slate-900 text-sm">
                {t('loc.selectPrompt')}
              </h3>
              <p className="text-[11px] text-slate-500">Choose your state, district, or primary APMC mandi</p>
            </div>
          </div>
          <button
            onClick={() => closePicker()}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* GPS Detect Option */}
          <button
            onClick={() => {
              detectLocation();
              closePicker();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-medium transition-colors group"
          >
            <Navigation className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{t('loc.useLocation')}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase font-medium tracking-wider">
              Or Choose APMC Market
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Search State */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* State Dropdown */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">{t('filter.state')}</label>
            <select
              data-testid="modal-state-select"
              value={tempState}
              onChange={(e) => {
                setTempState(e.target.value);
                setTempDistrict('');
                setTempMandi('');
              }}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="">-- Choose State --</option>
              {filteredStates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              {t('filter.district')}
            </label>
            <select
              data-testid="modal-district-select"
              value={tempDistrict}
              onChange={(e) => {
                setTempDistrict(e.target.value);
                setTempMandi('');
              }}
              disabled={!tempState}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="">-- Choose District (Optional) --</option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mandi Dropdown */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Primary Mandi</label>
            <select
              data-testid="modal-mandi-select"
              value={tempMandi}
              onChange={(e) => setTempMandi(e.target.value)}
              disabled={!tempState}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="">-- Choose Specific Mandi (Optional) --</option>
              {availableMandis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearLocation();
              closePicker();
            }}
            className="text-xs text-slate-600 hover:text-slate-900 border-slate-200"
          >
            Clear Selection
          </Button>
          <Button
            data-testid="apply-location-btn"
            size="sm"
            onClick={handleApplyManual}
            disabled={!tempState}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 font-medium shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Apply Location
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-8 h-14 flex items-center justify-between">
        {/* Location display / button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (status === 'NOT_SET' || status === 'DENIED' || status === 'UNAVAILABLE') {
                openPicker();
              } else {
                detectLocation();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              status === 'DETECTED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : status === 'MANUAL'
                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                : status === 'DENIED'
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Click to detect or change location"
          >
            {status === 'DETECTING' ? (
              <span className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            ) : status === 'DETECTED' ? (
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            ) : status === 'DENIED' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
            )}

            <span>
              {status === 'DETECTING'
                ? t('loc.detecting')
                : status === 'DENIED'
                ? t('loc.denied')
                : locationLabel || t('loc.selectPrompt')}
            </span>
          </button>

          <button
            onClick={openPicker}
            className="text-xs text-slate-500 hover:text-emerald-800 underline underline-offset-2 ml-1"
          >
            {t('loc.change')}
          </button>
        </div>

        {/* Language dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              data-testid="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Render location modal inside portal to avoid any CSS stacking context clipping */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
