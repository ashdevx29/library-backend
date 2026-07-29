export const MODULES = ['Members', 'Attendance', 'Payments', 'Expenses', 'Reports', 'Settings', 'Notifications', 'Shifts', 'Seats', 'Backup', 'Logs', 'Announcements', 'Roles'];

export const ACTIONS = ['View', 'Create', 'Edit', 'Delete'];

export const PERMISSIONS = {
  Members:     ['View', 'Create', 'Edit', 'Delete'],
  Attendance:  ['View', 'Create', 'Edit'],
  Payments:    ['View', 'Create', 'Delete'],
  Expenses:    ['View', 'Create', 'Edit'],
  Reports:     ['View'],
  Settings:    ['View', 'Edit'],
  Notifications: ['Create', 'Delete'],
  Shifts:      ['View', 'Create', 'Edit', 'Delete'],
  Seats:       ['View', 'Create', 'Edit', 'Delete'],
  Backup:      ['View', 'Create', 'Delete'],
  Logs:        ['View'],
  Announcements: ['View', 'Create', 'Edit', 'Delete'],
  Roles:       ['View', 'Create', 'Edit', 'Delete'],
};

export const ALL_PERMISSIONS = Object.entries(PERMISSIONS).flatMap(([mod, actions]) =>
  actions.map(action => `${mod}:${action}`)
);

export const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    isSystem: true,
    permissions: ALL_PERMISSIONS,
    description: 'Full system access with all permissions',
  },
  {
    name: 'Admin',
    isSystem: false,
    permissions: [
      'Members:View', 'Members:Create', 'Members:Edit', 'Members:Delete',
      'Attendance:View', 'Attendance:Create', 'Attendance:Edit',
      'Payments:View', 'Payments:Create', 'Payments:Delete',
      'Expenses:View', 'Expenses:Create', 'Expenses:Edit',
      'Reports:View',
      'Shifts:View', 'Shifts:Create', 'Shifts:Edit',
      'Seats:View', 'Seats:Create', 'Seats:Edit',
      'Notifications:Create',
      'Announcements:View', 'Announcements:Create', 'Announcements:Edit', 'Announcements:Delete',
      'Settings:View', 'Settings:Edit',
      'Backup:View', 'Backup:Create',
    ],
    description: 'Administrative access to most modules',
  },
  {
    name: 'Manager',
    isSystem: false,
    permissions: [
      'Members:View', 'Members:Create', 'Members:Edit',
      'Attendance:View', 'Attendance:Edit',
      'Payments:View', 'Payments:Create',
      'Expenses:View', 'Expenses:Create',
      'Reports:View',
      'Shifts:View',
      'Seats:View',
      'Announcements:View',
    ],
    description: 'Manager access for daily operations',
  },
  {
    name: 'Reception',
    isSystem: false,
    permissions: [
      'Members:View', 'Members:Create', 'Members:Edit',
      'Attendance:View', 'Attendance:Create',
      'Payments:View', 'Payments:Create',
      'Seats:View',
      'Announcements:View',
    ],
    description: 'Front desk access for member management',
  },
  {
    name: 'Accountant',
    isSystem: false,
    permissions: [
      'Members:View',
      'Payments:View', 'Payments:Create',
      'Expenses:View', 'Expenses:Create', 'Expenses:Edit',
      'Reports:View',
      'Announcements:View',
    ],
    description: 'Financial access for payments and expenses',
  },
  {
    name: 'Student',
    isSystem: true,
    permissions: [
      'Attendance:View',
      'Reports:View',
      'Announcements:View',
    ],
    description: 'Student portal access',
  },
];

export const hasPermission = (userPermissions, permission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(permission) || userPermissions.includes('*');
};

export const hasAnyPermission = (userPermissions, ...permissions) => {
  return permissions.some(p => hasPermission(userPermissions, p));
};

export const hasAllPermissions = (userPermissions, ...permissions) => {
  return permissions.every(p => hasPermission(userPermissions, p));
};
