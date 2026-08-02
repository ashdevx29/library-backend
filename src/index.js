import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { setSeatIo } from './services/SeatService.js';
import { ShiftService } from './services/ShiftService.js';
import { RoleService } from './services/RoleService.js';
import { helmetMiddleware, mongoSanitizeMiddleware, hppMiddleware, apiLimiter } from './middleware/securityMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import themeRoutes from './routes/themeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import qrAttendanceRoutes from './routes/qrAttendanceRoutes.js';
import attendanceReportRoutes from './routes/attendanceReportRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import adminReportRoutes from './routes/adminReportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import logRoutes from './routes/logRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import memberCardRoutes from './routes/memberCardRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import importRoutes from './routes/importRoutes.js';
// import importRoutes from './routes/importRoutes.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://library-frontend-9wih-smoky.vercel.app/',
  'https://library-frontend-sl.netlify.app',
  'http://localhost:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], credentials: true },
});

setSeatIo(io);

app.use(helmetMiddleware);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitizeMiddleware);
app.use(hppMiddleware);
app.use('/api', apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

io.on('connection', (socket) => {
  console.log('User connected via Socket.IO');
  socket.on('seat:subscribe', () => socket.join('seats'));
  socket.on('disconnect', () => console.log('User disconnected'));
});

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin-reports', adminReportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/attendance', qrAttendanceRoutes);
app.use('/api/attendance', attendanceReportRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/members', memberCardRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);

app.get('/', (req, res) => {
  res.send('Saahityik Library ERP API is running...');
});

setTimeout(() => {
  ShiftService.seedDefaults().catch((err) => console.error('Shift seed error:', err.message));
  RoleService.seedDefaults().catch((err) => console.error('Role seed error:', err.message));
}, 2000);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
