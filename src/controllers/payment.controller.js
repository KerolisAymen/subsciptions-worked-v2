const AppDataSource = require('../config/database');
const Payment = require('../models/Payment');
const Trip = require('../models/Trip');
const Participant = require('../models/Participant');
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

exports.createPayment = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Check if participant exists
    const participant = await participantRepository.findOne({
      where: { id: req.body.participantId }
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
    
    // Create payment
    const newPayment = paymentRepository.create({
      amount: req.body.amount,
      paymentDate: req.body.paymentDate || new Date(),
      notes: req.body.notes || null,
      participantId: req.body.participantId,
      tripId: participant.tripId,
      collectorId: req.user.id
    });
    
    const savedPayment = await paymentRepository.save(newPayment);
    
    res.status(201).json({
      status: 'success',
      data: {
        payment: savedPayment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTripPayments = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, req.params.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Get payments
    const payments = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.participant', 'participant')
      .leftJoinAndSelect('payment.collector', 'collector')
      .where('payment.tripId = :tripId', { tripId: req.params.tripId })
      .select([
        'payment',
        'participant.id', 'participant.name',
        'collector.id', 'collector.name'
      ])
      .getMany();
    
    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getParticipantPayments = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    const participantRepository = AppDataSource.getRepository(Participant);
    
    // Check if participant exists
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
    
    // Get payments
    const payments = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.collector', 'collector')
      .where('payment.participantId = :participantId', { participantId: req.params.participantId })
      .select([
        'payment',
        'collector.id', 'collector.name'
      ])
      .getMany();
    
    // Calculate total
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Get payment
    const payment = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.participant', 'participant')
      .leftJoinAndSelect('payment.collector', 'collector')
      .where('payment.id = :id', { id: req.params.paymentId })
      .select([
        'payment',
        'participant.id', 'participant.name',
        'collector.id', 'collector.name'
      ])
      .getOne();
    
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, payment.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Get payment
    const payment = await paymentRepository.findOne({
      where: { id: req.params.paymentId }
    });
    
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, payment.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Check if current user is the collector or admin/owner
    if (payment.collectorId !== req.user.id && access.role !== 'owner' && access.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own payments unless you are an admin or owner'
      });
    }
    
    // Update payment
    paymentRepository.merge(payment, {
      amount: req.body.amount || payment.amount,
      paymentDate: req.body.paymentDate || payment.paymentDate,
      notes: req.body.notes !== undefined ? req.body.notes : payment.notes
    });
    
    const updatedPayment = await paymentRepository.save(payment);
    
    res.status(200).json({
      status: 'success',
      data: {
        payment: updatedPayment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Get payment
    const payment = await paymentRepository.findOne({
      where: { id: req.params.paymentId }
    });
    
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    // Check if user has access to the trip
    const access = await checkProjectAccess(req.user.id, payment.tripId);
    
    if (!access.allowed) {
      return res.status(403).json({
        status: 'error',
        message: access.message
      });
    }
    
    // Check if current user is the collector or admin/owner
    if (payment.collectorId !== req.user.id && access.role !== 'owner' && access.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own payments unless you are an admin or owner'
      });
    }
    
    await paymentRepository.remove(payment);
    
    res.status(200).json({
      status: 'success',
      message: 'Payment successfully deleted',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
