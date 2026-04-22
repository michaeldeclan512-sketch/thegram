import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="pt-8 pb-20 px-4">
      {/* Search Bar */}
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

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-xl font-bold">Discovery awaits</p>
          <p className="text-sm">When users share photos, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4 max-w-[935px] mx-auto">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="relative aspect-square group cursor-pointer overflow-hidden bg-zinc-900"
            >
              {post.type === 'video' ? (
                <video src={post.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={post.imageUrl} 
                  alt="Explore" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                 <div className="flex items-center gap-1 font-bold">
                   <span>❤️</span>
                   <span>{post.likesCount || 0}</span>
                 </div>
                 <div className="flex items-center gap-1 font-bold">
                   <span>💬</span>
                   <span>{post.commentsCount || 0}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
