const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const now = new Date();

// Anchors a "day of month" to the current calendar month, clamped so it
// never lands in the future (important when the seed runs early in the
// month, e.g. day 20 would otherwise become the 20th of *next* month).
const dateInCurrentMonth = (day) =>
  new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()));

// Anchors a "day of month" to the previous calendar month.
const dateInPreviousMonth = (day) => new Date(now.getFullYear(), now.getMonth() - 1, day);

async function main() {
  console.log('Cleaning existing data...');
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.menuItemIngredient.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.employeePayment.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  const [adminPass, managerPass, cashierPass, employeePass] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('manager123', 10),
    bcrypt.hash('cashier123', 10),
    bcrypt.hash('employee123', 10),
  ]);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@restaurant.com',
      password: adminPass,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@restaurant.com',
      password: managerPass,
      role: 'MANAGER',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      username: 'cashier',
      email: 'cashier@restaurant.com',
      password: cashierPass,
      role: 'CASHIER',
    },
  });

  await prisma.user.create({
    data: {
      username: 'employee',
      email: 'employee@restaurant.com',
      password: employeePass,
      role: 'EMPLOYEE',
    },
  });

  console.log('Creating suppliers...');
  const [alBaraka, freshFarm, oceanFresh, globalBeverages] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Al Baraka Meat Co.',
        phone: '+212 600-111222',
        email: 'sales@albaraka-meat.com',
        address: '12 Industrial Zone, Casablanca',
        notes: 'Main supplier for beef and chicken',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Fresh Farm Produce',
        phone: '+212 600-333444',
        email: 'orders@freshfarm.com',
        address: '45 Market Street, Casablanca',
        notes: 'Vegetables and bakery products',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Ocean Fresh Seafood',
        phone: '+212 600-555666',
        email: 'contact@oceanfresh.com',
        address: '3 Port Avenue, Casablanca',
        notes: 'Fresh seafood, delivered daily',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Global Beverages Ltd',
        phone: '+212 600-777888',
        email: 'info@globalbeverages.com',
        address: '78 Commerce Blvd, Casablanca',
        notes: 'Sodas, syrups and bottled drinks',
      },
    }),
  ]);

  console.log('Creating stock items...');
  const stockData = [
    { name: 'Beef Meat', category: 'Meat', quantity: 42, unit: 'kg', buyingPrice: 80, minimumQuantity: 10, supplierId: alBaraka.id },
    { name: 'Chicken Breast', category: 'Meat', quantity: 28, unit: 'kg', buyingPrice: 45, minimumQuantity: 10, supplierId: alBaraka.id },
    { name: 'Burger Bread', category: 'Bakery', quantity: 140, unit: 'piece', buyingPrice: 1.5, minimumQuantity: 30, supplierId: freshFarm.id },
    { name: 'Cheese Slices', category: 'Dairy', quantity: 190, unit: 'piece', buyingPrice: 1, minimumQuantity: 50, supplierId: freshFarm.id },
    { name: 'Mozzarella Cheese', category: 'Dairy', quantity: 4, unit: 'kg', buyingPrice: 55, minimumQuantity: 5, supplierId: freshFarm.id },
    { name: 'Tomato', category: 'Vegetable', quantity: 22, unit: 'kg', buyingPrice: 6, minimumQuantity: 8, supplierId: freshFarm.id },
    { name: 'Lettuce', category: 'Vegetable', quantity: 13, unit: 'kg', buyingPrice: 8, minimumQuantity: 5, supplierId: freshFarm.id },
    { name: 'Onion', category: 'Vegetable', quantity: 18, unit: 'kg', buyingPrice: 4, minimumQuantity: 5, supplierId: freshFarm.id },
    { name: 'Burger Sauce', category: 'Condiment', quantity: 4800, unit: 'ml', buyingPrice: 0.05, minimumQuantity: 1000, supplierId: freshFarm.id },
    { name: 'French Fries (Frozen)', category: 'Frozen', quantity: 7, unit: 'kg', buyingPrice: 12, minimumQuantity: 10, supplierId: freshFarm.id },
    { name: 'Shrimp', category: 'Seafood', quantity: 3, unit: 'kg', buyingPrice: 70, minimumQuantity: 5, supplierId: oceanFresh.id },
    { name: 'Cola Syrup', category: 'Beverage', quantity: 38, unit: 'liter', buyingPrice: 3, minimumQuantity: 10, supplierId: globalBeverages.id },
  ];

  const stockItems = {};
  for (const item of stockData) {
    const created = await prisma.stockItem.create({
      data: { ...item, expirationDate: daysAgo(-60) },
    });
    stockItems[item.name] = created;
  }

  console.log('Creating menu items and ingredients...');
  const menuData = [
    {
      name: 'Classic Burger',
      category: 'Burgers',
      sellingPrice: 45,
      costPrice: 22,
      description: 'Beef patty, cheese and house sauce in a toasted bun.',
      ingredients: [
        { stockItem: 'Burger Bread', quantityUsed: 1, unit: 'piece' },
        { stockItem: 'Beef Meat', quantityUsed: 0.15, unit: 'kg' },
        { stockItem: 'Cheese Slices', quantityUsed: 1, unit: 'piece' },
        { stockItem: 'Burger Sauce', quantityUsed: 20, unit: 'ml' },
      ],
    },
    {
      name: 'Cheeseburger Deluxe',
      category: 'Burgers',
      sellingPrice: 55,
      costPrice: 28,
      description: 'Double cheese, grilled onions and extra sauce.',
      ingredients: [
        { stockItem: 'Burger Bread', quantityUsed: 1, unit: 'piece' },
        { stockItem: 'Beef Meat', quantityUsed: 0.2, unit: 'kg' },
        { stockItem: 'Cheese Slices', quantityUsed: 2, unit: 'piece' },
        { stockItem: 'Onion', quantityUsed: 0.02, unit: 'kg' },
        { stockItem: 'Burger Sauce', quantityUsed: 25, unit: 'ml' },
      ],
    },
    {
      name: 'Grilled Chicken Sandwich',
      category: 'Sandwiches',
      sellingPrice: 40,
      costPrice: 18,
      description: 'Grilled chicken breast with lettuce and sauce.',
      ingredients: [
        { stockItem: 'Burger Bread', quantityUsed: 1, unit: 'piece' },
        { stockItem: 'Chicken Breast', quantityUsed: 0.15, unit: 'kg' },
        { stockItem: 'Lettuce', quantityUsed: 0.03, unit: 'kg' },
        { stockItem: 'Burger Sauce', quantityUsed: 15, unit: 'ml' },
      ],
    },
    {
      name: 'Caesar Salad',
      category: 'Salads',
      sellingPrice: 35,
      costPrice: 15,
      description: 'Crisp lettuce, grilled chicken and cheese.',
      ingredients: [
        { stockItem: 'Lettuce', quantityUsed: 0.15, unit: 'kg' },
        { stockItem: 'Chicken Breast', quantityUsed: 0.1, unit: 'kg' },
        { stockItem: 'Cheese Slices', quantityUsed: 1, unit: 'piece' },
      ],
    },
    {
      name: 'French Fries',
      category: 'Sides',
      sellingPrice: 20,
      costPrice: 6,
      description: 'Crispy golden fries.',
      ingredients: [{ stockItem: 'French Fries (Frozen)', quantityUsed: 0.2, unit: 'kg' }],
    },
    {
      name: 'Shrimp Basket',
      category: 'Seafood',
      sellingPrice: 60,
      costPrice: 30,
      description: 'Pan-seared shrimp served with fries.',
      ingredients: [
        { stockItem: 'Shrimp', quantityUsed: 0.2, unit: 'kg' },
        { stockItem: 'French Fries (Frozen)', quantityUsed: 0.1, unit: 'kg' },
      ],
    },
    {
      name: 'Margherita Pizza',
      category: 'Pizza',
      sellingPrice: 50,
      costPrice: 20,
      description: 'Mozzarella and tomato on a crispy base.',
      ingredients: [
        { stockItem: 'Mozzarella Cheese', quantityUsed: 0.15, unit: 'kg' },
        { stockItem: 'Tomato', quantityUsed: 0.1, unit: 'kg' },
      ],
    },
    {
      name: 'Soda',
      category: 'Beverages',
      sellingPrice: 12,
      costPrice: 3,
      description: 'Chilled soft drink.',
      ingredients: [{ stockItem: 'Cola Syrup', quantityUsed: 0.3, unit: 'liter' }],
    },
  ];

  const menuItems = {};
  for (const item of menuData) {
    const created = await prisma.menuItem.create({
      data: {
        name: item.name,
        category: item.category,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        description: item.description,
        isAvailable: true,
        ingredients: {
          create: item.ingredients.map((ing) => ({
            stockItemId: stockItems[ing.stockItem].id,
            quantityUsed: ing.quantityUsed,
            unit: ing.unit,
          })),
        },
      },
    });
    menuItems[item.name] = created;
  }

  console.log('Creating purchases...');
  const purchaseData = [
    {
      supplierId: alBaraka.id,
      paymentStatus: 'PAID',
      purchaseDate: dateInPreviousMonth(20),
      items: [
        { stockItem: 'Beef Meat', quantity: 20, unitPrice: 80 },
        { stockItem: 'Chicken Breast', quantity: 15, unitPrice: 45 },
      ],
    },
    {
      supplierId: freshFarm.id,
      paymentStatus: 'PAID',
      purchaseDate: dateInPreviousMonth(10),
      items: [
        { stockItem: 'Tomato', quantity: 15, unitPrice: 6 },
        { stockItem: 'Lettuce', quantity: 10, unitPrice: 8 },
        { stockItem: 'Onion', quantity: 10, unitPrice: 4 },
      ],
    },
    {
      supplierId: oceanFresh.id,
      paymentStatus: 'PARTIAL',
      purchaseDate: dateInCurrentMonth(5),
      items: [{ stockItem: 'Shrimp', quantity: 5, unitPrice: 70 }],
    },
    {
      supplierId: globalBeverages.id,
      paymentStatus: 'UNPAID',
      purchaseDate: dateInCurrentMonth(2),
      items: [{ stockItem: 'Cola Syrup', quantity: 20, unitPrice: 3 }],
    },
  ];

  for (const purchase of purchaseData) {
    const items = purchase.items.map((item) => ({
      stockItemId: stockItems[item.stockItem].id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));
    const totalAmount = Number(items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2));

    await prisma.purchase.create({
      data: {
        supplierId: purchase.supplierId,
        paymentStatus: purchase.paymentStatus,
        purchaseDate: purchase.purchaseDate,
        totalAmount,
        items: { create: items },
      },
    });
  }

  console.log('Creating sales...');
  const saleData = [
    {
      userId: cashier.id,
      saleDate: dateInCurrentMonth(now.getDate()),
      paymentMethod: 'CASH',
      discount: 0,
      isPaid: true,
      items: [
        { menuItem: 'Classic Burger', quantity: 2 },
        { menuItem: 'Soda', quantity: 2 },
      ],
    },
    {
      userId: manager.id,
      saleDate: dateInCurrentMonth(Math.max(now.getDate() - 1, 1)),
      paymentMethod: 'CARD',
      discount: 5,
      isPaid: true,
      items: [
        { menuItem: 'Cheeseburger Deluxe', quantity: 1 },
        { menuItem: 'French Fries', quantity: 1 },
        { menuItem: 'Soda', quantity: 1 },
      ],
    },
    {
      userId: cashier.id,
      saleDate: dateInCurrentMonth(now.getDate()),
      paymentMethod: 'MOBILE',
      discount: 0,
      isPaid: false,
      items: [{ menuItem: 'Grilled Chicken Sandwich', quantity: 3 }],
    },
    {
      userId: cashier.id,
      saleDate: dateInCurrentMonth(now.getDate()),
      paymentMethod: 'CASH',
      discount: 5,
      isPaid: false,
      items: [
        { menuItem: 'Caesar Salad', quantity: 2 },
        { menuItem: 'Soda', quantity: 2 },
      ],
    },
    {
      userId: admin.id,
      saleDate: dateInCurrentMonth(Math.max(now.getDate() - 1, 1)),
      paymentMethod: 'ONLINE',
      discount: 0,
      isPaid: true,
      items: [
        { menuItem: 'Shrimp Basket', quantity: 1 },
        { menuItem: 'Margherita Pizza', quantity: 1 },
      ],
    },
    {
      userId: cashier.id,
      saleDate: dateInPreviousMonth(15),
      paymentMethod: 'CASH',
      discount: 0,
      isPaid: true,
      items: [
        { menuItem: 'Classic Burger', quantity: 4 },
        { menuItem: 'French Fries', quantity: 4 },
      ],
    },
  ];

  for (const sale of saleData) {
    const items = sale.items.map((item) => {
      const menuItem = menuItems[item.menuItem];
      const totalPrice = Number((menuItem.sellingPrice * item.quantity).toFixed(2));
      return {
        menuItemId: menuItem.id,
        quantity: item.quantity,
        unitPrice: menuItem.sellingPrice,
        totalPrice,
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalAmount = Number(Math.max(subtotal - sale.discount, 0).toFixed(2));

    await prisma.sale.create({
      data: {
        userId: sale.userId,
        saleDate: sale.saleDate,
        paymentMethod: sale.paymentMethod,
        discount: sale.discount,
        isPaid: sale.isPaid,
        totalAmount,
        items: { create: items },
      },
    });
  }

  console.log('Creating employees...');
  const employeeData = [
    { fullName: 'Ahmed Ben Ali', phone: '+212 661-000001', address: 'Casablanca', position: 'Head Chef', salary: 6500, startDate: daysAgo(400), status: 'ACTIVE' },
    { fullName: 'Sara Amrani', phone: '+212 661-000002', address: 'Casablanca', position: 'Waitress', salary: 3200, startDate: daysAgo(300), status: 'ACTIVE' },
    { fullName: 'Youssef El Idrissi', phone: '+212 661-000003', address: 'Rabat', position: 'Waiter', salary: 3200, startDate: daysAgo(250), status: 'ACTIVE' },
    { fullName: 'Fatima Zahra', phone: '+212 661-000004', address: 'Casablanca', position: 'Cashier', salary: 3500, startDate: daysAgo(180), status: 'ACTIVE' },
    { fullName: 'Karim Tazi', phone: '+212 661-000005', address: 'Mohammedia', position: 'Kitchen Assistant', salary: 2800, startDate: daysAgo(90), status: 'ACTIVE' },
    { fullName: 'Nadia Bensaid', phone: '+212 661-000006', address: 'Casablanca', position: 'Delivery Driver', salary: 2600, startDate: daysAgo(60), status: 'INACTIVE' },
  ];

  const employees = [];
  for (const emp of employeeData) {
    const created = await prisma.employee.create({ data: emp });
    employees.push(created);
  }

  console.log('Creating employee payments...');
  const currentMonth = monthKey(new Date());
  const lastMonth = monthKey(new Date(new Date().setMonth(new Date().getMonth() - 1)));

  for (const emp of employees) {
    await prisma.employeePayment.create({
      data: {
        employeeId: emp.id,
        amount: emp.salary,
        paymentType: 'SALARY',
        paymentDate: dateInPreviousMonth(28),
        month: lastMonth,
        notes: 'Monthly salary payment',
      },
    });
    await prisma.employeePayment.create({
      data: {
        employeeId: emp.id,
        amount: emp.salary,
        paymentType: 'SALARY',
        paymentDate: new Date(),
        month: currentMonth,
        notes: 'Monthly salary payment',
      },
    });
  }

  await prisma.employeePayment.create({
    data: {
      employeeId: employees[0].id,
      amount: 800,
      paymentType: 'BONUS',
      paymentDate: dateInCurrentMonth(now.getDate()),
      month: currentMonth,
      notes: 'Performance bonus - Head Chef',
    },
  });

  await prisma.employeePayment.create({
    data: {
      employeeId: employees[1].id,
      amount: 500,
      paymentType: 'ADVANCE',
      paymentDate: dateInCurrentMonth(now.getDate()),
      month: currentMonth,
      notes: 'Salary advance requested',
    },
  });

  await prisma.employeePayment.create({
    data: {
      employeeId: employees[4].id,
      amount: 150,
      paymentType: 'DEDUCTION',
      paymentDate: dateInCurrentMonth(now.getDate()),
      month: currentMonth,
      notes: 'Late arrivals deduction',
    },
  });

  console.log('Creating expenses...');
  const expenseData = [
    { name: 'Restaurant Rent', category: 'Rent', amount: 8000, paymentMethod: 'CASH', expenseDate: dateInCurrentMonth(3), description: 'Monthly rent payment' },
    { name: 'Electricity Bill', category: 'Utilities', amount: 1200, paymentMethod: 'CARD', expenseDate: dateInCurrentMonth(5), description: 'Monthly electricity bill' },
    { name: 'Water Bill', category: 'Utilities', amount: 300, paymentMethod: 'CASH', expenseDate: dateInCurrentMonth(5), description: 'Monthly water bill' },
    { name: 'Equipment Maintenance', category: 'Maintenance', amount: 650, paymentMethod: 'CARD', expenseDate: dateInCurrentMonth(8), description: 'Kitchen equipment servicing' },
    { name: 'Social Media Ads', category: 'Marketing', amount: 900, paymentMethod: 'ONLINE', expenseDate: dateInCurrentMonth(10), description: 'Marketing campaign' },
    { name: 'Restaurant Rent', category: 'Rent', amount: 8000, paymentMethod: 'CASH', expenseDate: dateInPreviousMonth(3), description: 'Monthly rent payment' },
    { name: 'Cleaning Supplies', category: 'Miscellaneous', amount: 220, paymentMethod: 'CASH', expenseDate: dateInPreviousMonth(20), description: 'Cleaning and sanitation supplies' },
  ];

  for (const expense of expenseData) {
    await prisma.expense.create({
      data: { ...expense, createdBy: manager.id },
    });
  }

  console.log('Seed completed successfully.');
  console.log('----------------------------------------');
  console.log('Default accounts:');
  console.log('  Admin:    admin@restaurant.com / admin123');
  console.log('  Manager:  manager@restaurant.com / manager123');
  console.log('  Cashier:  cashier@restaurant.com / cashier123');
  console.log('  Employee: employee@restaurant.com / employee123');
  console.log('----------------------------------------');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
