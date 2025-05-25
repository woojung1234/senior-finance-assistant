const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    name: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 12,
      max: 120
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    height: {
      type: Number, // cm 단위
      min: 50,
      max: 300
    },
    weight: {
      type: Number, // kg 단위
      min: 20,
      max: 500
    },
    targetWeight: {
      type: Number, // kg 단위
      min: 20,
      max: 500
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    preferredWorkouts: [{
      type: String,
      enum: ['cardio', 'strength', 'flexibility', 'balance', 'hiit', 'yoga', 'pilates', 'crossfit', 'bodyweight', 'other']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  // 비밀번호가 수정되지 않았으면 다음 미들웨어로 넘어감
  if (!this.isModified('password')) return next();
  
  try {
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 확인 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// 모델 생성 및 내보내기
const User = mongoose.model('User', userSchema);

module.exports = User;
