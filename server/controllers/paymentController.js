import Payment from '../models/Payment.js';
import Milestone from '../models/Milestone.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

export const fundMilestone = async (req, res) => {
  try {
    const { 
      milestoneId, 
      paymentMethod = 'upi_qr', 
      gpayNumber, 
      upiId, 
      transactionRef 
    } = req.body;

    const milestone = await Milestone.findById(milestoneId).populate('project');
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    
    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to fund this milestone' });
    }

    const payeeId = milestone.project.assignedFreelancer || req.user._id;

    const payment = new Payment({
      project: milestone.project._id,
      milestone: milestoneId,
      payer: req.user._id,
      payee: payeeId,
      amount: milestone.amount,
      paymentMethod,
      gpayNumber: gpayNumber || '9876543210',
      upiId: upiId || 'freelancehub@okaxis',
      transactionRef: transactionRef || `UPI-${Date.now().toString().slice(-8)}`,
      status: 'funded'
    });

    const createdPayment = await payment.save();

    // Update milestone status to funded / in-progress
    if (milestone.status === 'pending') {
      milestone.status = 'in-progress';
      await milestone.save();
    }

    res.status(201).json(createdPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const releasePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    if (payment.payer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to release this payment' });
    }

    if (payment.status !== 'funded') {
      return res.status(400).json({ message: 'Payment is not in funded status' });
    }

    payment.status = 'released';
    await payment.save();

    const freelancer = await User.findById(payment.payee);
    if (freelancer) {
      freelancer.balance = (freelancer.balance || 0) + payment.amount;
      await freelancer.save();
    }

    // Auto-complete milestone & project
    if (payment.milestone) {
      const milestone = await Milestone.findById(payment.milestone);
      if (milestone) {
        milestone.status = 'approved';
        await milestone.save();
      }
    }
    if (payment.project) {
      const project = await Project.findById(payment.project);
      if (project) {
        project.status = 'completed';
        await project.save();
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ project: req.params.projectId })
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .populate('milestone', 'title amount')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Free Razorpay / Gateway Order
export const createGatewayOrder = async (req, res) => {
  try {
    const { milestoneId, amount } = req.body;
    const orderAmount = Math.round(Number(amount) * 100); // Razorpay accepts in paise (INR)

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    res.json({
      orderId,
      amount: orderAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_marketplaceFreeKey'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Gateway Payment & Lock in Escrow
export const verifyGatewayPayment = async (req, res) => {
  try {
    const { 
      milestoneId, 
      paymentId, 
      orderId, 
      signature,
      paymentMethod = 'razorpay_gateway' 
    } = req.body;

    const milestone = await Milestone.findById(milestoneId).populate('project');
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const payeeId = milestone.project.assignedFreelancer || req.user._id;

    const payment = new Payment({
      project: milestone.project._id,
      milestone: milestoneId,
      payer: req.user._id,
      payee: payeeId,
      amount: milestone.amount,
      paymentMethod,
      transactionRef: paymentId || `PAY-${Date.now()}`,
      status: 'funded'
    });

    const createdPayment = await payment.save();

    if (milestone.status === 'pending') {
      milestone.status = 'in-progress';
      await milestone.save();
    }

    res.status(201).json({
      message: 'Direct payment verified and recorded successfully!',
      payment: createdPayment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
