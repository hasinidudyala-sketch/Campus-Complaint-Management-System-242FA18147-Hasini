/**
 * CAMPUSCARE - VFSTR HYDERABAD CAMPUS COMPLAINT MANAGEMENT SYSTEM
 * Main Server Entry Point
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const methodOverride = require('method-override');
const rateLimit = require('express-rate-limit');

// Database Connection & Seeder
const { connectDB } = require('./config/db');
const { seedData } = require('./utils/seeder');

// Models
const Notification = require('./models/Notification');
const User = require('./models/User');

// Routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Server
const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Automatically Seed Essential Demo Data if not already seeded
    await seedData(true);

    // 3. Security Middlewares
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disabled for seamless CDN integration of FontAwesome, Bootstrap Icons, Chart.js, Google Fonts
        crossOriginEmbedderPolicy: false
      })
    );
    app.use(cors());

    // 4. Rate Limiting for auth/public endpoints
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // Max 300 requests per IP per window
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/auth', limiter);

    // 5. Body Parsing and Method Override
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(methodOverride('_method'));

    // 6. Request Logging
    if (process.env.NODE_ENV !== 'test') {
      app.use(morgan('dev'));
    }

    // 7. Static Assets
    app.use(express.static(path.join(__dirname, 'public')));

    // 8. View Engine Configuration
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // 9. Session Configuration
    // Use MongoStore if mongoose connection is ready, otherwise memory store
    const sessionConfig = {
      secret: process.env.SESSION_SECRET || 'campuscare_secret_2026',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      }
    };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      sessionConfig.store = MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
      });
    }

    app.use(session(sessionConfig));
    app.use(flash());

    // 10. Global Variables for Templates (res.locals)
    app.use(async (req, res, next) => {
      res.locals.success_msg = req.flash('success_msg');
      res.locals.error_msg = req.flash('error_msg');
      res.locals.currentPath = req.path;
      res.locals.collegeName = process.env.COLLEGE_NAME || 'VFSTR Hyderabad Campus';
      res.locals.appName = process.env.APP_NAME || 'CampusCare';
      res.locals.currentYear = new Date().getFullYear();

      if (req.session && req.session.userId) {
        try {
          const user = await User.findById(req.session.userId);
          if (user) {
            req.user = user;
            res.locals.currentUser = user;
            res.locals.currentRole = user.role;

            // Fetch unread notifications count
            res.locals.unreadNotificationCount = await Notification.countDocuments({
              user: user._id,
              isRead: false
            });
          } else {
            res.locals.currentUser = null;
            res.locals.currentRole = null;
            res.locals.unreadNotificationCount = 0;
          }
        } catch (e) {
          res.locals.currentUser = null;
          res.locals.currentRole = null;
          res.locals.unreadNotificationCount = 0;
        }
      } else {
        res.locals.currentUser = null;
        res.locals.currentRole = null;
        res.locals.unreadNotificationCount = 0;
      }
      next();
    });

    // 11. Register Application Routes
    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/student', studentRoutes);
    app.use('/staff', staffRoutes);
    app.use('/admin', adminRoutes);
    app.use('/notifications', notificationRoutes);

    // 12. Error Handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 13. Start HTTP Server
    const server = app.listen(PORT, () => {
      console.log('========================================================');
      console.log(`🚀 CAMPUSCARE SERVER RUNNING AT: http://localhost:${PORT}`);
      console.log(`🏛️  INSTITUTION: VFSTR Hyderabad Campus`);
      console.log(`⚙️  ENVIRONMENT: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================================');
    });

    return server;
  } catch (err) {
    console.error('Failed to initialize CampusCare server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

