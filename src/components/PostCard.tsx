import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck } from 'lucide-react';
import { Post } from '../types';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likes);

  const toggleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="border-b border-zinc-800 pb-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700">
            <img src={post.user.avatar} alt={post.user.username} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold hover:text-zinc-400 cursor-pointer">{post.user.username}</span>
              {post.user.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-500" />}
              <span className="text-zinc-500 text-xs">• {post.timestamp}</span>
            </div>
          </div>
        </div>
        <button className="text-white hover:text-zinc-400 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image */}
      <div 
        className="aspect-square rounded-sm overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer"
        onDoubleClick={toggleLike}
      >
        <img 
          src={post.imageUrl} 
          alt="Post content" 
          className="w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
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
          <span className="font-bold mr-2">{post.user.username}</span>
          <span>{post.caption}</span>
        </div>
        <button className="text-zinc-500 text-sm mt-1 hover:text-zinc-400 text-left">
          View all {post.commentsCount} comments
        </button>
      </div>
    </div>
  );
}
