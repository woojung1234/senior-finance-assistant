const mongoose = require('mongoose');

// 운동 일정 스키마 정의
const workoutScheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutRoutine',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'missed', 'in_progress'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  // 실제 수행한 운동 데이터를 기록하기 위한 필드
  completionData: {
    actualDuration: {
      type: Number, // 분 단위
      min: 0
    },
    caloriesBurned: {
      type: Number,
      min: 0
    },
    feedback: {
      difficulty: {
        type: Number, // 1-10 스케일
        min: 1,
        max: 10
      },
      enjoyment: {
        type: Number, // 1-10 스케일
        min: 1,
        max: 10
      },
      comment: String
    },
    exercisesCompleted: [{
      exerciseId: String,
      name: String,
      // 유산소 운동 완료 데이터
      cardioData: {
        duration: Number, // 분 단위
        distance: Number, // 킬로미터 단위
        avgHeartRate: Number // 평균 심박수
      },
      // 근력 운동 완료 데이터
      strengthData: {
        setsCompleted: Number,
        repsPerSet: [Number],
        weightUsed: [Number] // kg 단위
      },
      notes: String
    }]
  },
  // 리마인더 설정
  reminder: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    reminderTime: {
      type: Date
    }
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

// 날짜 기반 인덱스 생성 (날짜 기반 조회 성능 향상)
workoutScheduleSchema.index({ user: 1, scheduledDate: 1 });

// 모델 생성 및 내보내기
const WorkoutSchedule = mongoose.model('WorkoutSchedule', workoutScheduleSchema);

module.exports = WorkoutSchedule;
