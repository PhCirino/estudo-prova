import os
import sys

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp

# Define a aplicação Flask
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações da aplicação
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Habilitar CORS para todas as rotas
CORS(app, supports_credentials=True)

# Configuração do Banco de Dados para o Render (PostgreSQL)
# O Render injeta a URL do banco de dados na variável de ambiente DATABASE_URL
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')

# Desabilita o rastreamento de modificações do SQLAlchemy (recomendado para produção)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados com a aplicação Flask
db.init_app(app)

# Cria as tabelas do banco de dados se elas não existirem
# Isso deve ser feito dentro de um contexto de aplicação
with app.app_context():
    db.create_all()

# Registra os blueprints das rotas da API
app.register_blueprint(user_bp, url_prefix='/api')

# Rota para servir os arquivos estáticos do frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    # Tenta servir o arquivo solicitado
    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        # Se o arquivo não for encontrado, tenta servir o index.html
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


# Bloco de execução principal
if __name__ == '__main__':
    # O host '0.0.0.0' permite que a aplicação seja acessível externamente
    # A porta 5000 é a porta padrão do Flask
    # debug=True é útil para desenvolvimento, mas deve ser False em produção
    app.run(host='0.0.0.0', port=5000, debug=True)
