import Payment from '../models/Payment.js';
import Membership from '../models/Membership.js';
import Member from '../models/Member.js';
import RenewalRequest from '../models/RenewalRequest.js';
import PDFDocument from 'pdfkit';

export const PaymentService = {
  createPayment: async (data) => {
    const payment = new Payment(data);
    await payment.save();
    if (data.status === 'Paid' && data.membershipId) {
      await Membership.findByIdAndUpdate(data.membershipId, { status: 'Active' });
    }
    return payment.populate([
      { path: 'memberId', select: 'fullName mobile email' },
      { path: 'membershipId', select: 'planType startDate expiryDate' },
    ]);
  },

  getPayments: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.memberId) query.memberId = filters.memberId;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) query.paymentDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.paymentDate.$lte = new Date(filters.endDate);
    }
    return Payment.find(query)
      .populate({ path: 'memberId', select: 'fullName mobile email' })
      .populate('membershipId', 'planType startDate expiryDate')
      .sort({ paymentDate: -1 });
  },

  getPaymentById: async (id) => {
    return Payment.findById(id)
      .populate({ path: 'memberId', select: 'fullName mobile email address' })
      .populate('membershipId', 'planType startDate expiryDate');
  },

  getPendingDues: async () => {
    return Payment.find({ status: 'Pending' })
      .populate({ path: 'memberId', select: 'fullName mobile membershipExpiryDate' })
      .populate('membershipId', 'planType')
      .sort({ paymentDate: -1 });
  },

  markPaid: async (id) => {
    const payment = await Payment.findByIdAndUpdate(id, { status: 'Paid' }, { new: true });
    if (payment?.membershipId) {
      await Membership.findByIdAndUpdate(payment.membershipId, { status: 'Active' });
    }
    return payment;
  },

  markFailed: async (id) => {
    return Payment.findByIdAndUpdate(id, { status: 'Failed' }, { new: true });
  },

  getPaymentStats: async () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [totalRevenue, monthRevenue, yearRevenue, pendingCount, paidCount, recentPayments] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'Paid', paymentDate: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'Paid', paymentDate: { $gte: yearStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.countDocuments({ status: 'Pending' }),
      Payment.countDocuments({ status: 'Paid' }),
      Payment.find({ status: 'Paid' })
        .populate({ path: 'memberId', select: 'fullName mobile' })
        .populate('membershipId', 'planType')
        .sort({ paymentDate: -1 })
        .limit(10),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0,
      yearRevenue: yearRevenue[0]?.total || 0,
      pendingDues: pendingCount,
      totalTransactions: paidCount,
      recentPayments,
    };
  },

  getUserPayments: async (userId) => {
    const member = await Member.findOne({ userId });
    if (!member) return [];
    return Payment.find({ memberId: member._id })
      .populate('membershipId', 'planType startDate expiryDate')
      .sort({ paymentDate: -1 });
  },

  getUserRenewals: async (userId) => {
    const member = await Member.findOne({ userId });
    if (!member) return [];
    return RenewalRequest.find({ memberId: member._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
  },

  generateReceipt: async (paymentId) => {
    const payment = await Payment.findById(paymentId)
      .populate({ path: 'memberId', select: 'fullName mobile email address' })
      .populate('membershipId', 'planType startDate expiryDate');

    if (!payment) throw new Error('Payment not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).font('Helvetica-Bold').text('SAAHITYIK LIBRARY', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Payment Receipt', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').text('Receipt Details');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Receipt No: REC-${payment._id.toString().slice(-8).toUpperCase()}`);
      doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').text('Member Details');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${payment.memberId?.fullName || '—'}`);
      doc.text(`Mobile: ${payment.memberId?.mobile || '—'}`);
      doc.text(`Email: ${payment.memberId?.email || '—'}`);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').text('Payment Details');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Plan: ${payment.membershipId?.planType || '—'}`);
      doc.text(`Period: ${payment.membershipId?.startDate ? new Date(payment.membershipId.startDate).toLocaleDateString('en-IN') : '—'} to ${payment.membershipId?.expiryDate ? new Date(payment.membershipId.expiryDate).toLocaleDateString('en-IN') : '—'}`);
      doc.text(`Payment Method: ${payment.paymentMethod}`);
      if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
      doc.text(`Status: ${payment.status}`);
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').fillColor('#888').text('This is a computer-generated receipt.', { align: 'center' });

      doc.end();
    });
  },

  generateInvoice: async (paymentId) => {
    const payment = await Payment.findById(paymentId)
      .populate({ path: 'memberId', select: 'fullName mobile email address' })
      .populate('membershipId', 'planType startDate expiryDate');

    if (!payment) throw new Error('Payment not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).font('Helvetica-Bold').text('SAAHITYIK LIBRARY', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Tax Invoice', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').text('Invoice');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice No: INV-${payment._id.toString().slice(-8).toUpperCase()}`);
      doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').text('Bill To');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`${payment.memberId?.fullName || '—'}`);
      doc.text(`${payment.memberId?.address || ''}`);
      doc.text(`Mobile: ${payment.memberId?.mobile || '—'}`);
      doc.text(`Email: ${payment.memberId?.email || '—'}`);
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop, { width: 250 });
      doc.text('Plan', 300, tableTop, { width: 100 });
      doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(10);
      doc.text('Library Membership Fee', 50, doc.y, { width: 250 });
      doc.text(payment.membershipId?.planType || '—', 300, doc.y, { width: 100 });
      doc.text(`₹${payment.amount.toLocaleString('en-IN')}`, 450, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Total: ₹${payment.amount.toLocaleString('en-IN')}`, 350, doc.y, { width: 200, align: 'right' });
      doc.moveDown(1);

      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text(`Payment Method: ${payment.paymentMethod}`);
      doc.text(`Status: ${payment.status}`);
      if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
      doc.moveDown(2);
      doc.fillColor('#888').fontSize(8).text('This is a computer-generated invoice.', { align: 'center' });

      doc.end();
    });
  },
};
