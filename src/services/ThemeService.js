import Theme from '../models/Theme.js';

export const ThemeService = {
  getTheme: async () => {
    let theme = await Theme.findOne();
    if (!theme) {
      theme = await Theme.create({}); // Creates default theme
    }
    return theme;
  },

  updateTheme: async (data) => {
    let theme = await Theme.findOne();
    if (theme) {
      Object.assign(theme, data);
      await theme.save();
    } else {
      theme = await Theme.create(data);
    }
    return theme;
  }
};
