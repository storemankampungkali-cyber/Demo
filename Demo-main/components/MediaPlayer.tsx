import React, { useState, useMemo } from 'react';
import { Youtube, X, Minimize2, Maximize2, Music, SkipBack, SkipForward, ListMusic, Play } from 'lucide-react';
import { PlaylistItem } from '../types';

interface MediaPlayerProps {
  videoId: string | null;
  playlist: PlaylistItem[];
  onPlay: (videoId: string) => void;
  onClose: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ videoId, playlist, onPlay, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentItem = useMemo(() => playlist.find(p => p.videoId === videoId), [videoId, playlist]);
  const currentIndex = useMemo(() => playlist.findIndex(p => p.videoId === videoId), [videoId, playlist]);

  if (!videoId) return null;

  const handleNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    onPlay(playlist[nextIndex].videoId);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    onPlay(playlist[prevIndex].videoId);
  };

  return (
    <div 
        className={`fixed z-[100] bg-black border border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300 ease-in-out flex flex-col
        ${isMinimized 
            ? 'bottom-4 right-4 w-72 h-20 rounded-xl' 
            : 'bottom-4 right-4 w-96 h-[400px] rounded-2xl'
        }`}
    >
        {/* Minimized View */}
        {isMinimized && (
            <div className="flex items-center px-3 h-full gap-3">
                <div className="w-10 h-10 bg-red-900/20 rounded-lg flex items-center justify-center border border-red-500/20 shrink-0">
                    <Music className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{currentItem?.title || 'Unknown Track'}</p>
                    <div className="flex gap-2 mt-1">
                        <button onClick={handlePrev} className="text-slate-400 hover:text-white"><SkipBack className="w-3 h-3" /></button>
                        <button onClick={handleNext} className="text-slate-400 hover:text-white"><SkipForward className="w-3 h-3" /></button>
                    </div>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => setIsMinimized(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* Maximized View */}
        {!isMinimized && (
            <>
                {/* Header */}
                <div className="h-10 bg-gradient-to-r from-red-900/80 to-black flex justify-between items-center px-3 border-b border-red-900/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">
                            {currentItem?.title || 'NEON PLAYER'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setShowPlaylist(!showPlaylist)} 
                            className={`p-1.5 rounded transition-colors ${showPlaylist ? 'text-red-400 bg-white/10' : 'text-slate-400 hover:text-white'}`}
                            title="Toggle Playlist"
                        >
                            <ListMusic className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:text-white text-slate-400">
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:text-red-400 text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative bg-black overflow-hidden group">
                     {/* Video Iframe */}
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full z-10"
                    ></iframe>

                    {/* Quick Playlist Overlay */}
                    {showPlaylist && (
                        <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-sm animate-fade-in flex flex-col">
                            <div className="p-3 border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>Queue ({playlist.length})</span>
                                <button onClick={() => setShowPlaylist(false)} className="text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {playlist.map((item, idx) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => { onPlay(item.videoId); setShowPlaylist(false); }}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${item.videoId === videoId ? 'bg-red-900/30 border border-red-500/30' : 'hover:bg-white/10 border border-transparent'}`}
                                    >
                                        <div className="text-xs text-slate-500 w-4">{idx + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm truncate ${item.videoId === videoId ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                                                {item.title}
                                            </div>
                                        </div>
                                        {item.videoId === videoId && <Music className="w-3 h-3 text-red-500 animate-bounce" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="h-14 bg-dark-card border-t border-dark-border flex items-center justify-between px-4 shrink-0">
                    <button 
                        onClick={handlePrev}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        title="Previous Track"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center max-w-[180px]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Now Playing</span>
                        <span className="text-xs text-red-400 font-medium truncate w-full text-center">
                            {currentItem?.title || '...'}
                        </span>
                    </div>

                    <button 
                        onClick={handleNext}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        title="Next Track"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>
            </>
        )}
    </div>
  );
};

export default MediaPlayer;