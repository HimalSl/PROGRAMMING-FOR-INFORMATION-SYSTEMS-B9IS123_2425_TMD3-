module.exports = {
    // The 'secret' property holds the secret key used for signing and verifying JSON Web Tokens (JWTs).
    secret: process.env.JWT_SECRET,

    // Set the expiration time for the JWTs.
    expiresIn: '24h'
};