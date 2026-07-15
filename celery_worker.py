from celery import Celery
from main import app
from celery.schedules import crontab

celery = Celery(
    app.import_name,
    broker=app.config["REDIS_URL"],
    backend=app.config["REDIS_URL"]
)

celery.conf.update(app.config)

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with app.app_context():
            return self.run(*args, **kwargs)

celery.Task = ContextTask
from application import tasks

celery.conf.beat_schedule = {
    "daily-reminder": {
        "task": "application.tasks.send_daily_reminders",
        "schedule": crontab(hour=9, minute=0)
    },
    "monthly-report":{
        "task":"application.tasks.send_monthly_report",
        "schedule":crontab( day_of_month=1, hour=9, minute=0)
    },
    "close-expired-drives": {
        "task": "application.tasks.close_expired_drives",
        "schedule": crontab(hour=0, minute=5),
    },
    "complete-expired-interviews": {
        "task": "application.tasks.complete_expired_interviews",
        "schedule": crontab(minute="*/10"),
    }
}