import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['Super Admin', 'Branch Admin', 'Staff', 'Student'], 
    required: true 
  },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  permissions: [{ type: String }],
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, index: true },
  mobile: { type: String, unique: true, sparse: true, index: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended'], 
    default: 'Active' 
  },
  lastLogin: { type: Date },
  refreshToken: { type: String }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getAllPermissions = async function() {
  if (this.role === 'Super Admin') return ['*'];
  if (this.permissions?.length) return this.permissions;
  if (this.roleId) {
    const Role = mongoose.model('Role');
    const role = await Role.findById(this.roleId);
    return role?.permissions || [];
  }
  return [];
};

const User = mongoose.model('User', userSchema);
export default User;
