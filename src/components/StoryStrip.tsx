import { motion } from 'framer-motion';

const MOCK_STORIES = [
  { id: '1', username: 'Your Story', avatar: 'https://picsum.photos/seed/me/100', isOwn: true },
  { id: '2', username: 'space_x', avatar: 'https://picsum.photos/seed/space/100' },
  { id: '3', username: 'nat_geo', avatar: 'https://picsum.photos/seed/nature/100' },
  { id: '4', username: 'coder_hub', avatar: 'https://picsum.photos/seed/code/100' },
  { id: '5', username: 'chef_luigi', avatar: 'https://picsum.photos/seed/cooking/100' },
  { id: '6', username: 'fitness_pros', avatar: 'https://picsum.photos/seed/gym/100' },
  { id: '7', username: 'daily_news', avatar: 'https://picsum.photos/seed/news/100' },
  { id: '8', username: 'art_weekly', avatar: 'https://picsum.photos/seed/painting/100' },
];

export default function StoryStrip() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade">
      {MOCK_STORIES.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1.5 cursor-pointer min-w-[76px]">
          <div className="relative group">
            <div className={`p-[2px] rounded-full ${story.isOwn ? 'bg-zinc-800' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'}`}>
              <div className="p-[2px] bg-black rounded-full">
                <img 
                  src={story.avatar} 
                  alt={story.username} 
                  className="w-14 h-14 rounded-full object-cover grayscale-[0.2] transition-transform duration-200 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {story.isOwn && (
               <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center text-white font-bold text-xs">
                 +
               </div>
            )}
          </div>
          <span className={`text-xs truncate w-20 text-center ${story.isOwn ? 'text-zinc-500' : 'text-white'}`}>
            {story.username}
          </span>
        </div>
      ))}
    </div>
  );
}
