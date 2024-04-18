const express = require('express');
const jwt = require("jsonwebtoken");
const app = express()
app.use(express.json())
const tokenAuthenticator = {}

tokenAuthenticator.notFoundHandler=(req, res, next) =>{
    next(createError(404, "Your requested content was not found!"));
}

module.exports=tokenAuthenticator;