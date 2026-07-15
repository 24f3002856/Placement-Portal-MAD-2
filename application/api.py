from flask import request
from flask_login import current_user
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from flask_restful import Resource, reqparse
from flask_restful import fields, marshal_with, marshal
from email_validator import validate_email, EmailNotValidError
from flask_security import hash_password, login_required, roles_required, roles_accepted
from flask_security.utils import verify_password, login_user, logout_user
from application.models import *
from application.database import db
from application.validation import NotFoundError, BusinessValidationError
from application.extensions import user_datastore
from application.cache import cache
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask import current_app

APPLICATION_STATUS = ["Waiting", "Shortlisted", "Interview", "Offer", "Rejected", "Selected"]
DRIVE_STATUS = ["Pending", "Approved", "Rejected", "Closed"]
INTERVIEW_STATUS = ["Scheduled", "Completed", "Cancelled"]
BLACKLIST_FLAG = ["Yes","No"]
APPROVAL_STATUS = ["Approved", "Rejected"]
OFFER_STATUS = ["Accepted", "Rejected", "Pending"]
    
Interview_OP = {
    "interview_id" : fields.Integer,
    "application_id" : fields.Integer,
    "date" : fields.DateTime(dt_format="iso8601"),
    "time" : fields.String,    
    "mode" : fields.String,
    "meeting_link" : fields.String,
    "instructions" : fields.String,
    "status" : fields.String
} 

login_parser = reqparse.RequestParser()
login_parser.add_argument("username")
login_parser.add_argument("password")

class LoginAPI(Resource):
    def post(self):
        args = login_parser.parse_args()
        username = args.get("username")
        password = args.get("password")

        if username is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1001",
                error_message="Username is required"
            )

        if password is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1003",
                error_message="Password is required"
            )

        user = User.query.filter_by(username=username).first()

        if user is None:
            raise BusinessValidationError(
                status_code=401,
                error_code="BE1101",
                error_message="Invalid username or password"
            )

        if not verify_password(password, user.password):
            raise BusinessValidationError(
                status_code=401,
                error_code="BE1101",
                error_message="Invalid password"
            )

        login_user(user)

        if current_user.has_role("admin"):
            return {
                "message": "Login Successful",
                "role": "admin"
            }, 200

        elif current_user.has_role("student"):
            student = Student.query.filter_by(user_id=current_user.id).first()
            if student is None:
                raise NotFoundError(status_code=404)

            if student.blacklist_flag == "Yes":
                return {
                    "message": "Student is blacklisted",
                    "role": "student",
                    "status": "blacklisted"
                }, 403

            return {
                "message": "Login Successful",
                "role": "student",
                "student_id": student.student_id
            }, 200

        elif current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)

            if company.approval_status == "Pending":
                return {
                    "message": "Approval Pending",
                    "role": "company",
                    "status": "pending"
                }, 403

            if company.approval_status == "Rejected":
                return {
                    "message": "Company Rejected",
                    "role": "company",
                    "status": "rejected"
                }, 403

            if company.blacklist_flag == "Yes":
                return {
                    "message": "Company Blacklisted",
                    "role": "company",
                    "status": "blacklisted"
                }, 403

            return {
                "message": "Login Successful",
                "role": "company",
                "company_id": company.company_id
            }, 200
        
class LogoutAPI(Resource):
    method_decorators = [login_required]
    def post(self):
        logout_user()
        return {
            "message": "Logout Successful"
        }, 200
    
class UserAPI(Resource):        
    @staticmethod
    def create_user(username, email, password):
        if username is None:
            raise BusinessValidationError(
                status_code = 400,
                error_code = "BE1001", 
                error_message = "Username is required"
            )

        if email is None:
            raise BusinessValidationError(
                status_code = 400, 
                error_code = "BE1002", 
                error_message = "Email is required"
            ) 

        if password is None:
            raise BusinessValidationError(
                status_code = 400, 
                error_code = "BE1003", 
                error_message = "Password is required"
            ) 
        
        try:
            valid = validate_email(email)     # Basic condn for email check if "@" is present
            email = valid.email     # Normalizes the provided email i.e. if Raj@GMAIL.com --> Raj@gmail.com
        except EmailNotValidError:
            raise BusinessValidationError(
                status_code=400, 
                error_code="BE1004", 
                error_message="Invalid email"
            )
        
        user = User.query.filter_by(username = username).first()
        if user:
            raise BusinessValidationError(
                status_code=400, 
                error_code="BE1005", 
                error_message="Username already exists. Use different username."
            )
        
        user = User.query.filter_by(email = email).first()
        if user:
            raise BusinessValidationError(
                status_code=400, 
                error_code="BE1006", 
                error_message="Email already exists. Use different email."
            )
        
        new_user = user_datastore.create_user(username = username, email = email, password = hash_password(password))
        db.session.flush()
        return new_user
    

Company_OP = {
    "company_id" : fields.Integer,
    "company_name" : fields.String,
    "hr_contact" : fields.String,
    "website" : fields.String,
    "overview" : fields.String,
    "approval_status" : fields.String,
    "blacklist_flag" : fields.String
}

create_company_parser = reqparse.RequestParser()
create_company_parser.add_argument("company_name")
create_company_parser.add_argument("username")
create_company_parser.add_argument("email")
create_company_parser.add_argument("password")

update_company_parser = reqparse.RequestParser()
update_company_parser.add_argument("company_name")
update_company_parser.add_argument("hr_contact")
update_company_parser.add_argument("industry")
update_company_parser.add_argument("website")
update_company_parser.add_argument("overview")  

class CompanyAPI(Resource):
    
    @login_required
    @marshal_with(Company_OP)
    def get(self, company_id):
        company = Company.query.filter_by(company_id = company_id).first()

        if current_user.has_role("company"):
            current_company = Company.query.filter_by(user_id=current_user.id).first()        
            if current_company.company_id != company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
            
        if company:
            return company
        else:
            raise NotFoundError(status_code = 404)


    def post(self):        
        args = create_company_parser.parse_args()
        user = UserAPI.create_user(args.get("username", None), args.get("email", None), args.get("password", None))
        role = user_datastore.find_role("company")
        user_datastore.add_role_to_user(user, role)

        company_name = args.get("company_name", None)

        if company_name is None:
            raise BusinessValidationError(
                status_code = 400,
                error_code = "BE1007", 
                error_message = "Name is required."
            )

        company = Company(
            company_name=company_name,
            user_id=user.id,
            approval_status="Pending"
        )

        db.session.add(company)
        db.session.commit()
        cache.clear()

        return {
            "message": "Company registered successfully",
            "company_id": company.company_id
        }, 200
    
    @login_required
    def put(self, company_id):
        company = Company.query.filter_by(company_id = company_id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        
        current_company = Company.query.filter_by(user_id=current_user.id).first()        
        if current_user.has_role("company"):        
            if current_company.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        
        args = update_company_parser.parse_args()
        company_name = args.get("company_name", None)
        hr_contact = args.get("hr_contact", None)
        industry = args.get("industry", None)
        website = args.get("website", None)
        overview = args.get("overview", None)

        if company_name is not None:
            company.company_name = company_name
        if hr_contact is not None:
            company.hr_contact = hr_contact
        if industry is not None:
            company.industry = industry
        if website is not None:
            company.website = website
        if overview is not None:
            company.overview = overview

        db.session.commit()
        cache.clear()
        return {
            "message": "Profile updated successfully"
        }, 200

class CompanyListAPI(Resource):
    method_decorators = [login_required, roles_accepted("admin", "student")]

    @marshal_with(Company_OP)   
    @cache.cached(timeout=60, query_string = True) 
    def get(self):
        approval = request.args.get("approval")
        blacklist = request.args.get("blacklist")

        if current_user.has_role("student"):
            if approval and blacklist:            
                if approval != "Approved" or blacklist != "No":
                    raise BusinessValidationError(
                    status_code=400,
                    error_code="BE1403",
                    error_message="Only Approved and Whitelisted companies allowed."
                )

        query = Company.query
        if approval and approval in APPROVAL_STATUS:
            query = query.filter_by(approval_status=approval)
        if blacklist and blacklist in BLACKLIST_FLAG:
            query = query.filter_by(blacklist_flag=blacklist)
        return query.all()


Student_OP = {
    "student_id" : fields.Integer,
    "student_name" : fields.String,
    "gender" : fields.String,
    "department" : fields.String,
    "education" : fields.String,
    "cgpa" : fields.Float,
    "skills" : fields.String,
    "contact" : fields.String,
    "resume" : fields.String,
    "blacklist_flag" : fields.String,
}

create_student_parser = reqparse.RequestParser()
create_student_parser.add_argument("student_name")
create_student_parser.add_argument("username")
create_student_parser.add_argument("email")
create_student_parser.add_argument("password")

update_student_parser = reqparse.RequestParser()
update_student_parser.add_argument("student_name", location="form")
update_student_parser.add_argument("gender", location="form")
update_student_parser.add_argument("department",location="form") 
update_student_parser.add_argument("education", location="form")  
update_student_parser.add_argument("cgpa", type= float, location="form") 
update_student_parser.add_argument("skills", location="form")  
update_student_parser.add_argument("contact", location="form")

class StudentAPI(Resource):
    @login_required
    @marshal_with(Student_OP)
    def get(self, student_id):
        student = Student.query.filter_by(student_id = student_id).first()

        if current_user.has_role("student"):
            current_student = Student.query.filter_by(user_id=current_user.id).first()
            if current_student.student_id != student_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
            
        if student:
            return student
        else:
            raise NotFoundError(status_code = 404)
        
    @login_required 
    @roles_required("student")   
    def put(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()
        if student is None:
            raise NotFoundError(status_code=404)

        if current_user.id != student.user_id:
            raise BusinessValidationError(
                status_code=403,
                error_code="BE1201",
                error_message="Unauthorized Access"
            )
        
        args = update_student_parser.parse_args()
        student_name = args.get("student_name", None)
        gender = args.get("gender", None)
        department = args.get("department", None)
        education = args.get("education", None)
        cgpa = args.get("cgpa", None)
        skills = args.get("skills", None)
        contact = args.get("contact", None)

        if student_name is not None:
            student.student_name = student_name
        if gender is not None:
            student.gender = gender
        if department is not None:
            student.department = department
        if education is not None:
            student.education = education
        if cgpa is not None:
            student.cgpa = cgpa
        if skills is not None:
            student.skills = skills
        if contact is not None:
            student.contact = contact

        resume = request.files.get("resume")
        if resume:
            filename = secure_filename(f"resume_{student_id}.pdf")
            resume_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "resumes")
            os.makedirs(resume_folder, exist_ok=True)
            filepath = os.path.join(resume_folder,filename)
        
            resume.save(filepath)
            student.resume = filepath
        db.session.commit()

        return {
            "message": "Student Profile Updated Successfully"
        }, 200  

    def post(self):        
        args = create_student_parser.parse_args()
        user = UserAPI.create_user(args.get("username", None), args.get("email", None), args.get("password", None))
        role = user_datastore.find_role("student")
        user_datastore.add_role_to_user(user, role)

        student_name = args.get("student_name", None)

        if student_name is None:
            raise BusinessValidationError(
                status_code = 400,
                error_code = "BE1007", 
                error_message = "Name is required."
            )

        student = Student(
            student_name=student_name,
            user_id=user.id,
        )

        db.session.add(student)
        db.session.commit()
        cache.clear()

        return {
            "message": "Student registered successfully",
            "student_id": student.student_id
        }, 200     
    
class StudentListAPI(Resource):
    method_decorators = [login_required, roles_accepted("admin", "company")]

    @marshal_with(Student_OP)
    @cache.cached(timeout=60, query_string = True)
    def get(self):
        blacklist = request.args.get("blacklist")

        if current_user.has_role("company"):
            if blacklist:            
                if blacklist != "No":
                    raise BusinessValidationError(
                    status_code=400,
                    error_code="BE1404",
                    error_message="Only Whitelisted students allowed."
                )

        query = Student.query
        if blacklist and blacklist in BLACKLIST_FLAG:
            query = query.filter_by(blacklist_flag=blacklist)
        return query.all()


Drive_OP = {
    "drive_id" : fields.Integer,
    "company_id" : fields.Integer,
    "company_name": fields.String(attribute="company.company_name"),
    "job_title" : fields.String,
    "job_description" : fields.String,
    "salary" : fields.Integer,
    "location" : fields.String,
    "required_skills" : fields.String,
    "minimum_cgpa" : fields.Float,
    "application_deadline" : fields.DateTime(dt_format="iso8601"),
    "status" : fields.String
}
create_drive_parser = reqparse.RequestParser()
create_drive_parser.add_argument("job_title")
create_drive_parser.add_argument("job_description")
create_drive_parser.add_argument("salary", type=int)
create_drive_parser.add_argument("location")
create_drive_parser.add_argument("required_skills")
create_drive_parser.add_argument("minimum_cgpa", type=float)
create_drive_parser.add_argument("application_deadline")

class DriveAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Drive_OP)
    def get(self, drive_id):
        drive = Placement_Drive.query.filter_by(drive_id = drive_id).first()

        if current_user.has_role("company"):
            company = Company.query.filter_by(user_id = current_user.id).first()
            if company and drive:
                if company.company_id != drive.company_id:
                    raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        elif current_user.has_role("student"):
            if drive:            
                if drive.status != "Approved":
                    raise BusinessValidationError(
                    status_code=400,
                    error_code="BE1402",
                    error_message="Only Approved Drives allowed."
                )

        if drive:
            return drive
        else:
            raise NotFoundError(status_code = 404)

    @roles_accepted("admin", "company")    
    def put(self, drive_id):
        drive = Placement_Drive.query.filter_by(drive_id = drive_id).first()
        if drive is None:
            raise NotFoundError(status_code=404)
        
        if current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)
            if drive.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403, 
                    error_code="BE1201", 
                    error_message="Unauthorized Access"
                )
            
        drive.status = "Closed"
        db.session.commit()
        cache.clear()
        return {"message": "Drive closed"}, 200
        
    def post(self):
        company = Company.query.filter_by(user_id=current_user.id).first()

        if company is None:
            raise NotFoundError(status_code=404)

        args = create_drive_parser.parse_args()

        job_title = args.get("job_title")
        job_description = args.get("job_description")
        salary = args.get("salary")
        location = args.get("location")
        required_skills = args.get("required_skills")
        minimum_cgpa = args.get("minimum_cgpa")
        application_deadline = datetime.strptime(args.get("application_deadline"), "%Y-%m-%d").date()

        if not job_title:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1009",
                error_message="Job title is required"
            )

        if not job_description:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1010",
                error_message="Job description is required"
            )

        if salary is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1011",
                error_message="Salary is required"
            )

        new_drive = Placement_Drive(
            company_id=company.company_id,
            job_title=job_title,
            job_description=job_description,
            salary=salary,
            location=location,
            required_skills=required_skills,
            minimum_cgpa=minimum_cgpa,
            application_deadline=application_deadline,
            status="Pending"
        )

        db.session.add(new_drive)
        db.session.commit()
        cache.clear()
        return {
            "message": "Drive created successfully",
            "drive_id": new_drive.drive_id
        }, 201

class DriveListAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Drive_OP)
    @cache.cached(timeout=60, query_string = True)
    def get(self):
        status = request.args.get("status")
        company_id = request.args.get("company_id", type = int)

        if current_user.has_role("company"):
            
            company = Company.query.filter_by(user_id = current_user.id).first()
            if company and company_id:
                if company.company_id != company_id:
                    raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        elif current_user.has_role("student"):
            if status != "Approved":
                raise BusinessValidationError(
                status_code=400,
                error_code="BE1402",
                error_message="Only Approved Drives allowed."
            )

        query = Placement_Drive.query.options(
            joinedload(Placement_Drive.company)
        )
        if status and status in DRIVE_STATUS:
            query = query.filter_by(status=status)
        if company_id:
            query = query.filter_by(company_id=company_id)

        return query.all()


Application_OP = {
    "application_id" : fields.Integer,
    "student_id" : fields.Integer,
    "drive_id" : fields.Integer,
    "interview": fields.Nested(Interview_OP),
    "student_name": fields.String(attribute="student.student_name"),
    "company_name": fields.String(attribute="drive.company.company_name"),
    "job_title": fields.String(attribute="drive.job_title"),
    "application_date" : fields.DateTime(dt_format="iso8601"),    
    "status" : fields.String
}

create_application_parser = reqparse.RequestParser()
create_application_parser.add_argument("drive_id")

update_application_parser = reqparse.RequestParser()
update_application_parser.add_argument("status")

class ApplicationAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Application_OP)
    def get(self, application_id):
        application = Application.query.filter_by(application_id = application_id).first()

        if current_user.has_role("company"):
            company = Company.query.filter_by(user_id = current_user.id).first()
            if company and application:
                if company.company_id != application.drive.company_id:
                    raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        elif current_user.has_role("student"):
            student = Student.query.filter_by(user_id = current_user.id).first()
            if student and application:
                if student.student_id != application.student_id:
                    raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )

        if application:
            return application
        else:
            raise NotFoundError(status_code = 404)        

    @roles_accepted("company", "admin")    
    def put(self, application_id):
        application = Application.query.filter_by(application_id = application_id).first()
        if application is None:
            raise NotFoundError(status_code=404)
        
        if current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()

            if company is None:
                raise NotFoundError(status_code=404)

            if application.drive.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
              
        args = update_application_parser.parse_args()
        status = args.get("status", None)

        if status is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1013",
                error_message="Status is required"
            )
        if status not in APPLICATION_STATUS:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1405",
                error_message="Invalid application status"
            )
        application.status = status
        if application.status == "Rejected" and application.interview:
            application.interview.status = "Completed"
        db.session.commit()
        cache.clear()
        return {
            "message": "Application updated successfully"
        },200

    @roles_required("student")
    def post(self):
        student = Student.query.filter_by(user_id = current_user.id).first()
        if student is None:
            raise NotFoundError(status_code = 404)
                        
        args = create_application_parser.parse_args()
        drive_id = args.get("drive_id")
        today = datetime.today().date()

        if drive_id is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1016",
                error_message="Drive ID is required."
            )
        else:
            existing = Application.query.filter_by(student_id = student.student_id, drive_id = drive_id).first()

            if existing:
                raise BusinessValidationError(
                    status_code=400,
                    error_code="BE1401",
                    error_message="Already applied."
                )
            
        new_application = Application(
            student_id = student.student_id,
            drive_id = drive_id,
            application_date = today,
            status = "Waiting"
        )
        
        db.session.add(new_application)
        db.session.commit()
        cache.clear()
        return {
            "message" : "Applied Successfully"
        }, 200

class ApplicationListAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Application_OP)
    @cache.cached(timeout=15, query_string=True)
    def get(self):
        status = request.args.get("status")        
        drive_id = request.args.get("drive_id", type=int)
        student_id = request.args.get("student_id", type=int)
        query = Application.query.options(
            joinedload(Application.student),
            joinedload(Application.drive).joinedload(Placement_Drive.company),
            joinedload(Application.interview)
        )

        if current_user.has_role("company") and drive_id:
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)                

            drive = Placement_Drive.query.filter_by(drive_id=drive_id).first()
            if drive is None:
                raise NotFoundError(status_code=404)
            
            if drive.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        elif current_user.has_role("student"):
            student = Student.query.filter_by(user_id=current_user.id).first()
            if student is None:
                raise NotFoundError(status_code=404)

            if student.student_id != student_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )            
            if student_id:
                query = query.filter_by(student_id=student_id)
        
        if status and status in APPLICATION_STATUS:
            query = query.filter_by(status=status)
        if drive_id:
            query = query.filter_by(drive_id=drive_id)
        
        return query.all()
    
    
create_interview_parser = reqparse.RequestParser()
create_interview_parser.add_argument("application_id")
create_interview_parser.add_argument("date")
create_interview_parser.add_argument("time")
create_interview_parser.add_argument("mode")
create_interview_parser.add_argument("meeting_link")
create_interview_parser.add_argument("instructions")

update_interview_parser = reqparse.RequestParser()
update_interview_parser.add_argument("status")


class InterviewAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Interview_OP)
    def get(self, interview_id):
        interview = Interview.query.filter_by(interview_id = interview_id).first()
        if interview:
            return interview
        else:
            raise NotFoundError(status_code = 404)
        
    def put(self, interview_id):
        interview = Interview.query.filter_by(interview_id = interview_id).first()
        if interview is None:
            raise NotFoundError(status_code=404)
        
        if current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)
            if interview.application.drive.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
              
        args = update_interview_parser.parse_args()
        status = args.get("status", None)

        if status is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1013",
                error_message="Status is required"
            )
        if status not in INTERVIEW_STATUS:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1406",
                error_message="Invalid interview status"
            )
        interview.status = status
        db.session.commit()
        cache.clear()

        return {
            "message": "Interview status updated successfully"
        },200

    @roles_required("company")
    def post(self):
        company = Company.query.filter_by(user_id=current_user.id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        
        args = create_interview_parser.parse_args()

        application_id = args.get("application_id")
        date = datetime.strptime(args.get("date"), "%Y-%m-%d").date()
        time = datetime.strptime(args.get("time"),"%H:%M").time()
        mode = args.get("mode")
        meeting_link = args.get("meeting_link")
        instructions = args.get("instructions")

        if not application_id:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1012",
                error_message="Application ID is required"
            )

        if not date:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1017",
                error_message="Date is required"
            )

        if time is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1018",
                error_message="Time is required"
            )
        
        if mode is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1019",
                error_message="Mode is required"
            )

        new_interview = Interview(
            application_id=application_id,
            date=date,
            time=time,
            mode=mode,
            meeting_link=meeting_link,
            instructions=instructions,
            status="Scheduled"
        )
        application = Application.query.filter_by(application_id = application_id).first()
        application.status = "Interview"

        db.session.add(new_interview)
        db.session.commit()        
        cache.clear()

        return {
            "message": "Interview scheduled successfully",
            "interview_id": new_interview.interview_id
        }, 201


create_placement_parser = reqparse.RequestParser()
create_placement_parser.add_argument("application_id")
create_placement_parser.add_argument("position")
create_placement_parser.add_argument("salary")
create_placement_parser.add_argument("joining_date")

update_placement_parser = reqparse.RequestParser()
update_placement_parser.add_argument("offer_status")

Placement_OP = {
    "placement_id": fields.Integer,
    "application_id": fields.Integer,
    "student_id": fields.Integer,
    "company_id": fields.Integer,
    "student_name": fields.String(attribute="student.student_name"),
    "company_name": fields.String(attribute="company.company_name"),
    "position": fields.String,
    "salary": fields.Integer,
    "joining_date": fields.DateTime(dt_format="iso8601"),
    "offer_status": fields.String
}

class PlacementAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Placement_OP)
    def get(self, placement_id):
        placement = Placement.query.filter_by(placement_id=placement_id).first()
        if placement is None:
            raise NotFoundError(status_code=404)

        if current_user.has_role("student"):
            student = Student.query.filter_by(user_id=current_user.id).first()
            if student is None:
                raise NotFoundError(status_code=404)
            if placement.student_id != student.student_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )

        elif current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)
            if placement.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"                    
                )            
        return placement

    @roles_required("student")
    def put(self, placement_id):
        student = Student.query.filter_by(user_id=current_user.id).first()
        placement = Placement.query.get(placement_id)
        if placement is None:
            raise NotFoundError(status_code=404)        
        if placement.student_id != student.student_id:
            raise BusinessValidationError(
                status_code=403,
                error_code="BE1201",
                error_message="Unauthorized Access"
            )                
                
        args = update_placement_parser.parse_args()
        offer_status = args.get("offer_status")

        if (offer_status is None) or (offer_status not in OFFER_STATUS):
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1407",
                error_message="Invalid offer status"
            )
        
        placement = Placement.query.filter_by(placement_id = placement_id).first()
        placement.offer_status = offer_status
        db.session.commit()
        cache.clear()

        return {
            "message": "Offer Status updated successfully",
        }, 200

    @roles_required("company")
    def post(self):
        company = Company.query.filter_by(user_id=current_user.id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        
        args = create_placement_parser.parse_args()

        application_id = args.get("application_id")
        position = args.get("position")
        salary = args.get("salary")
        joining_date = datetime.strptime(args.get("joining_date"), "%Y-%m-%d").date()

        if not application_id:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1012",
                error_message="Application ID is required"
            )

        if not position:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1009",
                error_message="Position is required"
            )

        if salary is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1011",
                error_message="Salary is required"
            )
        
        if joining_date is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1019",
                error_message="Joining-date is required"
            )

        application = Application.query.filter_by(application_id = application_id).first()
        student_id = application.student_id
        company_id = application.drive.company_id
        application.status = "Selected"
        if application.interview:
            application.interview.status = "Completed"
        
        new_placement = Placement(
            application_id=application_id,
            student_id = student_id,
            company_id = company_id,
            position=position,
            salary=salary,
            joining_date=joining_date,
            offer_status="Pending"
        )        

        db.session.add(new_placement)
        db.session.commit()  
        cache.clear()      

        return {
            "message": "Placement created successfully",
            "placement_id": new_placement.placement_id
        }, 201

class PlacementListAPI(Resource):
    method_decorators = [login_required]

    @cache.cached(timeout=30, query_string = True)
    @marshal_with(Placement_OP)
    def get(self):        
        offer_status = request.args.get("offer_status")
        student_id = request.args.get("student_id", type=int)
        company_id = request.args.get("company_id", type=int)
        query = Placement.query

        if current_user.has_role("company") and company_id:
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)

            if company.company_id != company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
            if company_id:
                query = query.filter_by(company_id=company_id)
            
        elif current_user.has_role("student") and student_id:
            student = Student.query.filter_by(user_id=current_user.id).first()
            if student is None:
                raise NotFoundError(status_code=404)
            
            if student.student_id != student_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )            
            if student_id:
                query = query.filter_by(student_id=student_id)
        
        if offer_status and offer_status in OFFER_STATUS:
            query = query.filter_by(offer_status=offer_status)
        
        return query.all()
        

Offer_OP = {
    "offer_id": fields.Integer,
    "placement_id": fields.Integer,
    "pdf_path": fields.String
}

class OfferLetterAPI(Resource):
    method_decorators = [login_required]

    @marshal_with(Offer_OP)
    def get(self, placement_id):
        offer = Offer_Letter.query.filter_by(placement_id=placement_id).first()
        if offer is None:
            raise NotFoundError(status_code=404)

        placement = offer.placement

        if current_user.has_role("student"):
            student = Student.query.filter_by(user_id=current_user.id).first()
            if student is None:
                raise NotFoundError(status_code=404)
            if placement.student_id != student.student_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )

        elif current_user.has_role("company"):
            company = Company.query.filter_by(user_id=current_user.id).first()
            if company is None:
                raise NotFoundError(status_code=404)
            if placement.company_id != company.company_id:
                raise BusinessValidationError(
                    status_code=403,
                    error_code="BE1201",
                    error_message="Unauthorized Access"
                )
        return offer
    
    def post(self):
        placement_id = request.form.get("placement_id",type=int)
        pdf = request.files.get("offer_letter")
        if pdf is None:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1502",
                error_message="Offer Letter PDF required"
            )
             
        filename=f"offer_{placement_id}.pdf"
        offer_folder = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "offers",
        )
        os.makedirs(offer_folder, exist_ok=True)
        filepath = os.path.join(offer_folder,filename)

        pdf.save(filepath)
        pdf_path=f"static/uploads/offers/{filename}"

        offer = Offer_Letter(
            placement_id=placement_id,
            pdf_path=pdf_path
        )
        
        db.session.add(offer)
        db.session.commit()

        return marshal(offer,Offer_OP),201


class AdminDashboard(Resource): # GET /api/admin/dashboard
    
    method_decorators = [login_required, roles_required("admin")]
    @cache.memoize(timeout=15)
    def get(self):
        # Stats
        return {
            "registered_companies" : Company.query.filter_by(approval_status="Approved", blacklist_flag="No").count(),
            "registered_students" : Student.query.filter_by(blacklist_flag = "No").count(),
            "ongoing_drives" : Placement_Drive.query.filter_by(status = "Approved").count(),
            "applications" : Application.query.filter(Application.status != "Selected").count(),
            "placed_students" : Placement.query.filter_by(offer_status = "Accepted").count()
        }


class AdminSearchAPI(Resource):
    method_decorators = [login_required, roles_required("admin")]

    @cache.cached(timeout=15,query_string=True)
    def get(self):
        q = request.args.get("q", "").strip()
        if not q:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1408",
                error_message="Search query required"
            )

        companies = Company.query.filter(or_(Company.company_name.ilike(f"%{q}%"), Company.website.ilike(f"%{q}%"))).all()
        students = Student.query.filter(or_(Student.student_name.ilike(f"%{q}%"), Student.department.ilike(f"%{q}%"))).all()
        drives = Placement_Drive.query.filter(or_(Placement_Drive.job_title.ilike(f"%{q}%"), Placement_Drive.location.ilike(f"%{q}%"), Placement_Drive.company.has(Company.company_name.ilike(f"%{q}%")))).all()
        applications = Application.query.filter(or_(Application.status.ilike(f"%{q}%"), Application.student.has(Student.student_name.ilike(f"%{q}%")))).all()
        placements = Placement.query.filter(or_(Placement.position.ilike(f"%{q}%"), Placement.student.has(Student.student_name.ilike(f"%{q}%")), Placement.company.has(Company.company_name.ilike(f"%{q}%")))).all()

        return {
            "companies": marshal(companies, Company_OP),
            "students": marshal(students, Student_OP),
            "drives": marshal(drives, Drive_OP),
            "applications": marshal(applications, Application_OP),
            "placements": marshal(placements, Placement_OP)
        }, 200
    
class CompanyBlacklistAPI(Resource): # PUT /api/admin/company/<id>/blacklist
    method_decorators = [login_required, roles_required("admin")]

    def put(self, company_id):
        company = Company.query.filter_by(company_id=company_id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        company.blacklist_flag = "Yes"
        drives = Placement_Drive.query.filter_by(company_id = company_id).all()
        for drive in drives:
            if drive.status != "Closed":
                drive.status = "Rejected"
            for app in drive.applications:
                if app.status != "Selected":
                    app.status = "Waiting"
                    if app.interview:
                        app.interview.status = "Cancelled"
        db.session.commit()
        cache.clear()
        
        return {
            "message": "Company blacklisted successfully"
        }, 200

class StudentBlacklistAPI(Resource): # PUT /api/admin/student/<id>/blacklist
    method_decorators = [login_required, roles_required("admin")]

    def put(self, student_id):
        student = Student.query.filter_by(student_id=student_id).first()

        if student is None:
            raise NotFoundError(status_code=404)
        student.blacklist_flag = "Yes"
        applications = Application.query.filter_by(student_id=student_id).all()
        for app in applications:
            if app.status != "Selected":
                app.status = "Rejected"
                if app.interview:
                    app.interview.status = "Cancelled"
        db.session.commit()
        cache.clear()

        return {
            "message": "Student blacklisted successfully"
        }, 200

class CompanyApproval(Resource): # PUT /api/admin/company/<company_id>/approve
    method_decorators = [login_required, roles_required("admin")]

    def put(self, company_id):
        company = Company.query.filter_by(company_id = company_id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        company.approval_status = "Approved"
        db.session.commit()
        cache.clear()
        return {
            "message":"Company approved"
        }, 200

class CompanyRejection(Resource): # PUT /api/admin/company/<company_id>/reject
    method_decorators = [login_required, roles_required("admin")]

    def put(self, company_id):
        company = Company.query.filter_by(company_id = company_id).first()
        if company is None:
            raise NotFoundError(status_code=404)
        company.approval_status = "Rejected"
        db.session.commit()
        cache.clear()
        return {
            "message":"Company rejected"
        }, 200

class DriveApproval(Resource): # PUT /api/admin/drive/<drive_id>/approve
    method_decorators = [login_required, roles_required("admin")]

    def put(self, drive_id):
        drive = Placement_Drive.query.filter_by(drive_id = drive_id).first()
        if drive is None:
            raise NotFoundError(status_code = 404)
        drive.status = "Approved"
        db.session.commit()
        cache.clear()
        return {
            "message":"Drive approved"
        }, 200

class DriveRejection(Resource): # PUT /api/admin/drive/<drive_id>/reject
    method_decorators = [login_required, roles_required("admin")]

    def put(self, drive_id):
        drive = Placement_Drive.query.filter_by(drive_id = drive_id).first()
        if drive is None:
            raise NotFoundError(status_code = 404)
        drive.status = "Rejected"
        db.session.commit()
        cache.clear()
        return {
            "message":"Drive rejected"
        }, 200

# class ViewDrive(Resource): DriveAPI.get()
# class DriveCloseAPI(Resource): DriveAPI.put()
# class ViewApplication(Resource): ApplicationAPI.get()

class CompanyWhitelistAPI(Resource): # PUT /api/admin/company/<id>/whitelist
    method_decorators = [login_required, roles_required("admin")]

    def put(self, company_id):
        company = Company.query.filter_by(company_id = company_id).first()
        if company is None:
            raise NotFoundError(status_code = 404)
        company.blacklist_flag = "No"
        drives = Placement_Drive.query.filter_by(company_id = company_id).all()
        for drive in drives:
            if drive.status != "Closed":
                drive.status = "Pending"
        db.session.commit()
        cache.clear()
        
        return {
            "message": "Company whitelisted successfully"
        }, 200
    
class StudentWhitelistAPI(Resource): # PUT /api/admin/student/<id>/whitelist
    method_decorators = [login_required, roles_required("admin")]

    def put(self, student_id):
        student = Student.query.filter_by(student_id = student_id).first()
        if student is None:
            raise NotFoundError(status_code = 404)
        student.blacklist_flag = "No"
        applications = Application.query.filter_by(student_id=student_id).all()
        for app in applications:
            if app.status != "Selected":
                app.status = "Waiting"
        db.session.commit()
        cache.clear()

        return {
            "message": "Student whitelisted successfully"
        }, 200


class CompanyDashboardAPI(Resource): # GET /api/company/dashboard
    method_decorators = [login_required, roles_required("company")]
    @cache.memoize(timeout=15)
    def get(self):
        # Stats
        company = Company.query.filter_by(user_id = current_user.id, approval_status = "Approved", blacklist_flag = "No").first()
        if company is None:
            raise NotFoundError(status_code = 404)
        
        company_id = company.company_id
        
        return {            
            "ongoing_drives" : Placement_Drive.query.filter_by(company_id = company_id, status = "Approved").count(),
            "applications" : Application.query.filter(Application.drive.has(company_id = company_id)).count(),
            "shortlisted_students" : Application.query.filter(Application.status == "Shortlisted", Application.drive.has(company_id = company_id)).count(),
            "placed_students" : Application.query.filter(Application.status == "Selected", Application.drive.has(company_id = company_id)).count()
        }    

# class CompanyCreateDriveAPI(Resource): DriveAPI.post()
# class CompanyEditProfileAPI(Resource): CompanyAPI.post()
# class CompanyViewApplicationsAPI(Resource): ApplicationListAPI.get()
# class CompanyReviewApplicationsAPI(Resource): ApplicationAPI.get(), ApplicationAPI.put()
# class CompanyDriveCloseAPI(Resource): DriveCloseAPI.put()


class StudentDashboard(Resource): # GET /api/student/dashboard
    method_decorators = [login_required, roles_required("student")]
    @cache.memoize(timeout=15)
    def get(self):
        # Stats
        student = Student.query.filter_by(user_id = current_user.id, blacklist_flag = "No").first()
        if student is None:
            raise NotFoundError(status_code = 404)
        student_id = student.student_id

        return{
            "applied_drives" : Application.query.filter(Application.student_id == student_id, Application.drive.has(Placement_Drive.status != "Rejected")).count(),
            "interviews": Interview.query.filter(Interview.application.has(student_id = student_id), Interview.application.has(status = "Interview")).count(),
            "offers" : Placement.query.filter_by(offer_status = "Pending").count(),
            "placements" : Placement.query.filter_by(offer_status = "Accepted").count()
        }
    
# class StudentApplicationHistoryAPI(Resource): ApplicationListAPI.get()

class StudentSearchAPI(Resource):
    method_decorators = [login_required, roles_required("student")]
    
    @cache.cached(timeout=15, query_string=True)
    def get(self):
        student = Student.query.filter_by(user_id = current_user.id).first()
        student_id = student.student_id
        q = request.args.get("q", "").strip()
        if not q:
            raise BusinessValidationError(
                status_code=400,
                error_code="BE1408",
                error_message="Search query required"
            )

        applications = Application.query.filter(Application.student_id == student_id, or_(Application.drive.has(Placement_Drive.job_title.ilike(f"%{q}%")), Application.drive.has(Placement_Drive.company.has(Company.company_name.ilike(f"%{q}%"))), Application.drive.has(Placement_Drive.company.has(Company.website.ilike(f"%{q}%"))))).all()
        drives = Placement_Drive.query.join(Company).filter(Placement_Drive.status == "Approved", or_(Placement_Drive.company.has(Company.company_name.ilike(f"%{q}%")), Placement_Drive.job_title.ilike(f"%{q}%"), Placement_Drive.location.ilike(f"%{q}%"))).all()
        placements = Placement.query.filter(Placement.student_id == student_id, or_(Placement.position.ilike(f"%{q}%"), Placement.student.has(Student.student_name.ilike(f"%{q}%")), Placement.company.has(Company.company_name.ilike(f"%{q}%")))).all()

        return {
            "applications": marshal(applications, Application_OP),
            "drives": marshal(drives, Drive_OP),
            "placements" : marshal(placements, Placement_OP)
        }, 200

# class StudentViewCompanyAPI(Resource): CompanyAPI.get(), DriveListAPI.get()
# class StudentViewDriveAPI(Resource): DriveAPI.get(), DriveListAPI.get()
# class StudentDriveApply(Resource): ApplicationAPI.post()
# class StudentViewAppliedDrive(Resource): DriveAPI.get(), ApplicationAPI.get()


class ExportStudentCSVAPI(Resource): # /api/student/export
    method_decorators = [login_required, roles_required("student")]

    def post(self):
        from application.tasks import export_student_csv
        student = Student.query.filter_by(user_id=current_user.id).first()
        if student is None:
            raise NotFoundError(status_code=404)

        task = export_student_csv.delay(student.student_id)

        return {
            "message": "CSV export started successfully.",
            "task_id": task.id
        }, 202
    
