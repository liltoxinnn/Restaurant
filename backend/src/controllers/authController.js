const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');
const { generateToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    throw new AppError('A user with this email or username already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: role || 'EMPLOYEE',
    },
    select: userSelect,
  });

  const token = generateToken({ id: user.id, role: user.role });

  return success(res, {
    message: 'User registered successfully',
    data: { user, token },
    statusCode: 201,
  });
});

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user.id, role: user.role });

  const { password: _password, ...userWithoutPassword } = user;

  return success(res, {
    message: 'Login successful',
    data: { user: userWithoutPassword, token },
  });
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return success(res, { message: 'Current user fetched', data: user });
});

module.exports = { register, login, me };
