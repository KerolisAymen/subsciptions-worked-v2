const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppDataSource = require('../config/database');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  
  // Fix for expires option invalid error
  let expiresIn = 90; // Default to 90 days if JWT_EXPIRES_IN is not set or invalid
  
  if (process.env.JWT_EXPIRES_IN) {
    // Try to parse JWT_EXPIRES_IN as a number
    const parsedExpiry = parseInt(process.env.JWT_EXPIRES_IN, 10);
    if (!isNaN(parsedExpiry)) {
      expiresIn = parsedExpiry;
    }
  }
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + expiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if user exists
    const existingUser = await userRepository.findOne({ 
      where: { email: req.body.email } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = userRepository.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires
    });

    const savedUser = await userRepository.save(newUser);
    
    try {
      // Generate verification URL - Use configurable frontend URL
      // This allows different hosts for backend API and frontend in development
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const frontendHost = process.env.FRONTEND_URL || `${protocol}://${req.get('host')}`;
      const verificationUrl = `${frontendHost}/verify-email/${verificationToken}`;
      
      // Send verification email
      await sendVerificationEmail({
        email: savedUser.email,
        name: savedUser.name,
        subject: 'Please verify your email address',
        verificationUrl
      });
      
      // Send response without token (user will need to verify email first)
      res.status(201).json({
        status: 'success',
        message: 'User created successfully! Please check your email to verify your account.',
        data: {
          user: {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            emailVerified: savedUser.emailVerified
          }
        }
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      
      // Delete the user if email sending fails
      await userRepository.remove(savedUser);
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email. Please try again later.'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    // Hash the token from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userRepository = AppDataSource.getRepository(User);
    const { MoreThan } = require('typeorm');

    // Find user with the token and non-expired verificationTokenExpires
    const user = await userRepository.findOne({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpires: MoreThan(new Date())
      }
    });

    if (!user) {
      // Send JSON error response
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
    
    // Update user verification status
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await userRepository.save(user);
    
    // Send JSON success response
    res.status(200).json({
      success: true,
      email: user.email,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during verification'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      console.log('User email not verified:', user.email);
      return res.status(401).json({
        status: 'error',
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    
    // If no user found or already verified, send generic success message for security
    if (!user || user.emailVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'If your email exists in our database, a verification link has been sent'
      });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.verificationToken = hashedToken;
    user.verificationTokenExpires = verificationTokenExpires;
    
    await userRepository.save(user);
    
    // Generate verification URL - Use configurable frontend URL
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const frontendHost = process.env.FRONTEND_URL || `${protocol}://${req.get('host')}`;
    const verificationUrl = `${frontendHost}/verify-email/${verificationToken}`;
    
    // Send verification email
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      subject: 'Please verify your email address',
      verificationUrl
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error sending verification email'
    });
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = async (req, res, next) => {
  let token;
  
  // Get token from header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'You are not logged in! Please log in to get access.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: decoded.id } });
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if the user has verified their email
    if (!currentUser.emailVerified) {
      return res.status(401).json({
        status: 'error',
        message: 'Please verify your email to access this resource.',
        requiresVerification: true,
        email: currentUser.email
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  }
};

exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Please provide your email address.' });
    }
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      // Always respond with success for security
      return res.status(200).json({ status: 'success', message: 'If your email exists, a reset link has been sent.' });
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpires;
    await userRepository.save(user);
    // Send reset email
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const frontendHost = process.env.FRONTEND_URL || `${protocol}://${req.get('host')}`;
    const resetUrl = `${frontendHost}/reset-password/${resetToken}`;
    
    const { sendResetPasswordEmail } = require('../utils/email');
    await sendResetPasswordEmail({ email: user.email, name: user.name, resetUrl });
    return res.status(200).json({ status: 'success', message: 'If your email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Error sending reset email.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ status: 'error', message: 'Please provide a new password.' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userRepository = AppDataSource.getRepository(User);
    const { MoreThan } = require('typeorm');
    const user = await userRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: MoreThan(new Date())
      }
    });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token is invalid or has expired.' });
    }
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await userRepository.save(user);
    res.status(200).json({ status: 'success', message: 'Password has been reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Error resetting password.' });
  }
};
