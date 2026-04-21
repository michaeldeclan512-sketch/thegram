import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simple In-memory Data Store (Mocking a database)
  const posts = [
    {
      id: "1",
      user: { name: "design_daily", avatar: "https://picsum.photos/seed/design/200" },
      image: "https://picsum.photos/seed/post1/600/600",
      caption: "Minimalism is not a lack of something. It's simply the perfect amount of something. ✨",
      likes: 1234,
      comments: [
        { user: "dev_guy", text: "Love this aesthetic!" },
        { user: "nina_art", text: "So inspiring." }
      ],
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      user: { name: "wanderlust", avatar: "https://picsum.photos/seed/travel/200" },
      image: "https://picsum.photos/seed/post2/600/600",
      caption: "Exploring the hidden gems of the Amalfi Coast. 🍋🌊 #Travel #Italy",
      likes: 856,
      comments: [],
      timestamp: "5 hours ago"
    }
  ];

  app.get("/api/posts", (req, res) => {
    res.json(posts);
  });

  // Socket.io for Real-time Messaging
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("send_message", (data) => {
      // Broadcast message to others (or target recipient if logic added)
      io.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
