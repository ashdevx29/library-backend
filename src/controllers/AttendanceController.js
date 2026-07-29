import { AttendanceService } from '../services/AttendanceService.js';

export const clockIn = async (req, res) => {
  try {
    const { shiftId, seatId } = req.body;
    // Assuming memberId comes from req.user._id which is mapped to member, or explicit in request
    // Here we use the body for demonstration, normally would derive from authenticated user
    const { memberId } = req.body; 
    
    const ipAddress = req.ip;
    const device = req.headers['user-agent'];

    const attendance = await AttendanceService.clockIn(memberId, shiftId, seatId, ipAddress, device);
    res.status(201).json({ success: true, data: attendance, message: 'Clocked in successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const { memberId } = req.body;
    const ipAddress = req.ip;
    const device = req.headers['user-agent'];

    const attendance = await AttendanceService.clockOut(memberId, ipAddress, device);
    res.status(200).json({ success: true, data: attendance, message: 'Clocked out successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
