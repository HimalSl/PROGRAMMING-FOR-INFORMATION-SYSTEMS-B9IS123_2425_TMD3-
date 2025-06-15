#  Matthews Coach Hire – Bus Booking System

##  Project Overview

This is a simple full-stack web application built for a fictional company called **Matthews Coach Hire**. It allows different users to interact with the system based on their role:

- **Passengers** can register, log in, search available buses, and book tickets.
- **Bus Owners** can register, log in, add buses, and view bookings.
- **Admins** can manage users, approve buses, and oversee the entire system.

The project uses **Vanilla JavaScript** on the frontend and **Node.js + Express** on the backend, with data stored in **JSON files** for simplicity.

---

##  Technology Stack

| Layer       | Technology Used            |
|-------------|-----------------------------|
| Frontend    | HTML + CSS + Vanilla JavaScript  |
| Backend     | Node.js + Express.js        |
| Database    | MongoDB(NO-SQL database) |
| Communication | JSON-based REST API        |
| Authentication | Role-based access  |

##  Why mongoDB
    - Uses REST API with frontend-backend separation
    - Uses JSON data exchange
    - Focus is on CRUD operations
    - Data can be stored in JSON, SQLite, NoSQL, etc

---

##  Key Features

###  Passenger
- Register & log in
- Search for buses
- Book tickets
- View booking history

###  Bus Owner
- Register & log in
- Add, edit, delete buses
- View bookings

###  Admin
- Approve buses
- View and manage users
- Manage location list

---

## Project Structure
```
├── PROGRAMMING-FOR-INFORMATION-SYSTEMS-B9IS123_2425_TMD3-
│   ├── frontend/
│   ├── backend/
│   ├── docs/
│   ├── README.md
│   └── .gitignore
```