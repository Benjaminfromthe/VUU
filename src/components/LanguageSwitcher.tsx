import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages: LanguageOption[] = [
    { code: 'en', name: 'English', flag: '🇷🇼/🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' }
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  const currentLanguageCode = i18n.language || 'en';

  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-xl w-fit" id="vuu-language-bar">
      <div className="px-2 text-slate-500 flex items-center">
        <Globe className="w-3.5 h-3.5 animate-pulse text-amber-400" />
      </div>
      <div className="flex gap-1">
        {languages.map((lang) => {
          const isActive = currentLanguageCode.startsWith(lang.code);
          return (
            <button
              key={lang.code}
              onClick={() => !isActive && handleLanguageChange(lang.code)}
              disabled={isActive}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-black cursor-not-allowed border border-amber-300/30 shadow-md shadow-amber-400/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <span>{lang.name}</span>
              {isActive && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
