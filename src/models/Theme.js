import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema({
  libraryName: { type: String, default: 'Saahityik Library ERP' },
  logo: { type: String, default: '/logo.png' },
  favicon: { type: String, default: '/favicon.ico' },
  primaryColor: { type: String, default: '#FF6B00' },
  secondaryColor: { type: String, default: '#FFA000' },
  accentColor: { type: String, default: '#FFB800' },
  sidebarColor: { type: String, default: '#0f172a' },
  headerColor: { type: String, default: '#ffffff' },
  buttonColor: { type: String, default: '#FF6B00' },
  fontFamily: { type: String, default: 'Poppins, sans-serif' },
  darkMode: { type: Boolean, default: false }
}, { timestamps: true });

const Theme = mongoose.model('Theme', themeSchema);
export default Theme;
