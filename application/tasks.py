from celery_worker import celery
from flask import render_template

@celery.task
def test():
    print("Celery is working!")

import csv
import os
from datetime import date, timedelta, datetime
from flask_mail import Message
from application.models import *
from application.mail import mail
from application.database import db

@celery.task
def export_student_csv(student_id):
    student = Student.query.filter_by(student_id=student_id).first()
    if student is None:
        return "Student not found"
    
    export_folder = os.path.join("static", "exports")
    os.makedirs(export_folder, exist_ok=True)

    filename = f"student_{student_id}.csv"
    filepath = os.path.join(export_folder, filename)

    applications = Application.query.filter_by(student_id=student_id).all()
    with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([
            "Student ID",
            "Company Name",
            "Drive Title",
            "Application Status",
            "Application Date"
        ])
        for app in applications:
            writer.writerow([
                app.student_id,
                app.drive.company.company_name,
                app.drive.job_title,
                app.status,
                app.application_date
            ])
    return filename

@celery.task
def send_daily_reminders():
    tomorrow = date.today() + timedelta(days=1)

    drives = Placement_Drive.query.filter_by(application_deadline = tomorrow, status = "Approved").all()

    for drive in drives:
        students = Student.query.all()
        for student in students:
            already_applied = Application.query.filter_by( student_id=student.student_id, drive_id=drive.drive_id).first()
            if already_applied:
                continue

            msg = Message(
                subject="Placement Drive Reminder",
                recipients=[student.user.email]
            )

            msg.body = f"""
                Hello {student.student_name},
                This is a reminder that the application deadline for {drive.job_title} at {drive.company.company_name} is tomorrow.

                Please apply before the deadline.

                Regards,
                Placement Portal
                """
            mail.send(msg)
    return "Reminder Sent"

@celery.task
def send_monthly_report():
    total_companies = Company.query.count()
    total_students = Student.query.count()
    total_drives = Placement_Drive.query.count()
    total_applications = Application.query.count()
    total_interviews = Interview.query.count()
    total_placements = Placement.query.count()

    html = render_template(
        "monthly_report.html",
        total_companies=total_companies,
        total_students=total_students,
        total_drives=total_drives,
        total_applications=total_applications,
        total_interviews=total_interviews,
        total_placements=total_placements
    )

    admin = User.query.filter_by(username="admin").first()
    msg = Message(
        subject="Monthly Placement Report",
        recipients=[admin.email]
    )

    msg.html = html
    mail.send(msg)
    return "Monthly Report Sent"

@celery.task
def close_expired_drives():
    expired_drives = Placement_Drive.query.filter(
        Placement_Drive.application_deadline < date.today(),
        Placement_Drive.status == "Approved"
    ).all()
    for drive in expired_drives:
        drive.status = "Closed"
    if expired_drives:
        db.session.commit()
    return f"{len(expired_drives)} drives closed."

@celery.task
def complete_expired_interviews():
    now = datetime.now()
    interviews = Interview.query.filter_by(status="Scheduled").all()
    updated = 0
    for interview in interviews:
        interview_datetime = datetime.combine(interview.date,interview.time)
        if interview_datetime <= now:
            interview.status = "Completed"
            updated += 1
            
    if updated:
        db.session.commit()
    return f"{updated} interviews marked as completed."