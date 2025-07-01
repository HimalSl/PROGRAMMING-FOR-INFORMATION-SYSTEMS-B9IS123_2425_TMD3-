module.exports = {
    // This holds the JWT secret key
    secret: process.env.JWT_SECRET,

    // Set the expiration time for the JWTs.
    expiresIn: '24h'
};