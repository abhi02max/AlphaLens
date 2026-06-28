import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useSearchStocks } from '../hooks/useStocks';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Debounce the input value by 400ms before sending it to React Query
  const debouncedQuery = useDebounce(inputValue, 400);
  
  const { data: searchResults, isLoading, isError } = useSearchStocks(debouncedQuery);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol) => {
    setInputValue('');
    setIsOpen(false);
    navigate(`/stock/${symbol}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSelect(inputValue.toUpperCase());
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto shadow-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-slate-400" size={20} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-fintech-blue/50 text-slate-800 text-lg transition-shadow"
          placeholder="Search for a symbol or company (e.g. AAPL, Tesla)..."
        />
        {isLoading && (
          <Loader2 className="absolute right-4 text-fintech-blue animate-spin" size={20} />
        )}
      </div>

      {isOpen && inputValue.length >= 2 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {isError ? (
            <div className="p-4 text-fintech-red text-center">Failed to fetch results.</div>
          ) : searchResults?.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <li 
                  key={result.symbol}
                  onClick={() => handleSelect(result.symbol)}
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{result.symbol}</span>
                    <span className="text-sm text-slate-500 truncate">{result.shortname}</span>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase">
                    {result.exchDisp}
                  </span>
                </li>
              ))}
            </ul>
          ) : !isLoading ? (
            <div className="p-4 text-slate-500 text-center">No symbols found for "{inputValue}"</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
