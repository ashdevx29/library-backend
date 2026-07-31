import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateTokens = (userId, role) => {
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { id: userId, role, jti, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId, jti: jti + '_rt', type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export default generateTokens;
// rgyr