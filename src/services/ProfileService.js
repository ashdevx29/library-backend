import User from '../models/User.js';
import Member from '../models/Member.js';
import bcrypt from 'bcrypt';

export const ProfileService = {
  getProfile: async (userId) => {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) throw new Error('User not found');

    let memberData = null;
    if (user.role === 'Student') {
      memberData = await Member.findOne({ userId: user._id })
        .populate('seatId', 'seatNumber floor section')
        .populate('shiftId', 'shiftName startTime endTime');
    }

    return { user, member: memberData };
  },

  updateProfile: async (userId, updates, role) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const allowedAdmin = ['email', 'mobile'];
    const allowedUser = ['name', 'email', 'mobile', 'profileImage'];
    const allowed = role === 'Student' ? allowedUser : allowedAdmin;

    if (role === 'Student') {
      const memberUpdates = {};
      if (updates.name !== undefined) memberUpdates.fullName = updates.name;
      if (updates.email !== undefined) memberUpdates.email = updates.email;
      if (updates.mobile !== undefined) memberUpdates.mobile = updates.mobile;
      if (updates.address !== undefined) memberUpdates.address = updates.address;
      if (updates.aadhaarNumber !== undefined) memberUpdates.aadhaarNumber = updates.aadhaarNumber;
      if (Object.keys(memberUpdates).length > 0) {
        await Member.findOneAndUpdate({ userId }, { $set: memberUpdates });
      }
    }

    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    if (Object.keys(filtered).length === 0 && role !== 'Student') {
      throw new Error('No valid fields to update');
    }

    if (filtered.email && filtered.email !== user.email) {
      const existing = await User.findOne({ email: filtered.email, _id: { $ne: userId } });
      if (existing) throw new Error('Email already in use');
    }
    if (filtered.mobile && filtered.mobile !== user.mobile) {
      const existing = await User.findOne({ mobile: filtered.mobile, _id: { $ne: userId } });
      if (existing) throw new Error('Mobile already in use');
    }

    Object.assign(user, filtered);
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    delete safe.refreshToken;
    return safe;
  },

  changePassword: async (userId, currentPassword, newPassword, role) => {
    if (role === 'Student') throw new Error('Students cannot change their password. Contact admin.');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) throw new Error('Current password is incorrect');

    if (!newPassword || newPassword.length < 8) throw new Error('New password must be at least 8 characters');

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  },

  uploadProfileImage: async (userId, file) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.profileImage = `/uploads/${file.filename}`;
    await user.save();

    if (user.role === 'Student') {
      await Member.findOneAndUpdate({ userId }, { $set: { photo: `/uploads/${file.filename}` } });
    }

    return { profileImage: user.profileImage };
  },
};
