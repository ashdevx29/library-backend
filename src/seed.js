import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Theme from './models/Theme.js';
import { ShiftService } from './services/ShiftService.js';

dotenv.config();

const seedAll = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saahityik_library';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    const adminExists = await User.findOne({ email: 'admin@saahityik.com' });
    if (!adminExists) {
      await User.create({
        role: 'Super Admin',
        name: 'Library Admin',
        email: 'admin@saahityik.com',
        mobile: '9999999999',
        password: 'Admin@123',
        status: 'Active',
      });
      console.log('Super Admin created: admin@saahityik.com / Admin@123');
    } else {
      console.log('Super Admin already exists');
    }

    const themeExists = await Theme.findOne();
    if (!themeExists) {
      await Theme.create({});
      console.log('Default theme created');
    } else {
      console.log('Theme already exists');
    }

    await ShiftService.seedDefaults();
    console.log('Default shifts seeded (Morning, Afternoon, Evening, Night)');

    console.log('-----------------------------------');
    console.log('Seed complete!');
    console.log('Admin: admin@saahityik.com / Admin@123');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAll();
