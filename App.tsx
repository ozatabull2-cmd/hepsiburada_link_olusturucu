
import React, { useState, useRef, useEffect } from 'react';
import { Campaign, SiteSettings, WPSettings } from './types';
import { DEFAULT_CAMPAIGNS, DISCOUNT_PRESETS } from './constants';
import { CampaignCard } from './components/CampaignCard';
import { generateStandaloneHTML } from './services/htmlGenerator';
import { updateWordPressPage } from './services/wordpressService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const defaultSettings = {
    pageTitle: 'Özel İndirim Rehberim',
    description: 'En sevilen markalarda bugüne özel Hepsiburada fırsatlarını senin için listeledim.',
    headerImageUrl: '',
    primaryColor: '#FF6000'
  };

  const defaultWPSettings = {
    siteUrl: '',
    pageId: '',
    username: '',
    appPassword: ''
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>(DEFAULT_CAMPAIGNS);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [wpSettings, setWPSettings] = useState<WPSettings>(defaultWPSettings);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First try to load from local file system (works in local dev)
        const res = await fetch('/api/db');
        if (!res.ok) throw new Error('API not available');
        const data = await res.json();

        if (data && Object.keys(data).length > 0) {
          if (data.campaigns) setCampaigns(data.campaigns);
          if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
          if (data.wpSettings) setWPSettings({ ...defaultWPSettings, ...data.wpSettings });
        } else {
          // Migration: If DB exists but is empty, try to fill from localStorage once
          migrateFromLocalStorage();
        }
      } catch (err) {
        // Fallback: If API fails (e.g. on Vercel), load from localStorage
        console.log('Running in static mode, loading from localStorage');
        migrateFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    const migrateFromLocalStorage = () => {
      const savedCampaigns = localStorage.getItem('campaigns');
      const savedSettings = localStorage.getItem('siteSettings');
      const savedWPSettings = localStorage.getItem('wpSettings');

      if (savedCampaigns) setCampaigns(JSON.parse(savedCampaigns));
      if (savedSettings) setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      if (savedWPSettings) setWPSettings({ ...defaultWPSettings, ...JSON.parse(savedWPSettings) });
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Try saving to file system first
      const data = { campaigns, settings, wpSettings };
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('API not available');
      }).catch(() => {
        // Fallback: Save to localStorage if API fails
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        localStorage.setItem('siteSettings', JSON.stringify(settings));
        localStorage.setItem('wpSettings', JSON.stringify(wpSettings));
      });
    }
  }, [campaigns, settings, wpSettings, loading]);

  const [wpStatus, setWpStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [wpMessage, setWpMessage] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Campaign, 'id'>>({
    title: '',
    discountType: '',
    description: '',
    link: '',
    imageUrl: '',
    buttonText: 'Fırsatı Yakala',
    accentColor: '#FF6000',
    isActive: true
  });

  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSmartButtonText = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('telefon') || t.includes('bilgisayar') || t.includes('elektronik')) return 'Ürünleri Gör';
    if (t.includes('giyim') || t.includes('moda') || t.includes('elbise')) return 'Fırsatı Gör';
    if (t.includes('kitap')) return 'Hemen Tıkla';
    if (t.includes('ev') || t.includes('mobilya')) return 'Ürünleri İncele';
    if (t.includes('anne') || t.includes('bebek')) return 'Fırsatları Gör';
    if (t.includes('kozmetik')) return 'Hemen Gör';
    return 'Hemen İncele';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
      const updates: any = { [name]: val };

      // Smart Auto-Fill Logic
      if (name === 'title' && typeof val === 'string') {
        // Auto-update button text if it hasn't been manually heavily edited (or is default)
        if (!prev.buttonText || prev.buttonText === 'Fırsatı Yakala' || prev.buttonText === 'Hemen İncele' || prev.buttonText === 'Fırsatı İncele') {
          updates.buttonText = getSmartButtonText(val);
        }

        // Auto-fetch image URL if empty or using previous auto-generated URL
        if (!prev.imageUrl || prev.imageUrl.includes('loremflickr.com')) {
          // Use English keywords for better results if possible, but Turkish works okay on some services.
          // LoremFlickr is good. 
          // We use a timestamp to prevent caching the same image for same query if they type
          const keyword = val.split(' ')[0] || 'shopping'; // Use first word as main keyword
          updates.imageUrl = `https://loremflickr.com/800/600/${encodeURIComponent(keyword)}?lock=${Math.floor(Math.random() * 1000)}`;
        }
      }

      return { ...prev, ...updates };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const setDiscountPreset = (val: string) => {
    setFormData(prev => ({ ...prev, discountType: val }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleWPSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWPSettings(prev => ({ ...prev, [name]: value }));
  };

  const updateWP = async () => {
    if (!wpSettings.siteUrl || !wpSettings.pageId) {
      alert('Lütfen WordPress Site URL ve Sayfa ID alanlarını doldurun.');
      return;
    }
    setWpStatus('loading');
    setWpMessage('Güncelleniyor...');
    const result = await updateWordPressPage(campaigns, settings, wpSettings);
    setWpStatus(result.success ? 'success' : 'error');
    setWpMessage(result.message);

    if (result.success) {
      setTimeout(() => {
        setWpStatus('idle');
        setWpMessage('');
      }, 5000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setCampaigns(prev => prev.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
      setEditingId(null);
    } else {
      setCampaigns(prev => [...prev, { ...formData, id: Math.random().toString(36).substr(2, 9) }]);
    }
    setFormData({
      title: '',
      discountType: '',
      description: '',
      link: '',
      imageUrl: '',
      buttonText: 'Fırsatı Yakala',
      accentColor: '#FF6000',
      isActive: true
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = (id: string) => {
    if (confirm('Kaldırmak istediğine emin misin?')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      title: campaign.title,
      discountType: campaign.discountType,
      description: campaign.description || '',
      link: campaign.link,
      imageUrl: campaign.imageUrl,
      buttonText: campaign.buttonText,
      accentColor: campaign.accentColor,
      isActive: campaign.isActive
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyHTML = () => {
    const html = generateStandaloneHTML(campaigns, settings);
    navigator.clipboard.writeText(html).then(() => {
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-['Inter']">
      {/* Sidebar Editor */}
      <aside className="w-full lg:w-[450px] bg-white border-r border-slate-200 overflow-y-auto h-screen sticky top-0 flex flex-col shadow-2xl z-30">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-xl shadow-orange-100 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 00(5.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">HB Builder</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Influencer Pro</p>
            </div>
          </div>
        </div>

        <div className="flex-grow p-8 space-y-10 scrollbar-hide">
          {/* Dashboard List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> Yayınlananlar
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">{campaigns.length} Kart</span>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
              {campaigns.map(c => (
                <div key={c.id} className={`group flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-300 ${editingId === c.id ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-50' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}>
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative shrink-0">
                      <img src={c.imageUrl} className={`w-12 h-12 rounded-xl object-cover shadow-sm transition-all ${c.isActive ? '' : 'grayscale'}`} alt="" />
                      {!c.isActive && <div className="absolute inset-0 bg-black/20 rounded-xl"></div>}
                    </div>
                    <div className="truncate">
                      <p className={`text-sm font-black truncate tracking-tight ${c.isActive ? 'text-slate-800' : 'text-slate-400 italic'}`}>{c.title}</p>
                      <p className="text-[10px] font-bold text-orange-500 truncate mt-0.5">{c.discountType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleCampaignStatus(c.id)}
                      className={`p-2 rounded-xl transition-all ${c.isActive ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-200 hover:bg-slate-300'}`}
                      title={c.isActive ? 'İndirimi Kapat' : 'İndirimi Aç'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                      title="Düzenle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                      title="Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Form Section */}
          <section ref={formRef} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center justify-between">
              {editingId ? 'İçeriği Güncelle' : 'Yeni Fırsat Kartı'}
              {editingId && (
                <button onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    discountType: '',
                    description: '',
                    link: '',
                    imageUrl: '',
                    buttonText: 'Fırsatı Yakala',
                    accentColor: '#FF6000',
                    isActive: true
                  });
                }} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors">Vazgeç</button>
              )}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Başlık / Marka / Kategori</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none bg-white transition-all font-semibold"
                    placeholder="Örn: Xiaomi Telefonlar"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">İndirim Mesajı</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {DISCOUNT_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setDiscountPreset(preset.value)}
                        className={`text-[10px] font-black py-2 rounded-xl transition-all border ${formData.discountType === preset.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none bg-white transition-all font-black text-orange-600 italic tracking-tighter"
                    placeholder="Veya kendin yaz..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Kart Açıklaması (Manuel)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none bg-white transition-all font-medium h-24 resize-none"
                    placeholder="Takipçilerin için özel bir not yaz..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-2">Hepsiburada Affiliate Linki</label>
                  <input
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-orange-100 text-xs focus:border-orange-500 outline-none bg-white transition-all font-mono"
                    placeholder="https://www.hepsiburada.com/..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Buton Yazısı</label>
                  <input
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:ring-4 focus:ring-slate-100 outline-none bg-white transition-all font-bold text-slate-700"
                    placeholder="Örn: Hemen İncele"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ürün Görseli</label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-xs bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 font-bold text-slate-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      Görsel Yükle
                    </button>

                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black text-slate-300 uppercase">VEYA URL</span>
                      <input
                        name="imageUrl"
                        value={formData.imageUrl.startsWith('data:') ? 'Dosya yüklendi (Base64)' : formData.imageUrl}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-100 text-[10px] bg-slate-50 text-slate-400 italic"
                        placeholder="Resim linki yapıştır..."
                      />
                    </div>

                    {formData.imageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-inner group">
                        <img src={formData.imageUrl} alt="Önizleme" className="w-full h-full object-cover" />

                        {formData.imageUrl.includes('loremflickr') && (
                          <button
                            type="button"
                            onClick={() => {
                              const keyword = formData.title.split(' ')[0] || 'shopping';
                              setFormData(prev => ({
                                ...prev,
                                imageUrl: `https://loremflickr.com/800/600/${encodeURIComponent(keyword)}?lock=${Math.floor(Math.random() * 1000)}`
                              }));
                            }}
                            className="absolute top-2 left-2 p-1.5 bg-white/90 text-slate-700 rounded-lg shadow-lg hover:bg-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            YENİ GÖRSEL
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveForm"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-6 h-6 rounded-lg border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="isActiveForm" className="text-xs font-black text-slate-700 select-none cursor-pointer">KAMPANYA AKTİF</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">RENK</label>
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleInputChange}
                      className="w-10 h-10 p-0 border-none rounded-xl cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-2xl hover:bg-black transition-all transform active:scale-95 tracking-widest uppercase"
              >
                {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'LİSTEYE EKLE'}
              </button>
            </form>
          </section>

          {/* Site Settings */}
          <section className="border-t border-slate-100 pt-10">
            <h2 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.3em]">Sayfa Görünümü</h2>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">WEB SİTESİ BAŞLIĞI</label>
                <input
                  name="pageTitle"
                  value={settings.pageTitle}
                  onChange={handleSettingsChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-black"
                  placeholder="Örn: Ayın Fırsatları"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">AÇIKLAMA METNİ</label>
                <textarea
                  name="description"
                  value={settings.description}
                  onChange={handleSettingsChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm h-28 resize-none font-medium leading-relaxed"
                  placeholder="Takipçilerine kısa bir mesaj yaz..."
                />
              </div>
            </div>
          </section>

          {/* WordPress Settings */}
          <section className="border-t border-slate-100 pt-10">
            <h2 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.0006 20.9168C10.6698 20.9168 9.4005 20.597 8.27218 20.0336L11.5235 10.1558L10.2223 10.1604L6.44754 20.0195C5.10959 18.9644 4.09522 17.5323 3.56519 15.9038C3.03073 14.2616 2.99966 12.4996 3.47565 10.8354C3.95163 9.17117 4.91266 7.68114 6.23612 6.55743C7.55958 5.43373 9.18525 4.72705 10.9066 4.52802C12.628 4.32898 14.3667 4.64676 15.8997 5.44087C17.4326 6.23499 18.6896 7.46914 19.5103 8.98687C20.3309 10.5046 20.6775 12.2367 20.5057 13.962C20.334 15.6873 19.6517 17.3276 18.5463 18.672L18.4965 18.7308L14.7336 8.35626L12.5645 8.3619L15.3671 16.4862L12.0006 20.9168ZM12.0006 24C5.37318 24 0 18.6268 0 11.9994C0 5.37202 5.37318 -0.0012207 12.0006 -0.0012207C18.628 -0.0012207 24.0012 5.37202 24.0012 11.9994C23.9926 18.6224 18.6236 23.9914 12.0006 24Z" /></svg>
              WORDPRESS ENTEGRASYON
            </h2>
            <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div>
                <label className="text-[10px] font-black text-blue-400 block mb-2 uppercase">SITE URL</label>
                <input
                  name="siteUrl"
                  value={wpSettings.siteUrl}
                  onChange={handleWPSettingsChange}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-mono bg-white text-blue-900"
                  placeholder="https://mysite.com"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-blue-400 block mb-2 uppercase">PAGE ID</label>
                  <input
                    name="pageId"
                    value={wpSettings.pageId}
                    onChange={handleWPSettingsChange}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs font-mono bg-white text-blue-900"
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-blue-400 block mb-2 uppercase">KULLANICI ADI</label>
                  <input
                    name="username"
                    value={wpSettings.username}
                    onChange={handleWPSettingsChange}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs bg-white text-blue-900"
                    placeholder="admin"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-blue-400 block mb-2 uppercase">APP PAROLA</label>
                  <input
                    name="appPassword"
                    type="password"
                    value={wpSettings.appPassword}
                    onChange={handleWPSettingsChange}
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs bg-white text-blue-900"
                    placeholder="abcd 1234..."
                  />
                </div>
              </div>
              <p className="text-[10px] text-blue-400 leading-tight">
                * Profil &gt; Kullanıcılar &gt; Uygulama Şifreleri bölümünden yeni bir şifre oluşturun.
              </p>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-200">
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={copyHTML}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl active:scale-95 uppercase tracking-widest ${copyStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
            >
              {copyStatus === 'success' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  KOD KOPYALANDI!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                  KODU KOPYALA
                </>
              )}
            </button>

            <button
              onClick={updateWP}
              disabled={wpStatus === 'loading'}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl active:scale-95 uppercase tracking-widest ${wpStatus === 'loading' ? 'bg-blue-300 cursor-wait' :
                wpStatus === 'success' ? 'bg-emerald-500' :
                  wpStatus === 'error' ? 'bg-red-500' :
                    'bg-blue-600 hover:bg-blue-700'
                } text-white`}
            >
              {wpStatus === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  GÜNCELLENİYOR...
                </>
              ) : wpStatus === 'success' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  GÜNCELLENDİ!
                </>
              ) : wpStatus === 'error' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  HATA OLUŞTU
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  WORDPRESS'İ GÜNCELLE
                </>
              )}
            </button>
            {wpMessage && (
              <p className={`text-[10px] text-center font-bold ${wpStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                {wpMessage}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 scrollbar-hide bg-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-red-400 shadow-sm shadow-red-100"></div>
                <div className="w-4 h-4 rounded-full bg-amber-400 shadow-sm shadow-amber-100"></div>
                <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-sm shadow-emerald-100"></div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] ml-2">CANLI ÖNİZLEME</span>
            </div>
          </div>

          <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.12)] border-8 border-white overflow-hidden min-h-[95vh] flex flex-col relative">
            {/* Header */}
            <header className="px-6 md:px-12 py-20 md:py-32 text-center bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight md:leading-none">
                {settings.pageTitle || 'Başlık Yazınız'}
              </h1>
              <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed tracking-tight px-4">
                {settings.description || 'Siteniz için etkileyici bir açıklama girin.'}
              </p>
            </header>

            {/* Grid - Adjusted for wider look */}
            <div className="p-6 md:p-12 lg:p-20 flex-grow bg-white">
              {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
                  {campaigns.map(c => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      isPreview={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-48 text-slate-200 border-4 border-dashed border-slate-50 rounded-[4rem]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-8 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-300">İçerik Bulunamadı</p>
                  <p className="text-md md:text-lg font-medium mt-3 opacity-50 px-4 text-center">Lütfen soldaki panelden kampanya eklemeye başlayın.</p>
                </div>
              )}
            </div>

            <footer className="py-24 text-center border-t border-slate-50 bg-slate-50/30">
              <p className="text-slate-300 text-sm font-black tracking-[0.4em] uppercase mb-4">
                &copy; {new Date().getFullYear()} {settings.pageTitle}
              </p>
              <div className="w-12 h-1 bg-slate-200 mx-auto rounded-full opacity-50"></div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
