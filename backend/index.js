import express from 'express'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js' 
import ridesRoutes from './routes/rides.js'
import maintenanceRoutes from './routes/maintenance.js'
import parkRoutes from './routes/park.js'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Theme Park API is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/rides', ridesRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/park', parkRoutes)

app.listen(3000, () => {
  console.log('Server running on port 3000')
})