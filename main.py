import os
from flask import Flask
from flask import render_template
from application import config
from application.config import LocalDevelopmentConfig
from application.database import db
from flask_restful import Resource, Api
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from application.models import User,Role
from application.extensions import user_datastore
from application.cache import cache
from application.mail import mail

from application.api import *

import logging 
logging.basicConfig(filename = "debug.log", level = logging.DEBUG, format = f"%(asctime)s %(levelname)s %(name)s")

app = None
api = None

def create_app():
    app = Flask(__name__, template_folder = "templates")

    if os.getenv("ENV", "development") == "production":
        app.logger.info("Currently no production config is setup.")
        raise Exception("Currently no production config is setup.")
    else:
        app.logger.info("Starting Local Development")
        print("Starting Local Development")
        app.config.from_object(LocalDevelopmentConfig)
    
    db.init_app(app)
    cache.init_app(app, config={
        "CACHE_TYPE": "RedisCache",
        "CACHE_REDIS_URL": app.config["REDIS_URL"],
        "CACHE_DEFAULT_TIMEOUT": 120
    })
    mail.init_app(app)
    api = Api(app)

    app.app_context().push()
    security = Security(app, user_datastore)
    app.logger.info("App setup complete.")
    return app, api

app,api = create_app()

if not os.path.exists("db_directory/appdb.sqlite3"):
    with app.app_context():
        db.create_all()

        if not user_datastore.find_role("admin"):
            user_datastore.create_role(name="admin")

        if not user_datastore.find_role("student"):
            user_datastore.create_role(name="student")

        if not user_datastore.find_role("company"):
            user_datastore.create_role(name="company")

        db.session.commit()

        # Create admin user (ONLY IF NOT EXISTS)
        if not user_datastore.find_user(email="24f3002856@ds.study.iitm.ac.in"):
            print("Creating admin user...")   # DEBUG
            admin_user = user_datastore.create_user(
                username = "admin",
                email="ADMIN_MAIL",
                password=hash_password("admin123")
            )

            role = user_datastore.find_role("admin")
            user_datastore.add_role_to_user(admin_user, role)

            db.session.commit()

api.add_resource(LoginAPI, "/api/login")
api.add_resource(LogoutAPI, "/api/logout")

api.add_resource(CompanyAPI, "/api/company", "/api/company/<int:company_id>")
api.add_resource(CompanyListAPI, "/api/companies")

api.add_resource(StudentAPI, "/api/student", "/api/student/<int:student_id>")
api.add_resource(StudentListAPI, "/api/students")

api.add_resource(DriveAPI, "/api/drive", "/api/drive/<int:drive_id>")
api.add_resource(DriveListAPI, "/api/drives")

api.add_resource(ApplicationAPI, "/api/application", "/api/application/<int:application_id>")
api.add_resource(ApplicationListAPI, "/api/applications")

api.add_resource(InterviewAPI, "/api/interview", "/api/interview/<int:interview_id>")
api.add_resource(PlacementAPI, "/api/placement", "/api/placement/<int:placement_id>")
api.add_resource(PlacementListAPI, "/api/placements")
api.add_resource(OfferLetterAPI, "/api/offer_letter", "/api/offer_letter/<int:placement_id>")


api.add_resource(AdminDashboard, "/api/admin/dashboard")
api.add_resource(AdminSearchAPI, "/api/admin/search")
api.add_resource(CompanyBlacklistAPI, "/api/admin/company/<int:company_id>/blacklist")
api.add_resource(StudentBlacklistAPI, "/api/admin/student/<int:student_id>/blacklist")
api.add_resource(CompanyApproval, "/api/admin/company/<int:company_id>/approve")
api.add_resource(CompanyRejection, "/api/admin/company/<int:company_id>/reject")
api.add_resource(DriveApproval, "/api/admin/drive/<int:drive_id>/approve")
api.add_resource(DriveRejection, "/api/admin/drive/<int:drive_id>/reject")
api.add_resource(CompanyWhitelistAPI, "/api/admin/company/<int:company_id>/whitelist")
api.add_resource(StudentWhitelistAPI, "/api/admin/student/<int:student_id>/whitelist")

api.add_resource(CompanyDashboardAPI, "/api/company/dashboard")
api.add_resource(StudentDashboard, "/api/student/dashboard")
api.add_resource(StudentSearchAPI, "/api/student/search")
api.add_resource(ExportStudentCSVAPI, "/api/student/export")

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host = "0.0.0.0", port = 5000)
