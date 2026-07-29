import { MemberService } from '../services/MemberService.js';

const send = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

export const createMember = send(async (req) => {
  const { fullName, mobile, membershipPlan } = req.body;
  if (!fullName || !mobile || !membershipPlan) throw new Error('fullName, mobile and membershipPlan are required');
  return MemberService.createMember(req.body, req.user._id);
});

export const getAllMembers = send(async (req) => MemberService.getAllMembers(req.query));

export const getMemberById = send(async (req) => MemberService.getMemberById(req.params.id));

export const updateMember = send(async (req) => MemberService.updateMember(req.params.id, req.body));

export const deleteMember = send(async (req) => { await MemberService.deleteMember(req.params.id); return 'deleted'; });

export const renewMembership = send(async (req) => {
  return MemberService.renewMembership(req.params.id, { ...req.body, adminId: req.user._id });
});

export const memberStats = send(async () => MemberService.memberStats());

export const getMemberAttendance = send(async (req) => MemberService.getMemberAttendance(req.params.id));

export const getMemberPayments = send(async (req) => MemberService.getMemberPayments(req.params.id));

export const getMembershipHistory = send(async (req) => MemberService.getMembershipHistory(req.params.id));
