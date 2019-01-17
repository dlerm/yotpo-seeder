const questions = require('express').Router()
const get = require('./get')
const post = require('./post')

questions.get('/:id?', get)
questions.post('/:id?', post)

questions.get('/', (req, res) => {
  res.status(200).json({ message: 'Questions Connected!' });
});

module.exports = questions

