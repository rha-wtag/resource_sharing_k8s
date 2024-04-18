const express = require('express');
const jwt = require("jsonwebtoken");
const app = express()
app.use(express.json())

const tokenAuthenticator = {}

tokenAuthenticator.authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization'].replace('Bearer ', '');

    if (!token) {
        return res.status(403).json({ message: "A token is required for authentication" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = tokenAuthenticator;