const mongoose = require('mongoose');

// AI 코치 대화 스키마 정의
const aiCoachConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  context: {
    userProfile: {
      type: mongoose.Schema.Types.Mixed
    },
    recentWorkouts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutSchedule'
    }],
    currentGoals: [{
      type: String
    }],
    healthMetrics: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  title: {
    type: String,
    default: '새 대화'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  generatedRoutines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutRoutine'
  }],
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 모델 생성 및 내보내기
const AICoachConversation = mongoose.model('AICoachConversation', aiCoachConversationSchema);

module.exports = AICoachConversation;
