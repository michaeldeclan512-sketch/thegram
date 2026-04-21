import { useState } from 'react';
import { 
  MessageSquarePlus, 
  Info, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Heart,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

const CHATS = [
  { id: '1', name: 'design_daily', avatar: 'https://picsum.photos/seed/design/100', lastMsg: 'Sent you a reel', time: '2h', status: 'online' },
  { id: '2', name: 'tech_insider', avatar: 'https://picsum.photos/seed/tech/100', lastMsg: 'Check this out!', time: '5h' },
  { id: '3', name: 'wanderlust', avatar: 'https://picsum.photos/seed/travel/100', lastMsg: 'Where are you?', time: '1d' },
  { id: '4', name: 'chef_luigi', avatar: 'https://picsum.photos/seed/cooking/100', lastMsg: '🍝 recipe soon', time: '2d' },
];

export default function Messages() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const chat = CHATS.find(c => c.id === activeChat);

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden border-x border-zinc-800 md:mr-4">
      {/* Sidebar */}
      <aside className={cn(
        "w-full md:w-[400px] border-r border-zinc-800 flex flex-col",
        activeChat && "hidden md:flex"
      )}>
        <div className="p-5 flex items-center justify-between">
           <div className="flex items-center gap-2 cursor-pointer">
             <span className="font-bold text-lg">michael_dev</span>
             <ChevronDown size={14} />
           </div>
           <MessageSquarePlus size={24} className="cursor-pointer hover:text-zinc-400" />
        </div>

        <div className="px-5 pb-4">
           <h3 className="font-bold text-sm mb-4">Messages</h3>
           <div className="flex flex-col gap-2">
             {CHATS.map((chat) => (
                <button 
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors",
                    activeChat === chat.id && "bg-zinc-900"
                  )}
                >
                  <div className="relative">
                    <img src={chat.avatar} className="w-14 h-14 rounded-full" alt={chat.name} />
                    {chat.status === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full" />}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-semibold">{chat.name}</span>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 w-full">
                      <span className="truncate">{chat.lastMsg}</span>
                      <span>• {chat.time}</span>
                    </div>
                  </div>
                </button>
             ))}
           </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col",
        !activeChat && "hidden md:flex items-center justify-center p-8 text-center"
      )}>
        {activeChat ? (
           <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <button onClick={() => setActiveChat(null)} className="md:hidden">←</button>
                 <img src={chat?.avatar} className="w-10 h-10 rounded-full" alt="User" />
                 <div className="flex flex-col">
                   <span className="text-sm font-bold">{chat?.name}</span>
                   <span className="text-xs text-zinc-500">Active now</span>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <Phone size={24} className="cursor-pointer hover:text-zinc-500" />
                 <Video size={26} className="cursor-pointer hover:text-zinc-500" />
                 <Info size={24} className="cursor-pointer hover:text-zinc-500" />
               </div>
            </div>

            {/* Messages body (Simulated) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 no-scrollbar">
               <div className="flex flex-col items-center py-10">
                 <img src={chat?.avatar} className="w-24 h-24 rounded-full mb-3" alt="Big Avatar" />
                 <span className="font-bold text-lg">{chat?.name}</span>
                 <span className="text-xs text-zinc-500 mt-1">{chat?.name} • SocialStream</span>
                 <button className="mt-4 px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">View Profile</button>
               </div>
               
               <div className="self-end bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[70%] text-sm">
                 Hey! Did you see the new design updates for the project?
               </div>
               <div className="self-start bg-zinc-800 text-white rounded-2xl px-4 py-2 max-w-[70%] text-sm">
                 Not yet, send them over!
               </div>
            </div>

            {/* Input */}
            <div className="p-5">
               <div className="flex items-center gap-3 border border-zinc-800 rounded-3xl px-4 py-2 bg-zinc-900/50 focus-within:ring-1 focus-within:ring-zinc-700">
                  <span className="text-xl px-1 cursor-pointer">😊</span>
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                  />
                  {messageText ? (
                    <button className="text-blue-500 font-bold text-sm px-2">Send</button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <ImageIcon size={22} className="cursor-pointer hover:text-zinc-400" />
                      <Heart size={22} className="cursor-pointer hover:text-zinc-400" />
                    </div>
                  )}
               </div>
            </div>
           </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
              <MessageSquarePlus size={48} />
            </div>
            <h2 className="text-xl font-bold">Your Messages</h2>
            <p className="text-zinc-500 text-sm mt-2">Send private photos and messages to a friend or group.</p>
            <button className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">Send message</button>
          </div>
        )}
      </main>
    </div>
  );
}
