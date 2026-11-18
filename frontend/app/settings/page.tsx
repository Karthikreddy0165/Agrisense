'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { useLanguage, LANGUAGES, LanguageCode } from '@/lib/context/LanguageContext';
import { STATES } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UserPreferences {
  preferredStateId: string;
  preferredCommodities: string[];
  displayUnit: 'quintal' | 'kg';
  priceAlerts: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  preferredStateId: '',
  preferredCommodities: [],
  displayUnit: 'quintal',
  priceAlerts: false,
  emailNotifications: false,
  darkMode: false,
};

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useLocalStorage<UserPreferences>('agri_preferences', DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  const toggleCommodity = (id: string) => {
    setPrefs((p) => ({
      ...p,
      preferredCommodities: p.preferredCommodities.includes(id)
        ? p.preferredCommodities.filter((c) => c !== id)
        : [...p.preferredCommodities, id],
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={t('settings.title', 'Settings')}
        subtitle={t('settings.subtitle', 'Configure your language preferences and default market options')}
      />

      <div className="space-y-6">
        {/* Language Selection */}
        <Card className="border border-slate-200">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-700" />
              <CardTitle className="text-slate-800 text-sm font-semibold">
                {t('settings.languageTitle', 'Interface Language')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-500 mb-3">Choose the display language for the entire AgriForecasting platform.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  data-testid={`settings-lang-${l.code}`}
                  onClick={() => setLanguage(l.code)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    language === l.code
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="block text-sm font-bold">{l.nativeName}</span>
                  <span className="text-xs text-slate-500">{l.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location preferences */}
        <Card className="border border-slate-200">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-slate-800 text-sm font-semibold">
              {t('settings.preferredState', 'Location Preferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('filter.state', 'Preferred State')}</label>
              <select
                value={prefs.preferredStateId}
                onChange={(e) => setPrefs((p) => ({ ...p, preferredStateId: e.target.value }))}
                className="w-full h-10 text-xs border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
              >
                <option value="">No preference / All India</option>
                {STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Commodity preferences */}
        <Card className="border border-slate-200">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-slate-800 text-sm font-semibold">
              {t('settings.preferredCommodities', 'Preferred Crops')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-500 mb-3">Select commodities you monitor frequently.</p>
            <div className="flex flex-wrap gap-2">
              {COMMODITIES.map((c) => {
                const selected = prefs.preferredCommodities.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCommodity(c.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      selected
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    )}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-5 h-9 font-medium">
            {saved ? <Check className="w-4 h-4 mr-1.5" /> : null}
            {saved ? 'Saved!' : t('settings.saveBtn', 'Save Preferences')}
          </Button>
          <p className="text-xs text-slate-400">Settings are stored locally in your browser session.</p>
        </div>
      </div>
    </div>
  );
}
