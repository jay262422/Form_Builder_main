const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { appConfig } = require('../config/appConfig');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (userId) => jwt.sign(
  { userId, type: 'access' },
  appConfig.jwt.secret,
  { expiresIn: appConfig.jwt.accessExpiresIn }
);

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

const getRefreshTokenExpiry = () => {
  const duration = appConfig.jwt.refreshExpiresIn;
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return new Date(Date.now() + amount * multipliers[unit]);
};

const verifyAccessToken = (token) => jwt.verify(token, appConfig.jwt.secret);

const issueTokenPair = async (user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((entry) => entry.expiresAt > new Date()),
    {
      tokenHash: refreshTokenHash,
      expiresAt,
      createdAt: new Date()
    }
  ].slice(-5);

  await user.save();

  return {
    accessToken,
    refreshToken,
    expiresIn: appConfig.jwt.accessExpiresIn
  };
};

const rotateRefreshToken = async (user, refreshToken) => {
  const refreshTokenHash = hashToken(refreshToken);
  const tokenEntry = (user.refreshTokens || []).find(
    (entry) => entry.tokenHash === refreshTokenHash && entry.expiresAt > new Date()
  );

  if (!tokenEntry) {
    return null;
  }

  user.refreshTokens = (user.refreshTokens || []).filter(
    (entry) => entry.tokenHash !== refreshTokenHash
  );

  return issueTokenPair(user);
};

const revokeRefreshToken = async (user, refreshToken) => {
  if (!refreshToken) {
    user.refreshTokens = [];
    await user.save();
    return;
  }

  const refreshTokenHash = hashToken(refreshToken);
  user.refreshTokens = (user.refreshTokens || []).filter(
    (entry) => entry.tokenHash !== refreshTokenHash
  );
  await user.save();
};

module.exports = {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  verifyAccessToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken
};
