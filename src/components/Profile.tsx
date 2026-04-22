import { useState, useEffect } from 'react';
import { 
  Settings, 
  Grid, 
  Bookmark, 
  UserSquare, 
  BadgeCheck,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProfileProps {
  userId?: string;
}

export default function Profile({ userId }: ProfileProps) {
  const { user: currentUser, signOut } = useAuth();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const viewId = userId || currentUser?.id;

  useEffect(() => {
    if (!viewId) return;

    let isSubscribed = true;
    setLoading(true);
    setTargetUser(null);
    setUserPosts([]);

    const fetchData = async () => {
      try {
        // 1. Fetch user data first or use currentUser
        let userData = null;
        if (viewId === currentUser?.id) {
          userData = currentUser;
        } else {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', viewId));
          if (userDoc.exists()) {
            userData = { id: userDoc.id, ...userDoc.data() };
          }
        }

        if (!isSubscribed) return;
        setTargetUser(userData);

        // If user doesn't exist, stop loading immediately
        if (!userData) {
          setLoading(false);
          return;
        }

        // 2. Setup snapshot listener for posts
        const q = query(
          collection(db, 'posts'),
          where('userId', '==', viewId),
          orderBy('isPinned', 'desc'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!isSubscribed) return;
          setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching profile data:", error);
        if (isSubscribed) setLoading(false);
      }
    };

    const unsubPromise = fetchData();

    return () => {
      isSubscribed = false;
      unsubPromise.then(unsub => unsub?.());
    };
  }, [viewId, currentUser]);

  if (!targetUser) {
    if (loading) {
      return (
        <div className="flex justify-center py-40">
          <Loader2 className="animate-spin text-zinc-500" size={48} />
        </div>
      );
    }
    return (
      <div className="text-center py-40">
        <h2 className="text-xl font-bold">User not found</h2>
      </div>
    );
  }

  const isOwnProfile = targetUser.id === currentUser?.id;

  return (
    <div className="pt-8 pb-20 px-4 max-w-[935px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row gap-8 md:gap-20 mb-12 items-center md:items-start">
        <div className="relative group">
          <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-xl">
            <div className="w-full h-full rounded-full bg-black p-1">
              <img src={targetUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="text-xl flex items-center gap-2 font-medium">
              {targetUser.username}
              {targetUser.isVerified && <BadgeCheck size={20} className="text-blue-500 fill-blue-500" />}
            </h2>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">Edit profile</button>
                  <button onClick={signOut} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors text-red-400">Logout</button>
                </>
              ) : (
                <>
                  <button className="px-8 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors text-white">Follow</button>
                  <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">Message</button>
                </>
              )}
              <button className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"><Settings size={20} /></button>
            </div>
          </div>

          <div className="flex gap-10">
            <div className="flex gap-1 text-sm md:text-base"><span className="font-bold">{userPosts.length}</span> posts</div>
            <div className="flex gap-1 text-sm md:text-base cursor-pointer"><span className="font-bold">{targetUser.followersCount || 0}</span> followers</div>
            <div className="flex gap-1 text-sm md:text-base cursor-pointer"><span className="font-bold">{targetUser.followingCount || 0}</span> following</div>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm">{targetUser.fullName}</span>
            <p className="text-sm whitespace-pre-wrap mt-1">{targetUser.bio || 'New member of SocialStream'}</p>
            {targetUser.website && (
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm font-semibold mt-2 flex items-center gap-1 hover:underline">
                <LinkIcon size={14} />
                {targetUser.website}
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
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : userPosts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
           <Grid size={48} className="mx-auto mb-4 opacity-20" />
           <p className="text-xl font-bold">Share Photos</p>
           <p className="text-sm">When you share photos, they will appear on your profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-8 py-4">
          {userPosts.map((post, index) => (
            <div key={`${post.id}-${index}`} className="relative aspect-square group cursor-pointer overflow-hidden bg-zinc-900 border border-zinc-800/20">
              {post.type === 'video' ? (
                <video src={post.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={post.imageUrl} alt="Profile post" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                 <div className="flex items-center gap-4 text-white font-bold">
                   <span className="flex items-center gap-1">❤️ {post.likesCount || 0}</span>
                   <span className="flex items-center gap-1">💬 {post.commentsCount || 0}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
