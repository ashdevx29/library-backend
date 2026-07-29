import { ShiftService } from '../services/ShiftService.js';

export const createShift = async (req, res) => {
  try {
    const { shiftName, shiftCode, startTime, endTime, description, status } = req.body;
    if (!shiftName || !shiftCode || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'shiftName, shiftCode, startTime and endTime are required' });
    }
    const shift = await ShiftService.createShift({ shiftName, shiftCode, startTime, endTime, description, status });
    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllShifts = async (req, res) => {
  try {
    const shifts = await ShiftService.getAllShifts(req.query);
    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const shift = await ShiftService.getShiftById(req.params.id);
    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateShift = async (req, res) => {
  try {
    const shift = await ShiftService.updateShift(req.params.id, req.body);
    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteShift = async (req, res) => {
  try {
    await ShiftService.deleteShift(req.params.id);
    res.status(200).json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
