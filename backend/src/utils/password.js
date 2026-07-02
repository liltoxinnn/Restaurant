const bcrypt = require('bcrypt');

// Single source of truth for the bcrypt cost factor so every controller
// that hashes a password stays in sync.
const SALT_ROUNDS = 12;

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { SALT_ROUNDS, hashPassword, comparePassword };
