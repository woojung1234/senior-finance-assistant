const mongoose = require('mongoose');

// 건강 측정 스키마 정의
const healthMetricSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // 체중 관련 측정값
  bodyMetrics: {
    weight: {
      type: Number, // kg 단위
      min: 20,
      max: 500
    },
    bodyFatPercentage: {
      type: Number,
      min: 1,
      max: 70
    },
    bmi: {
      type: Number,
      min: 10,
      max: 50
    },
    muscleWeight: {
      type: Number, // kg 단위
      min: 10,
      max: 200
    },
    waistCircumference: {
      type: Number, // cm 단위
      min: 30,
      max: 200
    }
  },
  // 심혈관 관련 측정값
  cardioMetrics: {
    restingHeartRate: {
      type: Number, // bpm 단위
      min: 30,
      max: 220
    },
    bloodPressure: {
      systolic: {
        type: Number, // mmHg 단위
        min: 70,
        max: 250
      },
      diastolic: {
        type: Number, // mmHg 단위
        min: 40,
        max: 150
      }
    },
    vo2Max: {
      type: Number,
      min: 10,
      max: 100
    }
  },
  // 영양 관련 측정값
  nutritionMetrics: {
    caloriesConsumed: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number, // grams
      min: 0
    },
    carbs: {
      type: Number, // grams
      min: 0
    },
    fat: {
      type: Number, // grams
      min: 0
    },
    water: {
      type: Number, // liters
      min: 0
    }
  },
  // 수면 관련 측정값
  sleepMetrics: {
    duration: {
      type: Number, // 시간 단위
      min: 0,
      max: 24
    },
    quality: {
      type: Number, // 1-10 스케일
      min: 1,
      max: 10
    }
  },
  // 기타 건강 지표
  otherMetrics: {
    stressLevel: {
      type: Number, // 1-10 스케일
      min: 1,
      max: 10
    },
    energyLevel: {
      type: Number, // 1-10 스케일
      min: 1,
      max: 10
    },
    soreness: {
      type: Number, // 1-10 스케일
      min: 1,
      max: 10
    }
  },
  notes: {
    type: String,
    trim: true
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

// 사용자 및 날짜 인덱스 생성
healthMetricSchema.index({ user: 1, date: -1 });

// 모델 생성 및 내보내기
const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);

module.exports = HealthMetric;
