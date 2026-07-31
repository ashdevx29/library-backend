import { AnalyticsService } from '../services/AnalyticsService.js';
// hjuihuih
const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const AnalyticsController = {
  summary: handle(() => AnalyticsService.summary()),
  revenueExpense: handle((req) => AnalyticsService.revenueExpense(Number(req.query.months) || 12)),
  attendanceTrend: handle((req) => AnalyticsService.attendanceTrend(Number(req.query.months) || 6)),
  planDistribution: handle(() => AnalyticsService.planDistribution()),
  seatDistribution: handle(() => AnalyticsService.seatDistribution()),
  dailyMatrix: handle((req) => AnalyticsService.dailyAttendanceMatrix(Number(req.query.year), Number(req.query.month))),
  calendarYear: handle((req) => AnalyticsService.calendarYear(Number(req.query.year))),
};
