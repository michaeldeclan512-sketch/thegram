import { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Compass, 
  Clapperboard, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Menu,
  Instagram,
  LogOut,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';
import Feed from './components/Feed';
import Explore from './components/Explore';
import Reels from './components/Reels';
import Messages from './components/Messages';
import Profile from './components/Profile';
import { useAuth } from './components/AuthProvider';
import UploadModal from './components/UploadModal';
import StoryViewer from './components/StoryViewer';
import LoginView from './components/LoginView';
import { StoryGroup } from './types';

type View = 'feed' | 'explore' | 'reels' | 'messages' | 'profile' | 'notifications' | 'search';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<View>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'post' | 'story' | 'reel'>('post');
  
  // Story Viewer State
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [initialUserIndex, setInitialUserIndex] = useState(0);

  const openUpload = (type: 'post' | 'story' | 'reel' = 'post') => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setActiveView('profile');
  };

  const openStoryViewer = (groups: StoryGroup[], index: number) => {
    setStoryGroups(groups);
    setInitialUserIndex(index);
    setIsStoryViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const navItems = [
    { icon: Home, label: 'Home', value: 'feed' as View, onClick: () => { setSelectedUserId(null); setActiveView('feed'); } },
    { icon: Search, label: 'Search', value: 'search' as View, onClick: () => setActiveView('search') },
    { icon: Clapperboard, label: 'Reels', value: 'reels' as View, onClick: () => setActiveView('reels') },
    { icon: MessageCircle, label: 'Messages', value: 'messages' as View, onClick: () => setActiveView('messages') },
    { icon: Heart, label: 'Notifications', value: 'notifications' as View, onClick: () => setActiveView('notifications') },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans selection:bg-zinc-800">
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        initialType={uploadType}
      />

      <StoryViewer
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        storyGroups={storyGroups}
        initialUserIndex={initialUserIndex}
      />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[245px] border-r border-zinc-800 p-3 h-full fixed left-0 top-0 z-40">
        <div className="px-3 py-8 mb-4 cursor-pointer" onClick={() => { setSelectedUserId(null); setActiveView('feed'); }}>
          <div className="flex items-center gap-2">
            <Instagram size={28} />
            <span className="font-bold text-xl tracking-tight hidden lg:inline">SocialStream</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 group",
                (activeView === item.value && !selectedUserId) ? "font-bold" : "font-normal"
              )}
            >
              <item.icon size={26} className={cn("transition-transform duration-200 group-hover:scale-110", (activeView === item.value && !selectedUserId) && "stroke-[2.5px]")} />
              <span className="text-base hidden lg:inline">{item.label}</span>
            </button>
          ))}
          
          <button 
             onClick={() => openUpload('post')}
             className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 group font-normal"
          >
            <PlusSquare size={26} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base hidden lg:inline">Create</span>
          </button>

          <button 
             onClick={() => { setSelectedUserId(null); setActiveView('profile'); }}
             className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900",
                (activeView === 'profile' && !selectedUserId) ? "font-bold" : "font-normal"
              )}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-700">
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="text-base hidden lg:inline">Profile</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <button 
            onClick={signOut}
            className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 w-full group text-red-400"
          >
            <LogOut size={26} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base hidden lg:inline">Logout</span>
          </button>
          <button className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 w-full group">
            <Menu size={26} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base hidden lg:inline">More</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 h-full overflow-y-auto no-scrollbar",
        activeView === 'reels' ? "md:ml-0 lg:ml-0" : "md:ml-[72px] lg:ml-[245px]"
      )}>
        <div className={cn(
          "mx-auto min-h-full",
          activeView === 'reels' ? "max-w-none w-full" : "max-w-[1000px]"
        )}>
           {activeView === 'feed' && (
             <Feed 
               onOpenUpload={openUpload} 
               onViewStories={openStoryViewer} 
               onViewProfile={handleViewProfile}
             />
           )}
           {activeView === 'reels' && (
             <Reels 
               onOpenUpload={openUpload} 
               onBack={() => setActiveView('feed')} 
               onViewProfile={handleViewProfile}
             />
           )}
           {activeView === 'messages' && <Messages />}
           {activeView === 'profile' && <Profile userId={selectedUserId || undefined} />}
           {(activeView === 'search' || activeView === 'notifications') && (
             <div className="flex flex-col items-center justify-center h-[80vh]">
                <div className="bg-zinc-900 p-8 rounded-3xl text-center">
                  <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
                  <p className="text-zinc-400 text-sm">The {activeView} feature is currently under development.</p>
                  <button 
                    onClick={() => setActiveView('feed')}
                    className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Back to Feed
                  </button>
                </div>
             </div>
           )}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-12 bg-black border-t border-zinc-800 flex items-center justify-around z-50">
        <button onClick={() => setActiveView('feed')}><Home size={24} className={activeView === 'feed' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('search')}><Search size={24} className={activeView === 'search' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => openUpload(activeView === 'reels' ? 'reel' : 'post')}><PlusSquare size={24} /></button>
        <button onClick={() => setActiveView('reels')}><Clapperboard size={24} className={activeView === 'reels' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('messages')}><MessageCircle size={24} className={activeView === 'messages' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('profile')} className={cn("w-6 h-6 rounded-full overflow-hidden border", activeView === 'profile' ? "border-white" : "border-zinc-700")}>
           <img src={user.avatar} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </button>
      </nav>
    </div>
  );
}
