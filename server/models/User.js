import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  skills: [{ type: String }],
  bio: { type: String },
  hourlyRate: { type: Number, default: 500 }, // Hourly rate in Rupees (₹)
  portfolio: { type: String },
  rating: { type: Number, default: 5 },
  totalReviews: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // Balance in Rupees (₹)
  gpayNumber: { type: String }, // Freelancer GPay Phone Number
  upiId: { type: String }, // Freelancer UPI ID (e.g. name@okaxis)
  upiQrCode: { type: String }, // Base64 encoded or image URL of Freelancer's GPay QR code
  
  // GitHub Integration & Extracted Projects
  githubUsername: { type: String },
  githubUrl: { type: String },
  portfolioProjects: [{
    title: { type: String, required: true },
    description: { type: String },
    techStack: [{ type: String }],
    repoUrl: { type: String },
    liveUrl: { type: String },
    stars: { type: Number, default: 0 }
  }],

  // Resume Section
  resumeData: {
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    education: [{
      institution: { type: String },
      degree: { type: String },
      year: { type: String }
    }],
    experience: [{
      role: { type: String },
      company: { type: String },
      duration: { type: String },
      description: { type: String }
    }],
    certifications: [{ type: String }],
    fileName: { type: String },
    uploadedAt: { type: Date }
  },

  // Uploaded Certificates & Skill Credentials
  certificates: [{
    title: { type: String, required: true },
    issuer: { type: String },
    issueDate: { type: String },
    credentialId: { type: String },
    credentialUrl: { type: String },
    skills: [{ type: String }],
    fileUrl: { type: String }, // Base64 data URI (image or PDF) or link
    fileName: { type: String },
    fileType: { type: String }, // 'image' | 'pdf'
    uploadedAt: { type: Date, default: Date.now }
  }],

  verifiedBadges: [{
    skill: { type: String, required: true },
    score: { type: Number, required: true },
    title: { type: String, default: 'Verified AI Expert' },
    verifiedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
