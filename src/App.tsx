/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, RefreshCcw, QrCode, Trash2, Link as LinkIcon, Type, Image as ImageIcon, X, Palette, Mail, MessageSquare, LifeBuoy, FileText, Wifi, Shield, Lock, Unlock, User, Phone, Briefcase, Globe, MapPin, Contact2, Building2, Scan, Camera, Check, ExternalLink, Copy, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { Html5Qrcode } from 'html5-qrcode';
import TOTPDashboard from './components/TOTPDashboard';
import PasswordGenerator from './components/PasswordGenerator';
import PasswordVault from './components/PasswordVault';

export default function App() {
  const [mode, setMode] = useState<'standard' | 'email' | 'wifi' | 'contact' | 'scan' | 'authenticator' | 'passwords'>('standard');
  const [passwordSubMode, setPasswordSubMode] = useState<'generator' | 'vault'>('generator');
  const [text, setText] = useState('');
  
  // Email state
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Wi-Fi state
  const [ssid, setSsid] = useState('');
  const [security, setSecurity] = useState('WPA');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(false);

  // Contact (vCard) state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactUrl, setContactUrl] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactNote, setContactNote] = useState('');

  const [qrValue, setQrValue] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Scanner state
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [imageScanError, setImageScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    let finalValue = '';
    
    if (mode === 'standard') {
      if (text.trim()) finalValue = text;
    } else if (mode === 'email') {
      if (recipient.trim()) {
        const encodedSubject = encodeURIComponent(subject.trim());
        const encodedBody = encodeURIComponent(body.trim());
        finalValue = `mailto:${recipient.trim()}?subject=${encodedSubject}&body=${encodedBody}`;
      }
    } else if (mode === 'wifi') {
      if (ssid.trim()) {
        const t = security === 'None' ? 'nopass' : security;
        const parts = [
          `S:${ssid}`,
          `T:${t}`,
          ...(security !== 'None' ? [`P:${password}`] : []),
          ...(hidden ? [`H:true`] : [])
        ];
        finalValue = `WIFI:${parts.join(';')};;`;
      }
    } else if (mode === 'contact') {
      if (contactName.trim()) {
        const vcard = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${contactName.trim()}`,
          contactPhone.trim() ? `TEL:${contactPhone.trim()}` : '',
          contactEmail.trim() ? `EMAIL:${contactEmail.trim()}` : '',
          contactOrg.trim() ? `ORG:${contactOrg.trim()}` : '',
          contactTitle.trim() ? `TITLE:${contactTitle.trim()}` : '',
          contactUrl.trim() ? `URL:${contactUrl.trim()}` : '',
          contactAddress.trim() ? `ADR:${contactAddress.trim()}` : '',
          contactNote.trim() ? `NOTE:${contactNote.trim()}` : '',
          'END:VCARD'
        ].filter(Boolean).join('\n');
        finalValue = vcard;
      }
    }

    if (finalValue) {
      setIsGenerating(true);
      setTimeout(() => {
        setQrValue(finalValue);
        setIsGenerating(false);
      }, 500);
    }
  };

  const applyTemplate = (type: 'newsletter' | 'feedback' | 'support') => {
    switch (type) {
      case 'newsletter':
        setSubject('Newsletter Signup Request');
        setBody('Please add me to your newsletter mailing list. Thank you!');
        break;
      case 'feedback':
        setSubject('Feedback about your service/product');
        setBody('I would like to share my feedback about my recent experience. Here are my thoughts...');
        break;
      case 'support':
        setSubject('Support Assistance Needed');
        setBody('I need help with an issue. Please assist me at your earliest convenience.');
        break;
    }
  };

  const applyContactTemplate = (type: 'personal' | 'business' | 'cafe') => {
    switch (type) {
      case 'personal':
        setContactName('John Doe');
        setContactPhone('+1 234 567 8900');
        setContactEmail('john@personal.com');
        setContactOrg('');
        setContactTitle('');
        setContactUrl('www.johndoe.me');
        setContactAddress('123 Home St, City, Country');
        setContactNote('Personal contact details');
        break;
      case 'business':
        setContactName('Alice Smith');
        setContactPhone('+44 20 7946 0958');
        setContactEmail('alice.smith@corporate.com');
        setContactOrg('Tech Solutions Inc.');
        setContactTitle('Product Manager');
        setContactUrl('www.techsolutions.com');
        setContactAddress('45 Business Square, London, UK');
        setContactNote('Contact for business inquiries');
        break;
      case 'cafe':
        setContactName('The Morning Brew');
        setContactPhone('+971 4 123 4567');
        setContactEmail('info@morningbrew.cafe');
        setContactOrg('Morning Brew Coffee House');
        setContactTitle('Customer Service');
        setContactUrl('www.morningbrew.cafe');
        setContactAddress('Khalifa St, Downtown, Dubai');
        setContactNote('Open daily 7 AM - 10 PM. Best coffee in town!');
        break;
    }
  };

  const handleClear = () => {
    setText('');
    setRecipient('');
    setSubject('');
    setBody('');
    setSsid('');
    setSecurity('WPA');
    setPassword('');
    setHidden(false);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactOrg('');
    setContactTitle('');
    setContactUrl('');
    setContactAddress('');
    setContactNote('');
    setQrValue('');
    setLogoUrl(null);
    setFgColor('#000000');
    setBgColor('#ffffff');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageScanning(true);
    setImageScanError(null);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-container");
      const result = await html5QrCode.scanFile(file, true);
      setScanResult(result);
      setIsImageScanning(false);
    } catch (err: any) {
      console.error("Image scan error:", err);
      setImageScanError("No QR code found in this image. Please try another.");
      setIsImageScanning(false);
    }
    
    if (qrImageInputRef.current) qrImageInputRef.current.value = '';
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('#qr-preview-container canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        const now = new Date();
        const timestamp = now.getFullYear().toString() + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + 
                         now.getDate().toString().padStart(2, '0') + '_' + 
                         now.getHours().toString().padStart(2, '0') + 
                         now.getMinutes().toString().padStart(2, '0') + 
                         now.getSeconds().toString().padStart(2, '0');
        downloadLink.download = `qrcode_${timestamp}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (error) {
        console.error("Download failed:", error);
      }
    }
  };

  const copyQRCode = async () => {
    const canvas = document.querySelector('#qr-preview-container canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
        if (blob) {
          const data = [new ClipboardItem({ 'image/png': blob })];
          await navigator.clipboard.write(data);
          setShowCopied(true);
          setTimeout(() => setShowCopied(false), 2000);
        }
      } catch (error) {
        console.error("Copy failed:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <QrCode size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">QR Generator</h1>
                <p className="text-gray-500 font-medium">Create instant QR codes for anything</p>
              </div>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-2xl w-full lg:w-auto overflow-x-auto shadow-inner scrollbar-hide">
              {(['standard', 'email', 'wifi', 'contact', 'scan', 'authenticator', 'passwords'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    if (m !== 'scan') {
                      setScanResult(null);
                      setCameraError(null);
                      setIsCameraActive(false);
                    }
                  }}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    mode === m 
                      ? 'bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'standard' ? 'Standard' : m === 'email' ? 'Email' : m === 'wifi' ? 'Wi-Fi' : m === 'contact' ? 'Contact' : m === 'scan' ? 'Scan QR' : m === 'authenticator' ? 'Authenticator' : 'Passwords'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Input Section */}
            <AnimatePresence mode="wait">
              {mode === 'standard' ? (
                <motion.div
                  key="standard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  <label htmlFor="qr-input" className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                    <LinkIcon size={14} />
                    Input Data
                  </label>
                  <textarea
                    id="qr-input"
                    className="w-full p-5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-32 text-gray-800 placeholder-gray-400 font-medium resize-none shadow-sm"
                    placeholder="Paste URL, email, or text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </motion.div>
              ) : mode === 'email' ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Mail size={14} />
                        Recipient Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="hello@example.com"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <FileText size={14} />
                        Subject Line
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="Email subject..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Email Body
                    </label>
                    <textarea
                      className="w-full p-5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-24 text-gray-800 placeholder-gray-400 font-medium resize-none shadow-sm"
                      placeholder="Type your message here..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>
                  
                  {/* Email Templates */}
                  <div className="flex flex-wrap gap-2 pt-1 font-sans">
                    <button
                      onClick={() => applyTemplate('newsletter')}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2 rounded-xl border border-purple-200 transition-all flex items-center gap-2"
                    >
                      📧 Newsletter Signup
                    </button>
                    <button
                      onClick={() => applyTemplate('feedback')}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl border border-indigo-200 transition-all flex items-center gap-2"
                    >
                      ⭐ Feedback Request
                    </button>
                    <button
                      onClick={() => applyTemplate('support')}
                      className="bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold px-4 py-2 rounded-xl border border-pink-200 transition-all flex items-center gap-2"
                    >
                      🛠️ Support Request
                    </button>
                  </div>
                </motion.div>
              ) : mode === 'wifi' ? (
                <motion.div
                  key="wifi"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Wifi size={14} />
                        Network Name (SSID)
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="My Awesome WiFi"
                        value={ssid}
                        onChange={(e) => setSsid(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Shield size={14} />
                        Security Type
                      </label>
                      <select
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 font-medium shadow-sm appearance-none"
                        value={security}
                        onChange={(e) => setSecurity(e.target.value)}
                      >
                        <option value="WPA">WPA/WPA2/WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="None">None (Open)</option>
                      </select>
                    </div>
                  </div>
                  
                  {security !== 'None' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Lock size={14} />
                        Wi-Fi Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={hidden}
                          onChange={(e) => setHidden(e.target.checked)}
                        />
                        <div className={`w-5 h-5 border-2 rounded-lg transition-all ${hidden ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white group-hover:border-indigo-400'}`}>
                          {hidden && <X size={14} className="text-white mx-auto mt-0.5" />}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-600">Hidden Network</span>
                    </label>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                    <LifeBuoy size={20} className="text-indigo-500 shrink-0" />
                    <p className="text-indigo-700 text-xs leading-relaxed font-medium">
                      Scan this QR code with your phone's camera. Your phone will automatically connect to the Wi-Fi network without typing the password.
                    </p>
                  </div>
                </motion.div>
              ) : mode === 'contact' ? (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <User size={14} />
                        Full Name (Required)
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="John Doe"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Phone size={14} />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="+92 300 1234567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Mail size={14} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="john@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Building2 size={14} />
                        Company
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="Organization Name"
                        value={contactOrg}
                        onChange={(e) => setContactOrg(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Briefcase size={14} />
                        Job Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="Project Manager"
                        value={contactTitle}
                        onChange={(e) => setContactTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Globe size={14} />
                        Website
                      </label>
                      <input
                        type="url"
                        className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                        placeholder="https://example.com"
                        value={contactUrl}
                        onChange={(e) => setContactUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                      <MapPin size={14} />
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                      placeholder="Street, City, Country"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                      <Type size={14} />
                      Notes
                    </label>
                    <textarea
                      className="w-full p-5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-24 text-gray-800 placeholder-gray-400 font-medium resize-none shadow-sm"
                      placeholder="Additional information..."
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                    />
                  </div>
                  
                  {/* Contact Templates */}
                  <div className="flex flex-wrap gap-2 pt-1 font-sans">
                    <button
                      onClick={() => applyContactTemplate('personal')}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2 rounded-xl border border-emerald-200 transition-all flex items-center gap-2"
                    >
                      📇 Personal Contact
                    </button>
                    <button
                      onClick={() => applyContactTemplate('business')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-xl border border-blue-200 transition-all flex items-center gap-2"
                    >
                      🏢 Business Contact
                    </button>
                    <button
                      onClick={() => applyContactTemplate('cafe')}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold px-4 py-2 rounded-xl border border-amber-200 transition-all flex items-center gap-2"
                    >
                      ☕ Cafe Contact
                    </button>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                    <Contact2 size={20} className="text-indigo-500 shrink-0" />
                    <p className="text-indigo-700 text-xs leading-relaxed font-medium">
                      Scan this QR code with your phone's camera. The contact information will be saved directly to your phone's address book.
                    </p>
                  </div>
                </motion.div>
              ) : mode === 'scan' ? (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-50">
                    {cameraError ? (
                      <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                        <X size={48} className="text-red-500 mb-4" />
                        <p className="text-gray-800 font-bold mb-2">Camera Access Error</p>
                        <p className="text-gray-500 text-sm">{cameraError}</p>
                        <button 
                          onClick={() => {
                            setCameraError(null);
                            setIsCameraActive(true);
                          }}
                          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : !isCameraActive ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50/80 backdrop-blur-sm">
                        <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 mb-4">
                          <Camera size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Scan?</h3>
                        <p className="text-gray-500 text-xs mb-6">Camera permission is required to scan QR codes instantly.</p>
                        <button
                          onClick={() => setIsCameraActive(true)}
                          className="w-full py-4 bg-linear-to-br from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Camera size={20} />
                          Start Camera
                        </button>
                      </div>
                    ) : (
                      <>
                        {!isScannerInitialized && (
                          <div className="absolute inset-0 z-10 bg-gray-50 flex flex-col items-center justify-center gap-3">
                            <RefreshCcw className="animate-spin text-indigo-600" size={32} />
                            <p className="text-indigo-600 font-bold text-sm">Initializing camera...</p>
                          </div>
                        )}
                        <div className="w-full h-full relative">
                          <BarcodeScanner
                            onUpdate={(err, result) => {
                              if (result) {
                                setScanResult(result.getText());
                              }
                              if (err) {
                                const error = err as any;
                                const errorMessage = typeof err === 'string' ? err : (error.message || '');
                                
                                if (errorMessage.includes('Permission denied')) {
                                  setCameraError('Camera access denied. Please allow camera permission in your browser settings.');
                                  setIsCameraActive(false);
                                } else if (
                                  error.name !== 'NotFoundException' && 
                                  !errorMessage.includes('No MultiFormat Readers') &&
                                  !errorMessage.includes('NotFoundException')
                                ) {
                                  console.error('Scanner error:', err);
                                }
                              }
                              if (!isScannerInitialized) setIsScannerInitialized(true);
                            }}
                            facingMode={facingMode}
                          />
                        </div>
                        {/* Scanning Brackets */}
                        <div className="absolute inset-x-12 inset-y-12 border-2 border-indigo-400 opacity-50 rounded-2xl pointer-events-none">
                          <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 border-2 border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isCameraActive && !cameraError && (
                      <>
                        <button
                          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                          className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
                        >
                          <Camera size={18} />
                          Switch
                        </button>
                        <button
                          onClick={() => {
                            setIsCameraActive(false);
                            setIsScannerInitialized(false);
                          }}
                          className="p-3 bg-white border border-gray-200 rounded-2xl text-red-500 hover:bg-red-50 border-red-100 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
                        >
                          <X size={18} />
                          Stop
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                    <input
                      type="file"
                      ref={qrImageInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => qrImageInputRef.current?.click()}
                      disabled={isImageScanning}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 text-gray-700 rounded-2xl font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {isImageScanning ? <RefreshCcw size={18} className="animate-spin text-indigo-600" /> : <ImageIcon size={18} />}
                      {isImageScanning ? 'Scanning QR code from image...' : '📸 Upload QR Code Image'}
                    </button>
                    
                    {imageScanError && (
                      <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <AlertCircle size={14} />
                        {imageScanError}
                      </div>
                    )}
                  </div>

                  <div id="qr-reader-container" style={{ display: 'none' }}></div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 max-w-sm">
                    <Scan size={20} className="text-indigo-500 shrink-0" />
                    <p className="text-indigo-700 text-xs leading-relaxed font-medium">
                      Point your camera at a QR code to decode it. Supports URLs, text, and formatted data.
                    </p>
                  </div>
                </motion.div>
              ) : mode === 'authenticator' ? (
                <motion.div
                  key="authenticator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TOTPDashboard />
                </motion.div>
              ) : (
                <motion.div
                  key="passwords"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Passwords Sub-Navigation */}
                  <div className="flex justify-center mb-6">
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => setPasswordSubMode('generator')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          passwordSubMode === 'generator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <RefreshCcw size={14} />
                        Generator
                      </button>
                      <button
                        onClick={() => setPasswordSubMode('vault')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          passwordSubMode === 'vault' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Lock size={14} />
                        Secure Vault
                      </button>
                    </div>
                  </div>

                  {passwordSubMode === 'generator' ? (
                    <PasswordGenerator />
                  ) : (
                    <PasswordVault />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions (Hidden in Scan/Authenticator/Passwords Mode) */}
            {mode !== 'scan' && mode !== 'authenticator' && mode !== 'passwords' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4 col-span-full">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Logo Upload */}
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <ImageIcon size={14} />
                        Center Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                          id="logo-upload"
                        />
                        {!logoUrl ? (
                          <label
                            htmlFor="logo-upload"
                            className="flex-1 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all rounded-2xl py-3 flex items-center justify-center gap-2 cursor-pointer text-gray-400 font-bold text-sm bg-gray-50/20"
                          >
                            <ImageIcon size={16} />
                            Upload
                          </label>
                        ) : (
                          <div className="flex-1 flex items-center gap-3 bg-indigo-50 p-2 rounded-2xl border border-indigo-100">
                            <div className="w-10 h-10 rounded-lg bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="flex-1 text-xs font-bold text-indigo-700 truncate">Logo added</span>
                            <button 
                              onClick={removeLogo}
                              className="p-1.5 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Palette size={14} />
                        Custom Colors
                      </label>
                      <div className="flex items-center gap-4 p-2 bg-gray-50/50 border border-gray-200 rounded-2xl">
                        <div className="flex-1 flex items-center gap-2 px-1">
                          <div className="relative">
                            <input 
                              type="color" 
                              value={fgColor} 
                              onChange={(e) => setFgColor(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Module</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex-1 flex items-center gap-2 px-1 text-right justify-end">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">BG</span>
                          <div className="relative">
                            <input 
                              type="color" 
                              value={bgColor} 
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={
                    (mode === 'standard' ? !text.trim() : 
                     mode === 'email' ? !recipient.trim() : 
                     mode === 'wifi' ? !ssid.trim() : 
                     !contactName.trim()) || isGenerating
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2 cursor-pointer col-span-1"
                >
                  <motion.div
                    animate={isGenerating ? { rotate: 360 } : {}}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <RefreshCcw size={20} />
                  </motion.div>
                  {isGenerating ? 'Generating...' : 'Generate QR Code'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#fee2e2' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClear}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 px-6 rounded-2xl border border-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer col-span-1"
                >
                  <Trash2 size={20} />
                  Clear
                </motion.button>
              </div>
            )}

            {/* Output Section (Hidden in Scan/Authenticator/Passwords Mode) */}
            <AnimatePresence mode="wait">
              {qrValue && mode !== 'scan' && mode !== 'authenticator' && mode !== 'passwords' && (
                <motion.div
                  key={qrValue + (logoUrl || '') + fgColor + bgColor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="pt-10 border-t border-gray-100 flex flex-col items-center"
                >
                  <div 
                    id="qr-preview-container"
                    className="p-6 rounded-3xl shadow-xl border border-gray-100 mb-8 relative group"
                    style={{ backgroundColor: bgColor }}
                  >
                    <QRCodeCanvas
                      value={qrValue}
                      size={240}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H"
                      includeMargin={true}
                      imageSettings={logoUrl ? {
                        src: logoUrl,
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        excavate: true,
                      } : undefined}
                    />
                    <div className="absolute inset-0 rounded-3xl bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  
                  <div className="flex flex-col items-center gap-6 w-full">
                    <div className="bg-gray-100/50 px-4 py-2 rounded-full border border-gray-200">
                      <p className="text-gray-500 text-xs font-semibold flex items-center gap-2">
                        <Type size={14} className="text-indigo-500" />
                        <span className="uppercase tracking-wider">Preview:</span>
                        <span className="text-gray-900 font-bold truncate max-w-[240px]">{qrValue}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm relative">
                      <AnimatePresence>
                        {showCopied && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -40 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none z-50 whitespace-nowrap"
                          >
                            QR code copied to clipboard!
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadQRCode}
                        className="flex-1 w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fas fa-download text-lg"></i>
                        <span>Download PNG</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copyQRCode}
                        className="flex-1 w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fas fa-copy text-lg"></i>
                        <span>Copy QR</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!qrValue && mode !== 'scan' && mode !== 'authenticator' && mode !== 'passwords' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/30"
              >
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <QrCode size={40} strokeWidth={1} className="opacity-30" />
                </div>
                <p className="font-semibold text-sm">Your generated QR will appear here</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Scan Result Modal */}
        <AnimatePresence>
          {scanResult && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                        <Check size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Scan Successful!</h3>
                    </div>
                    <button 
                      onClick={() => setScanResult(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                        Decoded Content
                      </label>
                      
                      {scanResult && /^(https?:\/\/)/i.test(scanResult) ? (
                        <div className="space-y-4">
                          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl break-all">
                            <a 
                              href={scanResult} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 group"
                            >
                              <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm shrink-0">
                                <Globe size={18} />
                              </div>
                              <span className="text-indigo-600 font-bold hover:underline leading-tight py-1 transition-all">
                                {scanResult}
                              </span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl break-all font-mono text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto scrollbar-hide">
                          {scanResult}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {scanResult && /^(https?:\/\/)/i.test(scanResult) && (
                        <button
                          onClick={() => window.open(scanResult, '_blank')}
                          className="flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                        >
                          <ExternalLink size={18} />
                          Open Link
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (scanResult) navigator.clipboard.writeText(scanResult);
                        }}
                        className={`flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 text-gray-700 rounded-2xl font-bold transition-all shadow-sm ${scanResult && !/^(https?:\/\/)/i.test(scanResult) ? 'col-span-2' : ''}`}
                      >
                        <Copy size={18} />
                        Copy Content
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setText(scanResult);
                        setMode('standard');
                        setScanResult(null);
                        handleGenerate();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-linear-to-br from-indigo-600 to-purple-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
                    >
                      <RefreshCcw size={18} />
                      Generate from this data
                    </button>

                    <button
                      onClick={() => setScanResult(null)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-bold transition-all border border-gray-200"
                    >
                      Scan Another QR
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="bg-gray-900 px-8 py-6 text-center space-y-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Instant Client-Side Encoding • Private & Secure
          </p>
          <div className="flex items-center justify-center gap-6">
            <a href="privacy.html" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors">Privacy Policy</a>
            <a href="terms.html" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors">Terms of Service</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


