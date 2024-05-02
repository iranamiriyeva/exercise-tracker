const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date 
})

const userSchema = new mongoose.Schema({
  username: String
})

const Exercise = mongoose.model('Exercise', exerciseSchema)
const User = mongoose.model('User', userSchema)

// Create new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body
  try {
    const newUser = new User({ username })
    await newUser.save()
    res.json({ username: newUser.username, _id: newUser._id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params
  const { description, duration, date } = req.body
  
  try {
    const user = await User.findById(_id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    const newExercise = new Exercise({
      username: user.username,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date() 
    })
    await newExercise.save()
    
    res.json({
      username: newExercise.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(), 
      _id: user._id
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params
  const { from, to, limit } = req.query
  
  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    let query = Exercise.find({ username: user.username })
    if (from) query = query.where('date').gte(new Date(from))
    if (to) query = query.where('date').lte(new Date(to))
    if (limit) query = query.limit(parseInt(limit))
    
    const exercises = await query.exec()
    
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() 
    }))
    
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})