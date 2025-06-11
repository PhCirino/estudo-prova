from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    level = db.Column(db.Integer, default=1)
    experience_points = db.Column(db.Integer, default=0)
    total_study_time = db.Column(db.Integer, default=0)  # em minutos
    
    # Relacionamentos
    children = db.relationship('User', backref=db.backref('parent', remote_side=[id]))
    quiz_results = db.relationship('QuizResult', backref='user', lazy=True)
    achievements = db.relationship('UserAchievement', backref='user', lazy=True)
    study_sessions = db.relationship('StudySession', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def add_experience(self, points):
        self.experience_points += points
        # Sistema de níveis: cada 100 pontos = 1 nível
        new_level = (self.experience_points // 100) + 1
        if new_level > self.level:
            self.level = new_level
            return True  # Subiu de nível
        return False

    def get_level_progress(self):
        current_level_xp = (self.level - 1) * 100
        next_level_xp = self.level * 100
        progress_xp = self.experience_points - current_level_xp
        return {
            'current_level': self.level,
            'progress_xp': progress_xp,
            'needed_xp': 100 - progress_xp,
            'progress_percentage': (progress_xp / 100) * 100
        }

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'level': self.level,
            'experience_points': self.experience_points,
            'total_study_time': self.total_study_time,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'level_progress': self.get_level_progress()
        }

class QuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    time_spent = db.Column(db.Integer, nullable=False)  # em segundos
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    quiz_type = db.Column(db.String(20), default='quiz')  # quiz, simulation

    def get_percentage(self):
        return round((self.score / self.total_questions) * 100)

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'score': self.score,
            'total_questions': self.total_questions,
            'percentage': self.get_percentage(),
            'time_spent': self.time_spent,
            'completed_at': self.completed_at.isoformat(),
            'quiz_type': self.quiz_type
        }

class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(10), nullable=False)
    condition_type = db.Column(db.String(50), nullable=False)  # perfect_score, level_up, streak, etc.
    condition_value = db.Column(db.String(100), nullable=True)
    experience_reward = db.Column(db.Integer, default=10)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'experience_reward': self.experience_reward
        }

class UserAchievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievement.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    achievement = db.relationship('Achievement', backref='user_achievements')

    def to_dict(self):
        return {
            'id': self.id,
            'achievement': self.achievement.to_dict(),
            'earned_at': self.earned_at.isoformat()
        }

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # em minutos
    session_type = db.Column(db.String(20), nullable=False)  # theory, video, practice
    started_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'topic': self.topic,
            'duration': self.duration,
            'session_type': self.session_type,
            'started_at': self.started_at.isoformat()
        }

