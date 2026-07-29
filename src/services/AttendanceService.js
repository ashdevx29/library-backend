import Attendance from '../models/Attendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Seat from '../models/Seat.js';
import SeatHistory from '../models/SeatHistory.js';

export const AttendanceService = {
  clockIn: async (memberId, shiftId, seatId, ipAddress, device) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({ memberId, date: today });
    if (existingAttendance && existingAttendance.checkInTime) {
      throw new Error('Already clocked in today');
    }

    const attendance = new Attendance({
      memberId,
      date: today,
      checkInTime: new Date(),
      status: 'Present',
      shiftId,
      seatId,
    });
    await attendance.save();

    const log = new AttendanceLog({ memberId, action: 'ClockIn', ipAddress, device });
    await log.save();

    await Seat.findByIdAndUpdate(seatId, {
      status: 'Occupied',
      currentOccupant: memberId,
      lastCheckIn: new Date(),
    });

    try {
      await SeatHistory.create({ seatId, memberId, action: 'checkin', shiftId });
    } catch (_) {}

    return attendance;
  },

  clockOut: async (memberId, ipAddress, device) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ memberId, date: today });
    if (!attendance || attendance.checkOutTime) {
      throw new Error('Not clocked in or already clocked out');
    }

    attendance.checkOutTime = new Date();
    attendance.duration = Math.round((attendance.checkOutTime - attendance.checkInTime) / 60000);
    await attendance.save();

    const log = new AttendanceLog({ memberId, action: 'ClockOut', ipAddress, device });
    await log.save();

    await Seat.findByIdAndUpdate(attendance.seatId, {
      status: 'Available',
      currentOccupant: null,
      lastCheckOut: new Date(),
    });

    try {
      await SeatHistory.create({
        seatId: attendance.seatId,
        memberId,
        action: 'checkout',
        shiftId: attendance.shiftId,
        duration: attendance.duration,
      });
    } catch (_) {}

    return attendance;
  },
};
