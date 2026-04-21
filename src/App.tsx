import { useState } from 'react';
import { 
  Home, 
  Search, 
  Compass, 
  Clapperboard, 
  MessageCircle, 
  Heart, 
  SquarePlus, 
  Menu,
  Instagram
} from 'lucide-react';
import { cn } from './lib/utils';
import Feed from './components/Feed';
import Explore from './components/Explore';
import Reels from './components/Reels';
import Messages from './components/Messages';
import Profile from './components/Profile';

type View = 'feed' | 'explore' | 'reels' | 'messages' | 'profile' | 'notifications' | 'create' | 'search';

export default function App() {
  const [activeView, setActiveView] = useState<View>('feed');

  const navItems = [
    { icon: Home, label: 'Home', value: 'feed' as View },
    { icon: Search, label: 'Search', value: 'search' as View },
    { icon: Compass, label: 'Explore', value: 'explore' as View },
    { icon: Clapperboard, label: 'Reels', value: 'reels' as View },
    { icon: MessageCircle, label: 'Messages', value: 'messages' as View },
    { icon: Heart, label: 'Notifications', value: 'notifications' as View },
    { icon: SquarePlus, label: 'Create', value: 'create' as View },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans selection:bg-zinc-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[245px] border-r border-zinc-800 p-3 h-full fixed left-0 top-0">
        <div className="px-3 py-8 mb-4 cursor-pointer">
          <div className="flex items-center gap-2">
            <Instagram size={24} />
            <span className="font-bold text-xl tracking-tight">SocialStream</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveView(item.value)}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 group",
                activeView === item.value ? "font-bold" : "font-normal"
              )}
            >
              <item.icon size={26} className={cn("transition-transform duration-200 group-hover:scale-110", activeView === item.value && "stroke-[2.5px]")} />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
          
          <button 
             onClick={() => setActiveView('profile')}
             className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900",
                activeView === 'profile' ? "font-bold" : "font-normal"
              )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1px]">
              <img 
                src="https://picsum.photos/seed/user123/100" 
                alt="Profile" 
                className="w-full h-full rounded-full border border-black object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-base">Profile</span>
          </button>
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-900 w-full group">
            <Menu size={26} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base">More</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[245px] h-full overflow-y-auto no-scrollbar">
        <div className="max-w-[1000px] mx-auto min-h-full">
           {activeView === 'feed' && <Feed />}
           {activeView === 'explore' && <Explore />}
           {activeView === 'reels' && <Reels />}
           {activeView === 'messages' && <Messages />}
           {activeView === 'profile' && <Profile />}
           {(activeView === 'search' || activeView === 'notifications' || activeView === 'create') && (
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
        <button onClick={() => setActiveView('explore')}><Search size={24} className={activeView === 'explore' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('reels')}><Clapperboard size={24} className={activeView === 'reels' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('messages')}><MessageCircle size={24} className={activeView === 'messages' ? "stroke-[2.5px]" : ""} /></button>
        <button onClick={() => setActiveView('profile')} className="w-6 h-6 rounded-full overflow-hidden border border-zinc-700">
           <img src="https://picsum.photos/seed/user123/100" alt="Me" className="w-full h-full object-cover" />
        </button>
      </nav>
    </div>
  );
}
