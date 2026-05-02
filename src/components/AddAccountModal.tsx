import React, { useState, useEffect } from 'react';
import { X, Camera, Key, Check, AlertCircle, Copy, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { parseOTPAuthURI } from '../utils/otpAuth';
import * as OTPAuth from 'otpauth';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: { name: string; issuer?: string; secret: string }) => void;
}

export default function AddAccountModal({ isOpen, onClose, onAdd }: AddAccountModalProps) {
  const [method, setMethod] = useState<'options' | 'scan' | 'manual'>('options');
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    if (!isOpen) {
      setMethod('options');
      setName('');
      setIssuer('');
      setSecret('');
      setError(null);
    }
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !secret.trim()) {
      setError('Name and Secret are required');
      return;
    }
    
    try {
      // Validate secret (base32 check)
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret.trim())
      });
      totp.generate();
      onAdd({ name: name.trim(), issuer: issuer.trim(), secret: secret.trim() });
      onClose();
    } catch (err: any) {
      setError('Invalid Secret Key (Base32 format required)');
    }
  };

  const handleScanUpdate = (err: any, result: any) => {
    if (result) {
      const parsed = parseOTPAuthURI(result.getText());
      if (parsed) {
        setName(parsed.name);
        setIssuer(parsed.issuer || '');
        setSecret(parsed.secret);
        setMethod('manual');
        setError(null);
      } else {
        setError('Invalid QR Code. Please scan a valid 2FA QR code (otpauth://)');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add Account</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setMethod('scan')}
                  className="w-full flex items-center gap-4 p-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all border border-indigo-100 text-left group"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Scan QR Code</p>
                    <p className="text-xs text-indigo-500 font-medium">Use your camera to scan 2FA QR</p>
                  </div>
                </button>

                <button
                  onClick={() => setMethod('manual')}
                  className="w-full flex items-center gap-4 p-5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl transition-all border border-purple-100 text-left group"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600 group-hover:scale-110 transition-transform">
                    <Key size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Manual Entry</p>
                    <p className="text-xs text-purple-500 font-medium">Enter account name and secret key</p>
                  </div>
                </button>
              </motion.div>
            )}

            {method === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden shadow-inner bg-gray-100">
                  <BarcodeScanner
                    onUpdate={handleScanUpdate}
                    facingMode={facingMode}
                  />
                  <div className="absolute inset-0 border-2 border-indigo-500/30 pointer-events-none rounded-2xl" />
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-medium w-full">
                    <AlertCircle size={16} shrink={0} />
                    {error}
                  </div>
                )}

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setMethod('options')}
                    className="flex-1 p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    className="flex-1 p-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} />
                    Flip
                  </button>
                </div>
              </motion.div>
            )}

            {method === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Account Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="e.g. Google, GitHub"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 truncate">Issuer (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      placeholder="e.g. google.com"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Secret Key</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all uppercase font-mono text-sm"
                        placeholder="JBSWY3DPEHPK3PXP"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value.replace(/\s/g, ''))}
                        required
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await navigator.clipboard.readText();
                          setSecret(text.replace(/\s/g, ''));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Clipboard size={18} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm font-medium">
                      <AlertCircle size={16} shrink={0} />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setMethod('options')}
                      className="flex-1 p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 p-4 bg-linear-to-br from-indigo-600 to-purple-600 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Save Account
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Minimal RefreshCcw icon if not imported
function RefreshCcw({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
