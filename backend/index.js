import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import feedbackRoutes from './routes/feedback.js'
import transactionRoutes from './routes/transactions.js' 
import ridesRoutes from './routes/rides.js'
import maintenanceRoutes from './routes/maintenance.js'
import membershipsRoutes from './routes/memberships.js'
import customerRoutes from './routes/customer.js'
import venuesRoutes from './routes/venues.js'
import parkRoutes from './routes/park.js'
import adminRoutes from './routes/admin.js'
import gmStatsRoutes from './routes/gm-stats.js'
import employeesRoutes from './routes/employees.js'
import departmentsRoutes from './routes/departments.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/rides', ridesRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/memberships', membershipsRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/venues', venuesRoutes)
app.use('/api/park', parkRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/gm', gmStatsRoutes)
app.use('/api/employees', employeesRoutes)
app.use('/api/departments', departmentsRoutes)

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')))

// Handle React routing - send all other requests to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})