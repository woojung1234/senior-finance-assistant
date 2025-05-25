const mongoose = require('mongoose');

// 운동 스키마 정의
const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'balance', 'hiit', 'yoga', 'pilates', 'crossfit', 'bodyweight', 'other'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  targetMuscles: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'legs', 'glutes', 'calves', 'full_body', 'other']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // 유산소 운동을 위한 필드
  cardioSpecific: {
    duration: {
      type: Number, // 분 단위
      min: 1
    },
    distance: {
      type: Number, // 킬로미터 단위
      min: 0
    }
  },
  // 근력 운동을 위한 필드
  strengthSpecific: {
    sets: {
      type: Number,
      min: 1,
      max: 20
    },
    reps: {
      type: Number,
      min: 1,
      max: 100
    },
    weight: {
      type: Number, // kg 단위
      min: 0
    },
    restBetweenSets: {
      type: Number, // 초 단위
      min: 0
    }
  },
  equipmentRequired: [{
    type: String,
    enum: ['none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'machines', 'bench', 'yoga_mat', 'stability_ball', 'pullup_bar', 'other']
  }],
  videoUrl: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
});

// 운동 루틴 스키마 정의
const workoutRoutineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  type: {
    type: String,
    enum: ['full_body', 'upper_body', 'lower_body', 'push', 'pull', 'legs', 'cardio', 'hiit', 'custom'],
    required: true
  },
  duration: {
    type: Number, // 분 단위
    required: true,
    min: 5,
    max: 240
  },
  caloriesBurn: {
    type: Number,
    min: 0
  },
  exercises: [{
    exercise: exerciseSchema,
    order: {
      type: Number,
      required: true,
      min: 1
    },
    notes: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isAIGenerated: {
    type: Boolean,
    default: false
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

// 모델 생성 및 내보내기
const WorkoutRoutine = mongoose.model('WorkoutRoutine', workoutRoutineSchema);

module.exports = WorkoutRoutine;
