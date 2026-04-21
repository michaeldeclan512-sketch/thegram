import { motion } from 'framer-motion';
import PostCard from './PostCard';
import StoryStrip from './StoryStrip';

const MOCK_POSTS = [
  {
    id: '1',
    user: { 
      id: 'u1', 
      username: 'art_perspective', 
      fullName: 'Art Journal', 
      avatar: 'https://picsum.photos/seed/art/100',
      isVerified: true 
    },
    imageUrl: 'https://picsum.photos/seed/painting/800/800',
    caption: 'The beauty of light and shadow in morning strokes. 🎨✨ #art #morningvibe',
    likes: 12435,
    commentsCount: 84,
    timestamp: '3 HOURS AGO',
    isLiked: false
  },
  {
    id: '2',
    user: { 
      id: 'u2', 
      username: 'tech_insider', 
      fullName: 'Tech Insider', 
      avatar: 'https://picsum.photos/seed/tech/100' 
    },
    imageUrl: 'https://picsum.photos/seed/robot/800/800',
    caption: 'Future is closer than you think. Neural interfaces are reaching a turning point in reliability. 🤖🛰️',
    likes: 8521,
    commentsCount: 142,
    timestamp: '8 HOURS AGO',
    isLiked: true
  },
  {
    id: '3',
    user: { 
      id: 'u3', 
      username: 'culinary_roads', 
      fullName: 'Gourmet Travel', 
      avatar: 'https://picsum.photos/seed/food/100',
      isVerified: true
    },
    imageUrl: 'https://picsum.photos/seed/pasta/800/800',
    caption: 'Authentic carbonara in Rome. No cream, just eggs, guanciale, and love. 🇮🇹🍝',
    likes: 4567,
    commentsCount: 32,
    timestamp: '1 DAY AGO',
    isLiked: false
  }
];

export default function Feed() {
  return (
    <div className="pt-8 pb-20 max-w-[630px] mx-auto px-4">
      <StoryStrip />
      
      <div className="flex flex-col gap-8 mt-4">
        {MOCK_POSTS.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
