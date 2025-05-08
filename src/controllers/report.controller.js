const AppDataSource = require('../config/database');
const Project = require('../models/Project');
const Trip = require('../models/Trip');
const Payment = require('../models/Payment');
const Participant = require('../models/Participant');
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

exports.getProjectSummary = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Check user membership in the project
    const membership = await checkProjectMembership(req.user.id, projectId);
    
    if (!membership) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this project'
      });
    }
    
    // Get project details
    const projectRepository = AppDataSource.getRepository(Project);
    const tripRepository = AppDataSource.getRepository(Trip);
    const participantRepository = AppDataSource.getRepository(Participant);
    const paymentRepository = AppDataSource.getRepository(Payment);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    const project = await projectRepository.findOne({
      where: { id: projectId }
    });
    
    // Get trips in the project
    const trips = await tripRepository.find({
      where: { projectId }
    });
    
    // Get members
    const members = await projectMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.projectId = :projectId', { projectId })
      .select(['member.id', 'member.role', 'user.id', 'user.name', 'user.email'])
      .getMany();
    
    // Get total stats
    const tripIds = trips.map(trip => trip.id);
    
    // Only proceed if there are trips
    let tripStats = [];
    let totalExpected = 0;
    let totalCollected = 0;
    let collectorSummary = [];
    
    if (tripIds.length > 0) {
      // Get all payments grouped by collector
      const collectorPayments = await paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.collector', 'collector')
        .where('payment.tripId IN (:...tripIds)', { tripIds })
        .select('SUM(payment.amount)', 'total')
        .addSelect('collector.id', 'collectorId')
        .addSelect('collector.name', 'collectorName')
        .groupBy('collector.id')
        .addGroupBy('collector.name')
        .getRawMany();
      
      collectorSummary = collectorPayments.map(item => ({
        collectorId: item.collectorId,
        collectorName: item.collectorName,
        total: Number(item.total)
      }));
      
      // Calculate stats for each trip
      for (const trip of trips) {
        const participants = await participantRepository.find({
          where: { tripId: trip.id }
        });
        
        const participantIds = participants.map(p => p.id);
        
        let tripExpected = 0;
        let tripCollected = 0;
        
        if (participantIds.length > 0) {
          // Sum expected amounts
          tripExpected = participants.reduce((sum, p) => sum + Number(p.expectedAmount), 0);
          
          // Sum collected amounts
          const payments = await paymentRepository
            .createQueryBuilder('payment')
            .where('payment.participantId IN (:...participantIds)', { participantIds })
            .select('SUM(payment.amount)', 'total')
            .getRawOne();
          
          tripCollected = payments ? Number(payments.total) : 0;
        }
        
        tripStats.push({
          id: trip.id,
          name: trip.name,
          expected: tripExpected,
          collected: tripCollected,
          remainingAmount: tripExpected - tripCollected,
          percentComplete: tripExpected > 0 ? (tripCollected / tripExpected) * 100 : 0
        });
        
        totalExpected += tripExpected;
        totalCollected += tripCollected;
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        project,
        members,
        tripCount: trips.length,
        trips: tripStats,
        totalExpected,
        totalCollected,
        totalRemainingAmount: totalExpected - totalCollected,
        percentComplete: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
        collectorSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTripReport = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    
    const tripRepository = AppDataSource.getRepository(Trip);
    const trip = await tripRepository.findOne({
      where: { id: tripId }
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
    
    const participantRepository = AppDataSource.getRepository(Participant);
    const paymentRepository = AppDataSource.getRepository(Payment);

    // Get participants with their payments and createdByUser/updatedByUser
    const participants = await participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.createdByUser', 'createdByUser')
      .leftJoinAndSelect('participant.updatedByUser', 'updatedByUser')
      .where('participant.tripId = :tripId', { tripId })
      .getMany();
      
    // Get all participant IDs for this trip
    const participantIds = participants.map(p => p.id);

    // Get collector summary
    const collectorSummary = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.collector', 'collector')
      .where('payment.tripId = :tripId', { tripId })
      .select('SUM(payment.amount)', 'total')
      .addSelect('collector.id', 'collectorId')
      .addSelect('collector.name', 'collectorName')
      .groupBy('collector.id')
      .addGroupBy('collector.name')
      .getRawMany();
    
    // OPTIMIZATION: Fetch all payments for all participants in a single query
    let allPayments = [];
    if (participantIds.length > 0) {
      allPayments = await paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.collector', 'collector')
        .where('payment.participantId IN (:...participantIds)', { participantIds })
        .getMany();
    }
    
    // Organize payments by participant ID for efficient lookup
    const paymentsByParticipant = {};
    allPayments.forEach(payment => {
      if (!paymentsByParticipant[payment.participantId]) {
        paymentsByParticipant[payment.participantId] = [];
      }
      paymentsByParticipant[payment.participantId].push(payment);
    });
    
    // Calculate participant payment details
    const participantDetails = [];
    let totalExpected = 0;
    let totalCollected = 0;
    
    for (const participant of participants) {
      const payments = paymentsByParticipant[participant.id] || [];
      
      const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const expectedAmount = Number(participant.expectedAmount);
      
      participantDetails.push({
        id: participant.id,
        name: participant.name,
        expectedAmount,
        paidAmount,
        remainingAmount: expectedAmount - paidAmount,
        percentComplete: expectedAmount > 0 ? (paidAmount / expectedAmount) * 100 : 0,
        payments,
        createdByUser: participant.createdByUser ? { id: participant.createdByUser.id, name: participant.createdByUser.name } : null,
        updatedByUser: participant.updatedByUser ? { id: participant.updatedByUser.id, name: participant.updatedByUser.name } : null
      });
      
      totalExpected += expectedAmount;
      totalCollected += paidAmount;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        trip,
        participants: participantDetails,
        totalExpected,
        totalCollected,
        totalRemainingAmount: totalExpected - totalCollected,
        percentComplete: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
        collectorSummary: collectorSummary.map(item => ({
          collectorId: item.collectorId,
          collectorName: item.collectorName,
          total: Number(item.total)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
