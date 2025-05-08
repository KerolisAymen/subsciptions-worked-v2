const AppDataSource = require('../config/database');
const Trip = require('../models/Trip');
const ProjectMember = require('../models/ProjectMember');

// Helper function to check project membership
const checkProjectMembership = async (userId, projectId) => {
  const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
  const membership = await projectMemberRepository.findOne({
    where: {
      userId,
      projectId
    }
  });
  
  if (!membership) {
    return false;
  }
  
  return membership;
};

exports.createTrip = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, req.body.projectId);
    
    if (!membership) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this project'
      });
    }
    
    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to create trips'
      });
    }
    
    // Create trip
    const newTrip = tripRepository.create({
      name: req.body.name,
      description: req.body.description || null,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      totalCost: req.body.totalCost || 0,
      expectedAmountPerPerson: req.body.expectedAmountPerPerson || 0,
      projectId: req.body.projectId
    });
    
    const savedTrip = await tripRepository.save(newTrip);
    
    res.status(201).json({
      status: 'success',
      data: {
        trip: savedTrip
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getProjectTrips = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, req.params.projectId);
    
    if (!membership) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this project'
      });
    }
    
    // Get trips
    const trips = await tripRepository.find({
      where: { projectId: req.params.projectId }
    });
    
    res.status(200).json({
      status: 'success',
      results: trips.length,
      data: {
        trips
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTrip = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);
    
    // Get trip
    const trip = await tripRepository.findOne({
      where: { id: req.params.tripId }
    });
    
    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, trip.projectId);
    
    if (!membership) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this trip'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        trip,
        userRole: membership.role
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);
    
    // Get trip
    const trip = await tripRepository.findOne({
      where: { id: req.params.tripId }
    });
    
    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, trip.projectId);
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this trip'
      });
    }
    
    // Update trip
    tripRepository.merge(trip, {
      name: req.body.name || trip.name,
      description: req.body.description !== undefined ? req.body.description : trip.description,
      startDate: req.body.startDate || trip.startDate,
      endDate: req.body.endDate || trip.endDate,
      totalCost: req.body.totalCost || trip.totalCost,
      expectedAmountPerPerson: req.body.expectedAmountPerPerson !== undefined 
        ? req.body.expectedAmountPerPerson 
        : trip.expectedAmountPerPerson
    });
    
    const updatedTrip = await tripRepository.save(trip);
    
    res.status(200).json({
      status: 'success',
      data: {
        trip: updatedTrip
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.createTrip = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);

    const membership = await checkProjectMembership(req.user.id, req.body.projectId);

    if (!membership) {
      return res.status(403).json({ status: 'error', message: 'You are not a member of this project' });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ status: 'error', message: 'You do not have permission to create trips' });
    }

    const newTrip = tripRepository.create({
      name: req.body.name,
      description: req.body.description || null,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      totalCost: req.body.totalCost || 0,
      expectedAmountPerPerson: req.body.expectedAmountPerPerson || 0,
      projectId: req.body.projectId
    });

    const savedTrip = await tripRepository.save(newTrip);

    res.status(201).json({
      status: 'success',
      data: { trip: savedTrip }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const tripRepository = AppDataSource.getRepository(Trip);
    
    // Get trip
    const trip = await tripRepository.findOne({
      where: { id: req.params.tripId }
    });
    
    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, trip.projectId);
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this trip'
      });
    }
    
    await tripRepository.remove(trip);
    
    res.status(200).json({
      status: 'success',
      message: 'Trip successfully deleted'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
