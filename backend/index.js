import express from 'express'
import authRoutes from './routes/auth.js'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Theme Park API is running')
})

app.use('/api/auth', authRoutes)

app.listen(3000, () => {
  console.log('Server running on port 3000')
})