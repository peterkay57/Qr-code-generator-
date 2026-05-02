import React, { useState } from 'react';
import { RefreshCcw, Copy, Dices, Shield, Check, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeneratorCriteria {
  name: string;
  petName: string;
  color: string;
  birthYear: string;
  symbol: string;
  number: string;
  street: string;
  food: string;
}

const SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '+', '='];
const WORD_BANK = ['cat', 'dog', 'sun', 'moon', 'star', 'blue', 'red', 'fire', 'water', 'earth', 'wind', 'bird', 'fish', 'tree', 'flower', 'cloud', 'mountain', 'river', 'ocean', 'forest'];

export default function PasswordGenerator() {
  const [criteria, setCriteria] = useState<GeneratorCriteria>({
    name: '',
    petName: '',
    color: '',
    birthYear: '',
    symbol: '!',
    number: '',
    street: '',
    food: '',
  });

  const [level, setLevel] = useState<'Easy' | 'Medium' | 'Strong'>('Medium');
  const [password, setPassword] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const generatePassword = () => {
    const inputs = Object.values(criteria).filter(Boolean);
    const wordsToUse = inputs.length > 0 ? inputs : [WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)], WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]];
    
    let base = wordsToUse.sort(() => Math.random() - 0.5).slice(0, 3).join('');
    
    if (level === 'Easy') {
      // Simple letter substitution
      base = base.replace(/e/gi, '3').replace(/a/gi, '4').replace(/i/gi, '1');
      if (criteria.birthYear) base += criteria.birthYear.slice(-2);
    } else if (level === 'Medium') {
      // More substitutions + random capitalization + symbol at end
      base = base.replace(/a/gi, '@').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0');
      base = base.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
      base += criteria.symbol;
    } else if (level === 'Strong') {
      // High security
      const substitutions: Record<string, string> = { 'a': '@', 'e': '3', 'i': '1', 'o': '0', 's': '$', 't': '7', 'b': '8', 'g': '9' };
      base = base.split('').map(c => substitutions[c.toLowerCase()] || c).join('');
      base = base.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
      
      const randomNum = Math.floor(Math.random() * 100);
      const randomLetters = Math.random().toString(36).substring(2, 4);
      base = criteria.symbol + base + '_' + randomNum + criteria.symbol + randomLetters;
    }

    setPassword(base);
  };

  const feelLucky = () => {
    const randomCriteria: GeneratorCriteria = {
      name: Math.random() > 0.5 ? WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)] : '',
      petName: Math.random() > 0.5 ? WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)] : '',
      color: WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)],
      birthYear: String(1970 + Math.floor(Math.random() * 56)),
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      number: String(Math.floor(Math.random() * 999)),
      street: '',
      food: '',
    };
    setCriteria(randomCriteria);
    const levels: ('Easy' | 'Medium' | 'Strong')[] = ['Easy', 'Medium', 'Strong'];
    setLevel(levels[Math.floor(Math.random() * levels.length)]);
    
    // Defer generation slightly to ensure state is updated if needed (though setPassword call below works fine)
    setTimeout(() => generatePassword(), 0);
  };

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const getStrength = () => {
    if (!password) return { label: 'None', color: 'bg-gray-200', width: 'w-0' };
    if (level === 'Easy') return { label: 'Low', color: 'bg-red-500', width: 'w-1/3' };
    if (level === 'Medium') return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/3' };
    return { label: 'High', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = getStrength();

  return (
    <div className="space-y-6">
      {/* Criteria Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Your Name</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="John"
            value={criteria.name}
            onChange={(e) => setCriteria({ ...criteria, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pet Name</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="Luna"
            value={criteria.petName}
            onChange={(e) => setCriteria({ ...criteria, petName: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Favorite Color</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="Blue"
            value={criteria.color}
            onChange={(e) => setCriteria({ ...criteria, color: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Year</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm appearance-none cursor-pointer"
            value={criteria.birthYear}
            onChange={(e) => setCriteria({ ...criteria, birthYear: e.target.value })}
          >
            <option value="">Year</option>
            {Array.from({ length: 2026 - 1970 + 1 }, (_, i) => 1970 + i).map(y => (
              <option key={y} value={y}>{String(y).slice(-2)}</option>
            )).reverse()}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Favorite Symbol</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm appearance-none cursor-pointer"
            value={criteria.symbol}
            onChange={(e) => setCriteria({ ...criteria, symbol: e.target.value })}
          >
            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Favorite Number</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="42"
            min="1"
            max="999"
            value={criteria.number}
            onChange={(e) => setCriteria({ ...criteria, number: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Street Name</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="Maple"
            value={criteria.street}
            onChange={(e) => setCriteria({ ...criteria, street: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Favorite Food</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
            placeholder="Pizza"
            value={criteria.food}
            onChange={(e) => setCriteria({ ...criteria, food: e.target.value })}
          />
        </div>
      </div>

      {/* Complexity Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          {(['Easy', 'Medium', 'Strong'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                level === l 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={feelLucky}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-all border border-amber-200 text-sm"
          >
            <Wand2 size={18} />
            I'm Feeling Lucky
          </button>
          <button
            onClick={generatePassword}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 text-sm"
          >
            <RefreshCcw size={18} />
            Generate
          </button>
        </div>
      </div>

      {/* Password Display Area */}
      <AnimatePresence mode="wait">
        {password && (
          <motion.div
            key={password}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-white border border-gray-100 rounded-3xl shadow-xl space-y-6"
          >
            <div className="relative group">
              <div className="w-full p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center break-all font-mono text-2xl sm:text-3xl font-bold text-gray-800 shadow-inner">
                {password}
              </div>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm flex items-center gap-2"
              >
                {showCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                <span>Password Strength</span>
                <span className={strength.label === 'Low' ? 'text-red-500' : strength.label === 'Medium' ? 'text-yellow-600' : 'text-emerald-600'}>
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${strength.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
