const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const monthLabel = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const dayLabel = (date) => new Date(date).toISOString().slice(0, 10);

// Builds an array of { start, end, label } for the last `count` months, oldest first.
const lastNMonths = (count) => {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ start, end, label: monthLabel(start) });
  }
  return months;
};

// Builds an array of { start, end, label } for the last `count` days, oldest first.
const lastNDays = (count) => {
  const days = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    days.push({ start: startOfDay(day), end: endOfDay(day), label: dayLabel(day) });
  }
  return days;
};

// Safely parses a query-string integer, falling back to a default and
// clamping to `max` so malformed input (e.g. "abc", "-5") can't produce
// NaN-driven crashes or unbounded queries.
const parsePositiveInt = (value, fallback, max) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(Math.floor(num), max);
};

// @desc    Aggregated dashboard analytics
// @route   GET /api/reports/dashboard
// @access  Private/Admin,Manager
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    todaySalesAgg,
    monthlySalesAgg,
    monthlyExpensesAgg,
    employeeCount,
    stockItems,
    recentSales,
    topSellingRaw,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: todayStart, lte: todayEnd } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: monthStart, lt: nextMonthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { expenseDate: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.stockItem.findMany(),
    prisma.sale.findMany({
      take: 8,
      orderBy: { saleDate: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        items: { include: { menuItem: { select: { id: true, name: true } } } },
      },
    }),
    prisma.saleItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const lowStockItems = stockItems.filter((item) => item.quantity <= item.minimumQuantity);

  const menuItemIds = topSellingRaw.map((row) => row.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const topSellingItems = topSellingRaw.map((row) => {
    const menuItem = menuItems.find((m) => m.id === row.menuItemId);
    return {
      menuItemId: row.menuItemId,
      name: menuItem ? menuItem.name : 'Unknown',
      category: menuItem ? menuItem.category : null,
      quantitySold: row._sum.quantity || 0,
      revenue: row._sum.totalPrice || 0,
    };
  });

  const months = lastNMonths(6);
  const incomeVsExpenses = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const [income, expenses] = await Promise.all([
        prisma.sale.aggregate({
          where: { saleDate: { gte: start, lt: end } },
          _sum: { totalAmount: true },
        }),
        prisma.expense.aggregate({
          where: { expenseDate: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
      ]);
      return {
        month: label,
        income: income._sum.totalAmount || 0,
        expenses: expenses._sum.amount || 0,
      };
    })
  );

  const monthlyIncome = monthlySalesAgg._sum.totalAmount || 0;
  const monthlyExpenses = monthlyExpensesAgg._sum.amount || 0;

  const data = {
    todaySales: todaySalesAgg._sum.totalAmount || 0,
    todaySalesCount: todaySalesAgg._count._all || 0,
    todayIncome: todaySalesAgg._sum.totalAmount || 0,
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit: Number((monthlyIncome - monthlyExpenses).toFixed(2)),
    lowStockCount: lowStockItems.length,
    employeeCount,
    recentSales,
    topSellingItems,
    incomeVsExpenses,
    lowStockItems,
  };

  return success(res, { message: 'Dashboard data fetched successfully', data });
});

// @desc    Daily sales report (last 30 days)
// @route   GET /api/reports/sales/daily
// @access  Private/Admin,Manager
const getDailySalesReport = asyncHandler(async (req, res) => {
  const days = parsePositiveInt(req.query.days, 30, 365);
  const range = lastNDays(days);

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: range[0].start, lte: range[range.length - 1].end } },
    select: { totalAmount: true, saleDate: true },
  });

  const report = range.map(({ start, end, label }) => {
    const daySales = sales.filter((s) => s.saleDate >= start && s.saleDate <= end);
    return {
      date: label,
      totalSales: daySales.length,
      totalAmount: Number(daySales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)),
    };
  });

  return success(res, { message: 'Daily sales report fetched successfully', data: report });
});

// @desc    Monthly sales report (last 12 months)
// @route   GET /api/reports/sales/monthly
// @access  Private/Admin,Manager
const getMonthlySalesReport = asyncHandler(async (req, res) => {
  const monthsCount = parsePositiveInt(req.query.months, 12, 60);
  const months = lastNMonths(monthsCount);

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: months[0].start, lt: months[months.length - 1].end } },
    select: { totalAmount: true, saleDate: true },
  });

  const report = months.map(({ start, end, label }) => {
    const monthSales = sales.filter((s) => s.saleDate >= start && s.saleDate < end);
    return {
      month: label,
      totalSales: monthSales.length,
      totalAmount: Number(monthSales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)),
    };
  });

  return success(res, { message: 'Monthly sales report fetched successfully', data: report });
});

// @desc    Monthly expenses report (last 12 months)
// @route   GET /api/reports/expenses/monthly
// @access  Private/Admin,Manager
const getMonthlyExpensesReport = asyncHandler(async (req, res) => {
  const monthsCount = parsePositiveInt(req.query.months, 12, 60);
  const months = lastNMonths(monthsCount);

  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: months[0].start, lt: months[months.length - 1].end } },
    select: { amount: true, expenseDate: true, category: true },
  });

  const report = months.map(({ start, end, label }) => {
    const monthExpenses = expenses.filter((e) => e.expenseDate >= start && e.expenseDate < end);
    return {
      month: label,
      totalExpenses: monthExpenses.length,
      totalAmount: Number(monthExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
    };
  });

  return success(res, { message: 'Monthly expenses report fetched successfully', data: report });
});

// @desc    Monthly profit report (last 12 months)
// @route   GET /api/reports/profit/monthly
// @access  Private/Admin,Manager
const getMonthlyProfitReport = asyncHandler(async (req, res) => {
  const monthsCount = parsePositiveInt(req.query.months, 12, 60);
  const months = lastNMonths(monthsCount);

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { saleDate: { gte: months[0].start, lt: months[months.length - 1].end } },
      select: { totalAmount: true, saleDate: true },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: months[0].start, lt: months[months.length - 1].end } },
      select: { amount: true, expenseDate: true },
    }),
  ]);

  const report = months.map(({ start, end, label }) => {
    const income = sales
      .filter((s) => s.saleDate >= start && s.saleDate < end)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const expense = expenses
      .filter((e) => e.expenseDate >= start && e.expenseDate < end)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      month: label,
      income: Number(income.toFixed(2)),
      expenses: Number(expense.toFixed(2)),
      profit: Number((income - expense).toFixed(2)),
    };
  });

  return success(res, { message: 'Monthly profit report fetched successfully', data: report });
});

// @desc    Stock report - inventory value and low stock items
// @route   GET /api/reports/stock
// @access  Private/Admin,Manager
const getStockReport = asyncHandler(async (req, res) => {
  const stockItems = await prisma.stockItem.findMany({
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });

  const items = stockItems.map((item) => ({
    ...item,
    stockValue: Number((item.quantity * item.buyingPrice).toFixed(2)),
    isLowStock: item.quantity <= item.minimumQuantity,
  }));

  const totalInventoryValue = Number(
    items.reduce((sum, item) => sum + item.stockValue, 0).toFixed(2)
  );
  const lowStockItems = items.filter((item) => item.isLowStock);

  return success(res, {
    message: 'Stock report fetched successfully',
    data: {
      totalItems: items.length,
      totalInventoryValue,
      lowStockCount: lowStockItems.length,
      items,
      lowStockItems,
    },
  });
});

// @desc    Employee payments report
// @route   GET /api/reports/employees/payments
// @access  Private/Admin,Manager
const getEmployeePaymentsReport = asyncHandler(async (req, res) => {
  const { month } = req.query;

  const where = {};
  if (month) where.month = month;

  const payments = await prisma.employeePayment.findMany({
    where,
    include: { employee: { select: { id: true, fullName: true, position: true } } },
    orderBy: { paymentDate: 'desc' },
  });

  const totalPaid = Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));

  const byType = payments.reduce((acc, p) => {
    acc[p.paymentType] = Number(((acc[p.paymentType] || 0) + p.amount).toFixed(2));
    return acc;
  }, {});

  return success(res, {
    message: 'Employee payments report fetched successfully',
    data: { totalPaid, byType, payments },
  });
});

// @desc    Top selling menu items report
// @route   GET /api/reports/top-selling-items
// @access  Private/Admin,Manager
const getTopSellingItemsReport = asyncHandler(async (req, res) => {
  const limit = parsePositiveInt(req.query.limit, 10, 100);

  const grouped = await prisma.saleItem.groupBy({
    by: ['menuItemId'],
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const menuItemIds = grouped.map((row) => row.menuItemId);
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

  const data = grouped.map((row) => {
    const menuItem = menuItems.find((m) => m.id === row.menuItemId);
    return {
      menuItemId: row.menuItemId,
      name: menuItem ? menuItem.name : 'Unknown',
      category: menuItem ? menuItem.category : null,
      quantitySold: row._sum.quantity || 0,
      revenue: row._sum.totalPrice || 0,
    };
  });

  return success(res, { message: 'Top selling items report fetched successfully', data });
});

module.exports = {
  getDashboard,
  getDailySalesReport,
  getMonthlySalesReport,
  getMonthlyExpensesReport,
  getMonthlyProfitReport,
  getStockReport,
  getEmployeePaymentsReport,
  getTopSellingItemsReport,
};
