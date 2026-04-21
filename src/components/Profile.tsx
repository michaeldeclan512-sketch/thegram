import { 
  Settings, 
  Grid, 
  Bookmark, 
  UserSquare, 
  BadgeCheck,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

const USER = {
  username: 'michael_dev',
  fullName: 'Michael Declan',
  avatar: 'https://picsum.photos/seed/user123/200',
  bio: 'Building the future one pixel at a time. 🚀\nTech enthusiast & Digital Creator.',
  website: 'ais.dev/michael',
  posts: 124,
  followers: '12.5k',
  following: 842,
  isVerified: true
};

const MOCK_USER_POSTS = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  url: `https://picsum.photos/seed/profile${i}/500/500`,
  isReel: i % 4 === 0
}));

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  return (
    <div className="pt-8 pb-20 px-4 max-w-[935px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row gap-8 md:gap-20 mb-12 items-center md:items-start">
        <div className="relative group cursor-pointer">
          <div className="w-20 h-20 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-black p-1">
              <img src={USER.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="text-xl flex items-center gap-2">
              {USER.username}
              {USER.isVerified && <BadgeCheck size={20} className="text-blue-500 fill-blue-500" />}
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">Edit profile</button>
              <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">View archive</button>
              <button className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"><Settings size={20} /></button>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="flex gap-1 text-sm md:text-base"><span className="font-bold">{USER.posts}</span> posts</div>
            <div className="flex gap-1 text-sm md:text-base cursor-pointer"><span className="font-bold">{USER.followers}</span> followers</div>
            <div className="flex gap-1 text-sm md:text-base cursor-pointer"><span className="font-bold">{USER.following}</span> following</div>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm">{USER.fullName}</span>
            <p className="text-sm whitespace-pre-wrap mt-1">{USER.bio}</p>
            {USER.website && (
              <a href="#" className="text-blue-400 text-sm font-semibold mt-2 flex items-center gap-1 hover:underline">
                <LinkIcon size={14} />
                {USER.website}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-t border-zinc-800 flex justify-center gap-16">
        <button 
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex items-center gap-1.5 py-4 text-xs font-bold uppercase tracking-widest border-t transition-colors",
            activeTab === 'posts' ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Grid size={14} /> POSTS
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={cn(
            "flex items-center gap-1.5 py-4 text-xs font-bold uppercase tracking-widest border-t transition-colors",
            activeTab === 'saved' ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Bookmark size={14} /> SAVED
        </button>
        <button 
           onClick={() => setActiveTab('tagged')}
           className={cn(
            "flex items-center gap-1.5 py-4 text-xs font-bold uppercase tracking-widest border-t transition-colors",
            activeTab === 'tagged' ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          <UserSquare size={14} /> TAGGED
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-8 py-4">
        {MOCK_USER_POSTS.map((post) => (
          <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden bg-zinc-900 border border-zinc-800/20">
            <img src={post.url} alt="Profile post" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
               <div className="flex items-center gap-4 text-white font-bold">
                 <span className="flex items-center gap-1">❤️ {Math.floor(Math.random() * 500)}</span>
                 <span className="flex items-center gap-1">💬 {Math.floor(Math.random() * 50)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
