import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trash2, Copy, Plus, Clock, Search, AlertCircle, ShieldCheck } from 'lucide-react';
import { TOTPAccount } from '../types';
import { generateTOTP, getRemainingTime } from '../utils/otpAuth';
import AddAccountModal from './AddAccountModal';

export default function TOTPDashboard() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load accounts
  useEffect(() => {
    const saved = localStorage.getItem('totp_accounts');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load accounts', e);
      }
    }
  }, []);

  // Save accounts
  useEffect(() => {
    localStorage.setItem('totp_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Update timer and codes
  useEffect(() => {
    const interval = setInterval(() => {
      const time = getRemainingTime();
      setRemainingTime(time);
      
      // If time just rolled over or it's the first run, refresh codes
      // We refresh every second just to be sure, but it only changes every 30s
      const newCodes: Record<string, string> = {};
      accounts.forEach(acc => {
        newCodes[acc.id] = generateTOTP(acc.secret);
      });
      setCodes(newCodes);
    }, 1000);

    return () => clearInterval(interval);
  }, [accounts]);

  const handleAddAccount = (data: { name: string; issuer?: string; secret: string }) => {
    const newAccount: TOTPAccount = {
      id: Math.random().toString(36).substring(2, 11),
      addedAt: Date.now(),
      ...data
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const deleteAccount = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.issuer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 text-sm"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((acc) => (
              <motion.div
                key={acc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight truncate max-w-[150px]">{acc.name}</h4>
                      {acc.issuer && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{acc.issuer}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">
                        {codes[acc.id] ? (
                          <>
                            {codes[acc.id].slice(0, 3)}
                            <span className="text-indigo-300"> </span>
                            {codes[acc.id].slice(3)}
                          </>
                        ) : '000 000'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${remainingTime < 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                            animate={{ width: `${(remainingTime / 30) * 100}%` }}
                            transition={{ ease: "linear", duration: 1 }}
                          />
                       </div>
                       <span className={`text-[10px] font-bold font-mono ${remainingTime < 5 ? 'text-red-500' : 'text-gray-400'}`}>
                         {remainingTime}s
                       </span>
                    </div>
                  </div>

                  <button
                    onClick={() => copyCode(codes[acc.id], acc.id)}
                    className={`relative p-4 rounded-2xl transition-all flex items-center justify-center ${copiedId === acc.id ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <AnimatePresence mode="wait">
                      {copiedId === acc.id ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <ShieldCheck size={20} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                        >
                          <Copy size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-6 bg-indigo-50 rounded-full text-indigo-400">
                <Shield size={48} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">No accounts found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Add your first 2FA account to start generating secure verification codes.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-br from-indigo-600 to-purple-600 text-white rounded-2xl font-bold transition-all shadow-lg"
              >
                <Plus size={18} />
                Get Started
              </button>
            </div>
          )}
        </div>
      </AnimatePresence>

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAccount}
      />
    </div>
  );
}
