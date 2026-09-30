const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
    required: true,
  },
  planType: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  amountFormatted: {
    type: String,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpaySignature: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
