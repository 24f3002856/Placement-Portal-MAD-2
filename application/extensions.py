from flask_security import SQLAlchemyUserDatastore
from .database import db
from application.models import User, Role

user_datastore = SQLAlchemyUserDatastore(db, User, Role)