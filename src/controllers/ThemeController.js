import { ThemeService } from '../services/ThemeService.js';

export const getTheme = async (req, res) => {
  try {
    const theme = await ThemeService.getTheme();
    res.status(200).json({ success: true, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTheme = async (req, res) => {
  try {
    const theme = await ThemeService.updateTheme(req.body);
    res.status(200).json({ success: true, data: theme });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadThemeAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const type = req.body.type === 'favicon' ? 'favicon' : 'logo';
    const url = `/uploads/${req.file.filename}`;
    const theme = await ThemeService.updateTheme({ [type]: url });

    res.status(200).json({ success: true, data: { url, theme } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
