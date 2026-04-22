import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'post' | 'story' | 'reel';
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85); // 85% quality
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function UploadModal({ isOpen, onClose, initialType = 'post' }: UploadModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'post' | 'story' | 'reel'>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const isCloudinaryConfigured = !!(cloudName && uploadPreset);

  const resetForm = useCallback(() => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
  }, []);

  // Update type when initialType changes and reset form on open
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      resetForm();
    }
  }, [isOpen, initialType, resetForm]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      console.log("File selected:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      setFile(selectedFile);
      
      // Clean up previous preview if it's an object URL
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      // Use ObjectURL for better performance and reliability with videos
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      
      setError(null);
    }
  }, [preview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const error = fileRejections[0]?.errors[0];
    if (error?.code === 'file-invalid-type') {
      setError(type === 'reel' ? "Reels must be video files." : "Invalid file type.");
    } else {
      setError("File upload failed. Please try again.");
    }
  }, [type]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: type === 'post' 
      ? { 'image/*': [], 'video/*': [] } 
      : type === 'story' 
        ? { 'image/*': [], 'video/*': [] } 
        : { 'video/*': [] }, // Reels are video only
    multiple: false,
    noKeyboard: true,
  } as any);

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress("Analyzing file...");
    setError(null);
    
    try {
      // Basic integrity check
      if (file.size === 0) {
        throw new Error("The selected file appears to be empty or corrupted. Please try selecting it again or choose a different file.");
      }

      if (file.size > 30 * 1024 * 1024) {
        throw new Error("File too large. Max size is 30MB.");
      }

      console.log(`Starting upload process for ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
      
      let fileToUpload = file;

      // Client-side compression for images to avoid platform proxy limits (Failed to fetch)
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          if (compressed) fileToUpload = compressed;
        } catch (e) {
          console.warn("Compression failed, using original file", e);
        }
      }

      setUploadProgress("Connecting to server...");
      // Diagnostic check: verify server is up with a simple retry
      let healthOk = false;
      for (let i = 0; i < 3; i++) {
        try {
          const healthCheck = await fetch('/api/health');
          if (healthCheck.ok) {
            healthOk = true;
            break;
          }
        } catch (e) {
          console.warn(`Health check attempt ${i + 1} failed, retrying...`, e);
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!healthOk) {
        throw new Error("The upload server appears to be offline. Try refreshing the page in a few moments.");
      }

      setUploadProgress("Uploading media...");
      const url = await uploadToCloudinary(fileToUpload);
      
      // If we got here, it's a success
      setUploadProgress("Sharing to feed...");
      const isVideo = fileToUpload.type.startsWith('video/');

      if (type === 'story') {
        const storyData = {
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar,
          mediaUrl: url,
          type: isVideo ? 'video' : 'image',
          createdAt: serverTimestamp(),
        };
        console.log("Saving story to Firestore:", storyData);
        await addDoc(collection(db, 'stories'), storyData);
        console.log("Story saved successfully");
      } else {
        // Post or Reel
        await addDoc(collection(db, 'posts'), {
          userId: user.id,
          username: user.username,
          userAvatar: user.avatar,
          imageUrl: isVideo ? null : url,
          videoUrl: isVideo ? url : null,
          caption: caption.trim(),
          likesCount: 0,
          commentsCount: 0,
          type: type === 'reel' ? 'reel' : (isVideo ? 'video' : 'image'),
          createdAt: serverTimestamp(),
        });

        // Update user post count
        await updateDoc(doc(db, 'users', user.id), {
          postsCount: increment(1)
        });
      }

      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Upload failed", err);
      // Give more technical detail on the mysterious "Failed to fetch"
      const technicalDetail = err instanceof Error ? err.message : JSON.stringify(err);
      setError(technicalDetail);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-zinc-900 w-full max-w-lg rounded-2xl overflow-hidden border border-zinc-800"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <button onClick={handleClose}><X size={24} /></button>
              <h2 className="font-bold">
                {type === 'story' ? 'Create Story' : type === 'reel' ? 'Create Reel' : 'Create new post'}
              </h2>
              <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="text-blue-500 font-bold disabled:opacity-50 min-w-[60px] flex justify-end"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-zinc-400 capitalize">{uploadProgress || 'Processing...'}</span>
                    <Loader2 className="animate-spin" size={18} />
                  </div>
                ) : 'Share'}
              </button>
            </div>

            <div className="p-4">
              {!isCloudinaryConfigured && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl text-amber-500 text-sm">
                  <div className="font-bold mb-1">Configuration Needed</div>
                  <p className="opacity-90">To enable uploads, please add your <b>Cloudinary Cloud Name</b> and <b>Upload Preset</b> in the "Settings" menu (bottom left).</p>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs text-center">
                  <div className="font-bold mb-1">Upload Error</div>
                  <div className="opacity-90">{error}</div>
                </div>
              )}
              {!preview ? (
                <div 
                  {...getRootProps()} 
                  className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <ImageIcon size={48} className="text-zinc-600" />
                  <p className="text-sm text-zinc-400">
                    {type === 'reel' ? 'Drag videos here' : 'Drag photos or videos here'}
                  </p>
                  <button 
                    type="button"
                    onClick={open}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
                  >
                    Select {type === 'reel' ? 'video' : 'from computer'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="aspect-square relative rounded-xl overflow-hidden bg-black">
                    {file?.type.startsWith('video/') ? (
                      <video src={preview} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                    )}
                    <button 
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <textarea
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm resize-none h-24 placeholder:text-zinc-500"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
