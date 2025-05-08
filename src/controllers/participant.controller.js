const AppDataSource = require('../config/database');
const Participant = require('../models/Participant');
const Trip = require('../models/Trip');
const ProjectMember = require('../models/ProjectMember');

// Helper function to check project access
const checkProjectAccess = async (userId, tripId) => {
  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.findOne({
    where: { id: tripId }
  });
  
  if (!trip) {
    return { allowed: false, message: 'Trip not found' };
  }
  
  const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
  const membership = await projectMemberRepository.findOne({
    where: {
      userId,
      projectId: trip.projectId
    }
  });
  
  if (!membership) {
    return { allowed: false, message: 'You do not have access to this trip' };
  }
  
  return { allowed: true, role: membership.role, trip };
};

exports.createParticipant = async (req, res) => {
  try {
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, req.body.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Create participant
    const newParticipant = participantRepository.create({
      name: req.body.name,
      phone: req.body.phone || null,
      email: req.body.email || null,
      tripId: req.body.tripId,
      expectedAmount: req.body.expectedAmount || 0,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    const savedParticipant = await participantRepository.save(newParticipant);
    
    res.status(201).json({
      status: 'success',
      data: {
        participant: savedParticipant
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTripParticipants = async (req, res) => {
  try {
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, req.params.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Get participants with their total payments and createdByUser/updatedByUser
    const participants = await participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.payments', 'payment')
      .leftJoinAndSelect('participant.createdByUser', 'createdByUser')
      .leftJoinAndSelect('participant.updatedByUser', 'updatedByUser')
      .where('participant.tripId = :tripId', { tripId: req.params.tripId })
      .getMany();
    
    // Calculate total paid amount for each participant
    const participantsWithTotals = participants.map(participant => {
      const totalPaid = participant.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const balance = Number(participant.expectedAmount) - totalPaid;
      return {
        ...participant,
        totalPaid,
        balance,
        createdByUser: participant.createdByUser
          ? { id: participant.createdByUser.id, name: participant.createdByUser.name }
          : null,
        updatedByUser: participant.updatedByUser
          ? { id: participant.updatedByUser.id, name: participant.updatedByUser.name }
          : null,
        payments: undefined // Don't include individual payments in this response
      };
    });
    
    res.status(200).json({
      status: 'success',
      results: participantsWithTotals.length,
      data: {
        participants: participantsWithTotals
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getParticipant = async (req, res) => {
  try {
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Get participant with payments
    const participant = await participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.payments', 'payment')
      .leftJoinAndSelect('payment.collector', 'collector')
      .where('participant.id = :id', { id: req.params.participantId })
      .getOne();
    
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, participant.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Calculate total paid
    const totalPaid = participant.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balance = Number(participant.expectedAmount) - totalPaid;
    
    // Format collector information
    const formattedPayments = participant.payments.map(payment => ({
      ...payment,
      collector: {
        id: payment.collector.id,
        name: payment.collector.name
      }
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        participant: {
          ...participant,
          payments: formattedPayments,
          totalPaid,
          balance
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

exports.updateParticipant = async (req, res) => {
  try {
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Get participant
    const participant = await participantRepository.findOne({
      where: { id: req.params.participantId }
    });
    
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, participant.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Update participant
    participantRepository.merge(participant, {
      name: req.body.name || participant.name,
      phone: req.body.phone !== undefined ? req.body.phone : participant.phone,
      email: req.body.email !== undefined ? req.body.email : participant.email,
      expectedAmount: req.body.expectedAmount || participant.expectedAmount,
      updatedBy: req.user.id
    });
    
    const updatedParticipant = await participantRepository.save(participant);
    
    res.status(200).json({
      status: 'success',
      data: {
        participant: updatedParticipant
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteParticipant = async (req, res) => {
  try {
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Get participant
    const participant = await participantRepository.findOne({
      where: { id: req.params.participantId }
    });
    
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, participant.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    await participantRepository.remove(participant);

    // Send a 200 response with a message instead of an empty 204 response
    res.status(200).json({
      status: 'success',
      message: 'Participant deleted'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
