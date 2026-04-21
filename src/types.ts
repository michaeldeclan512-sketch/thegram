export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  user: User;
  imageUrl: string;
  caption: string;
  likes: number;
  commentsCount: number;
  timestamp: string;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  isViewed: boolean;
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
