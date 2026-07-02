const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });

  return success(res, { message: 'Users fetched successfully', data: users });
});

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return success(res, { message: 'User fetched successfully', data: user });
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { password, ...rest } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const data = { ...rest };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });

  return success(res, { message: 'User updated successfully', data: user });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({ where: { id } });

  return success(res, { message: 'User deleted successfully', data: null });
});

module.exports = { getUsers, getUserById, updateUser, deleteUser };
