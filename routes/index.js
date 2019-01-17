const router = require('express').Router()
const reviews = require('./reviews')
const questions = require('./questions')

router.use('/reviews', reviews)
router.use('/questions', questions)

router.get('/', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.sendFile('index.html', { root: '.' })
});

module.exports = router;