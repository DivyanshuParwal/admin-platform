const mongoose = require('mongoose');

/**
 * Site is the tenant container in our multi-tenant model. Users belong to a
 * site, and most management views in the UI can be filtered by site.
 */
const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

siteSchema.index({ slug: 1 });
siteSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Site', siteSchema);
