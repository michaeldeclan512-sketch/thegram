export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  website?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrl?: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  type: 'image' | 'video' | 'reel';
  timestamp: string;
  isLiked?: boolean;
  isPinned?: boolean;
  isSaved?: boolean;
  notificationsEnabled?: boolean;
  privacy?: 'public' | 'friends' | 'private';
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: any;
  viewsCount?: number;
}

export interface StoryGroup {
  userId: string;
  username: string;
  userAvatar: string;
  stories: Story[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Reel {
  id: string;
  user: User;
  videoUrl: string;
  caption: string;
  likes: string;
  comments: string;
  audioName: string;
}
