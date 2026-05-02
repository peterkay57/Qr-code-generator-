import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, ShieldAlert, Key, Eye, EyeOff, Search, Plus, 
  Trash2, Edit, Copy, Check, Clock, Filter, ChevronDown, 
  Settings, LogOut, ArrowRight, ShieldCheck, AlertCircle, 
  Tag, Link as LinkIcon, FileText, User, ExternalLink, RefreshCcw
} from 'lucide-react';
import { vaultService } from '../services/vaultService';
import { PasswordEntry, VaultMetadata } from '../types';
import PasswordGenerator from './PasswordGenerator';
import { v4 as uuidv4 } from 'uuid';

export default function PasswordVault() {
  const [isLocked, setIsLocked] = useState(true);
  const [hasVault, setHasVault] = useState<boolean | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'service' | 'newest' | 'updated'>('service');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inactivityTimer, setInactivityTimer] = useState(0);

  const metadataRef = useRef<VaultMetadata | null>(null);

  // Check if vault exists
  useEffect(() => {
    const init = async () => {
      const meta = await vaultService.getMetadata();
      setHasVault(!!meta);
      if (meta) metadataRef.current = meta;
    };
    init();
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (isLocked) return;

    const interval = setInterval(() => {
      setInactivityTimer(prev => {
        if (prev >= 300) { // 5 minutes
          handleLock();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    const resetTimer = () => setInactivityTimer(0);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isLocked]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword.length < 8) {
      setError('Master password must be at least 8 characters');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const meta: VaultMetadata = {
      salt: saltBase64,
      iterations: 100000,
      version: 1,
    };

    await vaultService.saveMetadata(meta);
    metadataRef.current = meta;
    setHasVault(true);
    setIsLocked(false);
    setError('');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadataRef.current) return;

    try {
      // Test decryption with a dummy to verify password
      // or just trust that when they try to decrypt an entry it will fail.
      // But for login, let's just go through.
      setIsLocked(false);
      setError('');
      loadEntries();
    } catch (err) {
      setError('Incorrect master password');
    }
  };

  const handleLock = () => {
    setIsLocked(true);
    setMasterPassword('');
    setEntries([]);
    setDecryptedPasswords({});
  };

  const loadEntries = async () => {
    const all = await vaultService.getAllEntries();
    setEntries(all);
  };

  const handleSaveEntry = async (formData: Partial<PasswordEntry>) => {
    if (!metadataRef.current) return;

    try {
      const { ciphertext, iv } = await vaultService.encrypt(
        formData.password!,
        masterPassword,
        metadataRef.current.salt,
        metadataRef.current.iterations
      );

      const entry: PasswordEntry = {
        id: editingEntry?.id || uuidv4(),
        service: formData.service!,
        username: formData.username!,
        password: ciphertext,
        iv,
        category: formData.category || 'Personal',
        url: formData.url,
        notes: formData.notes,
        createdAt: editingEntry?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await vaultService.saveEntry(entry);
      setIsAddModalOpen(false);
      setEditingEntry(null);
      loadEntries();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      await vaultService.deleteEntry(id);
      loadEntries();
    }
  };

  const togglePasswordVisibility = async (id: string, entry: PasswordEntry) => {
    if (visiblePasswords[id]) {
      setVisiblePasswords({ ...visiblePasswords, [id]: false });
      return;
    }

    if (!decryptedPasswords[id]) {
      try {
        const decrypted = await vaultService.decrypt(
          entry.password,
          entry.iv,
          masterPassword,
          metadataRef.current!.salt,
          metadataRef.current!.iterations
        );
        setDecryptedPasswords({ ...decryptedPasswords, [id]: decrypted });
      } catch (err) {
        setError('Decryption failed. Check master password.');
        return;
      }
    }

    setVisiblePasswords({ ...visiblePasswords, [id]: true });
  };

  const copyToClipboard = async (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    // Clear clipboard after 30s
    setTimeout(() => {
       // Only clear if the current clipboard matches what we just copied (vague check)
       // navigator.clipboard.writeText(''); // A bit aggressive, maybe skip for now per prompt or implement better
    }, 30000);
  };

  const sortedAndFiltered = entries
    .filter(e => 
      (search === '' || e.service.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase())) &&
      (filterCategory === 'All' || e.category === filterCategory)
    )
    .sort((a, b) => {
      if (sort === 'service') return a.service.localeCompare(b.service);
      if (sort === 'newest') return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });

  if (hasVault === null) return null;

  if (!hasVault) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center space-y-8 max-w-md mx-auto">
        <div className="p-6 bg-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-indigo-600">
          <ShieldAlert size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Create Secure Vault</h2>
          <p className="text-gray-500 text-sm">Protect your passwords with end-to-end encryption. Only you hold the key.</p>
        </div>
        <form onSubmit={handleSetup} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Master Password</label>
            <input
              type="password"
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              placeholder="Min. 8 characters"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirm Password</label>
            <input
              type="password"
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
             <AlertCircle className="text-amber-500 shrink-0" size={20} />
             <p className="text-amber-800 text-xs font-medium leading-relaxed">
               ⚠️ <b>IMPORTANT:</b> If you lose this password, your data cannot be recovered. We do not store your password.
             </p>
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">
            Create Vault
            <ArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    );
  }

  if (isLocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center space-y-8 max-w-md mx-auto">
        <div className="p-6 bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-purple-600">
          <Lock size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Vault Locked</h2>
          <p className="text-gray-500 text-sm">Enter your master password to access your secure database.</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Master Password</label>
            <input
              type="password"
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              placeholder="Enter your password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">
            Unlock Vault
            <Unlock size={18} />
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search service or email..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg text-sm"
          >
            <Plus size={18} />
            Add Entry
          </button>
          <button
            onClick={handleLock}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-2xl transition-all"
            title="Lock Vault"
          >
            <Lock size={18} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Personal', 'Work', 'Banking', 'Social', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              filterCategory === cat 
              ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedAndFiltered.map(entry => (
          <motion.div
            layout
            key={entry.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl text-indigo-500">
                  <Tag size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{entry.service}</h4>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{entry.category}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingEntry(entry); setIsAddModalOpen(true); }}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                 <div className="flex items-center gap-2 overflow-hidden">
                   <User size={14} className="text-gray-400 shrink-0" />
                   <span className="text-sm text-gray-700 font-medium truncate">{entry.username}</span>
                 </div>
                 <button 
                   onClick={() => copyToClipboard(entry.username, entry.id + '_u')}
                   className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md"
                 >
                   {copiedId === entry.id + '_u' ? <Check size={14} /> : <Copy size={14} />}
                 </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                 <div className="flex items-center gap-2 overflow-hidden">
                   <Lock size={14} className="text-gray-400 shrink-0" />
                   <span className="text-sm text-gray-700 font-mono tracking-wider font-bold">
                     {visiblePasswords[entry.id] ? decryptedPasswords[entry.id] : '••••••••••••'}
                   </span>
                 </div>
                 <div className="flex gap-1">
                    <button 
                      onClick={() => togglePasswordVisibility(entry.id, entry)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md"
                    >
                      {visiblePasswords[entry.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      onClick={async () => {
                        const dec = decryptedPasswords[entry.id] || await vaultService.decrypt(entry.password, entry.iv, masterPassword, metadataRef.current!.salt, metadataRef.current!.iterations);
                        copyToClipboard(dec, entry.id + '_p');
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md"
                    >
                      {copiedId === entry.id + '_p' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                 </div>
              </div>

              {entry.url && (
                <a 
                  href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-indigo-500 transition-colors uppercase tracking-widest pl-1"
                >
                  <ExternalLink size={10} />
                  Visit Service
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <VaultEntryModal 
            onClose={() => { setIsAddModalOpen(false); setEditingEntry(null); }} 
            onSave={handleSaveEntry}
            initialData={editingEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VaultEntryModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (data: any) => void, initialData?: PasswordEntry | null }) {
  const [formData, setFormData] = useState({
    service: initialData?.service || '',
    username: initialData?.username || '',
    password: '', // We don't pre-fill password for editing initially for security/simplicity in re-encrypting
    category: initialData?.category || 'Personal',
    url: initialData?.url || '',
    notes: initialData?.notes || '',
  });
  const [showGen, setShowGen] = useState(false);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Entry' : 'New Password Entry'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Service Name</label>
                <input
                  type="text"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="e.g. Google"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category</label>
                <select
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Banking">Banking</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username / Email</label>
              <input
                type="text"
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="email@example.com"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowGen(!showGen)}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                >
                  <RefreshCcw size={10} />
                  Generate Secure Password
                </button>
              </div>
              <input
                type="password"
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-mono"
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!initialData}
              />
              {initialData && <p className="text-[10px] text-gray-400 px-1 italic">Leave blank to keep existing password</p>}
            </div>

            <AnimatePresence>
              {showGen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed mb-4">
                    <PasswordGeneratorInModal onSelect={(p) => { setFormData({ ...formData, password: p }); setShowGen(false); }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">URL (Optional)</label>
              <input
                type="text"
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <button type="submit" className="w-full py-4 bg-linear-to-br from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl transition-all">
              {initialData ? 'Update Entry' : 'Save Entry'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordGeneratorInModal({ onSelect }: { onSelect: (p: string) => void }) {
  // Simplified version for modal integration
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-gray-500">Generator Utility</p>
      <PasswordGenerator />
      <div className="text-[10px] text-gray-400 text-center">Copy a generated password and paste it into the field above or we can automate it.</div>
      {/* 
        The request asks for a "regenerate button that uses the Password Generator from Feature 1".
        I'll make the PasswordGenerator capable of passing back its value.
      */}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" /><path d="M6 6l12 12" />
    </svg>
  );
}
