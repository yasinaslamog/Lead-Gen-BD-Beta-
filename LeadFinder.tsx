
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BANGLADESH_DATA } from '../data/bangladeshData';
import { Lead } from '../types';
import { 
  Search, 
  MapPin, 
  Download, 
  Loader2, 
  Globe, 
  Phone, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Key,
  ExternalLink,
  Filter,
  X,
  Target,
  ArrowRight,
  TrendingUp,
  Mail,
  MoreVertical,
  // Fix: Added missing Database icon import
  Database
} from 'lucide-react';

export const LeadFinder: React.FC = () => {
  const [niche, setNiche] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [deepScrape, setDeepScrape] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    website: 'all',
    status: 'all',
    minRating: 0
  });

  const [visibleCount, setVisibleCount] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDistrict('');
  }, [division]);

  const filteredLeads = React.useMemo(() => {
    return leads.filter(lead => {
      if (filters.website === 'yes' && !lead.website) return false;
      if (filters.website === 'no' && lead.website) return false;
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.minRating > 0 && lead.rating < filters.minRating) return false;
      return true;
    });
  }, [leads, filters]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setVisibleCount(prev => {
          if (prev >= filteredLeads.length) return prev;
          return prev + 50;
        });
      }
    }
  }, [filteredLeads.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    setVisibleCount(50);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [filters, leads.length]);

  const searchSerper = async (query: string, key: string): Promise<Lead[]> => {
    const myHeaders = new Headers();
    myHeaders.append("X-API-KEY", key);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ "q": query, "gl": "bd" });
    const requestOptions: RequestInit = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };

    try {
      const response = await fetch("https://google.serper.dev/places", requestOptions);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const result = await response.json();
      if (!result.places) return [];

      return result.places.map((place: any) => {
        const hasWebsite = !!place.website;
        const rating = place.rating || 0;
        const reviews = place.ratingCount || 0;
        let auditStatus: Lead['audit'] = 'Clean';
        if (!hasWebsite) auditStatus = 'Website Prospect';
        let status: Lead['status'] = 'Verified';
        if (!hasWebsite) status = 'High Intent';
        else if (rating < 4.0 && rating > 0) status = 'Low Priority';

        return {
          id: place.cid || place.placeId || Math.random().toString(36).substr(2, 9),
          name: place.title,
          address: place.address || 'Address not available',
          phone: place.phoneNumber || 'N/A',
          website: place.website || '',
          rating: rating,
          reviews: reviews,
          status: status,
          audit: auditStatus
        };
      });
    } catch (error) {
      console.error('Error fetching from Serper:', error);
      return [];
    }
  };

  const handleScrape = async () => {
    if (!niche || !division || !district) return;
    if (!apiKey) {
      alert("API Key required. Get one at serper.dev");
      return;
    }

    setIsScraping(true);
    setProgress(0);
    setLeads([]);
    setVisibleCount(50);
    
    let targets: string[] = [];
    if (district === 'ALL') {
      const districts = Object.keys(BANGLADESH_DATA[division]);
      districts.forEach(dist => {
        const subLocs = BANGLADESH_DATA[division][dist];
        if (deepScrape && subLocs && subLocs.length > 0) {
          subLocs.forEach(sub => targets.push(`${sub}, ${dist}`));
        }
        targets.push(dist);
      });
    } else {
      const subLocs = BANGLADESH_DATA[division][district];
      if (deepScrape && subLocs && subLocs.length > 0) {
        targets = subLocs.map(sub => `${sub}, ${district}`);
      }
      targets.push(district);
    }

    const totalTargets = targets.length;
    const uniqueLeads = new Map<string, Lead>();

    for (let i = 0; i < totalTargets; i++) {
      const locationQuery = targets[i];
      setCurrentAction(`Scanning ${locationQuery}...`);
      const query = `${niche} in ${locationQuery}, ${division}, Bangladesh`;
      const newLeads = await searchSerper(query, apiKey);
      
      newLeads.forEach(lead => {
        const key = lead.id && lead.id.length > 5 ? lead.id : `${lead.name}-${lead.address}`; 
        if (!uniqueLeads.has(key)) uniqueLeads.set(key, lead);
      });

      setLeads(Array.from(uniqueLeads.values()));
      setProgress(Math.round(((i + 1) / totalTargets) * 100));
      if (i < totalTargets - 1) await new Promise(resolve => setTimeout(resolve, 600)); 
    }
    setIsScraping(false);
    setCurrentAction('');
  };

  const handleExport = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Status', 'Audit'];
    const csv = [headers.join(','), ...filteredLeads.map(l => [`"${l.name.replace(/"/g,'""')}"`,`"${l.address.replace(/"/g,'""')}"`,`"${l.phone}"`,`"${l.website}"`,l.rating,l.reviews,l.status,l.audit].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().getTime()}.csv`;
    link.click();
  };

  const visibleLeads = filteredLeads.slice(0, visibleCount);

  return (
    <div className="flex flex-col space-y-8 pb-20">
      
      {/* Configuration Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Key size={12} className="text-emerald-500" />
              API Authentication
            </label>
            <div className="relative group/input">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                <a href="https://serper.dev" target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-emerald-400 transition-colors">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Target size={12} className="text-emerald-500" />
              Service/Niche
            </label>
            <div className="relative">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Retail Shops"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-emerald-500" />
              Region
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900">Select Division</option>
              {Object.keys(BANGLADESH_DATA).map((div) => (
                <option key={div} value={div} className="bg-zinc-900">{div}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} className="text-emerald-500" />
              Sub-Region
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!division}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-sm appearance-none disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="" className="bg-zinc-900">Select District</option>
              {division && <option value="ALL" className="font-bold text-emerald-400 bg-zinc-900">★ All Districts</option>}
              {division && BANGLADESH_DATA[division] && Object.keys(BANGLADESH_DATA[division]).map((dist) => (
                <option key={dist} value={dist} className="bg-zinc-900">{dist}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-zinc-800/50">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setDeepScrape(!deepScrape)}
              className="flex items-center gap-3 group/toggle cursor-pointer"
            >
              <div className={`w-10 h-6 rounded-full transition-all relative ${deepScrape ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}>
                <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all shadow-sm ${deepScrape ? 'left-5 bg-emerald-500' : 'left-1 bg-zinc-500'}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase tracking-wide ${deepScrape ? 'text-emerald-400' : 'text-zinc-500'}`}>Deep Scrape</span>
                <span className="text-[10px] text-zinc-600 font-medium">Granular Search Engine</span>
              </div>
            </button>
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping || !niche || !district}
            className={`
              relative px-10 py-4 rounded-2xl font-bold text-sm tracking-tight overflow-hidden transition-all group/btn
              ${isScraping || !niche || !district 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700' 
                : 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20 active:scale-95 hover:bg-emerald-400'}
            `}
          >
            <div className="relative z-10 flex items-center gap-2">
              {isScraping ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{progress}% {currentAction ? 'Scanning...' : 'Extracting...'}</span>
                </>
              ) : (
                <>
                  <span>Initialize Extraction</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>
        
        {/* Progress Bar overlay */}
        {isScraping && (
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" style={{ width: `${progress}%` }} />
        )}
      </div>

      {/* Results Workspace */}
      <div className="flex flex-col bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[500px]">
        
        <div className="p-8 border-b border-zinc-800/30 flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                <Database size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Lead Repository</h3>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                  Showing <span className="text-zinc-300">{filteredLeads.length}</span> entries 
                  {leads.length !== filteredLeads.length && ` out of ${leads.length}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2.5 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border ${showFilters ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                <Filter size={16} />
                Filters
                {(filters.website !== 'all' || filters.status !== 'all' || filters.minRating > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-1" />
                )}
              </button>

              {filteredLeads.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2.5 px-6 py-3 text-xs font-bold uppercase tracking-widest bg-zinc-100 text-black rounded-xl hover:bg-white transition-all shadow-lg"
                >
                  <Download size={16} />
                  Export .CSV
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-zinc-950/30 rounded-3xl border border-zinc-800 animate-slide-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Asset Status</label>
                <select 
                  value={filters.website}
                  onChange={(e) => setFilters(prev => ({...prev, website: e.target.value}))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Global (Any)</option>
                  <option value="yes">Domain Registered</option>
                  <option value="no">Domain Missing (Opportunity)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Market Quality</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Any Intent</option>
                  <option value="High Intent">High Intent (Vulnerable)</option>
                  <option value="Verified">Verified</option>
                  <option value="Low Priority">Low Priority</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Performance Index</label>
                <select 
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({...prev, minRating: Number(e.target.value)}))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value={0}>Any Score</option>
                  <option value={3.0}>3.0+ Stars</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto scroll-smooth" ref={scrollContainerRef}>
          {leads.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800 mb-8 animate-float">
                <Search size={40} className="text-zinc-700" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Ready to Scan?</h4>
              <p className="text-zinc-500 text-sm max-w-xs px-6">Configure your parameters above and hit Initialize to start hunting leads.</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-32 text-center">
              <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 mb-6">
                <Filter size={32} className="text-zinc-700" />
              </div>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-6 px-6">Your criteria returned zero results.</p>
              <button 
                onClick={() => setFilters({ website: 'all', status: 'all', minRating: 0 })}
                className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all"
              >
                Clear Applied Filters
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-[10px] uppercase font-bold text-zinc-600 border-b border-zinc-800/50 sticky top-0 z-10 backdrop-blur-xl">
                  <tr>
                    <th className="px-8 py-5 tracking-[0.15em]">Organization</th>
                    <th className="px-8 py-5 tracking-[0.15em]">Contact Matrix</th>
                    <th className="px-8 py-5 tracking-[0.15em]">Market Status</th>
                    <th className="px-8 py-5 text-right tracking-[0.15em]">Reputation Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {visibleLeads.map((lead, idx) => (
                    <tr key={`${lead.id}-${idx}`} className="group hover:bg-zinc-800/30 transition-all animate-slide-in" style={{animationDelay: `${idx % 10 * 30}ms`}}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400 transition-all duration-300">
                            {lead.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-100 text-base leading-tight group-hover:text-emerald-400 transition-colors">{lead.name}</span>
                            <span className="text-zinc-500 text-[11px] mt-1 font-medium truncate max-w-[200px]">{lead.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-zinc-400 font-medium text-xs">
                            <Phone size={14} className="text-emerald-500/60" />
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe size={14} className={lead.website ? "text-emerald-500/60" : "text-zinc-700"} />
                            {lead.website ? (
                              <a href={lead.website} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors text-xs truncate max-w-[150px] font-medium">
                                {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                              </a>
                            ) : (
                              <span className="text-zinc-700 text-[10px] uppercase font-bold italic tracking-wider">No Endpoint</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-start gap-1.5">
                          {lead.audit === 'Website Prospect' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle size={10} />
                              Missing Site
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={10} />
                              Optimized
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${lead.status === 'High Intent' ? 'text-amber-500' : 'text-zinc-600'}`}>
                            {lead.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-base">{lead.rating}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  className={`${i < Math.floor(lead.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-800'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-600 font-bold tracking-wider">{lead.reviews} ANALYTICS</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {visibleCount < filteredLeads.length && (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-widest shadow-xl">
                    <Loader2 className="animate-spin text-emerald-500" size={16} />
                    Syncing more records...
                  </div>
                </div>
              )}
              
              {visibleCount >= filteredLeads.length && filteredLeads.length > 0 && (
                <div className="p-12 text-center text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
                  Total Payload Exhausted
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
