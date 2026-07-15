# 🎓 Placement Portal Application (MAD-II)

A full-stack **Placement Management System** built using **Flask**, **Vue.js**, **Redis**, and **Celery** that streamlines campus recruitment by providing a centralized platform for **Students**, **Companies**, and **Administrators**.

The application follows a **REST API architecture** with a Vue.js Single Page Application (SPA), role-based authentication, asynchronous background jobs, and API caching for improved performance.

---

# 🚀 Features

## 🔐 Authentication & Authorization

- Secure authentication using **Flask-Security**
- Password hashing with **bcrypt**
- Session-based login
- Role-based access control
    - 👨‍💼 Admin
    - 🏢 Company
    - 👨‍🎓 Student

---

# 👨‍💼 Admin Features

- Dashboard with placement statistics
- Approve or reject company registrations
- Approve or reject placement drives
- Blacklist / Whitelist companies
- Blacklist / Whitelist students
- Search across:
  - Companies
  - Students
  - Drives
  - Applications
  - Placements
- Monitor complete placement process

---

# 🏢 Company Features

- Company Registration
- Company Profile Management
- Create Placement Drives
- View Drive Details
- Manage Applications
- Shortlist / Reject Candidates
- Schedule Interviews
- Upload Offer Letters (PDF)
- Close Placement Drives
- View Placed Students

---

# 👨‍🎓 Student Features

- Student Registration
- Student Profile Management
- Resume Upload
- Browse Approved Placement Drives
- Apply for Jobs
- Track Application Status
- View Interview Schedule
- Accept / Reject Placement Offers
- Download Offer Letter
- Export Application History as CSV

---

# ⚙️ Additional Features

- RESTful API Architecture
- Vue.js Single Page Application
- Reusable Vue Components
- Client-side Routing
- Resume Upload Support
- Offer Letter Upload
- Duplicate Application Prevention
- Eligibility Validation
- Search Functionality
- Status Badges
- Notification Toasts
- Loading Indicators

---

# ⚡ Redis Caching

The application uses **Redis** for API caching to improve performance.

Cached Resources include:

- Admin Dashboard
- Company Dashboard
- Student Dashboard
- Company List
- Student List
- Drive List
- Application List
- Placement List
- Search APIs

This significantly reduces repeated database queries for frequently accessed resources.

---

# 🔄 Celery Background Jobs

The project uses **Celery** for asynchronous and scheduled task execution.

### User Triggered Job

- Export Student Applications as CSV

### Scheduled Jobs

- Daily Email Reminder for drives closing the next day
- Monthly Placement Report sent to Admin
- Automatic Closure of Expired Drives
- Automatic Completion of Expired Interviews

---

# 📧 Email Services

Using **Flask-Mail**, the application sends:

- Daily Placement Drive Reminder Emails
- Monthly Placement Activity Report

---

# 🏗️ Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | Vue.js 3 |
| Routing | Vue Router |
| Backend | Flask |
| REST APIs | Flask-RESTful |
| Authentication | Flask-Security |
| ORM | Flask-SQLAlchemy |
| Database | SQLite |
| Cache | Redis |
| Background Jobs | Celery |
| Mail | Flask-Mail |
| Styling | Bootstrap 5 |

---

# 🗄 Database Design

The application uses a normalized relational database consisting of:

- User
- Role
- Student
- Company
- Placement Drive
- Application
- Interview
- Placement
- Offer Letter

Relationships ensure referential integrity while maintaining a scalable design.

---

# 📁 Project Structure

```
Placement-Portal-MAD-2/

│
├── application/
│   ├── api.py
│   ├── models.py
│   ├── tasks.py
│   ├── cache.py
│   ├── database.py
│   ├── extensions.py
│   ├── mail.py
│   ├── validation.py
│
├── static/
│   ├── js/
│   │   ├── components/
│   │   ├── views/
│   │   ├── api.js
│   │   ├── app.js
│   │   └── router.js
│   ├── uploads/
│   └── exports/
│
├── templates/
│   ├── index.html
│   └── monthly_report.html
│
├── celery_worker.py
├── main.py
├── requirements.txt
├── README.md
└── Project_Report.pdf
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/<your-username>/Placement-Portal-MAD-2.git

cd Placement-Portal-MAD-2
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

### Linux / Mac

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Start Redis Server

```bash
redis-server
```

---

## 5. Start Celery Worker

```bash
celery -A celery_worker.celery worker --loglevel=info
```

---

## 6. Start Celery Beat Scheduler

```bash
celery -A celery_worker.celery beat --loglevel=info
```

---

## 7. Run Flask Application

```bash
python main.py
```

---

## 8. Open Browser

```
http://localhost:5000
```
## Note:
```
Uploaded resumes, offer letters, and exported CSV files are generated automatically at runtime. The required directories are created by the application if they do not already exist.
```

---

# 📡 Major REST APIs

Authentication

- POST /api/login
- POST /api/logout

Student

- GET /api/student/<id>
- PUT /api/student/<id>
- POST /api/student/export

Company

- GET /api/company/<id>
- PUT /api/company/<id>

Placement Drives

- GET /api/drives
- GET /api/drive/<id>
- POST /api/drive
- PUT /api/drive/<id>

Applications

- POST /api/application
- GET /api/application/<id>
- PUT /api/application/<id>

Interview

- POST /api/interview
- GET /api/interview/<id>

Placement

- POST /api/placement
- GET /api/placement/<id>
- PUT /api/placement/<id>

Offer Letter

- POST /api/offer_letter
- GET /api/offer_letter/<placement_id>

Admin

- GET /api/admin/dashboard
- GET /api/admin/search

---

# 📊 Performance Optimizations

- Redis API Caching
- Asynchronous CSV Export
- Scheduled Background Jobs
- Optimized SQLAlchemy Relationships
- Joined Loading for Efficient Queries
- Reusable Vue Components

---

# 🎥 Demonstration Video

👉 **Demo Video**

https://drive.google.com/drive/folders/1b2xIUKO1_PQO_VsuYLfkTV4__nnw_N4w

---

# 📄 Project Report

The complete project report is included in this repository.

---

# 👨‍💻 Author

**Kunal Sachin Kandale**

IIT Madras BS Degree in Data Science and Applications

Roll No: **24F3002856**

---

# 🙏 Acknowledgements

- Flask Documentation
- Vue.js Documentation
- Flask-RESTful
- Flask-Security
- SQLAlchemy
- Redis
- Celery
- Bootstrap
- ChatGPT (used for conceptual guidance, debugging, and code optimization)