from .database import db
from flask_security import UserMixin,RoleMixin
import uuid

class Roles_Users(db.Model):
    __tablename__ = "roles_users"
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key = True, nullable = False)
    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), primary_key = True, nullable = False)

class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    username = db.Column(db.String, unique = True)
    email = db.Column(db.String, unique = True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())

    fs_uniquifier = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4())
    )

    roles = db.relationship("Role",secondary = "roles_users", backref = db.backref("users", lazy = "dynamic"))
    student = db.relationship("Student",backref=db.backref("user", uselist=False))
    company = db.relationship("Company",backref=db.backref("user", uselist=False))

class Role(db.Model, RoleMixin):
    __tablename__ = "role"
    id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    name = db.Column(db.String, unique = True)
    description = db.Column(db.String)

class Student(db.Model):
    __tablename__ = "student"
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable = False)
    student_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    student_name = db.Column(db.String(100))
    gender = db.Column(db.String(20)) # M/F/Others
    department = db.Column(db.String(100))
    education = db.Column(db.String)
    cgpa = db.Column(db.Float)
    skills = db.Column(db.Text)
    contact = db.Column(db.String(20)) 
    resume = db.Column(db.String(255))   

    blacklist_flag = db.Column(db.String, default = "No") # (Yes / No)

    applications = db.relationship("Application", backref="student", lazy=True)
    placement = db.relationship("Placement", backref="student", lazy=True)

class Company(db.Model):
    __tablename__ = "company"
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable = False)
    company_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    company_name = db.Column(db.String(100))
    industry = db.Column(db.String(20))
    hr_contact = db.Column(db.String(20))
    website = db.Column(db.String(255))
    overview = db.Column(db.Text)

    approval_status = db.Column(db.String(20), default = "Pending") # (Pending / Approved / Rejected)
    blacklist_flag = db.Column(db.String(10), default = "No") # (Yes / No)

    placement = db.relationship("Placement", backref="company", lazy=True)
    drives = db.relationship("Placement_Drive", backref="company", lazy=True)

class Placement_Drive(db.Model):
    __tablename__ = "placement_drive"
    drive_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.company_id"))
    job_title = db.Column(db.String(20))
    job_description = db.Column(db.Text)
    salary = db.Column(db.Integer)
    location = db.Column(db.String(20))
    required_skills = db.Column(db.Text)
    minimum_cgpa = db.Column(db.Float)
    application_deadline = db.Column(db.Date)

    status = db.Column(db.String(10), default = "Pending") # (Pending / Approved(Active) / Closed / Rejected)
    
    applications = db.relationship("Application", backref="drive", lazy=True)

class Application(db.Model):
    __tablename__ = "application"
    application_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    student_id = db.Column(db.Integer, db.ForeignKey("student.student_id"))
    drive_id = db.Column(db.Integer, db.ForeignKey("placement_drive.drive_id"))
    application_date = db.Column(db.Date)

    status = db.Column(db.String(15), default = "Waiting") # (Waiting / Shortlisted / Interview/ Rejected / Selected).

    interview = db.relationship("Interview", backref = "application", lazy = True, uselist=False)
    placement = db.relationship("Placement", backref = "application", lazy = True)

class Interview(db.Model):
    __tablename__ = "interview"
    interview_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    application_id = db.Column(db.Integer, db.ForeignKey("application.application_id"))
    date = db.Column(db.Date)
    time = db.Column(db.Time)
    mode = db.Column(db.String(10)) # Online / Offline
    meeting_link = db.Column(db.String(100))
    instructions = db.Column(db.Text)

    status = db.Column(db.String,default="Scheduled") # Scheduled/Cancelled/Completed

class Placement(db.Model):
    __tablename__ = "placement"
    placement_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    application_id = db.Column(db.Integer, db.ForeignKey("application.application_id"))
    student_id = db.Column(db.Integer, db.ForeignKey("student.student_id"))
    company_id = db.Column(db.Integer, db.ForeignKey("company.company_id"))
    position = db.Column(db.String)
    salary = db.Column(db.Integer)
    joining_date = db.Column(db.Date)
    offer_status = db.Column(db.String(20), default="Pending") # Accepted/ Rejected/ Pending

    offer_letter = db.relationship("Offer_Letter", backref = "placement", uselist=False)

class Offer_Letter(db.Model):
    offer_id = db.Column(db.Integer, autoincrement = True, primary_key = True)
    placement_id = db.Column(db.Integer, db.ForeignKey("placement.placement_id"))
    pdf_path = db.Column(db.String(255))


