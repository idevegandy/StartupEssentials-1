import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    console.warn("SESSION_SECRET not provided in environment, using a generated one for this session.");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Check role middleware
  const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).send("Forbidden - Insufficient permissions");
      }
      
      next();
    };
  };

  // Check if restaurant admin is operating on their own restaurant
  const checkRestaurantAccess = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    
    if (req.user.role === 'super_admin') {
      return next(); // Super admins have access to all restaurants
    }
    
    if (!req.user.restaurantId) {
      return res.status(403).send("Forbidden - No restaurant assigned");
    }
    
    const restaurantId = parseInt(req.params.restaurantId || req.body.restaurantId);
    if (isNaN(restaurantId) || req.user.restaurantId !== restaurantId) {
      return res.status(403).send("Forbidden - Cannot access other restaurants");
    }
    
    next();
  };

  // Auth API routes
  app.post("/api/register", async (req, res, next) => {
    // Register is only for creating restaurant admins from super admin
    if (!req.isAuthenticated() || req.user.role !== 'super_admin') {
      return res.status(403).send("Only super admins can register new users");
    }
    
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Export middleware for use in other routes
  return {
    checkRole,
    checkRestaurantAccess
  };
}
