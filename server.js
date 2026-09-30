require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import Models
const User = require('./models/User');
const Payment = require('./models/Payment');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== MONGODB CONNECTION WITH DNS FALLBACK =====
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let isConnected = false;
async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mecora' });
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}
connectDB();

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Plans configuration
const plans = {
  monthly: { name: 'Monthly Plan', amount: 200000, duration: '1 Month', price: '₹2,000', days: 30 },
  quarterly: { name: 'Quarterly Plan', amount: 450000, duration: '3 Months', price: '₹4,500', days: 90 },
  annual: { name: 'Annual Plan', amount: 1000000, duration: '12 Months', price: '₹10,000', days: 365 },
};

// ===== SIGNUP ROUTE =====
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create new user
    const user = new User({ name, email, password, phone });
    await user.save();

    console.log(`👤 New user registered: ${name} (${email})`);

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// ===== LOGIN ROUTE =====
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log(`🔑 User logged in: ${user.name} (${email})`);

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ===== CREATE RAZORPAY ORDER =====
app.post('/api/create-order', async (req, res) => {
  try {
    const { planType, userId, userEmail, userName, userPhone } = req.body;
    const plan = plans[planType];

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan type' });
    }

    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('XXXX');

    if (isMock) {
      console.log(`ℹ️ [Demo Mode] Generating simulated order for ${userName} (${plan.name})`);
      return res.json({
        success: true,
        isMock: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: plan.amount,
          currency: 'INR',
        },
        plan,
        key: 'rzp_test_placeholder',
      });
    }

    const options = {
      amount: plan.amount, // amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        planType,
        userId,
        userEmail,
        userName,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      plan,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    // If Razorpay auth fails, fall back to mock order with notification
    if (error.statusCode === 401) {
      const plan = plans[req.body.planType];
      console.log('⚠️ Razorpay authentication failed (invalid keys in .env). Falling back to Test Simulation mode.');
      return res.json({
        success: true,
        isMock: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: plan ? plan.amount : 200000,
          currency: 'INR',
        },
        plan,
        key: 'rzp_test_placeholder',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create order. Please check Razorpay keys.' });
  }
});

// ===== VERIFY PAYMENT & SAVE TO DATABASE =====
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    const isMock = razorpay_order_id?.startsWith('order_mock_') || 
                   !process.env.RAZORPAY_KEY_SECRET || 
                   process.env.RAZORPAY_KEY_SECRET.includes('secret_here');

    // Verify signature only if NOT mock
    if (!isMock) {
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
    }

    const plan = plans[planType];
    const paymentDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Save payment to MongoDB
    const payment = new Payment({
      userId: (await User.findOne({ email: userEmail }))?._id,
      userName,
      userEmail,
      userPhone,
      planType,
      amount: plan.amount / 100, // Convert paise to rupees
      amountFormatted: plan.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'success',
    });
    await payment.save();

    // Update user's plan in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.days);

    await User.findOneAndUpdate(
      { email: userEmail },
      {
        plan: planType,
        planActive: true,
        planExpiresAt: expiresAt,
      }
    );

    console.log(`💰 Payment received: ${userName} - ${plan.name} (${plan.price})`);

    // Send confirmation email to customer
    const customerMailOptions = {
      from: `"Mecora Medical" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '✅ Payment Confirmation - Mecora Medical Software',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 28px;">Mecora Medical</h1>
            <p style="color: #a0aec0; margin: 5px 0 0;">Payment Confirmation</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e;">Hello ${userName}! 🎉</h2>
            <p style="color: #4a5568; line-height: 1.6;">Thank you for subscribing to Mecora Medical Software. Your payment has been successfully processed.</p>
            <div style="background: #f7fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #00d4ff;">
              <h3 style="color: #1a1a2e; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #718096;">Plan:</td><td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${plan.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Duration:</td><td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${plan.duration}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Amount:</td><td style="padding: 8px 0; color: #00d4ff; font-weight: 700; font-size: 18px;">${plan.price}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Payment ID:</td><td style="padding: 8px 0; color: #1a1a2e; font-size: 12px;">${razorpay_payment_id}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Date:</td><td style="padding: 8px 0; color: #1a1a2e;">${paymentDate}</td></tr>
              </table>
            </div>
            <p style="color: #4a5568; line-height: 1.6;">You can now access all features of Mecora Medical Software. If you have any questions, feel free to contact us.</p>
            <a href="${process.env.BASE_URL}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0099cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 15px; font-weight: 600;">Go to Dashboard →</a>
          </div>
          <div style="background: #f7fafc; padding: 20px; text-align: center;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">© 2026 Mecora Medical Software. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Send notification email to admin
    const adminMailOptions = {
      from: `"Mecora Medical" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 New Payment Received - ${userName} (${plan.name})`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 28px;">Mecora Medical</h1>
            <p style="color: #a0aec0; margin: 5px 0 0;">Admin Payment Notification</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1a1a2e;">New Payment Received! 💰</h2>
            <div style="background: #f0fff4; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #38a169;">
              <h3 style="color: #1a1a2e; margin-top: 0;">Customer Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #718096;">Name:</td><td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${userName}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Email:</td><td style="padding: 8px 0; color: #1a1a2e;">${userEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Phone:</td><td style="padding: 8px 0; color: #1a1a2e;">${userPhone}</td></tr>
              </table>
            </div>
            <div style="background: #f7fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #00d4ff;">
              <h3 style="color: #1a1a2e; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #718096;">Plan:</td><td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${plan.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Duration:</td><td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${plan.duration}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Amount:</td><td style="padding: 8px 0; color: #00d4ff; font-weight: 700; font-size: 18px;">${plan.price}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Payment ID:</td><td style="padding: 8px 0; color: #1a1a2e; font-size: 12px;">${razorpay_payment_id}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Order ID:</td><td style="padding: 8px 0; color: #1a1a2e; font-size: 12px;">${razorpay_order_id}</td></tr>
                <tr><td style="padding: 8px 0; color: #718096;">Date:</td><td style="padding: 8px 0; color: #1a1a2e;">${paymentDate}</td></tr>
              </table>
            </div>
          </div>
          <div style="background: #f7fafc; padding: 20px; text-align: center;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">Mecora Medical - Admin Dashboard</p>
          </div>
        </div>
      `,
    };

    // Send both emails
    try {
      await transporter.sendMail(customerMailOptions);
      await transporter.sendMail(adminMailOptions);
      console.log('📧 Emails sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        planType,
        userName,
        userEmail,
        amount: plan.price,
        date: paymentDate,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// ===== ADMIN: GET ALL PAYMENTS =====
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// ===== ADMIN: GET ALL USERS =====
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ===== ADMIN: DASHBOARD STATS =====
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({ planActive: true });
    const totalPayments = await Payment.countDocuments({ status: 'success' });
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscriptions,
        totalPayments,
        totalRevenue,
        recentPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Mecora Website running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;
