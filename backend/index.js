import express from 'express'
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
import departmentsRoutes from './routes/departments.js';
import venueRoutes from './routes/venues.js';

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Theme Park API is running')
})

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
app.use('/api/departments', departmentsRoutes);
app.use('/api/venues', venueRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
