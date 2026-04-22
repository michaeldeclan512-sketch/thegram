import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add permissive CORS headers for the preview iframe environment
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Mount upload route (Renamed to bypass ad-blockers/filters)
  app.post("/api/p", (req, res, next) => {
    console.log("[Server] Request to /api/p - Method:", req.method, "Size:", req.headers['content-length']);
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error("Multer parse error:", err);
        return res.status(400).json({ error: { message: err.message || "File upload error" } });
      }
      next();
    });
  }, async (req, res) => {
    const filePath = req.file?.path;
    console.log("File parsed by multer:", req.file?.originalname, "Size:", req.file?.size, "Path:", filePath);
    
    // Log environment state (without values)
    console.log("Cloudinary Env State:", {
      cloud_name: !!process.env.VITE_CLOUDINARY_CLOUD_NAME,
      upload_preset: !!process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET
    });
    
    try {
      const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !preset) {
        console.error("Cloudinary env missing:", { cloudName: !!cloudName, preset: !!preset });
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(400).json({ error: { message: "Cloudinary not configured in environment" } });
      }

      if (!filePath) {
        return res.status(400).json({ error: { message: "No file uploaded" } });
      }

      // Configure Cloudinary explicitly
      const cloudinaryConfig: any = {
        cloud_name: cloudName,
        secure: true
      };
      
      if (apiKey && apiSecret) {
        cloudinaryConfig.api_key = apiKey;
        cloudinaryConfig.api_secret = apiSecret;
      }
      
      cloudinary.config(cloudinaryConfig);

      console.log("Starting Cloudinary file upload...");
      const uploadOptions: any = {
        upload_preset: preset,
        resource_type: 'auto',
      };

      if (!apiKey || !apiSecret) {
        uploadOptions.unsigned = true;
        console.log("Using unsigned upload mode");
      }

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      console.log("Cloudinary Upload Success!");
      
      // Clean up temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      res.json({ secure_url: result.secure_url });
    } catch (error: any) {
      console.error("Server-side Cloudinary Error:", error);
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: { message: error.message || "Server upload failed during processing" } });
    }
  });

  // 2. Global Middleware for other routes
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  app.get("/api/h", (req, res) => {
    res.json({ s: "ok" });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: {
        has_cloud_name: !!process.env.VITE_CLOUDINARY_CLOUD_NAME,
        has_preset: !!process.env.VITE_CLOUDINARY_UPLOAD_PRESET
      }
    });
  });

  // 3. Base64 Fallback Route (For extremely restricted networks)
  app.post("/api/b", async (req, res) => {
    try {
      const { fileData, fileName, fileType } = req.body;
      if (!fileData) return res.status(400).json({ error: { message: "No data received" } });

      console.log(`[Server] Base64 upload received: ${fileName} (${fileType})`);
      
      const buffer = Buffer.from(fileData, 'base64');
      const tempPath = path.join(os.tmpdir(), `b64_${Date.now()}_${fileName}`);
      fs.writeFileSync(tempPath, buffer);

      const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !preset) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return res.status(400).json({ error: { message: "Cloudinary configuration missing" } });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      const result = await cloudinary.uploader.upload(tempPath, {
        upload_preset: preset,
        resource_type: 'auto',
        unsigned: !apiKey || !apiSecret
      });

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      res.json({ secure_url: result.secure_url });
    } catch (error: any) {
      console.error("Base64 upload failed:", error);
      res.status(500).json({ error: { message: error.message || "Base64 processing failed" } });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Error:", err);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
