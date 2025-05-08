const jwt = require('jsonwebtoken');
const AppDataSource = require('../config/database');
const User = require('../models/User');
const ProjectMember = require('../models/ProjectMember');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers or cookies
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: decoded.id } });

    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user with this token no longer exists.'
      });
    }

    // Add user to request
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error); // Log the error for debugging
    return res.status(401).json({
      status: 'error',
      message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Not authorized'
    });
  }
};

// Maintain authMiddleware as an alias for backwards compatibility
exports.authMiddleware = exports.protect;

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    // If one of the roles is system-admin and user is a system admin, grant access
    if (roles.includes('system-admin') && req.user.isSystemAdmin) {
      return next();
    }
    
    let projectId;
    
    // Get projectId from request - check various locations
    if (req.body.projectId) {
      projectId = req.body.projectId;
    } else if (req.params.projectId) {
      projectId = req.params.projectId;
    } else if (req.query.projectId) {
      projectId = req.query.projectId;
    } else {
      // Try to determine projectId from other entities
      try {
        projectId = await getProjectIdFromEntity(req);
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
    }
    
    // If no projectId could be found after all checks
    if (!projectId) {
      return res.status(403).json({
        status: 'error',
        message: 'Project ID not found. Unable to verify permissions.'
      });
    }

    try {
      // Get user's role in this project
      const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
      const membership = await projectMemberRepository.findOne({
        where: {
          userId: req.user.id,
          projectId: projectId
        }
      });

      if (!membership || !roles.includes(membership.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action'
        });
      }

      // Add role and project ID to request
      req.userRole = membership.role;
      req.projectId = projectId;
      next();
    } catch (error) {
      console.error('Error checking permissions:', error); // Log the error for debugging
      return res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred while checking permissions. Please try again later.'
      });
    }
  };
};

/**
 * Helper function to get projectId from various entities
 * @param {Object} req - Express request object
 * @returns {Promise<string>} The project ID
 */
async function getProjectIdFromEntity(req) {
  // Check for tripId
  if (req.params.tripId || req.body.tripId) {
    const tripId = req.params.tripId || req.body.tripId;
    const Trip = require('../models/Trip'); // Import needed model
    const tripRepository = AppDataSource.getRepository(Trip);
    const trip = await tripRepository.findOne({
      where: { id: tripId }
    });
    
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    return trip.projectId;
  }
  
  // Add similar checks for other entity types if needed
  // For example, check for taskId, documentId, etc.
  
  // If no entity identifier is found
  throw new Error('Could not determine the associated project');
}
