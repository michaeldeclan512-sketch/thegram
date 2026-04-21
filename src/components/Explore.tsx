import { Search } from 'lucide-react';

export default function Explore() {
  const images = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    url: `https://picsum.photos/seed/explore${i}/500/500`,
    ratio: Math.random() > 0.8 ? 'span-2' : 'span-1'
  }));

  return (
    <div className="pt-8 pb-20 px-4">
      {/* Search Bar - Desktop View only for Explore */}
      <div className="max-w-[600px] mx-auto mb-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-zinc-900 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-zinc-700 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 md:gap-4 max-w-[935px] mx-auto">
        {images.map((img) => (
          <div 
            key={img.id} 
            className={`relative aspect-square group cursor-pointer overflow-hidden bg-zinc-900 ${img.ratio === 'span-2' ? 'row-span-2' : ''}`}
          >
            <img 
              src={img.url} 
              alt="Explore" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
               <div className="flex items-center gap-1 font-bold">
                 <span>❤️</span>
                 <span>{Math.floor(Math.random() * 1000)}</span>
               </div>
               <div className="flex items-center gap-1 font-bold">
                 <span>💬</span>
                 <span>{Math.floor(Math.random() * 100)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
