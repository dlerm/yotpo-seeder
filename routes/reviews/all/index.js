const reviews = require('express').Router()
const get = require('./get')

reviews.get('/all', get)

module.exports = reviews

