#  Matthews Coach Hire – Bus Booking System

##  Project Overview

This is a simple full-stack web application built for a company called **Matthews Coach Hire**. It allows different users to interact with the system based on their role:

- **Passengers** can register, log in, search available buses, and book tickets.
- **Bus Owners** can register, log in, add buses, and view bookings.
- **Admins** can manage users, approve buses, and oversee the entire system.

The project uses **Vanilla JavaScript** on the frontend and **Node.js + Express** on the backend, with data stored in **JSON files** for simplicity.

---

##  Technology Stack


| **Layer**       | **Technology Used**            |
|-----------------|-------------------------------|
| Frontend        | HTML, CSS, Vanilla JavaScript |
| Backend         | Node.js, Express.js           |
| Database        | MongoDB (NoSQL)               |
| Communication   | JSON-based REST API           |
| Authentication  | JWT-based, role-based access  |
| Email           | Nodemailer (Gmail SMTP)       |
| Styling         | Google Fonts(Poppins), Font Awesome(Icons)    |
| API Testing     | Thunder Client VS code extension   |

###  Why mongoDB?
    - Uses REST API with frontend-backend separation
    - Uses JSON data exchange
    - Focus is on CRUD operations
    - Data can be stored in JSON, SQLite, NoSQL, etc

###  Why Node.js + Express.js for backend?
    - Node.js with Express.js is a widely used and suitable combination for building RESTful APIs, which aligns perfectly with this architectural  requirement

###  REST API Endpoints
- Follows **RESTful principles** for all resources (Users, Buses, Bookings, Locations)
- All data exchanged in **JSON format**
- Uses clear and consistent HTTP status codes
- API documented with **JSON request/response examples**
- Role-specific access via endpoints (passenger, owner, admin)

---

## Key Features

### Passenger
- **Register/Login/Logout**: Create an account, log in, and log out securely.
- **Search Buses**: Filter buses by end location and date.
- **Book Tickets**: Select a bus and book seats (to certain limit).
- **View Booking History**: See past and active bookings.
- **Cancel Bookings**: Cancel active bookings with confirmation.

### Bus Owner (Driver)
- **Register/Login/Logout**: Create an account as a driver.
- **Manage Buses**: Add, update start time, or remove buses (pending admin approval).
- **View Bookings**: See booking history for their buses.
- **Request Modifications**: Submit requests to update bus time or remove a bus.

### Admin
- **Manage Users**: Approve/reject driver registrations.
- **Manage Buses**: Approve/reject new buses or modification requests.
- **Manage Locations**: Add or delete destinations.
- **View Analytics**: See system-wide stats (users, buses, bookings).

---
### CRUD Operations
| **Entity**        | **Create**                     | **Read**                       | **Update**                     | **Delete**                     |
|-------------------|--------------------------------|--------------------------------|--------------------------------|--------------------------------|
| **User**          | Register (`POST /auth/register`) | View dashboard (`GET /auth/me`) | -                              | -                              |
| **Bus**           | Add bus (`POST /bus/add`)      | Search buses (`GET /booking/search`), Driver buses (`GET /bus/driver-buses`) | Update time (`POST /busModification/request`) | Remove bus (`POST /busModification/request`) |
| **Booking**       | Book seats (`POST /booking/book`) | Booking history (`GET /booking/history`), Driver bookings (`GET /bus/driver-bookings`) | -                              | Cancel booking (`POST /booking/cancel/:id`) |
| **Location**      | Add location (`POST /admin/locations/add`) | List locations (`GET /admin/locations`) | -                              | Delete location (`DELETE /admin/locations/:id`) |
| **BusModification** | Request modification (`POST /busModification/request`) | View pending requests (`GET /busModification`) | Approve/reject (`POST /busModification/approve/:id`, `/reject/:id`) | -                              |


## Project Structure

```
PROGRAMMING-FOR-INFORMATION-SYSTEMS-B9IS123_2425_TMD3-/
├── backend/src
│   ├── config/
│   │   ├── email.js               
│   │   ├── db.js                 
│   │   ├── jwt.js
│   ├── controllers/
│   │   ├── authController.js      
│   │   ├── busController.js       
│   │   ├── bookingController.js   
│   │   ├── adminController.js     
│   │   ├── busModificationController.js 
│   │   ├── userController.js
│   ├── middlewares/
│   │   ├── admin.js                
│   │   ├── auth.js               
│   ├── models/
│   │   ├── User.js                
│   │   ├── Bus.js                 
│   │   ├── Booking.js             
│   │   ├── Location.js            
│   │   ├── BusModification.js     
│   ├── routes/
│   │   ├── auth.js                
│   │   ├── bus.js                 
│   │   ├── booking.js             
│   │   ├── admin.js               
│   │   ├── busModification.js     
│   │   ├── user.js
│   ├── server.js                  
│   ├── tests/                     
│   ├── package.json               
│   ├── .env                       
├── frontend/src
│   ├── assets
│   ├── index.html                 
│   ├── styles.css                
│   ├── script.js                  
├── README.md                     
```

---
## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <https://github.com/HimalSl/PROGRAMMING-FOR-INFORMATION-SYSTEMS-B9IS123_2425_TMD3-.gitl>
   cd PROGRAMMING-FOR-INFORMATION-SYSTEMS-B9IS123_2425_TMD3
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Start the Backend**:
   ```bash
   npm run dev
   ```
   The server runs on `http://localhost:5000`.

4. **Serve the Frontend**:
   ```bash
   cd frontend
   npx live-server
   ```