# Team 6 — Theme Park Management System

## Links
- **Hosted App:** https://themeparkmanagement-production.up.railway.app/
- **GitHub:** https://github.com/isabelbuentello/themeparkmanagement

---

## Team Members
| GitHub Username | Name |
|----------------|------|
| isabelbuentello | Isabel Buentello |
| akshitajulius | Akshita Julius |
| AlexC2811 | Alexander Cantarero |
| lcsmnts | Lucas Montes |

---

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| General Manager | mjohnson | password123 |
| Maintenance | jrodriguez | password123 |
| Restaurant Manager | echen | password123 |
| Shop Manager | dbrown | password123 |
| Ticket Seller | awilson | password123 |
| Show Manager | jmartinez | password123 |
| Customer | isabelb | password |

Customers can also register their own account through the signup page.

---

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js / Express
- **Database:** MySQL (hosted on Railway)
- **Deployment:** Railway

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/isabelbuentello/themeparkmanagement.git
cd themeparkmanagement
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the root directory:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=themeparkmanagement
JWT_SECRET=yoursecretkey

5. Set up the database:
```bash
mysql -u root -p themeparkmanagement < schema.sql
```

6. Start the backend:
```bash
cd backend
node index.js
```

7. Start the frontend:
```bash
cd frontend
npm run dev
```

8. Visit `http://localhost:5173` in your browser.
