import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Music2, 
  Send, 
  MoreHorizontal,
  ChevronDown,
  Camera,
  Loader2,
  Volume2,
  VolumeX,
  Plus,
  Play,
  Pause,
  ArrowLeft,
  Search,
  MoreVertical,
  ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

interface ReelsProps {
  onOpenUpload: (type?: 'post' | 'story' | 'reel') => void;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

function ReelItem({ reel, isMuted, onToggleMute, onOpenUpload, isLast, onViewProfile }: { 
  reel: any, 
  isMuted: boolean, 
  onToggleMute: () => void, 
  onOpenUpload: (type?: 'post' | 'story' | 'reel') => void,
  isLast: boolean,
  onViewProfile?: (userId: string) => void,
  key?: any
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pulseIcon, setPulseIcon] = useState<'play' | 'pause' | null>(null);
  const [progress, setProgress] = useState(0);

  // Sync state with actual video playback
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(console.error);
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percentage);
    }
  };

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    // If it's a bubble from a child that didn't stop propagation, it might fire twice
    // But we want to catch it on the main div
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    
    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setPulseIcon('pause');
    } else {
      videoRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
      });
      setPulseIcon('play');
    }
    
    // Clear pulse after animation duration
    setTimeout(() => setPulseIcon(null), 800);
  };

  return (
    <div 
      className="relative h-screen w-full snap-start bg-black flex flex-col overflow-hidden select-none cursor-pointer"
      onClick={togglePlay}
    >
      {/* 1. Video Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video 
          ref={videoRef}
          src={reel.videoUrl} 
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
        />
      </div>

      {/* 2. UI Overlay Layer */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-10">
        
        {/* Center Feedback - Persistent & Pulses */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {pulseIcon && (
              <motion.div
                key={`pulse-${pulseIcon}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.2 }}
                className="bg-black/40 p-5 rounded-full backdrop-blur-md"
              >
                {pulseIcon === 'play' ? (
                  <Play fill="white" size={32} className="ml-0.5 text-white" />
                ) : (
                  <Pause fill="white" size={32} className="text-white" />
                )}
              </motion.div>
            )}

            {!isPlaying && !pulseIcon && (
              <motion.div
                key="paused-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="bg-black/30 p-5 rounded-full backdrop-blur-sm"
              >
                <Play fill="white" size={36} className="ml-1 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Volume - Positioned specifically */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="absolute top-20 right-4 pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Reel Content & Actions (Bottom) */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-12 flex items-end justify-between gap-4">
          
          <div className="flex-1 pb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {/* Profile & Follow */}
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onViewProfile?.(reel.userId)}
              >
                <img 
                  src={reel.userAvatar} 
                  className="w-9 h-9 rounded-full border border-white/20 object-cover" 
                  alt="User" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span 
                className="font-bold text-sm cursor-pointer hover:text-white/80"
                onClick={() => onViewProfile?.(reel.userId)}
              >
                @{reel.username}
              </span>
              <button 
                className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Follow
              </button>
            </div>
            
            {/* Caption */}
            <p className="text-[13px] line-clamp-2 pr-4 mb-3 drop-shadow-sm leading-relaxed cursor-text">
              {reel.caption || "Enjoy this reel!"}
            </p>

            {/* Audio */}
            <div className="flex items-center gap-2 text-xs bg-black/20 backdrop-blur-sm w-fit px-3 py-1 rounded-full border border-white/5">
              <Music2 size={12} className="animate-pulse" />
              <span className="max-w-[120px] truncate">Original Audio • @{reel.username}</span>
            </div>
          </div>

          {/* Side Column */}
          <div className="flex flex-col items-center gap-4 mb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
             <motion.button 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={(e) => { e.stopPropagation(); onOpenUpload('reel'); }}
               className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-1 group"
             >
                <Plus size={22} strokeWidth={3} className="text-white group-hover:rotate-90 transition-transform" />
             </motion.button>

             <div className="flex flex-col items-center gap-1">
               <button onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <ThumbsUp size={30} strokeWidth={1.5} className="drop-shadow-lg" />
               </button>
               <span className="text-[11px] font-bold">{reel.likesCount || '7.6k'}</span>
             </div>

             <div className="flex flex-col items-center gap-1">
               <button onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <MessageCircle size={30} strokeWidth={1.5} className="drop-shadow-lg" />
               </button>
               <span className="text-[11px] font-bold">{reel.commentsCount || '208'}</span>
             </div>

             <div className="flex flex-col items-center gap-1">
               <button onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <Send size={28} strokeWidth={1.5} className="drop-shadow-lg" />
               </button>
               <span className="text-[11px] font-bold">Share</span>
             </div>

             <div className="w-9 h-9 rounded-lg border-2 border-zinc-700 overflow-hidden mt-1 animate-[spin_4s_linear_infinite]">
                <img 
                  src={reel.userAvatar} 
                  className="w-full h-full object-cover" 
                  alt="Audio" 
                  referrerPolicy="no-referrer"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Red Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/20 z-30">
        <motion.div 
          className="h-full bg-red-600" 
          style={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
    </div>
  );
}

export default function Reels({ onOpenUpload, onBack, onViewProfile }: ReelsProps) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'reel'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setReels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Reels fetch error:", error);
        handleFirestoreError(error, 'list', 'posts');
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-zinc-500" size={48} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No Reels yet</h2>
        <p className="text-zinc-400 mb-8 max-w-xs">Be the first to share a moment with the community.</p>
        <button 
          onClick={() => onOpenUpload('reel')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          <Camera size={20} />
          Create Reel
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black relative">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 w-full p-4 z-[100] flex items-center justify-between pointer-events-auto">
        <button onClick={onBack} className="p-2 hover:bg-black/20 rounded-full transition-colors drop-shadow-md">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-black/20 rounded-full transition-colors drop-shadow-md">
            <Search size={24} />
          </button>
          <button className="p-2 hover:bg-black/20 rounded-full transition-colors drop-shadow-md">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth">
        {reels.map((reel, idx) => (
          <ReelItem 
            key={`${reel.id}-${idx}`} 
            reel={reel} 
            isMuted={isMuted} 
            onToggleMute={() => setIsMuted(!isMuted)}
            onOpenUpload={onOpenUpload}
            onViewProfile={onViewProfile}
            isLast={idx === reels.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
