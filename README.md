# 🏫 University Room Reservation System

An application for managing and booking university rooms. The system aims to solve the problem of overlapping room reservations and the lack of a centralized availability management system. The project ensures availability control and eliminates scheduling conflicts.

## Project Goal
The goal of the project is to create a Java application based on a REST API architecture using the Spring Boot framework. The application manages resources (rooms) and their reservations, taking into account the business logic related to time availability. The frontend will be implemented in React, and code quality will be ensured by unit and integration tests.

## Target Users
The solution is intended for the following user groups:
* Students
* Lecturers
* University administrative staff

## Features

### Core Features
* **Adding rooms** – an admin panel allowing the introduction of new resources into the system.
* **Fetching the list of rooms** – an overview of all available rooms.
* **Creating reservations** – the ability to book a room in a specific time slot.
* **Fetching the list of reservations** – viewing the current schedule.
* **Time conflict validation** – a smart system preventing overlapping reservations for the same room.
* **Error handling** – clear error messages for missing rooms, occupied time slots, or invalid data.

### Additional Features
* Checking room availability in a specific time slot.
* Filtering reservations by date or a specific room.
* Canceling existing reservations.
* Adding detailed information about the person making the reservation (booker).
* Specifying a room's capacity limit and its type (e.g., lecture, laboratory, computer).
* Advanced filtering of rooms by their type.

## 🛠 Tech Stack & Team

The project is developed by a 3-person team with a clear division of roles:

| Team Role | Responsibilities / Technologies |
| :--- | :--- |
| **Backend Developer** | API, database, business logic, Java + Spring |
| **Frontend Developer** | UI/UX, TypeScript + React |
| **Tester (QA)** | Unit and integration tests, JUnit, Mockito, Spring Boot Test |

---
*Project developed for the Advanced Programming Techniques course.*

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed and running
- Java 21+ (only needed if you want to run the backend locally without Docker)

### 1. Start the database

```bash
docker run --name room-reservation-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=room_reservation \
  -p 3306:3306 \
  -d mysql:8
```

### 2. Configure environment variables

Create a `.env` file in the project root.
Minimum required values for local development:

```properties
DB_URL=jdbc:mysql://localhost:3306/room_reservation
DB_USERNAME=root
DB_PASSWORD=root
JWT_SECRET=your-secret-key-at-least-32-characters-long
```

Generate a secure secret with:

```bash
openssl rand -hex 32
```
On Windows you can do it in a WSL terminal.

### 3. Run the backend

```bash
./mvnw spring-boot:run
```

The app starts on **http://localhost:8080**.  
Flyway runs automatically on startup and creates all tables and seed data — no manual SQL needed.

### 4. Explore the API with Swagger UI

Open **http://localhost:8080/swagger-ui/index.html** in your browser.

#### Authenticating in Swagger

1. Call `POST /auth/login` with one of the pre-existing accounts (see below).
2. Copy the `token` value from the response.
3. Click the **Authorize 🔒** button (top right).
4. Paste the token and click **Authorize**.

All locked endpoints will now include your Bearer token automatically.

### Pre-existing accounts

| Username  | Password  | Role    |
|-----------|-----------|---------|
| `admin`   | `admin`   | ADMIN   |
| `student` | `student` | STUDENT |
| `teacher` | `teacher` | TEACHER |

> **ADMIN** can access all endpoints including user management.  
> **STUDENT** and **TEACHER** have access to their own profile and reservation-related endpoints.