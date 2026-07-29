const express = require('express');
const router = express.Router();

// const User = require('../models/User');
const Plan = require('../models/Plan');
const authMiddleware = require('../authMiddleware/authMiddleware.js');
const { hashPassword, comparePassword, generateToken } = require('../public/javascripts/auth');
const {
  generateTutoringPlan,
  generateQuiz,
  generateExplanation,
} = require('../public/javascripts/gemini');


router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email format.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    const hashedPwd = await hashPassword(password);
    const user = await User.create({ username, email, password: hashedPwd });

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error during signup.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error during login.' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, message: 'Logged out.' });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


router.post('/plans', authMiddleware, async (req, res) => {
  try {
    const { subject, topic, level, goals, type } = req.body;

    if (!subject || !topic || !level) {
      return res.status(400).json({
        success: false,
        message: 'Subject, topic, and level are required.',
      });
    }

    console.log('Generating:', { subject, topic, level, type });

    let generatedContent;

    if (type === 'quiz') {
      generatedContent = await generateQuiz({
        subject,
        topic,
        numQuestions: 5,
      });
    } else if (type === 'explanation') {
      generatedContent = await generateExplanation({
        subject,
        topic,
        level,
      });
    } else {
      generatedContent = await generateTutoringPlan({
        subject,
        topic,
        level,
        goals: goals || 'Master the fundamentals',
      });
    }

    const plan = await Plan.create({
      userId: req.userId,
      type: type || 'plan',
      subject,
      topic,
      level,
      goals: goals || '',
      content: generatedContent,
    });

    return res.status(201).json({
      success: true,
      message: 'Plan generated and saved.',
      plan,
    });
  } catch (err) {
    // ── LOG THE REAL ERROR ──
    console.error('=== GENERATE PLAN ERROR ===');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    if (err.response) console.error('Gemini status:', err.response.status, err.response.statusText);
    console.error('Stack:', err.stack);
    console.error('============================');

    if (err instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        message: 'AI returned invalid data. Try again.',
      });
    }

    // ── Return the ACTUAL error message so the frontend can show it ──
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate plan.',
    });
  }
});

router.get('/plans', authMiddleware, async (req, res) => {
  try {
    const plans = await Plan.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-content')
      .lean();

    return res.json({ success: true, plans });
  } catch (err) {
    console.error('List plans error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch plans.' });
  }
});

router.get('/plans/:id', authMiddleware, async (req, res) => {
  try {
    const plan = await Plan.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found.' });
    }

    return res.json({ success: true, plan });
  } catch (err) {
    console.error('Get plan error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch plan.' });
  }
});

router.put('/plans/:id', authMiddleware, async (req, res) => {
  try {
    const { subject, topic, level, goals, regenerate, type } = req.body;

    const plan = await Plan.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found.' });
    }

    if (subject) plan.subject = subject;
    if (topic) plan.topic = topic;
    if (level) plan.level = level;
    if (goals !== undefined) plan.goals = goals;

    if (regenerate) {
      const genType = type || plan.type;
      if (genType === 'quiz') {
        plan.content = await generateQuiz({
          subject: plan.subject,
          topic: plan.topic,
          numQuestions: 5,
        });
      } else if (genType === 'explanation') {
        plan.content = await generateExplanation({
          subject: plan.subject,
          topic: plan.topic,
          level: plan.level,
        });
      } else {
        plan.content = await generateTutoringPlan({
          subject: plan.subject,
          topic: plan.topic,
          level: plan.level,
          goals: plan.goals || 'Master the fundamentals',
        });
      }
      plan.type = genType;
    }

    await plan.save();

    return res.json({
      success: true,
      message: 'Plan updated.',
      plan: plan.toObject(),
    });
  } catch (err) {
    console.error('Update plan error:', err);
    if (err instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        message: 'AI returned an unexpected format. Please try again.',
      });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update plan.' });
  }
});

router.delete('/plans/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Plan.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Plan not found.' });
    }

    return res.json({ success: true, message: 'Plan deleted.' });
  } catch (err) {
    console.error('Delete plan error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete plan.' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username) {
      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters.',
        });
      }
      const taken = await User.findOne({
        username,
        _id: { $ne: req.userId },
      });
      if (taken) {
        return res
          .status(409)
          .json({ success: false, message: 'Username is already taken.' });
      }
      updates.username = username;
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid email format.' });
      }
      const taken = await User.findOne({
        email,
        _id: { $ne: req.userId },
      });
      if (taken) {
        return res
          .status(409)
          .json({ success: false, message: 'Email is already registered.' });
      }
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No fields to update.' });
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).select('-password');

    return res.json({
      success: true,
      message: 'Profile updated.',
      user,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update profile.' });
  }
});

router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    await Plan.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.json({ success: true, message: 'Account deleted.' });
  } catch (err) {
    console.error('Account delete error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete account.' });
  }
});

module.exports = router;