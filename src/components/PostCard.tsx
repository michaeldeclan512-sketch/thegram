import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  BadgeCheck, 
  Pin, 
  Trash2, 
  Edit3, 
  Shield, 
  Bell, 
  BellOff, 
  ExternalLink,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  Flag,
  Clock,
  Ban,
  UserX
} from 'lucide-react';
import { Post } from '../types';
import { doc, updateDoc, increment, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PostCardProps {
  post: Post;
  onViewProfile?: (userId: string) => void;
}

export default function PostCard({ post, onViewProfile }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [copying, setCopying] = useState(false);

  const isOwner = user?.id === post.userId;

  const toggleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likesCount: increment(newLikedState ? 1 : -1)
      });
    } catch (error) {
       console.error("Failed to update like", error);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const postRef = doc(db, 'posts', post.id);
      const userRef = user ? doc(db, 'users', user.id) : null;
      
      switch (action) {
        case 'delete':
          if (window.confirm('Are you sure you want to delete this post?')) {
            await deleteDoc(postRef);
          }
          break;
        case 'pin':
          await updateDoc(postRef, { isPinned: !post.isPinned });
          break;
        case 'save':
          await updateDoc(postRef, { isSaved: !post.isSaved });
          break;
        case 'privacy':
          const nextPrivacy = post.privacy === 'public' ? 'friends' : post.privacy === 'friends' ? 'private' : 'public';
          await updateDoc(postRef, { privacy: nextPrivacy });
          break;
        case 'notifications':
          await updateDoc(postRef, { notificationsEnabled: !post.notificationsEnabled });
          break;
        case 'copy':
          const postLink = `${window.location.origin}/post/${post.id}`;
          await navigator.clipboard.writeText(postLink);
          setCopying(true);
          setTimeout(() => setCopying(false), 2000);
          break;
        case 'edit':
          setIsEditing(true);
          break;
        case 'interested':
        case 'not_interested':
        case 'hide':
        case 'report':
        case 'snooze':
        case 'hide_all':
        case 'block':
          // Mocking these for demo since they require complex feed filtering logic
          // But implementing the UI feedback immediately
          alert(`${action.replace('_', ' ').charAt(0).toUpperCase() + action.replace('_', ' ').slice(1)} action recorded.`);
          break;
      }
      if (action !== 'edit') setShowOptions(false);
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    }
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, 'posts', post.id), { caption: editCaption });
      setIsEditing(false);
      setShowOptions(false);
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  return (
    <div className="border-b border-zinc-800 pb-4 mb-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewProfile?.(post.userId)}
          >
            <img 
              src={post.userAvatar} 
              alt={post.username} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span 
                className="text-sm font-bold hover:text-zinc-400 cursor-pointer"
                onClick={() => onViewProfile?.(post.userId)}
              >
                {post.username}
              </span>
              <span className="text-zinc-500 text-xs">• {post.timestamp}</span>
              {post.isPinned && <Pin size={12} className="text-zinc-500 fill-zinc-500 rotate-45" />}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowOptions(true)}
          className="text-white hover:text-zinc-400 transition-colors p-2"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showOptions && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-[20px] z-[101] p-4 pb-10 border-t border-zinc-800"
            >
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
              
              <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto no-scrollbar pb-6">
                {isOwner ? (
                  <>
                    <button onClick={() => handleAction('pin')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <Pin size={20} className={cn(post.isPinned && "fill-white")} />
                      <span className="font-semibold">{post.isPinned ? 'Unpin post' : 'Pin post'}</span>
                    </button>
                    <button onClick={() => handleAction('edit')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors text-blue-400">
                      <Edit3 size={20} />
                      <span className="font-semibold">Edit post</span>
                    </button>
                    <button onClick={() => handleAction('privacy')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <Shield size={20} />
                      <span className="font-semibold">Privacy: {post.privacy || 'public'}</span>
                    </button>
                    <button onClick={() => handleAction('delete')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors text-red-500">
                      <Trash2 size={20} />
                      <span className="font-semibold">Delete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleAction('interested')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <ThumbsUp size={20} />
                      <span className="font-semibold">Interested</span>
                    </button>
                    <button onClick={() => handleAction('not_interested')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors text-amber-500">
                      <ThumbsDown size={20} />
                      <span className="font-semibold">Not interested</span>
                    </button>
                    <button onClick={() => handleAction('hide')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <EyeOff size={20} />
                      <span className="font-semibold">Hide post</span>
                    </button>
                    <button onClick={() => handleAction('report')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors text-red-500">
                      <Flag size={20} />
                      <span className="font-semibold">Report photo</span>
                    </button>
                  </>
                )}

                <div className="h-[1px] bg-zinc-800 my-2 mx-4" />

                <button onClick={() => handleAction('save')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                  <Bookmark size={20} className={cn(post.isSaved && "fill-white")} />
                  <span className="font-semibold">{post.isSaved ? 'Unsave post' : 'Save post'}</span>
                </button>

                <button onClick={() => handleAction('notifications')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                  {post.notificationsEnabled ? <BellOff size={20} /> : <Bell size={20} />}
                  <span className="font-semibold">{post.notificationsEnabled ? 'Turn off notifications' : 'Turn on notifications'}</span>
                </button>

                <button onClick={() => handleAction('copy')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                  {copying ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  <span className={cn("font-semibold", copying && "text-green-500")}>{copying ? 'Link copied!' : 'Copy link'}</span>
                </button>

                {!isOwner && (
                  <>
                    <div className="h-[1px] bg-zinc-800 my-2 mx-4" />
                    <button onClick={() => handleAction('snooze')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <Clock size={20} />
                      <span className="font-semibold text-zinc-300">Snooze @{post.username} for 30 days</span>
                    </button>
                    <button onClick={() => handleAction('hide_all')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors">
                      <Ban size={20} />
                      <span className="font-semibold text-zinc-300">Hide all from @{post.username}</span>
                    </button>
                    <button onClick={() => handleAction('block')} className="flex items-center gap-4 w-full p-4 hover:bg-zinc-800 rounded-xl transition-colors text-red-500">
                      <UserX size={20} />
                      <span className="font-semibold">Block @{post.username}</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-[200] flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsEditing(false)} className="text-lg">Cancel</button>
              <h2 className="text-lg font-bold">Edit Caption</h2>
              <button onClick={saveEdit} className="text-lg font-bold text-blue-500">Save</button>
            </div>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="flex-1 bg-transparent border-none text-lg resize-none focus:ring-0 outline-none p-0"
              placeholder="Write a caption..."
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media */}
      <div 
        className="aspect-square rounded-sm overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
        onDoubleClick={toggleLike}
      >
        {(post.type === 'video' || post.type === 'reel') ? (
           <video 
             src={post.videoUrl || post.imageUrl} 
             controls 
             className="w-full h-full object-contain" 
           />
        ) : (
          <img 
            src={post.imageUrl || ''} 
            alt="Post content" 
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className="transition-transform active:scale-125 duration-200">
            <Heart 
              size={26} 
              className={isLiked ? "text-red-500 fill-red-500" : "hover:text-zinc-500 transition-colors"} 
            />
          </button>
          <button className="hover:text-zinc-500 transition-colors">
            <MessageCircle size={26} />
          </button>
          <button className="hover:text-zinc-500 transition-colors">
            <Send size={24} />
          </button>
        </div>
        <button className="hover:text-zinc-500 transition-colors">
          <Bookmark size={26} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <span className="text-sm font-bold">{likes.toLocaleString()} likes</span>
        <div className="text-sm">
          <span className="font-bold mr-2">{post.username}</span>
          <span>{post.caption}</span>
        </div>
        <button className="text-zinc-500 text-sm mt-1 hover:text-zinc-400 text-left">
          View all {post.commentsCount || 0} comments
        </button>
      </div>
    </div>
  );
}
