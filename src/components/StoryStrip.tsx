import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Story, StoryGroup } from '../types';

interface StoryStripProps {
  onOpenUpload: (type?: 'post' | 'story' | 'reel') => void;
  onViewStories: (storyGroups: StoryGroup[], initialUserIndex: number) => void;
  onViewProfile?: (userId: string) => void;
}

export default function StoryStrip({ onOpenUpload, onViewStories, onViewProfile }: StoryStripProps) {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);

  useEffect(() => {
    if (!user) return;

    // Use a simpler query to avoid issues with null serverTimestamps 
    // and ensure immediate local display
    const q = query(collection(db, 'stories'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Stories snapshot received, count:", snapshot.size);
      const allStories = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Story));

      // Filter for last 24 hours locally
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const validStories = allStories.filter(story => {
        const time = story.createdAt?.toMillis() || Date.now();
        return time >= yesterday;
      });

      // Sort by creation time asc locally
      validStories.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeA - timeB;
      });
      
      // Group by userId
      const groups: { [key: string]: StoryGroup } = {};
      validStories.forEach(story => {
        if (!groups[story.userId]) {
          groups[story.userId] = {
            userId: story.userId,
            username: story.username,
            userAvatar: story.userAvatar,
            stories: []
          };
        }
        groups[story.userId].stories.push(story);
      });

      // Convert to array
      const groupsArray = Object.values(groups);
      console.log("Groups converted to array:", groupsArray.map(g => g.username));
      console.log("Current User ID:", user?.id);
      console.log("Is current user in groups?", groupsArray.some(g => g.userId === user?.id));
      
      setStoryGroups(groupsArray);
    }, (error) => {
      console.error("Story fetched error:", error);
    });

    return unsubscribe;
  }, [user]);

  const currentUserGroup = storyGroups.find(g => g.userId === user?.id);
  const otherGroups = storyGroups.filter(g => g.userId !== user?.id);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade">
      {/* Current User Story / Upload */}
      {user && (
        <div 
          className="flex flex-col items-center gap-1.5 min-w-[76px] group cursor-pointer"
          onClick={() => {
            if (currentUserGroup) {
              onViewStories(storyGroups, storyGroups.indexOf(currentUserGroup));
            } else {
              onOpenUpload('story');
            }
          }}
        >
          <div className="relative">
            <div className={`p-[3px] rounded-full flex items-center justify-center transition-all active:scale-90 overflow-visible ${
              currentUserGroup ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'bg-zinc-800'
            }`}>
              <div className="w-14 h-14 bg-zinc-800 rounded-full overflow-hidden flex items-center justify-center relative">
                {currentUserGroup ? (
                   // Replace with status preview if they have a story
                   <div className="w-full h-full bg-zinc-900 border-2 border-black rounded-full overflow-hidden">
                     {currentUserGroup.stories[currentUserGroup.stories.length - 1].type === 'video' ? (
                       <video 
                        src={currentUserGroup.stories[currentUserGroup.stories.length - 1].mediaUrl} 
                        className="w-full h-full object-cover" 
                       />
                     ) : (
                       <img 
                         src={currentUserGroup.stories[currentUserGroup.stories.length - 1].mediaUrl} 
                         alt="" 
                         className="w-full h-full object-cover" 
                         referrerPolicy="no-referrer"
                       />
                     )}
                   </div>
                ) : (
                  <img 
                    src={user.avatar} 
                    alt="Your Avatar" 
                    className="w-full h-full object-cover opacity-80" 
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>
            
            <div
              onClick={(e) => { e.stopPropagation(); onOpenUpload('story'); }}
              className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 border-[3px] border-black rounded-full flex items-center justify-center text-white text-base font-bold shadow-xl translate-x-1 translate-y-1 hover:bg-blue-600 transition-colors z-10"
            >
              +
            </div>
          </div>
          <span className="text-xs truncate w-20 text-center text-zinc-500 font-medium mt-1">
            {currentUserGroup ? 'Your story' : 'Create story'}
          </span>
        </div>
      )}

      {/* Other Story Groups */}
      {otherGroups.map((group, groupIdx) => {
        const indexInFullList = storyGroups.indexOf(group);
        const lastStory = group.stories[group.stories.length - 1];
        
        return (
          <div 
            key={`${group.userId}-${groupIdx}`} 
            className="flex flex-col items-center gap-1.5 cursor-pointer min-w-[76px] group"
            onClick={() => onViewStories(storyGroups, indexInFullList)}
          >
            <div className="relative">
              {/* Main Content Bubble (The "Status" Preview) */}
              <div className="p-[2.5px] rounded-full bg-blue-500 shadow-lg">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-900 border-2 border-black flex items-center justify-center">
                  {lastStory.type === 'video' ? (
                    <video src={lastStory.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={lastStory.mediaUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>

              {/* User Avatar Badge (Like the small overlay in screenshot) */}
              <div 
                className="absolute -top-1 -left-1 z-10 p-[1.5px] bg-blue-600 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95"
                onClick={(e) => { e.stopPropagation(); onViewProfile?.(group.userId); }}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white bg-black">
                  <img 
                    src={group.userAvatar} 
                    alt={group.username} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
            <span className="text-xs truncate w-20 text-center text-white font-medium mt-1">
              {group.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
