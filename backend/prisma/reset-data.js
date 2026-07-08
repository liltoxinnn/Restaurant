// Wipes all business data (stock, menu, sales, purchases, employees,
// suppliers, expenses) so you can start entering your own real data,
// while keeping the existing login accounts intact - unlike seed.js, this
// does NOT touch the users table, so nobody gets locked out.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all business data (keeping user accounts)...');

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

  console.log('Done. Stock, menu, sales, purchases, employees, suppliers and expenses are all empty.');
  console.log('Your existing login accounts were left untouched.');
}

main()
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
