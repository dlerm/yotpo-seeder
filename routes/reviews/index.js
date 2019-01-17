const reviews = require('express').Router()
const get = require('./get')
const all = require('./all')
const post = require('./post')

reviews.get('/all', all)
reviews.get('/:id?', get)
reviews.post('/:id?', post)

reviews.get('/', (req, res) => {
  res.status(200).json({ message: 'Reviews Connected!' });
});

module.exports = reviews

