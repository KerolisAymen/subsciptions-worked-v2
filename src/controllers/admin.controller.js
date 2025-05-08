const AppDataSource = require('../config/database');
const User = require('../models/User');
const Project = require('../models/Project');
const Trip = require('../models/Trip');
const Participant = require('../models/Participant');
const Payment = require('../models/Payment');
const ProjectMember = require('../models/ProjectMember');

// Get all users in the system - system admin only
exports.getAllUsers = async (req, res) => {
  try {
    // Check if the requesting user is a system admin
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      select: ['id', 'name', 'email', 'isSystemAdmin', 'createdAt', 'updatedAt']
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all projects in the system - system admin only
exports.getAllProjects = async (req, res) => {
  try {
    // Check if the requesting user is a system admin
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const projectRepository = AppDataSource.getRepository(Project);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    const tripRepository = AppDataSource.getRepository(Trip);

    // Get all projects
    const projects = await projectRepository.find();

    // Get project details including owners and trip counts
    const projectDetails = [];
    
    for (const project of projects) {
      // Get project owner
      const owner = await projectMemberRepository
        .createQueryBuilder('member')
        .leftJoinAndSelect('member.user', 'user')
        .where('member.projectId = :projectId', { projectId: project.id })
        .andWhere('member.role = :role', { role: 'owner' })
        .getOne();
      
      // Get member count
      const memberCount = await projectMemberRepository.count({
        where: { projectId: project.id }
      });
      
      // Get trip count
      const tripCount = await tripRepository.count({
        where: { projectId: project.id }
      });
      
      projectDetails.push({
        ...project,
        owner: owner ? owner.user : null,
        memberCount,
        tripCount
      });
    }

    res.status(200).json({
      status: 'success',
      results: projectDetails.length,
      data: {
        projects: projectDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get system statistics - system admin only
exports.getSystemStats = async (req, res) => {
  try {
    // Check if the requesting user is a system admin
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const paymentRepository = AppDataSource.getRepository(Payment);

    // Get counts
    const userCount = await userRepository.count();
    const projectCount = await projectRepository.count();
    const tripCount = await tripRepository.count();
    const participantCount = await participantRepository.count();
    
    // Get total amount collected
    const paymentsResult = await paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();
    
    const totalCollected = paymentsResult.total ? Number(paymentsResult.total) : 0;

    // Get most recent activity
    const recentPaymentsForActivity = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.collector', 'collector')
      .leftJoinAndSelect('payment.participant', 'participant')
      .orderBy('payment.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get recent users
    const recentUsers = await userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Get monthly payment trends for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // First day of the month
    
    // Get all payments made in the last 6 months
    const paymentsForTrends = await paymentRepository
      .createQueryBuilder('payment')
      .select('payment.amount', 'amount')
      .addSelect('payment.createdAt', 'createdAt')
      .where('payment.createdAt >= :startDate', { startDate: sixMonthsAgo })
      .orderBy('payment.createdAt', 'ASC')
      .getRawMany();
    
    // Process payments to get monthly totals
    const monthlyTotals = {};
    
    paymentsForTrends.forEach(payment => {
      const date = new Date(payment.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const key = `${year}-${month}`;
      
      if (!monthlyTotals[key]) {
        monthlyTotals[key] = {
          year,
          month,
          total: 0
        };
      }
      
      monthlyTotals[key].total += Number(payment.amount);
    });
    
    // Convert to array format
    const monthlyTrends = Object.values(monthlyTotals);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          userCount,
          projectCount,
          tripCount,
          participantCount,
          totalCollected
        },
        recentActivity: {
          payments: recentPaymentsForActivity.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            createdAt: payment.createdAt,
            participant: {
              id: payment.participant.id,
              name: payment.participant.name
            },
            collector: {
              id: payment.collector.id,
              name: payment.collector.name
            }
          })),
          users: recentUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            isSystemAdmin: user.isSystemAdmin,
            createdAt: user.createdAt
          }))
        },
        monthlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Make a user a system admin
exports.makeUserAdmin = async (req, res) => {
  try {
    // Check if the requesting user is a system admin
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const userId = req.params.userId;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user to make them a system admin
    user.isSystemAdmin = true;
    await userRepository.save(user);
    
    res.status(200).json({
      status: 'success',
      message: 'User is now a system administrator',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isSystemAdmin: user.isSystemAdmin
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove system admin privileges from a user
exports.removeUserAdmin = async (req, res) => {
  try {
    // Check if the requesting user is a system admin
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only system administrators can access this resource.'
      });
    }

    const userId = req.params.userId;
    
    // Don't allow removing admin from yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot remove administrator privileges from yourself'
      });
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user to remove system admin privileges
    user.isSystemAdmin = false;
    await userRepository.save(user);
    
    res.status(200).json({
      status: 'success',
      message: 'Administrator privileges removed from user',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isSystemAdmin: user.isSystemAdmin
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};