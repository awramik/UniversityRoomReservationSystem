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