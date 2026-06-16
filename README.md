# Eventa - Event Management System

## Overview

Eventa is a Django-based Event Management System that allows users to register, log in, browse events, and register for events. The project follows the Django MVT (Model-View-Template) architecture and uses Django REST Framework (DRF) for API development.

---

## Features

### User Management
- User Registration
- User Login
- JWT Authentication
- User Profile Management
- Password Hashing and Security

### Event Management
- Create Events
- View Event Details
- List All Events
- Event Registration

### Registration Management
- Register for Events
- View Registered Events
- Prevent Duplicate Registrations

---

## Technology Stack

### Backend
- Python 3.x
- Django
- Django REST Framework (DRF)

### Authentication
- JWT Authentication
- Simple JWT

### Database
- MySQL

### Development Tools
- Visual Studio Code
- Git
- GitHub

---

## Project Structure
Eventa/
│
├── Users/
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ ├── urls.py
│
├── Events/
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ ├── urls.py
│
├── Bookings/
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ ├── urls.py
│
├── Eventa/
│ ├── settings.py
│ ├── urls.py
│ ├── wsgi.py
│ └── asgi.py
│
├── manage.py
└── requirements.txt


---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd Eventa

Create Virtual Environment
python -m venv venv
Activate Virtual Environment
Windows
venv\Scripts\activate
Linux/Mac
source venv/bin/activate
Install Dependencies
pip install -r requirements.txt

Or manually:

pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install mysqlclient
Database Configuration

Configure MySQL in settings.py.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'eventa_db',
        'USER': 'root',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
Apply Migrations
python manage.py makemigrations
python manage.py migrate
Create Superuser
python manage.py createsuperuser
Run Server
python manage.py runserver

Server URL:

http://127.0.0.1:8000/
API Endpoints
User APIs

Method	Endpoint	    Description
POST	/user/register	Register User
POST	/user/login	    Login User

Event APIs
Method	Endpoint	    Description
GET	/event/events	    List Events
GET	/event/events/<id>	Event Details

Registration APIs
Method	Endpoint	                 Description
POST	/book/events/<id>/register	 Register Event
GET  	/book/my-registrations	         View My Registrations
Authentication

After login, JWT tokens are returned.

Example:

{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}

Use the access token in headers:

Authorization: Bearer <access_token>
Security Features
Passwords stored using Django's secure hashing system
JWT-based authentication
Protected API endpoints
Duplicate event registration prevention
Future Enhancements
React Frontend
Event Search
Event Categories
Event Images Upload
Email Notifications
User Dashboard
Event Organizer Panel

Author
Mavisha V
Btech Computer science and Enineering

Project: Eventa - Event Registration System


Before moving to React, make sure:

✅ Registration API works  
✅ Login API works  
✅ JWT authentication works  
✅ Event List API works  
✅ Event Detail API works  
✅ Event Registration API works  
✅ My Registrations API works

If all these APIs are tested successfully in Postman, then you can start the React frontend.
