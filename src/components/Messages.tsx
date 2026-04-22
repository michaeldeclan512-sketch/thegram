import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquarePlus, 
  Info, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Heart,
  ChevronDown,
  Loader2,
  Send as SendIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc,
  serverTimestamp, 
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Messages() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all users to start conversations
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user?.id);
      setUsers(usersData);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsubscribe;
  }, [activeChatId]);

  const startChat = (otherUser: any) => {
    // For simplicity, chatId is a sorted combination of both UIDs
    const chatId = [user?.id, otherUser.id].sort().join('_');
    setActiveChatId(chatId);
    setActiveUser(otherUser);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChatId || !user || sending || !activeUser) return;

    setSending(true);
    try {
      // Ensure the chat document exists with members for rules to work
      const chatRef = doc(db, 'chats', activeChatId);
      await setDoc(chatRef, {
        members: [user.id, activeUser.id],
        lastMessage: messageText.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Add the message
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        senderId: user.id,
        text: messageText.trim(),
        createdAt: serverTimestamp(),
      });
      setMessageText('');
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden border-x border-zinc-800 md:mr-4">
      {/* Sidebar */}
      <aside className={cn(
        "w-full md:w-[400px] border-r border-zinc-800 flex flex-col",
        activeChatId && "hidden md:flex"
      )}>
        <div className="p-5 flex items-center justify-between">
           <div className="flex items-center gap-2 cursor-pointer">
             <span className="font-bold text-lg">{user?.username}</span>
             <ChevronDown size={14} />
           </div>
           <MessageSquarePlus size={24} className="cursor-pointer hover:text-zinc-400" />
        </div>

        <div className="px-5 pb-4 overflow-y-auto no-scrollbar">
           <h3 className="font-bold text-sm mb-4">Messages</h3>
           {loading ? (
             <div className="flex justify-center p-8 text-zinc-500">
               <Loader2 className="animate-spin" />
             </div>
           ) : (
             <div className="flex flex-col gap-2">
               {users.map((chatUser) => (
                  <button 
                    key={chatUser.id}
                    onClick={() => startChat(chatUser)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors",
                      activeUser?.id === chatUser.id && "bg-zinc-900"
                    )}
                  >
                    <div className="relative">
                      <img src={chatUser.avatar} className="w-14 h-14 rounded-full object-cover" alt={chatUser.username} />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-semibold">{chatUser.username}</span>
                      <span className="text-xs text-zinc-500 truncate">{chatUser.fullName}</span>
                    </div>
                  </button>
               ))}
               {users.length === 0 && (
                 <p className="text-zinc-500 text-sm text-center p-8">No other users found.</p>
               )}
             </div>
           )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col",
        !activeChatId && "hidden md:flex items-center justify-center p-8 text-center"
      )}>
        {activeChatId && activeUser ? (
           <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <button onClick={() => { setActiveChatId(null); setActiveUser(null); }} className="md:hidden">←</button>
                 <img src={activeUser.avatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
                 <div className="flex flex-col">
                   <span className="text-sm font-bold">{activeUser.username}</span>
                   <span className="text-xs text-zinc-500">Active now</span>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <Phone size={24} className="cursor-pointer hover:text-zinc-500 text-zinc-400" />
                 <Video size={26} className="cursor-pointer hover:text-zinc-500 text-zinc-400" />
                 <Info size={24} className="cursor-pointer hover:text-zinc-500 text-zinc-400" />
               </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 no-scrollbar">
               <div className="flex flex-col items-center py-10">
                 <img src={activeUser.avatar} className="w-24 h-24 rounded-full mb-3 object-cover" alt="Big Avatar" />
                 <span className="font-bold text-lg">{activeUser.fullName}</span>
                 <span className="text-xs text-zinc-500 mt-1">{activeUser.username} • Instagram</span>
                 <button className="mt-4 px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">View Profile</button>
               </div>
               
               {messages.map((msg) => (
                 <div 
                   key={msg.id}
                   className={cn(
                     "px-4 py-2 rounded-2xl max-w-[70%] text-sm",
                     msg.senderId === user?.id 
                       ? "self-end bg-blue-500 text-white" 
                       : "self-start bg-zinc-800 text-white"
                   )}
                 >
                   {msg.text}
                 </div>
               ))}
               <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-5">
               <form 
                 onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                 className="flex items-center gap-3 border border-zinc-800 rounded-3xl px-4 py-2 bg-zinc-900/50 focus-within:ring-1 focus-within:ring-zinc-700"
               >
                  <span className="text-xl px-1 cursor-pointer">😊</span>
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                  />
                  {messageText.trim() ? (
                    <button 
                      type="submit"
                      disabled={sending}
                      className="text-blue-500 font-bold text-sm px-2 disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : 'Send'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 text-zinc-400">
                      <ImageIcon size={22} className="cursor-pointer hover:text-zinc-400" />
                      <Heart size={22} className="cursor-pointer hover:text-zinc-400" />
                    </div>
                  )}
               </form>
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
