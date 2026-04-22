import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, MoreHorizontal, Eye, Users } from 'lucide-react';
import { Story, StoryGroup } from '../types';
import { useAuth } from './AuthProvider';
import { doc, setDoc, serverTimestamp, updateDoc, increment, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  storyGroups: StoryGroup[];
  initialUserIndex: number;
}

interface Viewer {
  userId: string;
  username: string;
  userAvatar: string;
  viewedAt: any;
}

const STORY_DURATION = 5000; // 5 seconds for images

export default function StoryViewer({ isOpen, onClose, storyGroups, initialUserIndex }: StoryViewerProps) {
  const { user } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDuration, setVideoDuration] = useState(STORY_DURATION);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentUserGroup = storyGroups[currentUserIndex];
  const currentStory = currentUserGroup?.stories[currentStoryIndex];
  const isOwner = user && currentStory && user.id === currentStory.userId;

  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentUserGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < storyGroups.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentUserIndex, currentUserGroup, storyGroups, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(storyGroups[currentUserIndex - 1].stories.length - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex, storyGroups]);

  // Record view logic
  useEffect(() => {
    if (!isOpen || !user || !currentStory) return;

    const recordView = async () => {
      // Don't record own views for the "viewers list" but maybe for count?
      // Instagram doesn't count own views in the list.
      if (user.id === currentStory.userId) return;

      const viewRef = doc(db, 'stories', currentStory.id, 'views', user.id);
      try {
        // Use setDoc to identify by user.id so one user = one view record
        await setDoc(viewRef, {
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar,
          viewedAt: serverTimestamp()
        }, { merge: true });

        // Increment count on story doc
        await updateDoc(doc(db, 'stories', currentStory.id), {
          viewsCount: increment(1)
        });
      } catch (err) {
        console.error("Error recording view:", err);
      }
    };

    recordView();
  }, [isOpen, currentStory?.id, user?.id]);

  // Fetch viewers if owner
  useEffect(() => {
    if (!isOpen || !isOwner || !currentStory) {
      setViewers([]);
      return;
    }

    const q = query(
      collection(db, 'stories', currentStory.id, 'views'),
      orderBy('viewedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const viewersData = snapshot.docs.map(doc => doc.data() as Viewer);
      setViewers(viewersData);
    });

    return () => unsubscribe();
  }, [isOpen, isOwner, currentStory?.id]);

  // Reset indices when opened with initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      setShowViewers(false);
    }
  }, [isOpen, initialUserIndex]);

  // Pause/Play video
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else if (isOpen) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isOpen]);

  // Progress timer logic
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;

    const duration = currentStory.type === 'video' ? videoDuration : STORY_DURATION;
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current!);
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentStory, handleNext, videoDuration]);

  if (!isOpen || !currentUserGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center select-none overflow-hidden touch-none">
      {/* Background Blur */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentStory.mediaUrl} 
          className="w-full h-full object-cover blur-3xl opacity-30" 
          referrerPolicy="no-referrer"
          alt=""
        />
      </div>

      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-zinc-900 shadow-2xl rounded-xl overflow-hidden flex flex-col z-10">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
          {currentUserGroup.stories.map((_, idx) => (
            <div key={`progress-${idx}`} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-[width] duration-300 linear"
                style={{ 
                  width: `${idx < currentStoryIndex ? 100 : idx === currentStoryIndex ? progress : 0}%` 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <img 
              src={currentUserGroup.userAvatar} 
              className="w-8 h-8 rounded-full border border-white/20 object-cover"
              referrerPolicy="no-referrer"
              alt={currentUserGroup.username}
            />
            <span className="font-semibold text-sm drop-shadow-md">{currentUserGroup.username}</span>
            <span className="text-white/60 text-xs drop-shadow-sm">
              {/* Simple distance calculation or just "Now" */}
              Now
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/10 rounded-full">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button className="p-1 hover:bg-white/10 rounded-full">
              <MoreHorizontal size={20} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="relative flex-1 flex items-center justify-center bg-black"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => !showViewers && setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => !showViewers && setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center"
            >
              {currentStory.type === 'image' ? (
                <img 
                  src={currentStory.mediaUrl} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  alt="Story content"
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  loop={false}
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration * 1000)}
                  onEnded={handleNext}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Overlay (Invisible tap areas) */}
          <div className="absolute inset-0 flex">
            <div 
              className="w-1/3 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            />
            <div 
              className="w-2/3 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
            />
          </div>
        </div>

        {/* Footer / View Count */}
        {isOwner && (
          <div className="absolute bottom-6 left-0 right-0 z-50 px-6 flex justify-start">
            <button 
              onClick={() => {
                setShowViewers(true);
                setIsPaused(true);
              }}
              className="flex items-center gap-2 group transition-transform active:scale-95"
            >
              <div className="flex -space-x-2">
                {viewers.slice(0, 3).map((v, i) => (
                  <img 
                    key={`${v.userId}-${i}`}
                    src={v.userAvatar}
                    className="w-6 h-6 rounded-full border-2 border-zinc-900 object-cover"
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                ))}
                {viewers.length === 0 && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border-2 border-zinc-900">
                    <Eye size={12} className="text-white/60" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-white drop-shadow-md">
                {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
              </span>
            </button>
          </div>
        )}

        {/* Viewers List Bottom Sheet */}
        <AnimatePresence>
          {showViewers && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowViewers(false);
                  setIsPaused(false);
                }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl z-[70] max-h-[60%] flex flex-col"
              >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-white/60" />
                    <h3 className="font-bold">Viewers</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowViewers(false);
                      setIsPaused(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                  {viewers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
                      <Eye size={40} className="opacity-20" />
                      <p className="text-sm font-medium">No views yet</p>
                    </div>
                  ) : (
                    viewers.map((v, i) => (
                      <div key={`${v.userId}-${i}`} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <img 
                            src={v.userAvatar} 
                            className="w-10 h-10 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                            alt={v.username}
                          />
                          <div>
                            <p className="font-semibold text-sm">{v.username}</p>
                            <p className="text-xs text-zinc-500">Viewed just now</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-blue-500 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                          Profile
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Navigation Arrows */}
        <div className="hidden sm:block">
          <button 
            onClick={handlePrev}
            className="absolute -left-16 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute -right-16 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}
