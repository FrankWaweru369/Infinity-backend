import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {

    let resource_type = 'auto';

    if (file.mimetype.startsWith('video/')) {
      resource_type = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      resource_type = 'image';
    }

    
    let folder = 'infinity-platform/posts';

    if (req.body.type === 'reel') {
      folder = 'infinity-platform/reels';
    } else if (req.body.type === 'profile') {
      folder = 'infinity-platform/profiles';
    }

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
      resource_type,
      public_id: `media-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  },
});

export default cloudinary;
