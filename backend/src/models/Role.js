const mongoose = require('mongoose');

/**
 * Role represents a level of access in the system. Roles are reusable across
 * users. We keep permissions as a flat list of string keys to keep the model
 * simple while still allowing role-based UI/API behaviour.
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      // System roles cannot be deleted (e.g. "admin").
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);
