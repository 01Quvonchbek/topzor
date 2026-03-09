import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User as UserIcon, 
  Heart, 
  PlusCircle, 
  Car, 
  Home, 
  Smartphone, 
  Briefcase, 
  Wrench, 
  Hammer, 
  Leaf, 
  Cpu, 
  Gavel,
  MapPin,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Star,
  Download,
  X,
  Phone,
  Eye,
  Clock,
  Send,
  Camera,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Filter,
  Truck,
  Bike,
  Settings,
  Key,
  Map,
  Building,
  Laptop,
  Monitor,
  Tv,
  Zap,
  Headphones,
  Globe,
  GraduationCap,
  Droplets,
  Palette,
  Code,
  Box,
  Grid,
  Hash,
  Paintbrush,
  Apple,
  Carrot,
  Dog,
  Wheat,
  Sprout,
  Tractor,
  Printer,
  Gamepad,
  HelpCircle,
  LayoutGrid,
  Map as MapIcon,
  MessageCircle,
  Sparkles,
  Mic,
  Search as SearchIcon,
  Image as ImageIcon,
  MapPin as MapPinIcon,
  Bot,
  Video,
  Send as TelegramIcon,
  ShieldAlert,
  Crown,
  BadgeCheck,
  Store,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from './services/aiService';
import { LiveServerMessage } from '@google/genai';
import { Ad, Category, User, Banner, Bid, Chat, Message, UserRole } from './types';

const CATEGORY_ICONS: Record<string, any> = {
  Car, Home, Smartphone, Briefcase, Wrench, Hammer, Leaf, Cpu, Gavel,
  Truck, Bike, Settings, Key, Map, Building, Laptop, Monitor, Tv, Zap,
  Headphones, Globe, User: UserIcon, GraduationCap, Droplets, Palette, Code,
  Box, Grid, Hash, Paintbrush, Apple, Carrot, Dog, Wheat, Sprout, Tractor,
  Camera, Printer, Gamepad, Star
};

  const AdCard = ({ ad, favorites, toggleFavorite, fetchAdDetail, view, deleteAd }: { 
    ad: Ad, 
    favorites: number[], 
    toggleFavorite: (e: React.MouseEvent, id: number) => Promise<void> | void,
    fetchAdDetail: (id: number) => Promise<void> | void,
    view: string,
    deleteAd: (e: React.MouseEvent, id: number) => Promise<void> | void,
    key?: any
  }) => (
    <motion.div 
      layout
      key={ad.id}
      whileHover={{ y: -8 }}
      onClick={() => fetchAdDetail(ad.id)}
      className="bg-white rounded-[32px] overflow-hidden border border-black/5 hover:shadow-2xl transition-all cursor-pointer group"
    >
      <div className="aspect-[4/5] relative overflow-hidden">
        <img src={ad.main_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
        <button 
          onClick={(e) => toggleFavorite(e, ad.id)}
          className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl hover:bg-white transition-colors shadow-lg"
        >
          <Heart className={`w-5 h-5 ${favorites.includes(ad.id) ? 'fill-red-500 text-red-500' : 'text-black/20'}`} />
        </button>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {ad.is_vip && <div className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-full shadow-lg">VIP</div>}
          {ad.auction && <div className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full shadow-lg flex items-center gap-1"><Gavel className="w-3 h-3" /> Auksion</div>}
        </div>
        {ad.has_delivery && (
          <div className="absolute bottom-4 left-4 p-2 bg-emerald-600 text-white rounded-xl shadow-lg">
            <Truck className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-black/20 uppercase tracking-widest">
            <MapPin className="w-3 h-3" />
            {ad.location}
          </div>
          <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${ad.condition === 'new' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            {ad.condition === 'new' ? 'Yangi' : 'Ishlatilgan'}
          </div>
        </div>
        <h4 className="font-bold text-lg mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors">{ad.title}</h4>
        <div className="flex items-center justify-between">
          <div className="text-xl font-black text-emerald-600">
            {ad.auction ? (ad.auction.highest_bid || ad.auction.start_price)?.toLocaleString() : ad.price.toLocaleString()} 
            <span className="text-xs font-bold text-black/20 ml-1">UZS</span>
          </div>
          {view === 'profile' && (
            <button onClick={(e) => deleteAd(e, ad.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [selectedAuctionCategory, setSelectedAuctionCategory] = useState<number | null>(null);
  const [view, setView] = useState<'home' | 'categories' | 'premium' | 'auctions' | 'services' | 'map' | 'chat' | 'profile' | 'favorites' | 'help' | 'ai'>('home');
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);

  // Advanced Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);

  // Modals
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);

  // AI Features State
  const [aiView, setAiView] = useState<'chat' | 'search' | 'image' | 'voice' | 'nearby'>('chat');
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResult, setAiSearchResult] = useState<{ text: string, sources: any[] } | null>(null);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [aiImageSize, setAiImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [nearbyQuery, setNearbyQuery] = useState('');
  const [nearbyResult, setNearbyResult] = useState<{ text: string, sources: any[] } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [regions] = useState([
    { id: 1, name: 'Toshkent' },
    { id: 2, name: 'Samarqand' },
    { id: 3, name: 'Buxoro' },
    { id: 4, name: 'Andijon' },
    { id: 5, name: 'Farg\'ona' },
    { id: 6, name: 'Namangan' },
    { id: 7, name: 'Xorazm' },
    { id: 8, name: 'Navoiy' },
    { id: 9, name: 'Qashqadaryo' },
    { id: 10, name: 'Surxondaryo' },
    { id: 11, name: 'Jizzax' },
    { id: 12, name: 'Sirdaryo' },
    { id: 13, name: 'Qoraqalpog\'iston' }
  ]);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchAds();
    fetchBanners();
    fetchFavorites();
    fetchShops();
    checkApiKey();
  }, []);

  const handleAiChat = async (text: string) => {
    if (!text.trim()) return;
    setAiChatMessages(prev => [...prev, { role: 'user', text }]);
    setIsAiLoading(true);
    try {
      const response = await aiService.askChatbot(text);
      setAiChatMessages(prev => [...prev, { role: 'bot', text: response || 'Xatolik yuz berdi' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const result = await aiService.searchWithGrounding(aiSearchQuery);
      setAiSearchResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt.trim()) return;
    if (!hasApiKey) {
      await openApiKeyDialog();
      return;
    }
    setIsAiLoading(true);
    try {
      const img = await aiService.generateImage(aiImagePrompt, aiImageSize);
      setGeneratedImage(img);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const startLiveSession = async () => {
    try {
      const session = aiService.connectLive({
        onopen: () => {
          setIsLiveActive(true);
          startAudioCapture(session);
        },
        onmessage: (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            playAudio(base64Audio);
          }
        },
        onerror: (err) => {
          console.error(err);
          stopLiveSession();
        },
        onclose: () => {
          stopLiveSession();
        }
      });
      setLiveSession(session);
    } catch (err) {
      console.error(err);
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    if (liveSession) liveSession.close();
    setLiveSession(null);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const startAudioCapture = async (session: any) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const playAudio = (base64Data: string) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;

    const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
    const buffer = audioContext.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  };

  const handleNearbySearch = async () => {
    if (!nearbyQuery.trim()) return;
    setIsAiLoading(true);
    try {
      // Get current location if possible
      let location: { lat: number, lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn("Location access denied", e);
      }

      const result = await aiService.searchNearby(nearbyQuery, location);
      setNearbyResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const openApiKeyDialog = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [selectedCategory, selectedSubCategory, condition, hasDelivery, view, searchQuery]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchShops = async () => {
    const res = await fetch('/api/shops');
    const data = await res.json();
    setShops(data);
  };

  useEffect(() => {
    fetchAuctions();
  }, [selectedAuctionCategory]);

  const fetchBanners = async () => {
    const res = await fetch('/api/banners');
    const data = await res.json();
    setBanners(data);
  };

  const fetchAuctions = async () => {
    const params = new URLSearchParams();
    params.append('is_auction', 'true');
    if (selectedAuctionCategory) params.append('category', selectedAuctionCategory.toString());
    const res = await fetch('/api/ads?' + params.toString());
    const data = await res.json();
    setAds(data); // In auctions view, we reuse the ads state or filter it
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      let url = '/api/ads';
      if (view === 'favorites') url = '/api/favorites';
      else if (view === 'profile') url = '/api/my-ads';

      const params = new URLSearchParams();
      if (selectedSubCategory) params.append('category', selectedSubCategory.toString());
      else if (selectedCategory) params.append('category', selectedCategory.toString());
      
      if (view === 'premium') params.append('is_premium', 'true');
      if (view === 'auctions') params.append('is_auction', 'true');
      
      if (searchQuery) params.append('search', searchQuery);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (condition) params.append('condition', condition);
      if (hasDelivery) params.append('hasDelivery', 'true');

      const fullUrl = url + (params.toString() ? `?${params.toString()}` : '');
      const res = await fetch(fullUrl);
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const res = await fetch('/api/favorites');
    const data = await res.json();
    setFavorites(data.map((f: Ad) => f.id));
  };

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const res = await fetch(`/api/favorites/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.removed) setFavorites(favorites.filter(fid => fid !== id));
    else setFavorites([...favorites, id]);
  };

  const fetchAdDetail = async (id: number) => {
    const res = await fetch(`/api/ads/${id}`);
    const data = await res.json();
    setSelectedAd(data);
    if (data.user_id) fetchSellerReviews(data.user_id);
  };

  const fetchSellerReviews = async (userId: number) => {
    const res = await fetch(`/api/reviews/${userId}`);
    const data = await res.json();
    setSellerReviews(data);
  };

  const deleteAd = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('O\'chirilsinmi?')) return;
    await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    fetchAds();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-black font-sans selection:bg-emerald-100 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <h1 
              className="text-2xl font-black tracking-tighter text-emerald-600 cursor-pointer"
              onClick={() => {
                setView('home');
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                setSearchQuery('');
              }}
            >
              SuperPlatform
            </h1>
          </div>

          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Nima qidiryapsiz?"
              className="w-full bg-black/5 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPostAdOpen(true)}
              className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              E'lon berish
            </button>
          </div>
        </div>

        {/* Sub Navigation / Main Menu */}
        <div className="bg-white border-b border-black/5 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-black/40">
            <button onClick={() => setView('home')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'home' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Home className="w-3 h-3" /> Bosh sahifa
            </button>
            <button onClick={() => setView('categories')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'categories' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <LayoutGrid className="w-3 h-3" /> Kategoriyalar
            </button>
            <button onClick={() => setView('premium')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'premium' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Star className="w-3 h-3" /> Premium e’lonlar
            </button>
            <button onClick={() => setView('auctions')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'auctions' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Gavel className="w-3 h-3" /> Auksion
            </button>
            <button onClick={() => setView('services')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'services' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Wrench className="w-3 h-3" /> Xizmatlar
            </button>
            <button onClick={() => setView('map')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'map' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <MapIcon className="w-3 h-3" /> Xarita
            </button>
            <button onClick={() => setView('chat')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'chat' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <MessageCircle className="w-3 h-3" /> Chat
            </button>
            <button onClick={() => setView('profile')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'profile' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <UserIcon className="w-3 h-3" /> Profil
            </button>
            <button onClick={() => setView('favorites')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'favorites' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Heart className="w-3 h-3" /> Sevimlilar
            </button>
            <button onClick={() => setView('help')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'help' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <HelpCircle className="w-3 h-3" /> Yordam markazi
            </button>
            <button onClick={() => setView('ai')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'ai' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Sparkles className="w-3 h-3" /> AI Hub
            </button>
            <button onClick={() => setView('admin')} className={`whitespace-nowrap flex items-center gap-2 ${view === 'admin' ? 'text-emerald-600' : 'hover:text-black transition-colors'}`}>
              <Settings className="w-3 h-3" /> Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Voice Assistant Floating Button */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isLiveActive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-black text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Live AI Active</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={isLiveActive ? stopLiveSession : startLiveSession}
          className={`p-6 rounded-full shadow-2xl transition-all active:scale-90 ${isLiveActive ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
        >
          {isLiveActive ? <X className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {view === 'home' && (
          <section className="max-w-7xl mx-auto px-4 pt-12 w-full">
            <div className="bg-emerald-600 rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-5xl font-black tracking-tighter mb-6 leading-none">O'zbekistondagi eng yirik marketplace</h2>
                <p className="text-emerald-100 text-lg mb-8 font-medium">Avtomobillar, ko'chmas mulk, elektronika va xizmatlar — barchasi bir joyda.</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    <input 
                      type="text" 
                      placeholder="Nima qidiryapsiz?"
                      className="w-full bg-white text-black border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all">Qidirish</button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none">
                <Sparkles className="w-full h-full p-12" />
              </div>
            </div>
          </section>
        )}

        {/* Categories Bar (Main Categories) */}
        <section className="max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
            {categories.filter(c => c.parent_id === null).map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon] || Smartphone;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isActive ? null : cat.id);
                    setSelectedSubCategory(null);
                  }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap border ${
                    isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white border-black/5 hover:border-emerald-600/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Subcategories Bar */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 overflow-x-auto py-4 no-scrollbar">
                  {categories.filter(c => c.parent_id === selectedCategory).map(sub => {
                    const Icon = CATEGORY_ICONS[sub.icon] || Smartphone;
                    const isActive = selectedSubCategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubCategory(isActive ? null : sub.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap border text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? 'bg-black text-white border-black' : 'bg-white border-black/5 hover:bg-black/5'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* View Content */}
        <main className="max-w-7xl mx-auto px-4 pb-24 w-full">
          {view === 'home' && banners.length > 0 && (
            <section className="mb-12">
              <div className="relative h-[300px] md:h-[400px] rounded-[48px] overflow-hidden shadow-2xl group">
                <AnimatePresence mode="wait">
                  {banners.slice(0, 1).map((banner) => (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <img src={banner.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
                        <h2 className="text-white text-4xl font-black tracking-tighter mb-4">Maxsus Takliflar</h2>
                        <button className="bg-white text-black px-8 py-4 rounded-2xl font-bold w-fit hover:bg-emerald-600 hover:text-white transition-all">
                          Batafsil ko'rish
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {view === 'home' && (
            <>
              {/* Premium Ads Section */}
              <section className="mb-20">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-3xl font-black tracking-tight">Premium e'lonlar</h3>
                  </div>
                  <button onClick={() => setView('premium')} className="text-emerald-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    Barchasini ko'rish <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {ads.filter(ad => ad.is_premium).slice(0, 4).map(ad => (
                    <AdCard key={ad.id} ad={ad} favorites={favorites} toggleFavorite={toggleFavorite} fetchAdDetail={fetchAdDetail} view={view} deleteAd={deleteAd} />
                  ))}
                </div>
              </section>

              {/* Regions Section */}
              <section className="mb-20">
                <h3 className="text-3xl font-black tracking-tight mb-8">Viloyatlar bo'yicha qidiruv</h3>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  {regions.map(region => (
                    <button
                      key={region.id}
                      onClick={() => {
                        setSelectedRegion(region.id === selectedRegion ? null : region.id);
                        fetchAds();
                      }}
                      className={`p-4 rounded-2xl border font-bold text-sm transition-all text-center ${
                        selectedRegion === region.id ? 'bg-black text-white border-black' : 'bg-white border-black/5 hover:border-emerald-600/20'
                      }`}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Auction Block */}
              <section className="mb-20 bg-black rounded-[48px] p-12 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                      <Gavel className="w-8 h-8 text-emerald-500" />
                      <h3 className="text-3xl font-black tracking-tight">Jonli Auksionlar</h3>
                    </div>
                    <button onClick={() => setView('auctions')} className="text-emerald-400 font-bold flex items-center gap-2">
                      Barchasi <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ads.filter(ad => ad.auction).slice(0, 3).map(ad => (
                      <div key={ad.id} className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 border border-white/10">
                        <img src={ad.main_image} className="w-full aspect-video object-cover rounded-2xl mb-4" referrerPolicy="no-referrer" />
                        <h4 className="font-bold text-lg mb-2">{ad.title}</h4>
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-xs font-bold text-white/40 uppercase">Hozirgi narx</span>
                          <span className="font-black text-emerald-400">{ad.auction?.highest_bid?.toLocaleString()} UZS</span>
                        </div>
                        <button onClick={() => fetchAdDetail(ad.id)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all">Taklif berish</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[120px] rounded-full" />
              </section>

              {/* Services Block */}
              <section className="mb-20">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black tracking-tight">Xizmatlar</h3>
                  <button onClick={() => setView('services')} className="text-emerald-600 font-bold">Barchasi</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categories.filter(c => c.parent_id === 5).slice(0, 4).map(sub => {
                    const Icon = CATEGORY_ICONS[sub.icon] || Wrench;
                    return (
                      <div key={sub.id} className="bg-white p-8 rounded-[32px] border border-black/5 hover:shadow-xl transition-all group cursor-pointer">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg mb-2">{sub.name}</h4>
                        <p className="text-xs text-black/40 font-medium">Professional mutaxassislar xizmati</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Mobile App Banner */}
              <section className="mb-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[48px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
                <div className="relative z-10 max-w-xl">
                  <h3 className="text-4xl font-black tracking-tighter mb-6">Mobil ilovamizni yuklab oling</h3>
                  <p className="text-indigo-100 text-lg mb-8 font-medium">Ilovada e'lonlarni joylash va boshqarish yanada osonroq. Har doim aloqada bo'ling!</p>
                  <div className="flex flex-wrap gap-4">
                    <button className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-black/80 transition-all">
                      <Download className="w-6 h-6" /> App Store
                    </button>
                    <button className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-black/80 transition-all">
                      <Download className="w-6 h-6" /> Google Play
                    </button>
                  </div>
                </div>
                <div className="relative z-10 w-full md:w-1/3 aspect-[3/4] bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-4 shadow-2xl">
                  <div className="w-full h-full bg-black/20 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-white/20" />
                  </div>
                </div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 blur-[100px] rounded-full" />
              </section>

              {/* Trust & Safety Section */}
              <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border border-black/5 text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-6" />
                  <h4 className="font-bold text-xl mb-4">Xavfsiz savdo</h4>
                  <p className="text-sm text-black/40 font-medium">Barcha foydalanuvchilar tekshiriladi va firibgarlikdan himoya qilinadi.</p>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-black/5 text-center">
                  <BadgeCheck className="w-12 h-12 text-emerald-600 mx-auto mb-6" />
                  <h4 className="font-bold text-xl mb-4">Tasdiqlangan sotuvchilar</h4>
                  <p className="text-sm text-black/40 font-medium">Biznes va ishonchli sotuvchilar maxsus belgi bilan ajratiladi.</p>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-black/5 text-center">
                  <HelpCircle className="w-12 h-12 text-emerald-600 mx-auto mb-6" />
                  <h4 className="font-bold text-xl mb-4">24/7 Qo'llab-quvvatlash</h4>
                  <p className="text-sm text-black/40 font-medium">Har qanday savol bo'yicha bizning operatorlarimiz yordam berishadi.</p>
                </div>
              </section>
            </>
          )}

          {view === 'home' || view === 'premium' || view === 'categories' || view === 'favorites' || view === 'profile' ? (
            <>
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-bold tracking-tight">
                  {view === 'favorites' ? 'Sevimlilar' : 
                   view === 'profile' ? 'Mening e\'lonlarim' : 
                   view === 'premium' ? 'Premium e’lonlar' :
                   selectedSubCategory ? categories.find(c => c.id === selectedSubCategory)?.name :
                   selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 
                   'Barcha e\'lonlar'}
                </h3>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-black/5 text-sm font-bold hover:bg-black/5 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtrlar
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white rounded-[32px] animate-pulse border border-black/5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {ads.length > 0 ? ads.map(ad => (
                    <AdCard key={ad.id} ad={ad} favorites={favorites} toggleFavorite={toggleFavorite} fetchAdDetail={fetchAdDetail} view={view} deleteAd={deleteAd} />
                  )) : (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-black/40 font-bold">Hech narsa topilmadi</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : view === 'auctions' ? (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-3xl font-bold tracking-tight">Jonli Auksionlar</h3>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                  <button 
                    onClick={() => setSelectedAuctionCategory(null)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${!selectedAuctionCategory ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-black/5 hover:border-emerald-600/20'}`}
                  >
                    Barchasi
                  </button>
                  {categories.filter(c => c.parent_id === 9).map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedAuctionCategory(cat.id)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedAuctionCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-black/5 hover:border-emerald-600/20'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {ads.map(auc => (
                  <div key={auc.id} className="bg-white rounded-[40px] overflow-hidden border border-black/5 shadow-xl">
                    <img src={auc.main_image} className="w-full aspect-video object-cover" referrerPolicy="no-referrer" />
                    <div className="p-8">
                      <h4 className="font-bold text-xl mb-4">{auc.title}</h4>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <div className="text-[10px] font-bold text-black/20 uppercase mb-1">Boshlang'ich narx</div>
                          <div className="font-bold">{auc.auction_start_price?.toLocaleString()} UZS</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Eng yuqori taklif</div>
                          <div className="font-black text-emerald-600">{auc.highest_bid?.toLocaleString() || 'Taklif yo\'q'} UZS</div>
                        </div>
                      </div>
                      <button onClick={() => fetchAdDetail(auc.id)} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all">Taklif berish</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : view === 'map' ? (
            <div className="space-y-12">
              <div className="bg-white rounded-[48px] border border-black/5 h-[600px] flex flex-col overflow-hidden shadow-2xl">
                <div className="flex-1 relative">
                  <img src="https://picsum.photos/seed/map/1200/800" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/20 shadow-2xl text-center max-w-sm">
                      <MapPinIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                      <h4 className="font-bold text-xl mb-2">Xarita ko'rinishi</h4>
                      <p className="text-sm text-black/40 mb-6">Yaqin atrofdagi e'lonlarni xaritada ko'ring.</p>
                      <button className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold">Xaritani ochish</button>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-gray-50 border-t border-black/5">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                        <input 
                          value={nearbyQuery}
                          onChange={(e) => setNearbyQuery(e.target.value)}
                          placeholder="Yaqin atrofdagi xizmatlarni qidiring (masalan: Eng yaqin avtoservislar)..."
                          className="w-full bg-white border border-black/5 rounded-2xl py-4 pl-12 pr-4 font-bold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button 
                        onClick={handleNearbySearch}
                        disabled={isAiLoading}
                        className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {isAiLoading ? 'Qidirilmoqda...' : 'AI Qidiruv'}
                      </button>
                    </div>
                    {nearbyResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-6 bg-white rounded-3xl border border-black/5 font-medium leading-relaxed">
                          {nearbyResult.text}
                        </div>
                        {nearbyResult.sources.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {nearbyResult.sources.map((src: any, i: number) => (
                              <a 
                                key={i} 
                                href={src.uri} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
                              >
                                {src.title || 'Xaritada ko\'rish'}
                              </a>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'ai' ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold tracking-tight">AI Hub</h3>
                <div className="flex bg-white p-1 rounded-2xl border border-black/5">
                  <button onClick={() => setAiView('chat')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${aiView === 'chat' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Chat</button>
                  <button onClick={() => setAiView('search')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${aiView === 'search' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Search</button>
                  <button onClick={() => setAiView('image')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${aiView === 'image' ? 'bg-black text-white' : 'hover:bg-black/5'}`}>Image</button>
                </div>
              </div>

              <div className="bg-white rounded-[48px] border border-black/5 min-h-[600px] shadow-2xl overflow-hidden flex flex-col">
                {aiView === 'chat' ? (
                  <div className="flex-1 flex flex-col p-8">
                    <div className="flex-1 overflow-y-auto space-y-6 mb-8 no-scrollbar">
                      {aiChatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                          <Bot className="w-20 h-20 mb-4" />
                          <p className="font-bold">AI yordamchi bilan suhbatni boshlang</p>
                        </div>
                      )}
                      {aiChatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-6 rounded-[32px] font-medium ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-black/5 text-black rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-black/5 p-6 rounded-[32px] rounded-tl-none flex gap-1">
                            <div className="w-2 h-2 bg-black/20 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-black/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-black/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).message;
                        handleAiChat(input.value);
                        input.value = '';
                      }}
                      className="relative"
                    >
                      <input 
                        name="message"
                        placeholder="Savolingizni yozing..."
                        className="w-full bg-black/5 border-none rounded-3xl py-6 pl-8 pr-24 font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-4 rounded-2xl hover:bg-emerald-600 transition-all">
                        <Send className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                ) : aiView === 'search' ? (
                  <div className="p-12 max-w-4xl mx-auto w-full space-y-12">
                    <div className="text-center space-y-4">
                      <h4 className="text-4xl font-black tracking-tighter">AI Grounded Search</h4>
                      <p className="text-black/40 font-medium">Google Search ma'lumotlari asosida aniq javoblar oling.</p>
                    </div>
                    <div className="relative">
                      <input 
                        value={aiSearchQuery}
                        onChange={(e) => setAiSearchQuery(e.target.value)}
                        placeholder="Masalan: Toshkentdagi eng arzon iPhone 15 narxlari..."
                        className="w-full bg-black/5 border-none rounded-[32px] py-8 pl-12 pr-32 text-xl font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner"
                      />
                      <button 
                        onClick={handleAiSearch}
                        disabled={isAiLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {isAiLoading ? 'Qidirilmoqda...' : 'Qidirish'}
                      </button>
                    </div>

                    {aiSearchResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div className="p-10 bg-emerald-50 rounded-[48px] border border-emerald-100 leading-relaxed text-lg font-medium text-emerald-900">
                          {aiSearchResult.text}
                        </div>
                        {aiSearchResult.sources.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-black/20 ml-6">Manbalar</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {aiSearchResult.sources.map((src, i) => (
                                <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="bg-white p-6 rounded-3xl border border-black/5 hover:border-emerald-600 transition-all flex items-center justify-between group">
                                  <span className="font-bold truncate max-w-[80%]">{src.title || src.uri}</span>
                                  <Globe className="w-5 h-5 text-black/10 group-hover:text-emerald-600" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 max-w-4xl mx-auto w-full space-y-12">
                    <div className="text-center space-y-4">
                      <h4 className="text-4xl font-black tracking-tighter">AI Image Generator</h4>
                      <p className="text-black/40 font-medium">Nano Banana Pro yordamida tasavvuringizni rasmga aylantiring.</p>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/20 ml-6">Rasm tavsifi</label>
                        <textarea 
                          value={aiImagePrompt}
                          onChange={(e) => setAiImagePrompt(e.target.value)}
                          placeholder="Masalan: Futuristic car driving on a neon street in Tashkent..."
                          className="w-full bg-black/5 border-none rounded-[32px] p-8 text-xl font-bold focus:ring-2 focus:ring-emerald-500 shadow-inner min-h-[150px] resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-8">
                        <div className="flex-1 space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-black/20 ml-6">Rasm o'lchami</label>
                          <div className="flex bg-black/5 p-2 rounded-2xl">
                            {(['1K', '2K', '4K'] as const).map(size => (
                              <button 
                                key={size}
                                onClick={() => setAiImageSize(size)}
                                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${aiImageSize === size ? 'bg-white text-black shadow-lg' : 'text-black/40 hover:text-black'}`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={handleGenerateImage}
                          disabled={isAiLoading}
                          className="mt-auto bg-emerald-600 text-white px-12 py-6 rounded-3xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-3"
                        >
                          {isAiLoading ? 'Yaratilmoqda...' : <><ImageIcon className="w-6 h-6" /> Yaratish</>}
                        </button>
                      </div>

                      {generatedImage && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <img src={generatedImage} className="w-full rounded-[48px] shadow-2xl border-8 border-white" />
                          <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={async () => {
                                setIsAiLoading(true);
                                try {
                                  const edited = await aiService.editOrCreateImage("Add a futuristic city background", generatedImage);
                                  setGeneratedImage(edited);
                                } catch (e) {
                                  console.error(e);
                                } finally {
                                  setIsAiLoading(false);
                                }
                              }}
                              className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl font-bold hover:bg-white flex items-center gap-2"
                            >
                              <Sparkles className="w-5 h-5 text-emerald-600" />
                              Edit (AI)
                            </button>
                            <a 
                              href={generatedImage} 
                              download="ai-image.png"
                              className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl hover:bg-white"
                            >
                              <Download className="w-6 h-6" />
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : view === 'admin' ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black tracking-tight">Admin Panel</h3>
                <div className="flex gap-4">
                  <div className="bg-white px-6 py-3 rounded-2xl border border-black/5 shadow-sm">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Jami e'lonlar</div>
                    <div className="text-xl font-black">1,234</div>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl border border-black/5 shadow-sm">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Jami foydalanuvchilar</div>
                    <div className="text-xl font-black">5,678</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { name: 'Dashboard', icon: LayoutGrid },
                  { name: 'Foydalanuvchilar', icon: UserIcon },
                  { name: 'E’lonlar', icon: FileText },
                  { name: 'Kategoriyalar', icon: Grid },
                  { name: 'To‘lovlar', icon: Zap },
                  { name: 'Auksionlar', icon: Gavel },
                  { name: 'Shikoyatlar', icon: AlertTriangle },
                  { name: 'Bannerlar', icon: ImageIcon },
                  { name: 'Statistikalar', icon: Eye },
                  { name: 'Tariflar', icon: Star },
                  { name: 'Moderatorlar', icon: ShieldCheck }
                ].map((item, i) => (
                  <button key={i} className="bg-white p-8 rounded-[32px] border border-black/5 hover:border-emerald-600 transition-all group text-left">
                    <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <p className="text-xs text-black/40 font-medium mt-2">Boshqarish va tahrirlash</p>
                  </button>
                ))}
              </div>
            </div>
          ) : view === 'chat' ? (
            <div className="bg-white rounded-[48px] border border-black/5 h-[600px] flex overflow-hidden shadow-2xl">
              <div className="w-1/3 border-r border-black/5 p-8">
                <h4 className="font-black text-xl mb-8">Chatlar</h4>
                <div className="space-y-4">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <div className="font-bold text-sm mb-1">iPhone 15 Pro Max</div>
                    <div className="text-xs text-black/40 truncate">Narxi qancha bo'ladi oxiri?</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <MessageCircle className="w-16 h-16 text-black/5 mb-4" />
                <h4 className="font-bold text-xl mb-2">Xabarlar</h4>
                <p className="text-sm text-black/40">Sotuvchilar bilan muloqotni boshlang.</p>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <h3 className="text-2xl font-bold mb-4">{view === 'help' ? 'Yordam markazi' : view === 'services' ? 'Xizmatlar' : 'Tez kunda'}</h3>
              <p className="text-black/40">Ushbu bo'lim tez orada ishga tushadi.</p>
            </div>
          )}
        </main>
      </div>

      {/* Ad Detail Modal */}
      <AnimatePresence>
        {selectedAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[48px] overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
            >
              <button onClick={() => setSelectedAd(null)} className="absolute top-8 right-8 z-10 p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition-colors shadow-xl">
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-3/5 bg-gray-50 overflow-y-auto p-4 space-y-4">
                <img src={selectedAd.main_image} className="w-full rounded-[32px] shadow-lg" referrerPolicy="no-referrer" />
                {selectedAd.images?.map((img, i) => (
                  <img key={i} src={img.image_url} className="w-full rounded-[32px] shadow-lg" referrerPolicy="no-referrer" />
                ))}
              </div>

              <div className="w-full md:w-2/5 p-12 overflow-y-auto bg-white flex flex-col">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase mb-6">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedAd.category_name}
                </div>
                <h2 className="text-4xl font-black mb-6 leading-tight">{selectedAd.title}</h2>
                <div className="text-4xl font-black text-emerald-600 mb-6">
                  {selectedAd.auction ? (selectedAd.auction.highest_bid || selectedAd.auction.start_price)?.toLocaleString() : selectedAd.price.toLocaleString()} 
                  <span className="text-xl font-bold text-black/20 ml-1">UZS</span>
                </div>

                {selectedAd.auction && (
                  <div className="mb-12 p-6 bg-black text-white rounded-[32px] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-widest opacity-50">Auksion tugash vaqti</div>
                      <div className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> {selectedAd.auction.end_time}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-widest opacity-50">Oxirgi takliflar</div>
                      {selectedAd.auction.bids && selectedAd.auction.bids.length > 0 ? (
                        selectedAd.auction.bids.slice(0, 3).map((bid, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="opacity-80">{bid.user_name}</span>
                            <span className="font-bold">{bid.amount.toLocaleString()} UZS</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm opacity-50 italic">Hali takliflar yo'q</div>
                      )}
                    </div>
                    <button 
                      onClick={async () => {
                        const amount = prompt("Taklifingizni kiriting:");
                        if (amount && selectedAd.auction) {
                          const res = await fetch('/api/bids', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ auction_id: selectedAd.auction.id, user_id: 4, amount: Number(amount) })
                          });
                          if (res.ok) fetchAdDetail(selectedAd.id);
                          else alert("Xatolik: Taklifingiz joriy narxdan yuqori bo'lishi kerak");
                        }
                      }}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                    >
                      Taklif berish
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 mb-12 py-8 border-y border-black/5">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Manzil</div>
                    <div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> {selectedAd.location}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Holati</div>
                    <div className="font-bold flex items-center gap-2">
                      {selectedAd.condition === 'new' ? <BadgeCheck className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                      {selectedAd.condition === 'new' ? 'Yangi' : 'Ishlatilgan'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Ko'rishlar</div>
                    <div className="font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-600" /> {selectedAd.views_count}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-black/20 uppercase">Yetkazib berish</div>
                    <div className="font-bold flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${selectedAd.has_delivery ? 'text-emerald-600' : 'text-gray-300'}`} />
                      {selectedAd.has_delivery ? 'Mavjud' : 'Yo\'q'}
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h5 className="text-[10px] font-bold text-black/20 uppercase mb-4">Tavsif</h5>
                  <p className="text-black/60 leading-relaxed text-lg">{selectedAd.description}</p>
                </div>

                <div className="mt-auto space-y-4">
                  <button className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3">
                    <Phone className="w-6 h-6" />
                    {selectedAd.seller_phone}
                  </button>
                  {selectedAd.telegram && (
                    <a 
                      href={`https://t.me/${selectedAd.telegram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full py-5 bg-[#24A1DE] text-white rounded-3xl font-black text-lg hover:bg-[#24A1DE]/80 transition-all flex items-center justify-center gap-3"
                    >
                      <TelegramIcon className="w-6 h-6" />
                      Telegram orqali bog'lanish
                    </a>
                  )}
                  <button className="w-full py-5 bg-black text-white rounded-3xl font-black text-lg hover:bg-black/80 transition-all flex items-center justify-center gap-3">
                    <MessageSquare className="w-6 h-6" />
                    Xabar yozish
                  </button>
                </div>

                {/* Reviews */}
                {sellerReviews.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-black/5">
                    <h5 className="font-bold mb-6">Sotuvchi haqida fikrlar</h5>
                    <div className="space-y-4">
                      {sellerReviews.map((r, i) => (
                        <div key={i} className="bg-emerald-50/50 p-6 rounded-3xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{r.reviewer_name}</span>
                            <div className="flex text-yellow-400">
                              {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                            </div>
                          </div>
                          <p className="text-sm text-black/60">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Modal */}
      <AnimatePresence>
        {isPostAdOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-2xl rounded-[48px] p-12 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black">Yangi e'lon</h2>
                <button onClick={() => setIsPostAdOpen(false)} className="p-3 hover:bg-black/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 no-scrollbar" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data = Object.fromEntries(fd.entries());
                await fetch('/api/ads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...data,
                    price: Number(data.price),
                    category_id: Number(data.category_id),
                    has_delivery: data.has_delivery === 'on',
                    is_auction: data.is_auction === 'on',
                    auction_start_price: data.is_auction === 'on' ? Number(data.price) : null,
                    main_image: `https://picsum.photos/seed/${Math.random()}/800/600`,
                    status: 'active'
                  })
                });
                setIsPostAdOpen(false);
                fetchAds();
              }}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Sarlavha</label>
                    <input name="title" required className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Narxi (UZS)</label>
                    <input name="price" type="number" required className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Kategoriya</label>
                    <select name="category_id" className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500">
                      {categories.filter(c => c.parent_id !== null).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Viloyat</label>
                    <select name="region_id" className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500">
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Manzil (tuman/ko'cha)</label>
                    <input name="location" required className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Holati</label>
                    <select name="condition" className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500">
                      <option value="new">Yangi</option>
                      <option value="used">Ishlatilgan</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Telegram (username)</label>
                    <input name="telegram" placeholder="@username" className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/20 uppercase ml-4">Tavsif</label>
                  <textarea name="description" rows={4} className="w-full bg-black/5 border-none rounded-3xl px-6 py-4 font-bold focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="flex items-center gap-8 px-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="has_delivery" className="w-6 h-6 rounded-lg border-black/10 text-emerald-600 focus:ring-emerald-500 transition-all" />
                    <span className="text-sm font-bold group-hover:text-emerald-600 transition-colors">Yetkazib berish bor</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="is_auction" className="w-6 h-6 rounded-lg border-black/10 text-emerald-600 focus:ring-emerald-500 transition-all" />
                    <span className="text-sm font-bold group-hover:text-emerald-600 transition-colors">Auksionga qo'yish</span>
                  </label>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20">E'lonni joylashtirish</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
