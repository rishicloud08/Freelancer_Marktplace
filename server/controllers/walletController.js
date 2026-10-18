import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import { saveUserToPersistentState } from '../services/persistenceService.js';

export const getWalletSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch payments involving this user
    let payments = [];
    let lockedInEscrow = 0;
    let totalPaid = 0;
    let totalEarned = 0;

    if (user.role === 'client') {
      payments = await Payment.find({ payer: user._id })
        .populate('project', 'title status')
        .populate('milestone', 'title amount')
        .populate('payee', 'name email')
        .sort({ createdAt: -1 });

      lockedInEscrow = payments.filter(p => p.status === 'funded').reduce((sum, p) => sum + (p.amount || 0), 0);
      totalPaid = payments.filter(p => p.status === 'released').reduce((sum, p) => sum + (p.amount || 0), 0);
    } else {
      payments = await Payment.find({ payee: user._id })
        .populate('project', 'title status')
        .populate('milestone', 'title amount')
        .populate('payer', 'name email')
        .sort({ createdAt: -1 });

      lockedInEscrow = payments.filter(p => p.status === 'funded').reduce((sum, p) => sum + (p.amount || 0), 0);
      totalEarned = payments.filter(p => p.status === 'released').reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    res.json({
      balance: user.balance || 0,
      lockedInEscrow,
      totalPaid,
      totalEarned,
      gpayNumber: user.gpayNumber || '',
      upiId: user.upiId || '',
      transactions: payments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, upiId, gpayNumber } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    // Deduct from user balance
    user.balance -= withdrawAmount;
    await user.save();
    saveUserToPersistentState(user);

    res.json({
      message: `Withdrawal request of ₹${withdrawAmount.toLocaleString()} to UPI/GPay (${upiId || gpayNumber || user.upiId || 'Linked GPay'}) initiated successfully!`,
      newBalance: user.balance,
      payoutRef: `PAYOUT-${Date.now().toString().slice(-8)}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const depositFunds = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionRef } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    user.balance = (user.balance || 0) + depositAmount;
    await user.save();
    saveUserToPersistentState(user);

    res.json({
      message: `🎉 ₹${depositAmount.toLocaleString()} deposited into Account Credit successfully!`,
      newBalance: user.balance,
      transactionRef: transactionRef || `DEP-${Date.now().toString().slice(-8)}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Transaction record not found' });

    // Allow payer or payee to delete/hide the transaction
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance = 0;
    await user.save();
    saveUserToPersistentState(user);

    res.json({
      message: 'Account balance reset to ₹0 successfully',
      newBalance: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustBalance = async (req, res) => {
  try {
    const { amount, action } = req.body; // action: 'reduce' | 'set'
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (action === 'reduce') {
      user.balance = Math.max(0, (user.balance || 0) - numAmount);
    } else {
      user.balance = numAmount;
    }

    await user.save();
    saveUserToPersistentState(user);

    res.json({
      message: `Account balance updated to ₹${user.balance.toLocaleString()}`,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.user.role === 'client') {
      await Payment.deleteMany({ payer: userId });
    } else {
      await Payment.deleteMany({ payee: userId });
    }
    res.json({ message: 'All transaction history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




