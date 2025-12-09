import { useState, useRef, useEffect } from 'react';
import { IoLanguage, IoChevronDown } from 'react-icons/io5';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageDropdown = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'vi' as const, name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  ];

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: 'vi' | 'en') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-[#3BC8E7] transition-colors cursor-pointer px-3 py-2 rounded-lg hover:bg-[#252B4D]"
      >
        <IoLanguage className="text-xl" />
        <span className="text-sm font-medium">{t('common.languages')}</span>
        <IoChevronDown className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1B2039] border border-[#252B4D] rounded-lg shadow-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#252B4D] transition-colors ${
                language === lang.code ? 'bg-[#252B4D] text-[#3BC8E7]' : 'text-white'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="flex-1 font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="text-[#3BC8E7]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;

