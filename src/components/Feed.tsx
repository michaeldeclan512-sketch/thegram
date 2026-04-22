import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PostCard from './PostCard';
import StoryStrip from './StoryStrip';
import { Post, StoryGroup } from '../types';
import { Loader2 } from 'lucide-react';

interface FeedProps {
  onOpenUpload: (type?: 'post' | 'story' | 'reel') => void;
  onViewStories: (storyGroups: StoryGroup[], initialUserIndex: number) => void;
  onViewProfile?: (userId: string) => void;
}

export default function Feed({ onOpenUpload, onViewStories, onViewProfile }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().createdAt?.toDate()?.toLocaleDateString() || 'Just now',
        }))
        .filter((post: any) => post.type !== 'reel') as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="pt-8 pb-20 max-w-[630px] mx-auto px-4">
      <StoryStrip 
        onOpenUpload={onOpenUpload} 
        onViewStories={onViewStories} 
        onViewProfile={onViewProfile}
      />
      
      <div className="flex flex-col gap-8 mt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-zinc-500" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg font-bold">No posts yet</p>
            <p className="text-sm">Start following people or upload your first photo!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={`${post.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard post={post} onViewProfile={onViewProfile} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
