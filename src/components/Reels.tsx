import { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Music2, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_REELS = [
  {
    id: '1',
    user: { username: 'scenic_shots', avatar: 'https://picsum.photos/seed/mountains/100' },
    videoUrl: 'https://picsum.photos/seed/forest/1080/1920',
    caption: 'Lost in the magic of the Pacific Northwest. 🌲⛰️',
    likes: '1.2M',
    comments: '4.5K',
    audio: 'Original Audio - scenic_shots'
  },
  {
    id: '2',
    user: { username: 'city_vibes', avatar: 'https://picsum.photos/seed/city/100' },
    videoUrl: 'https://picsum.photos/seed/tokyo/1080/1920',
    caption: 'Tokyo nights hit different. 🗼✨',
    likes: '850K',
    comments: '1.2K',
    audio: 'Lo-fi Beats - Chill Radio'
  }
];

export default function Reels() {
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <div className="h-full w-full flex items-center justify-center bg-black overflow-hidden relative">
      <div className="absolute top-8 left-8 z-50 flex items-center gap-2 cursor-pointer">
        <h1 className="text-xl font-bold">Reels</h1>
        <ChevronDown size={20} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={MOCK_REELS[currentIdx].id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="relative h-[95vh] aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden flex flex-col group shadow-2xl border border-zinc-800"
        >
          {/* Simulated Video Content */}
          <img 
            src={MOCK_REELS[currentIdx].videoUrl} 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
            alt="Reel content"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

          {/* Reel Content Overlay */}
          <div className="mt-auto p-4 z-10 flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={MOCK_REELS[currentIdx].user.avatar} className="w-8 h-8 rounded-full border border-zinc-500" alt="User" />
                <span className="font-bold text-sm">{MOCK_REELS[currentIdx].user.username}</span>
                <button className="px-3 py-1 border border-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors">Follow</button>
              </div>
              <p className="text-sm mb-3 line-clamp-2">{MOCK_REELS[currentIdx].caption}</p>
              <div className="flex items-center gap-2 text-xs">
                <Music2 size={14} />
                <span>{MOCK_REELS[currentIdx].audio}</span>
              </div>
            </div>

            {/* Side Actions */}
            <div className="flex flex-col items-center gap-6 mb-2">
               <div className="flex flex-col items-center gap-1 group">
                 <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Heart size={28} className="group-hover:scale-110 transition-transform" /></button>
                 <span className="text-xs font-semibold">{MOCK_REELS[currentIdx].likes}</span>
               </div>
               <div className="flex flex-col items-center gap-1 group">
                 <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MessageCircle size={28} className="group-hover:scale-110 transition-transform" /></button>
                 <span className="text-xs font-semibold">{MOCK_REELS[currentIdx].comments}</span>
               </div>
               <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Send size={26} /></button>
               <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Bookmark size={26} /></button>
               <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreHorizontal size={26} /></button>
               <div className="w-8 h-8 rounded-md bg-zinc-800 border border-white/20 overflow-hidden">
                 <img src="https://picsum.photos/seed/audio/50" className="w-full h-full object-cover" alt="Audio cover" />
               </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows for demo */}
      <div className="absolute right-12 flex flex-col gap-4">
        <button 
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(prev => prev - 1)}
          className="p-3 bg-zinc-800 rounded-full disabled:opacity-30 hover:bg-zinc-700 transition-colors"
        >
          ↑
        </button>
        <button 
          disabled={currentIdx === MOCK_REELS.length - 1}
          onClick={() => setCurrentIdx(prev => prev + 1)}
          className="p-3 bg-zinc-800 rounded-full disabled:opacity-30 hover:bg-zinc-700 transition-colors"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
