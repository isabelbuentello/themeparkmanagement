Team 6 Project

Logins:

general manager: mjohnson password123
customer: isabelb password or make your own
maintenance: jrodriguez password123
restaurant manager: echen password123
shop manager: dbrown password123

triggers:
trg_maintenance_update_ride_status: When a maintenance log is created, automatically updates the ride's status (broken → broken, in-progress → maintenance, fixed → open)

trg_parkday_rain_insertWhen a new park day is created with rain=true, automatically closes all weather-affected rides
