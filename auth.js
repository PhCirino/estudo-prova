// Sistema de Autenticação e Usuários
class AuthManager {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.currentUser = null;
        this.loadCurrentUser();
    }

    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.baseURL}/me`, {
                credentials: 'include'
            });
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUI();
            }
        } catch (error) {
            console.log('No user logged in');
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.currentUser = data.user;
                this.updateUI();
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, user: data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            this.currentUser = null;
            this.updateUI();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    async saveQuizResult(resultData) {
        if (!this.currentUser) return null;

        try {
            const response = await fetch(`${this.baseURL}/quiz-result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(resultData)
            });

            if (response.ok) {
                const data = await response.json();
                // Atualizar dados do usuário atual
                await this.loadCurrentUser();
                return data;
            }
        } catch (error) {
            console.error('Erro ao salvar resultado:', error);
        }
        return null;
    }

    async saveStudySession(sessionData) {
        if (!this.currentUser) return null;

        try {
            const response = await fetch(`${this.baseURL}/study-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sessionData)
            });

            if (response.ok) {
                const data = await response.json();
                await this.loadCurrentUser();
                return data;
            }
        } catch (error) {
            console.error('Erro ao salvar sessão de estudo:', error);
        }
        return null;
    }

    async getUserAchievements() {
        if (!this.currentUser) return [];

        try {
            const response = await fetch(`${this.baseURL}/achievements`, {
                credentials: 'include'
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao buscar conquistas:', error);
        }
        return [];
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const adminSection = document.getElementById('adminSection');

        if (this.currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            
            // Atualizar informações do usuário
            this.updateUserInfo();
            
            // Mostrar seção admin se for admin
            if (this.currentUser.is_admin && adminSection) {
                adminSection.style.display = 'block';
            }
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (adminSection) adminSection.style.display = 'none';
        }
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userLevelElement = document.getElementById('userLevel');
        const userXPElement = document.getElementById('userXP');
        const levelProgressBar = document.getElementById('levelProgressBar');

        if (userNameElement) userNameElement.textContent = this.currentUser.username;
        if (userLevelElement) userLevelElement.textContent = `Nível ${this.currentUser.level}`;
        if (userXPElement) userXPElement.textContent = `${this.currentUser.experience_points} XP`;
        
        if (levelProgressBar && this.currentUser.level_progress) {
            const progress = this.currentUser.level_progress.progress_percentage;
            levelProgressBar.style.width = `${progress}%`;
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.is_admin;
    }
}

// Sistema de Níveis e Conquistas
class LevelSystem {
    constructor(authManager) {
        this.authManager = authManager;
        this.achievements = [];
        this.loadAchievements();
    }

    async loadAchievements() {
        this.achievements = await this.authManager.getUserAchievements();
    }

    getLevelInfo(level) {
        const levelData = {
            1: { name: 'Iniciante', color: '#95a5a6', icon: '🌱' },
            2: { name: 'Estudante', color: '#3498db', icon: '📚' },
            3: { name: 'Dedicado', color: '#9b59b6', icon: '💪' },
            4: { name: 'Avançado', color: '#e67e22', icon: '🎯' },
            5: { name: 'Expert', color: '#e74c3c', icon: '🏆' },
            6: { name: 'Mestre', color: '#f39c12', icon: '👑' },
            7: { name: 'Lenda', color: '#2ecc71', icon: '⭐' },
            8: { name: 'Campeão', color: '#1abc9c', icon: '🥇' },
            9: { name: 'Gênio', color: '#8e44ad', icon: '🧠' },
            10: { name: 'Colégio Naval', color: '#2c3e50', icon: '⚓' }
        };

        return levelData[Math.min(level, 10)] || levelData[10];
    }

    showLevelUpModal(newLevel) {
        const levelInfo = this.getLevelInfo(newLevel);
        
        const modal = document.createElement('div');
        modal.className = 'modal level-up-modal';
        modal.innerHTML = `
            <div class="modal-content level-up-content">
                <div class="level-up-animation">
                    <div class="level-up-icon">${levelInfo.icon}</div>
                    <h2>PARABÉNS!</h2>
                    <h3>Você subiu para o nível ${newLevel}!</h3>
                    <p class="level-name" style="color: ${levelInfo.color}">${levelInfo.name}</p>
                    <div class="level-up-effects">
                        <div class="sparkle">✨</div>
                        <div class="sparkle">⭐</div>
                        <div class="sparkle">🎉</div>
                    </div>
                    <button onclick="this.closest('.modal').remove()" class="btn-level-up">
                        Continuar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Animação de entrada
        setTimeout(() => {
            modal.querySelector('.level-up-content').classList.add('animate-in');
        }, 100);
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h4>Nova Conquista!</h4>
                <p>${achievement.name}</p>
                <small>+${achievement.experience_reward} XP</small>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificação
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Sistema Admin
class AdminManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.students = [];
    }

    async loadStudents() {
        if (!this.authManager.isAdmin()) return;

        try {
            const response = await fetch(`${this.authManager.baseURL}/admin/students`, {
                credentials: 'include'
            });

            if (response.ok) {
                this.students = await response.json();
                this.updateStudentsList();
            }
        } catch (error) {
            console.error('Erro ao carregar estudantes:', error);
        }
    }

    async createStudent(studentData) {
        try {
            const response = await fetch(`${this.authManager.baseURL}/admin/create-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(studentData)
            });

            const data = await response.json();
            if (response.ok) {
                await this.loadStudents();
                return { success: true, student: data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Erro de conexão' };
        }
    }

    async getStudentProgress(studentId) {
        try {
            const response = await fetch(`${this.authManager.baseURL}/admin/student/${studentId}/progress`, {
                credentials: 'include'
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao buscar progresso do estudante:', error);
        }
        return null;
    }

    updateStudentsList() {
        const studentsContainer = document.getElementById('studentsContainer');
        if (!studentsContainer) return;

        studentsContainer.innerHTML = this.students.map(student => `
            <div class="student-card" onclick="adminManager.showStudentProgress(${student.id})">
                <div class="student-avatar">
                    <div class="level-badge">${student.level}</div>
                </div>
                <div class="student-info">
                    <h4>${student.username}</h4>
                    <p>Nível ${student.level} • ${student.experience_points} XP</p>
                    <p>Tempo de estudo: ${Math.round(student.total_study_time / 60)}h</p>
                    <small>Último acesso: ${student.last_login ? new Date(student.last_login).toLocaleDateString('pt-BR') : 'Nunca'}</small>
                </div>
                <div class="student-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${student.level_progress.progress_percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async showStudentProgress(studentId) {
        const progressData = await this.getStudentProgress(studentId);
        if (!progressData) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content student-progress-modal">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>Progresso de ${progressData.student.username}</h2>
                
                <div class="student-stats">
                    <div class="stat-card">
                        <h3>Nível ${progressData.student.level}</h3>
                        <p>${progressData.student.experience_points} XP</p>
                    </div>
                    <div class="stat-card">
                        <h3>${Math.round(progressData.student.total_study_time / 60)}h</h3>
                        <p>Tempo de estudo</p>
                    </div>
                    <div class="stat-card">
                        <h3>${progressData.achievements.length}</h3>
                        <p>Conquistas</p>
                    </div>
                </div>

                <div class="recent-activity">
                    <h3>Atividade Recente</h3>
                    <div class="quiz-results">
                        ${progressData.recent_quiz_results.map(result => `
                            <div class="quiz-result-item">
                                <span class="subject">${result.subject}</span>
                                <span class="score ${result.percentage >= 80 ? 'good' : result.percentage >= 60 ? 'average' : 'needs-improvement'}">
                                    ${result.percentage}%
                                </span>
                                <span class="date">${new Date(result.completed_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="achievements-section">
                    <h3>Conquistas</h3>
                    <div class="achievements-grid">
                        ${progressData.achievements.map(achievement => `
                            <div class="achievement-badge">
                                <span class="achievement-icon">${achievement.achievement.icon}</span>
                                <span class="achievement-name">${achievement.achievement.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }
}

// Instâncias globais
const authManager = new AuthManager();
const levelSystem = new LevelSystem(authManager);
const adminManager = new AdminManager(authManager);

// Funções de interface
function showLoginModal() {
    const modal = document.getElementById('loginModal') || createLoginModal();
    modal.style.display = 'block';
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal') || createRegisterModal();
    modal.style.display = 'block';
}

function createLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content auth-modal">
            <span class="close" onclick="document.getElementById('loginModal').style.display='none'">&times;</span>
            <h2>Entrar</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginUsername">Usuário:</label>
                    <input type="text" id="loginUsername" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Senha:</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn-auth">Entrar</button>
                <p>Não tem conta? <a href="#" onclick="showRegisterModal(); document.getElementById('loginModal').style.display='none'">Registre-se</a></p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await authManager.login(username, password);
        if (result.success) {
            modal.style.display = 'none';
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    });
    
    return modal;
}

function createRegisterModal() {
    const modal = document.createElement('div');
    modal.id = 'registerModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content auth-modal">
            <span class="close" onclick="document.getElementById('registerModal').style.display='none'">&times;</span>
            <h2>Registrar</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerUsername">Usuário:</label>
                    <input type="text" id="registerUsername" required>
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email:</label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">Senha:</label>
                    <input type="password" id="registerPassword" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="registerIsAdmin"> Conta de Administrador (Pai/Mãe)
                    </label>
                </div>
                <button type="submit" class="btn-auth">Registrar</button>
                <p>Já tem conta? <a href="#" onclick="showLoginModal(); document.getElementById('registerModal').style.display='none'">Entre</a></p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('registerUsername').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            is_admin: document.getElementById('registerIsAdmin').checked
        };
        
        const result = await authManager.register(userData);
        if (result.success) {
            modal.style.display = 'none';
            showNotification('Conta criada com sucesso! Faça login para continuar.', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    });
    
    return modal;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modificar a função finishQuiz original para integrar com o sistema de usuários
const originalFinishQuiz = window.finishQuiz;
window.finishQuiz = async function() {
    const questions = questionsData[currentQuiz];
    score = 0;
    
    // Calcular pontuação
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            score++;
        }
    });
    
    const timeElapsed = Math.round((new Date() - quizStartTime) / 1000);
    const percentage = Math.round((score / questions.length) * 100);
    
    // Salvar resultado se usuário estiver logado
    if (authManager.isLoggedIn()) {
        const resultData = {
            subject: currentQuiz,
            score: score,
            total_questions: questions.length,
            time_spent: timeElapsed,
            quiz_type: 'quiz'
        };
        
        const saveResult = await authManager.saveQuizResult(resultData);
        if (saveResult) {
            // Verificar se subiu de nível
            if (saveResult.level_up) {
                setTimeout(() => {
                    levelSystem.showLevelUpModal(authManager.currentUser.level);
                }, 1000);
            }
            
            // Mostrar experiência ganha
            showNotification(`+${saveResult.experience_gained} XP ganhos!`, 'success');
        }
    }
    
    showQuizResults(percentage, timeElapsed);
};

// Adicionar sistema de sessões de estudo
let studyStartTime = null;

function startStudySession(subject, topic) {
    studyStartTime = new Date();
    
    if (authManager.isLoggedIn()) {
        showNotification(`Sessão de estudo iniciada: ${subject} - ${topic}`, 'info');
    }
}

function endStudySession(subject, topic, sessionType = 'theory') {
    if (!studyStartTime || !authManager.isLoggedIn()) return;
    
    const duration = Math.round((new Date() - studyStartTime) / (1000 * 60)); // em minutos
    
    if (duration > 0) {
        const sessionData = {
            subject: subject,
            topic: topic,
            duration: duration,
            session_type: sessionType
        };
        
        authManager.saveStudySession(sessionData);
        showNotification(`Sessão de estudo concluída: ${duration} minutos`, 'success');
    }
    
    studyStartTime = null;
}

