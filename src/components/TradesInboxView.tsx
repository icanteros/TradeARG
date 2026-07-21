import React from 'react';
import { TradeProposal } from '../types';
import { fetchTrades, updateTradeStatus } from '../supabaseService';
import { Inbox, Send, Check, X, AlertCircle, Sparkles, Calendar, MessageSquare, ArrowRight, RefreshCw } from 'lucide-react';

interface TradesInboxViewProps {
  profileId: string;
  pesoRate: number;
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  onZoomCard: (card: any) => void;
}

export default function TradesInboxView({ profileId, pesoRate, onViewChange, onZoomCard }: TradesInboxViewProps) {
  const [activeTab, setActiveTab] = React.useState<'received' | 'sent'>('received');
  const [proposals, setProposals] = React.useState<TradeProposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const loadProposals = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrades(profileId);
      setProposals(data);
    } catch (e) {
      console.error('Error loading trades:', e);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  React.useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleUpdateStatus = async (tradeId: string, status: 'Accepted' | 'Declined') => {
    setActionLoadingId(tradeId);
    try {
      const success = await updateTradeStatus(tradeId, status);
      if (success) {
        setProposals(prev => prev.map(p => p.id === tradeId ? { ...p, status } : p));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const receivedProposals = React.useMemo(() => {
    return proposals.filter(p => p.receiverId === profileId);
  }, [proposals, profileId]);

  const sentProposals = React.useMemo(() => {
    return proposals.filter(p => p.senderId === profileId);
  }, [proposals, profileId]);

  const activeList = activeTab === 'received' ? receivedProposals : sentProposals;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="retro-grid min-h-screen pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Background glow spotlight */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="flex-1 flex flex-col py-8 z-10 relative">
        <div className="w-full max-w-5xl mx-auto space-y-10">
          
          {/* Header Title block */}
          <div className="text-center select-none space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff] text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Bandeja de Intercambios
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-on-surface">
              Mis <span className="text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.4)]">Canjes</span>
            </h2>
            <p className="text-on-surface-variant text-xs sm:text-sm max-w-xl mx-auto font-normal">
              Revisá tus propuestas enviadas y respondé a las ofertas que recibís de otros jugadores en tiempo real.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center border-b border-[#2d2d44] max-w-md mx-auto" id="trades-tab-switcher">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'received'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Recibidos ({receivedProposals.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'sent'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Send className="w-4 h-4" />
              Enviados ({sentProposals.length})
            </button>
          </div>

          {/* Refresh button */}
          <div className="flex justify-end max-w-4xl mx-auto">
            <button 
              onClick={loadProposals} 
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#121221] border border-[#2d2d44] text-[10px] font-black uppercase tracking-widest text-[#c7c4d7] hover:text-white hover:border-primary/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Proposals List */}
          <div className="max-w-4xl mx-auto space-y-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-t-primary border-primary/20 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs font-mono text-[#908fa0] uppercase tracking-widest">Cargando propuestas de la base de datos...</p>
              </div>
            ) : activeList.length === 0 ? (
              <div className="text-center py-20 bg-[#121221]/40 border border-dashed border-[#2d2d44] rounded-2xl">
                <Inbox className="w-12 h-12 text-[#908fa0]/30 mx-auto mb-3" />
                <p className="text-sm font-bold text-on-surface">No hay propuestas aquí</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {activeTab === 'received' 
                    ? 'Cuando otros coleccionistas te propongan un canje, aparecerá en esta sección.' 
                    : 'Aún no has propuesto ningún canje. Busca cartas en la Comunidad para comenzar.'}
                </p>
                {activeTab === 'sent' && (
                  <button 
                    onClick={() => onViewChange('trade')}
                    className="mt-6 bg-primary hover:brightness-110 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Buscar en la Comunidad
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {activeList.map((proposal) => {
                  const hasOffered = !!proposal.offeredCard;
                  const hasRequested = !!proposal.requestedCard;
                  
                  const offerPrice = proposal.offeredCard?.price || 0;
                  const requestPrice = proposal.requestedCard?.price || 0;
                  const deltaUSD = requestPrice - offerPrice;
                  const deltaARS = Math.round(deltaUSD * pesoRate);

                  return (
                    <div 
                      key={proposal.id}
                      className="bg-[#121221] border border-primary/20 p-5 rounded-2xl flex flex-col gap-5 hover:border-primary/45 transition-all duration-300 relative"
                    >
                      {/* Top Proposal Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d44]/50 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#00f2ff]"></span>
                          <span className="font-bold text-[#c7c4d7]">
                            {activeTab === 'received' ? 'De:' : 'Para:'}
                          </span>
                          <span className="font-black text-white bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-mono">
                            @{activeTab === 'received' ? proposal.senderName : proposal.receiverName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 font-mono text-[10px] text-[#908fa0]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(proposal.createdAt)}
                          </span>
                          
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded font-black uppercase text-[8px] tracking-widest ${
                            proposal.status === 'Accepted'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : proposal.status === 'Declined'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {proposal.status === 'Pending' ? 'Pendiente' : proposal.status === 'Accepted' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </div>
                      </div>

                      {/* Swap Comparison Pane */}
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Offered Card (from sender) */}
                        <div className="w-full md:w-[42%] bg-[#05050a]/40 p-3 rounded-xl border border-white/5 flex items-center gap-4">
                          {hasOffered ? (
                            <>
                              <img 
                                src={proposal.offeredCard?.imageUrl} 
                                alt={proposal.offeredCard?.name} 
                                className="w-12 h-16 object-cover rounded shadow cursor-pointer hover:scale-105 transition-transform animate-fadeIn" 
                                onClick={() => onZoomCard(proposal.offeredCard)}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-red-400 uppercase tracking-widest block mb-0.5">
                                  {activeTab === 'received' ? 'Te Ofrece' : 'Entregás'}
                                </span>
                                <p className="text-xs font-bold text-[#dae2fd] truncate" title={proposal.offeredCard?.name}>{proposal.offeredCard?.name}</p>
                                <p className="text-[9px] text-[#908fa0] font-mono uppercase mt-0.5 truncate">{proposal.offeredCard?.setName}</p>
                                <p className="text-[10px] text-secondary font-mono font-bold mt-1">${proposal.offeredCard?.price.toFixed(2)} USD</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-[#908fa0] text-xs py-4 px-2 w-full justify-center">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span>Carta de oferta no disponible o privada</span>
                            </div>
                          )}
                        </div>

                        {/* Swap visual indicator & Price Delta */}
                        <div className="flex flex-col items-center justify-center text-center select-none">
                          <div className="w-8 h-8 rounded-full bg-[#121221] border border-[#2d2d44] flex items-center justify-center text-secondary mb-1">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          {hasOffered && hasRequested && (
                            <>
                              <div className={`text-xs font-mono font-black ${deltaUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {deltaUSD >= 0 ? `+$${deltaUSD.toFixed(2)}` : `-$${Math.abs(deltaUSD).toFixed(2)}`}
                              </div>
                              <span className="text-[8px] text-[#908fa0] font-mono mt-0.5">
                                {deltaARS >= 0 ? `+$${deltaARS.toLocaleString('es-AR')}` : `-$${Math.abs(deltaARS).toLocaleString('es-AR')}`} ARS
                              </span>
                              <span className="text-[7px] text-[#908fa0]/60 font-mono uppercase tracking-wider mt-0.5">
                                {activeTab === 'received' 
                                  ? (deltaUSD >= 0 ? 'A tu favor' : 'En tu contra')
                                  : (deltaUSD >= 0 ? 'A favor del otro' : 'A tu favor')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Requested Card (received) */}
                        <div className="w-full md:w-[42%] bg-[#05050a]/40 p-3 rounded-xl border border-white/5 flex items-center gap-4">
                          {hasRequested ? (
                            <>
                              <img 
                                src={proposal.requestedCard?.imageUrl} 
                                alt={proposal.requestedCard?.name} 
                                className="w-12 h-16 object-cover rounded shadow cursor-pointer hover:scale-105 transition-transform animate-fadeIn" 
                                onClick={() => onZoomCard(proposal.requestedCard)}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">
                                  {activeTab === 'received' ? 'Te Pide' : 'Recibís'}
                                </span>
                                <p className="text-xs font-bold text-[#dae2fd] truncate" title={proposal.requestedCard?.name}>{proposal.requestedCard?.name}</p>
                                <p className="text-[9px] text-[#908fa0] font-mono uppercase mt-0.5 truncate">{proposal.requestedCard?.setName}</p>
                                <p className="text-[10px] text-secondary font-mono font-bold mt-1">${proposal.requestedCard?.price.toFixed(2)} USD</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-[#908fa0] text-xs py-4 px-2 w-full justify-center">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span>Carta requerida no disponible o privada</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Proposal Custom Message / Notes */}
                      {proposal.notes && (
                        <div className="bg-[#05050a]/50 border border-[#2d2d44]/30 rounded-xl p-3.5 flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-[#908fa0] uppercase tracking-wider font-sans select-none mb-0.5">Mensaje adjunto:</p>
                            <p className="text-xs text-[#c7c4d7] italic font-sans">"{proposal.notes}"</p>
                          </div>
                        </div>
                      )}

                      {/* Pending Action controls (For Receiver) */}
                      {proposal.status === 'Pending' && activeTab === 'received' && (
                        <div className="flex justify-end gap-3 pt-3 border-t border-[#2d2d44]/30">
                          <button
                            onClick={() => handleUpdateStatus(proposal.id, 'Declined')}
                            disabled={actionLoadingId === proposal.id}
                            className="bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(proposal.id, 'Accepted')}
                            disabled={actionLoadingId === proposal.id}
                            className="bg-emerald-500 hover:brightness-110 text-white px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aceptar Canje
                          </button>
                        </div>
                      )}

                      {/* Pending status reminder for sent trades */}
                      {proposal.status === 'Pending' && activeTab === 'sent' && (
                        <div className="text-right text-[9px] font-black uppercase tracking-wider text-yellow-400/80 animate-pulse select-none">
                          Esperando respuesta del receptor...
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-16 pt-8 border-t border-primary/10 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#464554] select-none">
        TRADEARG // MOTOR DE CANJES ACTIVO
      </footer>
    </div>
  );
}
