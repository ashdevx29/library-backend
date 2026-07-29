import Role from '../models/Role.js';
import { DEFAULT_ROLES } from '../helpers/permissions.js';

export const RoleService = {
  seedDefaults: async () => {
    for (const role of DEFAULT_ROLES) {
      const exists = await Role.findOne({ name: role.name });
      if (!exists) await Role.create(role);
    }
  },

  getAll: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.isSystem !== undefined) query.isSystem = filters.isSystem === 'true';
    return Role.find(query).sort({ name: 1 });
  },

  getById: async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new Error('Role not found');
    return role;
  },

  create: async (data) => {
    const exists = await Role.findOne({ name: data.name });
    if (exists) throw new Error('Role name already exists');
    return Role.create(data);
  },

  update: async (id, data) => {
    const role = await Role.findById(id);
    if (!role) throw new Error('Role not found');
    if (role.isSystem && data.name && data.name !== role.name) {
      throw new Error('Cannot rename system roles');
    }
    Object.assign(role, data);
    await role.save();
    return role;
  },

  delete: async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system roles');
    await Role.findByIdAndDelete(id);
    return true;
  },

  getStats: async () => {
    const [total, system, custom] = await Promise.all([
      Role.countDocuments(),
      Role.countDocuments({ isSystem: true }),
      Role.countDocuments({ isSystem: false }),
    ]);
    return { total, system, custom };
  },
};
