import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FiShield, 
  FiArrowUpRight, 
  FiArrowDownLeft, 
  FiClock, 
  FiSmartphone, 
  FiCopy, 
  FiCheck, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiDollarSign,
  FiX,
  FiBriefcase,
  FiLock,
  FiPlusCircle,
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Wallet() {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Freelancer Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState(user?.upiId || user?.gpayNumber || '');
  const [withdrawing, setWithdrawing] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(null);

  // Client Deposit Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10');
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.wallet.getSummary();
      setWalletData(res.data);
      if (res.data?.upiId || res.data?.gpayNumber) {
        setWithdrawUpi(res.data.upiId || res.data.gpayNumber);
      }
    } catch (err) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid withdrawal amount');
    if (amount > (walletData?.balance || 0)) return toast.error('Insufficient available balance');

    setWithdrawing(true);
    try {
      const res = await api.wallet.withdraw({
        amount,
        upiId: withdrawUpi,
        gpayNumber: withdrawUpi
      });
      toast.success(res.data?.message || 'Withdrawal initiated successfully!');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid deposit amount');

    setDepositing(true);
    try {
      const res = await api.wallet.deposit({
        amount,
        paymentMethod: 'gpay_qr',
        transactionRef: `GPAY-${Date.now().toString().slice(-8)}`
      });
      toast.success(res.data?.message || `₹${amount} added to Account Credit successfully!`);
      setIsDepositModalOpen(false);
      setDepositAmount('10');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const [releasingTxId, setReleasingTxId] = useState(null);
  const [deletingTxId, setDeletingTxId] = useState(null);

  const handleReleasePayment = async (paymentId, amount) => {
    setReleasingTxId(paymentId);
    try {
      await api.payments.releasePayment(paymentId);
      toast.success(`🎉 Released ₹${Number(amount).toLocaleString()} to freelancer successfully!`);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setReleasingTxId(null);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    setDeletingTxId(txId);
    try {
      await api.wallet.deleteTransaction(txId);
      toast.success('Transaction record deleted successfully');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeletingTxId(null);
    }
  };

  const handleClearAllTransactions = async () => {
    if (!window.confirm('Are you sure you want to clear all transaction history in your ledger?')) return;
    try {
      await api.wallet.clearAllTransactions();
      toast.success('All transactions cleared successfully');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear transactions');
    }
  };

  const handleResetBalance = async () => {
    if (!window.confirm('Do you want to reset your account credit/balance to ₹0?')) return;
    try {
      await api.wallet.resetBalance();
      toast.success('Account balance reset to ₹0 successfully');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset balance');
    }
  };

  const handleReduceBalance = async (amtToReduce) => {
    try {
      await api.wallet.adjustBalance({ amount: amtToReduce, action: 'reduce' });
      toast.success(`Reduced account credit by ₹${amtToReduce}`);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reduce balance');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(id);
    toast.success('UTR Reference copied!');
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const isClient = user?.role === 'client';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <FiSmartphone /> Direct Google Pay & UPI Settlement
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2">
              {isClient ? 'Client Direct Billing & Receipts' : 'Freelancer Direct Earnings & Invoices'}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {isClient
                ? 'Review verified direct Google Pay / UPI milestone receipts sent straight to freelancers.'
                : 'Review direct UPI payments received into your bank account from clients.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/projects"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiBriefcase /> Go to Projects →
            </Link>
          </div>
        </div>

        {/* 💡 Visual Direct Payment Journey Flowchart */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-7 rounded-3xl shadow-xl border border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-gray-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <FiSmartphone /> Direct UPI Flow
              </span>
              <h3 className="font-black text-sm md:text-base text-white">
                How Direct Payments Work: Client GPay ➔ Freelancer Bank Account
              </h3>
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold">
              ⚡ ₹0 Platform Fees • 100% Direct Transfer
            </span>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Step 1 */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <h4 className="text-xs font-bold text-yellow-300">Project Started</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Client (<strong>Kesh</strong>) hires freelancer (<strong>Rishi</strong>) and specifies project budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <h4 className="text-xs font-bold text-purple-300">Work Submitted 🚀</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Freelancer builds and submits GitHub code and live demo with automated AI inspection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                <h4 className="text-xs font-bold text-blue-300">Client Scans GPay QR 📱</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Client scans Rishi's Google Pay QR on their phone or clicks deep link.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                  4
                </span>
                <h4 className="text-xs font-bold text-emerald-300">Direct in Bank 🎉</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Money transfers directly into Rishi's bank account with zero middleman holding!
              </p>
            </div>
          </div>
        </div>

        {/* 2 Clear Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Total Settled via GPay */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isClient ? 'Total Paid Directly to Talent' : 'Total Direct Earnings (INR)'}
            </span>
            <div className="text-3xl md:text-4xl font-black text-emerald-400 mt-2">
              ₹{((isClient ? walletData?.totalPaid : walletData?.totalEarned) || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-2 flex items-center gap-1">
              ✓ Direct UPI / Google Pay transfers
            </p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          </div>

          {/* Card 2: Settlement Guarantee */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Commission Fee
            </span>
            <div className="text-3xl md:text-4xl font-black text-white mt-2">
              ₹0 (100% Free)
            </div>
            <p className="text-[11px] text-indigo-400 font-semibold mt-2 flex items-center gap-1">
              <FiSmartphone /> No intermediary fees or cuts taken
            </p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
          </div>

        </div>

        {/* Transactions Ledger */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                Direct Google Pay & UPI Transactions Ledger
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified history of direct payments, recipient UPI VPAs, and UTR transaction references.
              </p>
            </div>

            {walletData?.transactions && walletData.transactions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTransactions}
                className="self-start sm:self-auto text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FiTrash2 className="text-sm" /> Clear All Records
              </button>
            )}
          </div>

          {(!walletData?.transactions || walletData.transactions.length === 0) ? (
            <div className="text-center py-12 text-slate-400">
              <FiClock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-sm text-slate-300">No transactions recorded yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isClient
                  ? 'Pay for a project milestone in the Projects section to see real-time direct Google Pay receipts.'
                  : 'Receive direct Google Pay payments from clients upon delivering project milestones.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {walletData.transactions.map((tx) => {
                const isReleased = tx.status === 'released' || tx.status === 'funded';
                return (
                  <div key={tx._id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/50 -mx-4 px-4 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-emerald-500/20 text-emerald-400">
                        <FiSmartphone />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs md:text-sm">
                          {tx.milestone?.title || 'Direct Project Milestone Payment'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Project: <strong className="text-slate-200">{tx.project?.title || 'Active Project'}</strong> • {isClient ? `Paid to: ${tx.payee?.name || 'Freelancer'}` : `Received from: ${tx.payer?.name || 'Client'}`}
                        </p>
                        {tx.upiId && (
                          <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            UPI VPA: {tx.upiId} {tx.transactionRef && `• UTR: ${tx.transactionRef}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Direct GPay Paid
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-base font-black text-emerald-400">
                          ₹{Number(tx.amount).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">
                          Google Pay
                        </p>
                      </div>

                      {/* Delete Transaction Record Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx._id)}
                        disabled={deletingTxId === tx._id}
                        title="Delete transaction record"
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/30"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
