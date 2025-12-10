// backend/controllers/videoOptimizerController.js
import cloudinary from '../config/cloudinary.js';
import Reel from '../models/Reel.js';

// ✅ Generate optimized Cloudinary URLs
const generateOptimizedUrls = (originalUrl) => {
  if (!originalUrl?.includes('cloudinary.com')) {
    return { original: originalUrl };
  }

  const publicId = originalUrl.split('/upload/')[1]?.split('.')[0];
  
  return {
    original: originalUrl,
    high: `${originalUrl.split('/upload/')[0]}/upload/q_auto:good,w_1280,h_720/${publicId}.mp4`,
    medium: `${originalUrl.split('/upload/')[0]}/upload/q_auto:eco,w_854,h_480/${publicId}.mp4`,
    low: `${originalUrl.split('/upload/')[0]}/upload/q_auto:low,w_640,h_360/${publicId}.mp4`
  };
};

// ✅ Store optimized URLs in database
export const optimizeVideo = async (req, res) => {
  try {
    const { videoUrl, reelId } = req.body;
    
    const optimizedUrls = generateOptimizedUrls(videoUrl);
    
    await Reel.findByIdAndUpdate(reelId, {
      videoUrls: optimizedUrls,
      isOptimized: true
    });
    
    res.json({ success: true, optimizedUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get video based on quality preference
export const getOptimizedVideo = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { quality = 'auto', dataSaver = false } = req.query;
    
    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    
    // Determine quality
    let selectedQuality = quality;
    if (quality === 'auto') {
      selectedQuality = dataSaver === 'true' ? 'medium' : 'high';
    }
    
    // Get URL
    let videoUrl = reel.videoUrl;
    if (reel.videoUrls?.[selectedQuality]) {
      videoUrl = reel.videoUrls[selectedQuality];
    }
    
    res.json({ reelId, quality: selectedQuality, url: videoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
