import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

// JWT and Password Helper Utilities (Standard crypto modules)
const JWT_SECRET = process.env.JWT_SECRET || "event_platform_secure_jwt_secret_2026_xYz";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

function generateJWT(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    return JSON.parse(base64UrlDecode(payload));
  } catch (err) {
    return null;
  }
}

// In-Memory Database Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image?: string; // Additional beautiful decoration metadata
  category?: string;
  capacity?: number;
  createdAt: string;
}

interface Registration {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: string;
}

// Setup initial pre-populated events
const events: EventItem[] = [
  {
    id: "evt-1",
    title: "Global Tech Summit 2026",
    description: "The global gathering for software developers, product managers, and tech leaders. Explore cutting-edge methodologies, software architecture trends, and get hands-on with next-gen developer environments.",
    date: "2026-07-20",
    location: "Austin Convention Center, Austin, TX",
    category: "Technology",
    capacity: 500,
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "evt-2",
    title: "NextGen AI & Robotics Expo",
    description: "Dive into the future of intelligent agents, robotics, deep neural network systems, and large language model safety. Features interactive panel discussions, live humanoid demos, and startup pitches.",
    date: "2026-08-15",
    location: "Moscone Center, San Francisco, CA",
    category: "Artificial Intelligence",
    capacity: 350,
    createdAt: "2026-06-02T11:00:00Z",
  },
  {
    id: "evt-3",
    title: "Decentralized Finance & Web3 Forum",
    description: "An intensive single-day forum focusing on distributed ledger technology, smart contract security, modular blockchains, and token economics. Connect with top protocols and financial engineering pioneers.",
    date: "2026-09-10",
    location: "Marriott Marquis, New York, NY",
    category: "Finance",
    capacity: 200,
    createdAt: "2026-06-03T09:30:00Z",
  },
  {
    id: "evt-4",
    title: "CleanEnergy 2026 Hackathon",
    description: "Join forces with engineers, designers, and environmental advocates to solve critical sustainable energy challenges. Build open-source solutions for grid optimization, carbon tracking, and resource management.",
    date: "2026-10-05",
    location: "UW Innovation Hub, Seattle, WA",
    category: "Environment",
    capacity: 150,
    createdAt: "2026-06-04T08:00:00Z",
  },
  {
    id: "evt-5",
    title: "Creative Designers Collective",
    description: "An interactive, curated space sharing the latest in typography, layout principles, animations, micro-interactions, and visual design systems. Learn of sustainable aesthetics and user behavior trends.",
    date: "2026-10-22",
    location: "The Broad Museum Hall, Los Angeles, CA",
    category: "Design",
    capacity: 120,
    createdAt: "2026-06-05T14:00:00Z",
  },
  {
    id: "evt-6",
    title: "Mindfulness & Productivity Workshop",
    description: "A transformative session on incorporating stress reduction, diaphragmatic breathing loops, and cognitive recovery techniques with modern, high-intensity professional software development sprints.",
    date: "2026-11-12",
    location: "Ecotrust Conference Center, Portland, OR",
    category: "Wellness",
    capacity: 80,
    createdAt: "2026-06-06T12:00:00Z",
  }
];

// Persistent stores in-memory for live demo session
const users: User[] = [
  // Seed user for easy sign-in testing
  {
    id: "usr-demo",
    name: "Demo User",
    email: "demo@example.com",
    passwordHash: hashPassword("password123"),
    createdAt: "2026-06-15T00:00:00Z"
  }
];

const registrations: Registration[] = [
  // Seed registration
  {
    id: "reg-demo-1",
    userId: "usr-demo",
    eventId: "evt-1",
    registeredAt: "2026-06-15T10:00:00Z"
  }
];

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired session token" });
  }
  
  req.user = decoded; // { id, email, name }
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // 1. Authentication Endpoints
  // POST /api/register
  app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required fields" });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    if (users.some(u => u.email === normalizedEmail)) {
      return res.status(400).json({ error: "A user with this email address already exists" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const newUser: User = {
      id: `usr-${crypto.randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = generateJWT({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    });
    
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  });

  // POST /api/login
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required fields" });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email === normalizedEmail);
    
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const token = generateJWT({
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  });

  // 2. Event Endpoints
  // GET /api/events
  app.get("/api/events", (req, res) => {
    res.json(events);
  });

  // GET /api/events/:id
  app.get("/api/events/:id", (req, res) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  });

  // 3. Registration Endpoints
  // POST /api/events/:id/register
  app.post("/api/events/:id/register", authenticateToken, (req: any, res: any) => {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if already registered
    const alreadyRegistered = registrations.some(
      r => r.userId === userId && r.eventId === eventId
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ error: "You are already registered for this event" });
    }
    
    // Check capacity code
    const currentRegistrationCount = registrations.filter(r => r.eventId === eventId).length;
    if (event.capacity && currentRegistrationCount >= event.capacity) {
      return res.status(400).json({ error: "This event is currently fully booked" });
    }

    const newRegistration: Registration = {
      id: `reg-${crypto.randomUUID()}`,
      userId,
      eventId,
      registeredAt: new Date().toISOString()
    };
    
    registrations.push(newRegistration);
    
    res.status(201).json({
      message: "Registered for event successfully",
      registration: newRegistration
    });
  });

  // GET /api/my-registrations
  app.get("/api/my-registrations", authenticateToken, (req: any, res: any) => {
    const userId = req.user.id;
    
    // Filter registrations for this specific user
    const userRegs = registrations.filter(r => r.userId === userId);
    
    // Joint-map with full event objects
    const myEvents = userRegs.map(reg => {
      const eventDetails = events.find(e => e.id === reg.eventId);
      return {
        registrationId: reg.id,
        registeredAt: reg.registeredAt,
        event: eventDetails
      };
    }).filter(reg => reg.event !== undefined); // Guard against missing events safely
    
    res.json(myEvents);
  });

  // Vite Integration for Asset Serving / SPA Fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EventPlatformServer] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
