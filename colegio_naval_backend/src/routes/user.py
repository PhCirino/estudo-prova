from flask import Blueprint, jsonify, request, session
from datetime import datetime
from src.models.user import User, QuizResult, Achievement, UserAchievement, StudySession, db

user_bp = Blueprint('user', __name__)

# Rotas de Autenticação
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Verificar se usuário já existe
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Criar novo usuário
    user = User(
        username=data['username'],
        email=data['email'],
        is_admin=data.get('is_admin', False)
    )
    user.set_password(data['password'])
    
    # Se for um estudante e tiver parent_id, associar ao pai/mãe
    if 'parent_id' in data and not data.get('is_admin', False):
        user.parent_id = data['parent_id']
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        
        return jsonify({
            'user': user.to_dict(),
            'message': 'Login successful'
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'})

@user_bp.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

# Rotas de Quiz e Resultados
@user_bp.route('/quiz-result', methods=['POST'])
def save_quiz_result():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    result = QuizResult(
        user_id=session['user_id'],
        subject=data['subject'],
        score=data['score'],
        total_questions=data['total_questions'],
        time_spent=data['time_spent'],
        quiz_type=data.get('quiz_type', 'quiz')
    )
    
    db.session.add(result)
    
    # Adicionar experiência baseada no desempenho
    user = User.query.get(session['user_id'])
    percentage = (data['score'] / data['total_questions']) * 100
    
    # Sistema de pontos: 10 pontos base + bônus por performance
    base_points = 10
    performance_bonus = int(percentage / 10)  # 1 ponto extra para cada 10%
    total_points = base_points + performance_bonus
    
    level_up = user.add_experience(total_points)
    
    # Verificar conquistas
    check_achievements(user, result)
    
    db.session.commit()
    
    response_data = {
        'result': result.to_dict(),
        'experience_gained': total_points,
        'level_up': level_up,
        'user_progress': user.get_level_progress()
    }
    
    return jsonify(response_data), 201

@user_bp.route('/study-session', methods=['POST'])
def save_study_session():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    session_record = StudySession(
        user_id=session['user_id'],
        subject=data['subject'],
        topic=data['topic'],
        duration=data['duration'],
        session_type=data['session_type']
    )
    
    db.session.add(session_record)
    
    # Atualizar tempo total de estudo do usuário
    user = User.query.get(session['user_id'])
    user.total_study_time += data['duration']
    
    # Adicionar experiência por tempo de estudo (1 ponto por 5 minutos)
    study_points = max(1, data['duration'] // 5)
    user.add_experience(study_points)
    
    db.session.commit()
    
    return jsonify(session_record.to_dict()), 201

# Rotas de Conquistas
@user_bp.route('/achievements', methods=['GET'])
def get_user_achievements():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_achievements = UserAchievement.query.filter_by(user_id=session['user_id']).all()
    return jsonify([ua.to_dict() for ua in user_achievements])

@user_bp.route('/available-achievements', methods=['GET'])
def get_available_achievements():
    achievements = Achievement.query.all()
    return jsonify([achievement.to_dict() for achievement in achievements])

# Rotas Admin
@user_bp.route('/admin/students', methods=['GET'])
def get_students():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    
    admin_user = User.query.get(session['user_id'])
    students = User.query.filter_by(parent_id=admin_user.id).all()
    
    return jsonify([student.to_dict() for student in students])

@user_bp.route('/admin/student/<int:student_id>/progress', methods=['GET'])
def get_student_progress(student_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    
    # Verificar se o estudante pertence ao admin
    admin_user = User.query.get(session['user_id'])
    student = User.query.filter_by(id=student_id, parent_id=admin_user.id).first()
    
    if not student:
        return jsonify({'error': 'Student not found or access denied'}), 404
    
    # Buscar dados de progresso
    quiz_results = QuizResult.query.filter_by(user_id=student_id).order_by(QuizResult.completed_at.desc()).limit(10).all()
    study_sessions = StudySession.query.filter_by(user_id=student_id).order_by(StudySession.started_at.desc()).limit(10).all()
    achievements = UserAchievement.query.filter_by(user_id=student_id).order_by(UserAchievement.earned_at.desc()).all()
    
    return jsonify({
        'student': student.to_dict(),
        'recent_quiz_results': [result.to_dict() for result in quiz_results],
        'recent_study_sessions': [session.to_dict() for session in study_sessions],
        'achievements': [achievement.to_dict() for achievement in achievements]
    })

@user_bp.route('/admin/create-student', methods=['POST'])
def create_student():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.json
    
    # Verificar se usuário já existe
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Criar estudante associado ao admin
    student = User(
        username=data['username'],
        email=data['email'],
        parent_id=session['user_id'],
        is_admin=False
    )
    student.set_password(data['password'])
    
    db.session.add(student)
    db.session.commit()
    
    return jsonify(student.to_dict()), 201

# Função auxiliar para verificar conquistas
def check_achievements(user, quiz_result):
    # Conquista: Primeira vez
    if QuizResult.query.filter_by(user_id=user.id).count() == 1:
        award_achievement(user, 'first_quiz')
    
    # Conquista: Pontuação perfeita
    if quiz_result.get_percentage() == 100:
        award_achievement(user, 'perfect_score')
    
    # Conquista: Nível 5
    if user.level >= 5:
        award_achievement(user, 'level_5')
    
    # Conquista: 10 quizzes
    if QuizResult.query.filter_by(user_id=user.id).count() >= 10:
        award_achievement(user, 'quiz_master')

def award_achievement(user, achievement_type):
    # Verificar se já possui a conquista
    achievement = Achievement.query.filter_by(condition_type=achievement_type).first()
    if not achievement:
        return
    
    existing = UserAchievement.query.filter_by(
        user_id=user.id, 
        achievement_id=achievement.id
    ).first()
    
    if not existing:
        user_achievement = UserAchievement(
            user_id=user.id,
            achievement_id=achievement.id
        )
        db.session.add(user_achievement)
        user.add_experience(achievement.experience_reward)

# Inicializar conquistas padrão
@user_bp.route('/init-achievements', methods=['POST'])
def init_achievements():
    achievements = [
        {
            'name': 'Primeiro Quiz!',
            'description': 'Parabéns por fazer seu primeiro quiz!',
            'icon': '🎯',
            'condition_type': 'first_quiz',
            'experience_reward': 20
        },
        {
            'name': 'Pontuação Perfeita!',
            'description': 'Conseguiu 100% em um quiz!',
            'icon': '🏆',
            'condition_type': 'perfect_score',
            'experience_reward': 50
        },
        {
            'name': 'Nível 5!',
            'description': 'Alcançou o nível 5!',
            'icon': '⭐',
            'condition_type': 'level_5',
            'experience_reward': 100
        },
        {
            'name': 'Mestre dos Quizzes',
            'description': 'Completou 10 quizzes!',
            'icon': '🎖️',
            'condition_type': 'quiz_master',
            'experience_reward': 75
        }
    ]
    
    for ach_data in achievements:
        existing = Achievement.query.filter_by(condition_type=ach_data['condition_type']).first()
        if not existing:
            achievement = Achievement(**ach_data)
            db.session.add(achievement)
    
    db.session.commit()
    return jsonify({'message': 'Achievements initialized'})

# Rotas de usuários (mantidas para compatibilidade)
@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())



@user_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    current_user_id = session["user_id"]
    is_admin = session.get("is_admin", False)

    # Permite que o usuário atualize apenas seu próprio perfil, ou um admin atualize qualquer perfil
    if not is_admin and current_user_id != user_id:
        return jsonify({"error": "Unauthorized to update this user"}), 403

    user = User.query.get_or_404(user_id)
    data = request.json

    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    # Atualiza os campos do usuário com base nos dados recebidos
    if "username" in data:
        # Validação: verificar se o novo username já existe (exceto para o próprio usuário)
        if User.query.filter(User.username == data["username"], User.id != user_id).first():
            return jsonify({"error": "Username already taken"}), 400
        user.username = data["username"]

    if "email" in data:
        # Validação: verificar se o novo email já existe (exceto para o próprio usuário)
        if User.query.filter(User.email == data["email"], User.id != user_id).first():
            return jsonify({"error": "Email already taken"}), 400
        user.email = data["email"]

    if "password" in data:
        user.set_password(data["password"])

    if "is_admin" in data and is_admin: # Apenas admins podem alterar o status de admin
        user.is_admin = data["is_admin"]

    # Exemplo de outros campos que você pode querer atualizar:
    # if "some_other_field" in data:
    #     user.some_other_field = data["some_other_field"]

    db.session.commit()

    return jsonify(user.to_dict()), 200


