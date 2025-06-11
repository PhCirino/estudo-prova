// Dados das questões (expandir conforme necessário)
// Sistema de Player de Vídeo Integrado
class VideoPlayer {
    constructor() {
        this.currentVideo = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
    }

    createVideoModal(videoData) {
        const modal = document.createElement('div');
        modal.className = 'modal video-modal';
        modal.innerHTML = `
            <div class="modal-content video-modal-content">
                <div class="video-header">
                    <h3>${videoData.title}</h3>
                    <span class="close video-close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="video-container">
                    <div class="video-player">
                        <iframe 
                            src="${this.getEmbedUrl(videoData.url)}" 
                            frameborder="0" 
                            allowfullscreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                        </iframe>
                    </div>
                    <div class="video-info">
                        <p class="video-description">${videoData.description}</p>
                        <div class="video-metadata">
                            <span class="video-duration">⏱️ ${videoData.duration}</span>
                            <span class="video-subject">📚 ${videoData.subject}</span>
                            <span class="video-level">📊 ${videoData.level}</span>
                        </div>
                    </div>
                </div>
                <div class="video-controls">
                    <button class="btn-video" onclick="videoPlayer.markAsWatched('${videoData.id}')">
                        <i class="fas fa-check"></i> Marcar como Assistido
                    </button>
                    <button class="btn-video" onclick="videoPlayer.addToFavorites('${videoData.id}')">
                        <i class="fas fa-heart"></i> Favoritar
                    </button>
                    <button class="btn-video" onclick="videoPlayer.takeNotes('${videoData.id}')">
                        <i class="fas fa-sticky-note"></i> Fazer Anotações
                    </button>
                </div>
                <div id="notesSection-${videoData.id}" class="notes-section" style="display: none;">
                    <h4>Suas Anotações</h4>
                    <textarea id="notes-${videoData.id}" placeholder="Digite suas anotações sobre esta aula..."></textarea>
                    <button onclick="videoPlayer.saveNotes('${videoData.id}')" class="btn-save-notes">Salvar Anotações</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Registrar início da sessão de estudo
        if (authManager.isLoggedIn()) {
            startStudySession(videoData.subject, videoData.title);
        }
        
        return modal;
    }

    getEmbedUrl(url) {
        // Converter URLs do YouTube para formato embed
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1].split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
        return url;
    }

    markAsWatched(videoId) {
        const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
        if (!watchedVideos.includes(videoId)) {
            watchedVideos.push(videoId);
            localStorage.setItem('watchedVideos', JSON.stringify(watchedVideos));
            
            // Adicionar experiência por assistir vídeo
            if (authManager.isLoggedIn()) {
                const sessionData = {
                    subject: 'Geral',
                    topic: 'Vídeo-aula',
                    duration: 15, // Estimativa de 15 minutos
                    session_type: 'video'
                };
                authManager.saveStudySession(sessionData);
            }
            
            showNotification('Vídeo marcado como assistido! +5 XP', 'success');
            this.updateVideoProgress();
        }
    }

    addToFavorites(videoId) {
        const favorites = JSON.parse(localStorage.getItem('favoriteVideos') || '[]');
        if (!favorites.includes(videoId)) {
            favorites.push(videoId);
            localStorage.setItem('favoriteVideos', JSON.stringify(favorites));
            showNotification('Vídeo adicionado aos favoritos!', 'success');
        } else {
            showNotification('Vídeo já está nos favoritos!', 'info');
        }
    }

    takeNotes(videoId) {
        const notesSection = document.getElementById(`notesSection-${videoId}`);
        if (notesSection.style.display === 'none') {
            notesSection.style.display = 'block';
            // Carregar anotações existentes
            const savedNotes = localStorage.getItem(`notes-${videoId}`);
            if (savedNotes) {
                document.getElementById(`notes-${videoId}`).value = savedNotes;
            }
        } else {
            notesSection.style.display = 'none';
        }
    }

    saveNotes(videoId) {
        const notes = document.getElementById(`notes-${videoId}`).value;
        localStorage.setItem(`notes-${videoId}`, notes);
        showNotification('Anotações salvas!', 'success');
    }

    updateVideoProgress() {
        const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
        const totalVideos = this.getTotalVideosCount();
        const progress = Math.round((watchedVideos.length / totalVideos) * 100);
        
        // Atualizar indicadores visuais de progresso
        const progressElements = document.querySelectorAll('.video-progress');
        progressElements.forEach(element => {
            element.textContent = `${watchedVideos.length}/${totalVideos} vídeos assistidos (${progress}%)`;
        });
    }

    getTotalVideosCount() {
        // Contar total de vídeos disponíveis
        let total = 0;
        Object.values(studyMaterials).forEach(subject => {
            Object.values(subject).forEach(topic => {
                if (topic.videos) {
                    total += topic.videos.length;
                }
            });
        });
        return total;
    }

    showVideoLibrary() {
        const modal = document.createElement('div');
        modal.className = 'modal video-library-modal';
        modal.innerHTML = `
            <div class="modal-content video-library-content">
                <div class="video-library-header">
                    <h2><i class="fas fa-video"></i> Biblioteca de Vídeos</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="video-filters">
                    <select id="subjectFilter" onchange="videoPlayer.filterVideos()">
                        <option value="">Todas as Disciplinas</option>
                        <option value="math">Matemática</option>
                        <option value="portuguese">Português</option>
                        <option value="social">Estudos Sociais</option>
                        <option value="science">Ciências</option>
                        <option value="english">Inglês</option>
                    </select>
                    <select id="statusFilter" onchange="videoPlayer.filterVideos()">
                        <option value="">Todos os Status</option>
                        <option value="watched">Assistidos</option>
                        <option value="unwatched">Não Assistidos</option>
                        <option value="favorites">Favoritos</option>
                    </select>
                </div>
                <div id="videoLibraryContent" class="video-library-grid">
                    ${this.generateVideoLibraryContent()}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    generateVideoLibraryContent() {
        const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '[]');
        const favoriteVideos = JSON.parse(localStorage.getItem('favoriteVideos') || '[]');
        let content = '';
        
        Object.entries(studyMaterials).forEach(([subjectKey, subject]) => {
            Object.entries(subject).forEach(([topicKey, topic]) => {
                if (topic.videos) {
                    topic.videos.forEach(video => {
                        const isWatched = watchedVideos.includes(video.id);
                        const isFavorite = favoriteVideos.includes(video.id);
                        
                        content += `
                            <div class="video-card" data-subject="${subjectKey}" data-status="${isWatched ? 'watched' : 'unwatched'}" ${isFavorite ? 'data-favorite="true"' : ''}>
                                <div class="video-thumbnail">
                                    <i class="fas fa-play-circle"></i>
                                    ${isWatched ? '<div class="watched-badge"><i class="fas fa-check"></i></div>' : ''}
                                    ${isFavorite ? '<div class="favorite-badge"><i class="fas fa-heart"></i></div>' : ''}
                                </div>
                                <div class="video-card-content">
                                    <h4>${video.title}</h4>
                                    <p>${video.description}</p>
                                    <div class="video-meta">
                                        <span><i class="fas fa-clock"></i> ${video.duration}</span>
                                        <span><i class="fas fa-tag"></i> ${video.subject}</span>
                                    </div>
                                    <button onclick="videoPlayer.playVideo('${video.id}')" class="btn-play-video">
                                        <i class="fas fa-play"></i> Assistir
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }
            });
        });
        
        return content || '<p>Nenhum vídeo encontrado.</p>';
    }

    filterVideos() {
        const subjectFilter = document.getElementById('subjectFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const videoCards = document.querySelectorAll('.video-card');
        
        videoCards.forEach(card => {
            let show = true;
            
            if (subjectFilter && card.dataset.subject !== subjectFilter) {
                show = false;
            }
            
            if (statusFilter) {
                if (statusFilter === 'watched' && card.dataset.status !== 'watched') {
                    show = false;
                } else if (statusFilter === 'unwatched' && card.dataset.status !== 'unwatched') {
                    show = false;
                } else if (statusFilter === 'favorites' && !card.dataset.favorite) {
                    show = false;
                }
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }

    playVideo(videoId) {
        // Encontrar o vídeo pelo ID
        let videoData = null;
        Object.values(studyMaterials).forEach(subject => {
            Object.values(subject).forEach(topic => {
                if (topic.videos) {
                    const video = topic.videos.find(v => v.id === videoId);
                    if (video) {
                        videoData = video;
                    }
                }
            });
        });
        
        if (videoData) {
            // Fechar biblioteca de vídeos se estiver aberta
            const libraryModal = document.querySelector('.video-library-modal');
            if (libraryModal) {
                libraryModal.remove();
            }
            
            this.createVideoModal(videoData);
        }
    }
}

// Instância global do player de vídeo
const videoPlayer = new VideoPlayer();

// Dados expandidos dos materiais de estudo com vídeos integrados
const studyMaterials = {
    math: [
        {
            question: "Qual o resultado de 15 + 23?",
            options: ["38", "37", "39", "40"],
            correct: 0,
            explanation: "15 + 23 = 38. Soma simples de dois números inteiros."
        },
        {
            question: "Qual é o MDC de 12 e 18?",
            options: ["2", "3", "6", "9"],
            correct: 2,
            explanation: "MDC(12,18) = 6. Os divisores comuns são 1, 2, 3, 6, sendo 6 o maior."
        },
        {
            question: "Quanto é 2³?",
            options: ["6", "8", "9", "12"],
            correct: 1,
            explanation: "2³ = 2 × 2 × 2 = 8"
        }
    ],
    portuguese: [
        {
            question: "Qual o antônimo de 'bom'?",
            options: ["ótimo", "mau", "excelente", "perfeito"],
            correct: 1,
            explanation: "Antônimo é a palavra de sentido contrário. O antônimo de 'bom' é 'mau'."
        },
        {
            question: "Qual a função sintática de 'livro' na frase 'João comprou um livro'?",
            options: ["Sujeito", "Objeto direto", "Objeto indireto", "Predicativo"],
            correct: 1,
            explanation: "'Livro' é objeto direto do verbo 'comprou' (comprou o quê? um livro)."
        }
    ],
    social: [
        {
            question: "Qual a capital do Brasil?",
            options: ["Rio de Janeiro", "São Paulo", "Brasília", "Belo Horizonte"],
            correct: 2,
            explanation: "Brasília é a capital federal do Brasil desde 1960."
        },
        {
            question: "Em que ano foi proclamada a Independência do Brasil?",
            options: ["1820", "1822", "1824", "1825"],
            correct: 1,
            explanation: "A Independência do Brasil foi proclamada em 7 de setembro de 1822."
        }
    ],
    science: [
        {
            question: "Qual o símbolo químico da água?",
            options: ["O2", "CO2", "H2O", "N2"],
            correct: 2,
            explanation: "H2O representa a molécula de água: 2 átomos de hidrogênio e 1 de oxigênio."
        },
        {
            question: "Qual a velocidade da luz no vácuo?",
            options: ["300.000 km/s", "150.000 km/s", "450.000 km/s", "600.000 km/s"],
            correct: 0,
            explanation: "A velocidade da luz no vácuo é aproximadamente 300.000 km/s."
        }
    ],
    english: [
        {
            question: "Translate 'hello' to Portuguese.",
            options: ["olá", "adeus", "obrigado", "por favor"],
            correct: 0,
            explanation: "'Hello' em português é 'olá', uma saudação comum."
        },
        {
            question: "What is the past tense of 'go'?",
            options: ["goed", "went", "gone", "going"],
            correct: 1,
            explanation: "O passado simples de 'go' é 'went' (verbo irregular)."
        }
    ]
};

// Materiais de estudo
const studyMaterials = {
    math: {
        title: "Matemática",
        icon: "fas fa-calculator",
        content: `
            <h2><i class="fas fa-calculator"></i> Matemática</h2>
            
            <h3>Aritmética</h3>
            <ul>
                <li><strong>Numeração e bases de numeração:</strong> Entender os diferentes sistemas de numeração (decimal, binário, etc.) e como converter entre eles.</li>
                <li><strong>Operações fundamentais:</strong> Revisão aprofundada das quatro operações com números inteiros, decimais e frações.</li>
                <li><strong>Números primos e fatoração:</strong> Identificação de números primos, crivo de Eratóstenes, fatoração.</li>
                <li><strong>MDC e MMC:</strong> Métodos de cálculo (fatoração, algoritmo de Euclides) e resolução de problemas.</li>
                <li><strong>Frações e decimais:</strong> Operações com frações, conversão entre frações e decimais, dízimas periódicas.</li>
                <li><strong>Sistema métrico:</strong> Unidades de medida e conversões entre unidades.</li>
                <li><strong>Potências e raízes:</strong> Propriedades das potências e raízes, operações com radicais.</li>
                <li><strong>Razões e proporções:</strong> Regra de três, porcentagem e juros simples.</li>
            </ul>
            <h4>Vídeos-aula de Aritmética:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=ccc-d-lMhZI" target="_blank">Colégio Naval 2012 Q6: Aritmética básica</a></li>
                <li><a href="https://www.youtube.com/watch?v=InzlIdFpLJY" target="_blank">Colégio Naval 2020 - Questão de Aritmética</a></li>
                <li><a href="https://www.youtube.com/playlist?list=PL37yQAz7qH5In_7QbKL2AnT2RoXeN0num" target="_blank">Preparatório Matemática Colégio Naval EPCAr (Playlist)</a></li>
                <li><a href="https://www.youtube.com/watch?v=CuafRhsH1O4" target="_blank">COLÉGIO NAVAL |2024 | Matemática | Média Aritmética | QUESTÃO 02</a></li>
                <li><a href="https://www.youtube.com/watch?v=y9J5u47i1q0" target="_blank">Colégio Naval- Aritmética- Misturas</a></li>
                <li><a href="https://www.youtube.com/watch?v=KBsv5RcL4RI" target="_blank">ARITMÉTICA PARA COLÉGIO NAVAL E IME</a></li>
                <li><a href="https://www.youtube.com/watch?v=OMhiK9e5uZ8" target="_blank">Colégio Naval 2024 Q8: Aritmética</a></li>
                <li><a href="https://www.youtube.com/watch?v=GrokZn6bnTo" target="_blank">Bateria de questões de MATEMÁTICA PARA COLÉGIO NAVAL E EPCAR</a></li>
                <li><a href="https://www.youtube.com/watch?v=ytV-ynGCFnc" target="_blank">Aula de Matemática para CN - Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=EtN2pJp5ROw" target="_blank">Colégio Naval 2024 Q7: 4 questões de aritmética em uma.</a></li>
            </ul>
            
            <h3>Álgebra</h3>
            <ul>
                <li><strong>Conjuntos numéricos:</strong> Definição e propriedades de N, Z, Q, R.</li>
                <li><strong>Expressões algébricas:</strong> Monômios, binômios, trinômios, polinômios.</li>
                <li><strong>Equações:</strong> Métodos de resolução de equações do 1º e 2º grau.</li>
                <li><strong>Funções:</strong> Função afim e quadrática, gráficos, raízes.</li>
            </ul>
            <h4>Vídeos-aula de Álgebra:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=EmKBjBf8VVU" target="_blank">Revisão Final Colégio Naval 2025 - Matemática (Álgebra)</a></li>
                <li><a href="https://www.youtube.com/playlist?list=PL37yQAz7qH5In_7QbKL2AnT2RoXeN0num" target="_blank">Preparatório Matemática Colégio Naval EPCAr (Playlist)</a></li>
                <li><a href="https://www.youtube.com/watch?v=TaTYLB8JV8o" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Matemática</a></li>
                <li><a href="https://www.youtube.com/watch?v=xQ9KssZr2ck" target="_blank">AULÃO 01 MATEMÁTICA PARA COLÉGIO NAVAL</a></li>
                <li><a href="https://www.youtube.com/watch?v=ZNu5Oy7_Yqw" target="_blank">Aula Matemática Álgebra cap 01-01 Números inteiros</a></li>
                <li><a href="https://www.youtube.com/watch?v=9jKVPZMibhY" target="_blank">Matemática | Álgebra | Equação do 1º grau | Colégio Naval e EPCAR</a></li>
                <li><a href="https://www.youtube.com/watch?v=P3wjcEAfCtY" target="_blank">Álgebra Concursos 9o ano - Colégio Naval EPCAR Colégio Militar CEFET - Produtos notáveis</a></li>
                <li><a href="https://www.youtube.com/watch?v=H1ITG_Rq88g" target="_blank">Aula ao vivo GRÁTIS - Matemática - Álgebra Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/channel/UC2oiRokiVCAWi8z0-iCfBiA/community" target="_blank">Algebrando no Papiro (Canal)</a></li>
                <li><a href="https://www.youtube.com/watch?v=uHG5d0jgmSQ" target="_blank">Matemática | Álgebra | Polinômios | Colégio Naval</a></li>
            </ul>
            
            <h3>Geometria e Trigonometria</h3>
            <ul>
                <li><strong>Geometria plana:</strong> Ângulos, polígonos, circunferência.</li>
                <li><strong>Triângulos:</strong> Semelhança, relações métricas, teorema de Pitágoras.</li>
                <li><strong>Trigonometria:</strong> Seno, cosseno, tangente, lei dos senos e cossenos.</li>
                <li><strong>Áreas e volumes:</strong> Cálculo de áreas de figuras planas e volumes de sólidos.</li>
            </ul>
            <h4>Vídeos-aula de Geometria e Trigonometria:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=6DULJzRJnd8" target="_blank">Concurso Colégio Naval 2025: Desvendando Geometria e Trigonometria</a></li>
                <li><a href="https://www.youtube.com/watch?v=E_IGd5P_rjI" target="_blank">Questão 11, COLÉGIO NAVAL CPACN 2023(Trigonometria)</a></li>
                <li><a href="https://www.youtube.com/watch?v=6JODbZGugc0" target="_blank">LEI DOS SENOS E COSSENOS JUNTOS? GEOMETRIA PLANA!/MATEMÁTICA /TRIGONOMETRIA/COLÉGIO NAVAL</a></li>
                <li><a href="https://www.youtube.com/watch?v=eTmaEzdd8QU" target="_blank">Colégio Naval 2023 Q 20: Geometria plana</a></li>
                <li><a href="https://www.youtube.com/playlist?list=PLt7DIWCE7kXc3V0HdTnYsjTPm3SOLzbGa" target="_blank">Preparatório Colégio Naval e EPCAR (Playlist)</a></li>
                <li><a href="https://www.youtube.com/watch?v=BjMGjV_BPa8" target="_blank">QUESTÃO 20 (Colégio Naval, 2021, prova verde) Geometria Plana, Trigonometria</a></li>
                <li><a href="https://www.youtube.com/watch?v=xQ9KssZr2ck" target="_blank">AULÃO 01 MATEMÁTICA PARA COLÉGIO NAVAL</a></li>
                <li><a href="https://www.youtube.com/watch?v=iunR9Nnr-mU" target="_blank">Geometria no Colégio Naval! Não é pra criança não!</a></li>
                <li><a href="https://www.youtube.com/watch?v=hIEqwfBZOVo" target="_blank">Questão 18, COLÉGIO NAVAL CPACN 2023(GEOMETRIA PLANA e TRIGONOMETRIA)</a></li>
                <li><a href="https://www.tiktok.com/@destrava.exatas/video/7350300429114281222" target="_blank">Geometria Plana: Questão do Colégio Naval (TikTok)</a></li>
            </ul>
        `
    },
    portuguese: {
        title: "Português",
        icon: "fas fa-pen",
        content: `
            <h2><i class="fas fa-pen"></i> Língua Portuguesa</h2>
            
            <h3>Gramática</h3>
            <ul>
                <li><strong>Vocabulário:</strong> Sinônimos, antônimos, homônimos, polissemia.</li>
                <li><strong>Classes de palavras:</strong> Substantivos, adjetivos, verbos, advérbios, etc.</li>
                <li><strong>Sintaxe:</strong> Termos da oração, período composto.</li>
                <li><strong>Concordância:</strong> Nominal e verbal, casos especiais.</li>
                <li><strong>Regência:</strong> Nominal e verbal, uso de preposições.</li>
                <li><strong>Crase:</strong> Regras de uso da crase.</li>
                <li><strong>Pontuação:</strong> Uso correto dos sinais de pontuação.</li>
                <li><strong>Acentuação:</strong> Regras de acentuação gráfica.</li>
            </ul>
            <h4>Vídeos-aula de Gramática:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=141EC9yPkJY" target="_blank">Português para Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=YZhtzo5U8W4" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Português | Classes de palavras</a></li>
                <li><a href="https://www.youtube.com/watch?v=rFVDmdf1t5M" target="_blank">Português para Colégio Naval - Prof. Fabíola Soares</a></li>
                <li><a href="https://www.youtube.com/watch?v=hsxLtBmJLzo" target="_blank">Concurso Colégio Naval 2026: Questões Comentadas de Português</a></li>
                <li><a href="https://www.youtube.com/watch?v=DizLYBAOpOE" target="_blank">[CORREÇÃO] Colégio Naval 2024/2025 - Língua Portuguesa</a></li>
                <li><a href="https://www.youtube.com/watch?v=tAYQy59a60c" target="_blank">AO VIVO | Aula de Língua Portuguesa para Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=1KM5xfQitjc" target="_blank">Português para o Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=5Sqn6L18T5Y" target="_blank">Revisão Final Colégio Naval 2025 - Português</a></li>
                <li><a href="https://www.youtube.com/watch?v=lvq5mDP35mI" target="_blank">Colégio Naval - Português com Márcio Wesley</a></li>
                <li><a href="https://www.youtube.com/watch?v=CNWaWUk90Tc" target="_blank">Colégio Naval 2023 - Resolução da prova de Português</a></li>
            </ul>
            
            <h3>Interpretação de Textos</h3>
            <ul>
                <li><strong>Estratégias de leitura:</strong> Identificação de ideias principais e secundárias.</li>
                <li><strong>Coesão e coerência:</strong> Elementos de ligação textual.</li>
                <li><strong>Figuras de linguagem:</strong> Metáfora, comparação, personificação, etc.</li>
                <li><strong>Funções da linguagem:</strong> Referencial, emotiva, conativa, etc.</li>
            </ul>
            <h4>Vídeos-aula de Interpretação de Textos:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=YZhtzo5U8W4" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Português | Classes de palavras</a></li>
                <li><a href="https://www.youtube.com/watch?v=141EC9yPkJY" target="_blank">Português para Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=rFVDmdf1t5M" target="_blank">Português para Colégio Naval - Prof. Fabíola Soares</a></li>
                <li><a href="https://www.youtube.com/watch?v=u3yQlzGvemI" target="_blank">Português para Carreiras militares: Interpretação textual</a></li>
                <li><a href="https://www.youtube.com/watch?v=MIU_E3MKBJU" target="_blank">Colégio Naval - Interpretação de Texto</a></li>
                <li><a href="https://www.youtube.com/watch?v=CNWaWUk90Tc" target="_blank">Colégio Naval 2023 - Resolução da prova de Português</a></li>
                <li><a href="https://www.youtube.com/watch?v=KNlxNZ1jUso" target="_blank">Concurso Colégio Naval - Aprendendo com os Erros</a></li>
                <li><a href="https://www.youtube.com/watch?v=tAYQy59a60c" target="_blank">AO VIVO | Aula de Língua Portuguesa para Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=vef5MXJhRv0" target="_blank">Aula de Português - EPCAR | COLÉGIO NAVAL</a></li>
                <li><a href="https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=1&institute_ids%5B%5D=6162" target="_blank">Questões Militares sobre Português para COLÉGIO NAVAL (QConcursos)</a></li>
            </ul>
            
            <h3>Redação</h3>
            <ul>
                <li><strong>Estrutura:</strong> Introdução, desenvolvimento, conclusão.</li>
                <li><strong>Argumentação:</strong> Tipos de argumentos, persuasão.</li>
                <li><strong>Tipos textuais:</strong> Narrativo, descritivo, dissertativo.</li>
                <li><strong>Coerência:</strong> Organização lógica das ideias.</li>
            </ul>
            <h4>Vídeos-aula de Redação:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=_KUXXxd0rUQ" target="_blank">Revisão Final Colégio Naval 2025 - Redação</a></li>
                <li><a href="https://www.youtube.com/watch?v=7qqDhhztigg" target="_blank">DICAS REDAÇÃO COLÉGIO NAVAL</a></li>
                <li><a href="https://www.youtube.com/watch?v=XRywM6Iywq0" target="_blank">Reta final Colégio Naval 2023 - Redação - Prof. Celina Gil</a></li>
                <li><a href="https://www.youtube.com/watch?v=2t9ltzUfEt8" target="_blank">PROJETO CN - AULA DE REDAÇÃO</a></li>
                <li><a href="https://www.tiktok.com/@maitlopesdealmeid/video/7354931911350897926" target="_blank">Como Redigir a Redação do Colégio Naval (TikTok)</a></li>
                <li><a href="https://www.youtube.com/playlist?list=PLt7DIWCE7kXc3V0HdTnYsjTPm3SOLzbGa" target="_blank">Preparatório Colégio Naval e EPCAR (Playlist)</a></li>
                <li><a href="https://www.youtube.com/watch?v=YZhtzo5U8W4" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Português</a></li>
                <li><a href="https://www.youtube.com/watch?v=na2V_H4cFRk" target="_blank">Revisão Colégio Naval (CN) 2024 - 2º Dia</a></li>
                <li><a href="https://www.youtube.com/watch?v=141EC9yPkJY" target="_blank">Português para Colégio Naval</a></li>
                <li><a href="https://www.tiktok.com/discover/temas-de-reda%C3%A7%C3%A3o-para-treinar-para-o-colegio-naval" target="_blank">Temas De Redação Para Treinar Para O Colegio Naval (TikTok)</a></li>
            </ul>
        `
    },
    social: {
        title: "Estudos Sociais",
        icon: "fas fa-globe-americas",
        content: `
            <h2><i class="fas fa-globe-americas"></i> Estudos Sociais</h2>
            
            <h3>Geografia do Brasil</h3>
            <ul>
                <li><strong>Aspectos físicos:</strong> Relevo, clima, vegetação, hidrografia.</li>
                <li><strong>Questão ambiental:</strong> Problemas ambientais, desenvolvimento sustentável.</li>
                <li><strong>Território:</strong> Formação e expansão do território brasileiro.</li>
                <li><strong>Economia:</strong> Setores econômicos, industrialização, agricultura.</li>
                <li><strong>População:</strong> Distribuição, urbanização, migração.</li>
                <li><strong>Geopolítica:</strong> Brasil no cenário mundial, blocos econômicos.</li>
            </ul>
            <h4>Vídeos-aula de Geografia do Brasil:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=mLkye28gvc0" target="_blank">Prepare-se para o Colégio Naval | Aulão de Estudos Sociais</a></li>
                <li><a href="https://www.youtube.com/watch?v=3ajmeXpo7kk" target="_blank">Revisão Final Colégio Naval 2025 - Geografia do Brasil</a></li>
                <li><a href="https://www.youtube.com/watch?v=ecimefqjjng" target="_blank">Aula de Geografia - Colégio Naval - AlfaCon</a></li>
                <li><a href="https://www.youtube.com/watch?v=Phsvf7OSCVk" target="_blank">Como estudar Geografia para a prova do Colégio Naval.</a></li>
                <li><a href="https://www.youtube.com/watch?v=Q5UCPAfWbGc" target="_blank">COLÉGIO NAVAL: GEOGRAFIA - Teorema Militar</a></li>
                <li><a href="https://www.youtube.com/watch?v=QZixGnHEkA8" target="_blank">o que você precisa saber de GEOGRAFIA!</a></li>
                <li><a href="https://www.youtube.com/watch?v=XImuQNAmvKA" target="_blank">Concurso Colégio Naval 2026: Questões Comentadas de Geografia do Brasil</a></li>
                <li><a href="https://www.youtube.com/watch?v=6cKeOriu9wM" target="_blank">Aula Exercícios de Geografia para Colégio Naval - CPACN</a></li>
                <li><a href="https://m.facebook.com/proffmat/videos/nova-turma-preparat%C3%B3ria-para-o-concurso-do-col%C3%A9gio-naval-e-epcarin%C3%ADcio-13-de-jan/1569762090316128/" target="_blank">Nova turma preparatória para o concurso do Colégio Naval e EPCAR (Facebook)</a></li>
                <li><a href="https://www.youtube.com/watch?v=NntaMrMtaII" target="_blank">Geografia para Colégio Naval - Prof. Saulo Takami</a></li>
            </ul>
            
            <h3>História do Brasil</h3>
            <ul>
                <li><strong>Período Colonial:</strong> Expansão ultramarina, colonização, economia colonial.</li>
                <li><strong>Independência:</strong> Movimentos nativistas, processo de independência.</li>
                <li><strong>Império:</strong> Primeiro e Segundo Reinado, abolição da escravidão.</li>
                <li><strong>República:</strong> Proclamação, República Velha, Era Vargas.</li>
                <li><strong>Brasil Contemporâneo:</strong> Ditadura militar, redemocratização.</li>
                <li><strong>Cultura:</strong> Contribuições africanas e indígenas.</li>
            </ul>
            <h4>Vídeos-aula de História do Brasil:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=mLkye28gvc0" target="_blank">Prepare-se para o Colégio Naval | Aulão de Estudos Sociais</a></li>
                <li><a href="https://www.youtube.com/watch?v=_pz5ILvxwFQ" target="_blank">Revisão Final Colégio Naval 2025 - História do Brasil</a></li>
                <li><a href="https://www.youtube.com/watch?v=OVyRH0USIlE" target="_blank">HISTÓRIA PARA COLÉGIO NAVAL - AULA 02</a></li>
                <li><a href="https://www.youtube.com/watch?v=zd03y91sFsI" target="_blank">História para Colégio Naval - Brasil República I - Prof. Marco Túlio</a></li>
                <li><a href="https://www.youtube.com/watch?v=V3WyNqttow4" target="_blank">História para Colégio Naval - Brasil Império I - Prof. Marco Túlio</a></li>
                <li><a href="https://www.youtube.com/watch?v=mFFPW3vHBl4" target="_blank">Aulões de Questões - Colégio Naval - História - Prof. Marco Túlio</a></li>
                <li><a href="https://www.youtube.com/watch?v=jUPsKTLmuiU" target="_blank">Concurso Colégio Naval 2026: Questões Comentadas de História do Brasil</a></li>
                <li><a href="https://m.facebook.com/proffmat/videos/nova-turma-preparat%C3%B3ria-para-o-concurso-do-col%C3%A9gio-naval-e-epcarin%C3%ADcio-13-de-jan/1569762090316128/" target="_blank">Nova turma preparatória para o concurso do Colégio Naval e EPCAR (Facebook)</a></li>
                <li><a href="https://www.youtube.com/watch?v=u5n662hd__o" target="_blank">Concurso Colégio Naval - Aprendendo com os Erros</a></li>
                <li><a href="https://www.alfaconcursos.com.br/cursos-gratuitos/cn-colegio-naval-gratuito?srsltid=AfmBOoruCtYT4yTTfhaCRvx-QUeaQXRm98qjdFEDuhI6hKiw2rM2eZT7" target="_blank">Curso gratuito para concurso Colégio Naval (AlfaCon)</a></li>
            </ul>
        `
    },
    science: {
        title: "Ciências",
        icon: "fas fa-flask",
        content: `
            <h2><i class="fas fa-flask"></i> Ciências</h2>
            
            <h3>Química</h3>
            <ul>
                <li><strong>Matéria:</strong> Estados físicos, propriedades, transformações.</li>
                <li><strong>Átomos:</strong> Estrutura atômica, tabela periódica.</li>
                <li><strong>Ligações químicas:</strong> Iônicas, covalentes, metálicas.</li>
                <li><strong>Reações químicas:</strong> Balanceamento, estequiometria.</li>
                <li><strong>Funções inorgânicas:</strong> Ácidos, bases, sais, óxidos.</li>
            </ul>
            <h4>Vídeos-aula de Química:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=JFG25L-WQsI" target="_blank">Ultimato Colégio Naval - Ciências (Física, Química e Biologia)</a></li>
                <li><a href="https://www.youtube.com/watch?v=2xHhSck3Znw" target="_blank">QUÍMICA PARA COLÉGIO NAVAL E EAM</a></li>
                <li><a href="https://www.youtube.com/watch?v=CDdm9T0JfU4" target="_blank">Especial Química Colégio Naval 2024 - com Prof. Guilherme Alves</a></li>
                <li><a href="https://www.youtube.com/watch?v=niczz_Gpag0" target="_blank">COLÉGIO NAVAL: FÍSICA, QUÍMICA E BIOLOGIA - Teorema Militar</a></li>
                <li><a href="https://m.youtube.com/watch?v=G8cgB1rqF5o&t=32s" target="_blank">QUÍMICA NO CN: O QUE ESPERAR DA PROVA?</a></li>
                <li><a href="https://www.youtube.com/watch?v=jJKvHWpJ4WE" target="_blank">QUÍMICA NO COLÉGIO NAVAL - REVISÃO DE VÉSPERA</a></li>
                <li><a href="https://www.youtube.com/watch?v=30nfgqNNKgA" target="_blank">Curso de Química do Colégio Naval</a></li>
                <li><a href="https://www.youtube.com/watch?v=Ni3YYp0Jfpw" target="_blank">Química: Colégio Naval - Prof. Wagner Bertolini</a></li>
                <li><a href="https://www.youtube.com/watch?v=2Y_zQNOvmSg" target="_blank">Correção Colégio Naval 2020 - Ciências (Biologia e Química)</a></li>
                <li><a href="https://www.alfaconcursos.com.br/cursos-gratuitos/cn-colegio-naval-gratuito?srsltid=AfmBOoruCtYT4yTTfhaCRvx-QUeaQXRm98qjdFEDuhI6hKiw2rM2eZT7" target="_blank">Curso gratuito para concurso Colégio Naval (AlfaCon)</a></li>
            </ul>
            
            <h3>Física</h3>
            <ul>
                <li><strong>Mecânica:</strong> Cinemática, dinâmica, leis de Newton.</li>
                <li><strong>Energia:</strong> Trabalho, energia cinética e potencial.</li>
                <li><strong>Termologia:</strong> Temperatura, calor, mudanças de estado.</li>
                <li><strong>Óptica:</strong> Reflexão, refração, lentes, espelhos.</li>
                <li><strong>Eletricidade:</strong> Carga elétrica, corrente, resistência.</li>
            </ul>
            <h4>Vídeos-aula de Física:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=JFG25L-WQsI" target="_blank">Ultimato Colégio Naval - Ciências (Física, Química e Biologia)</a></li>
                <li><a href="https://www.youtube.com/watch?v=vi7uKJ1wzI4" target="_blank">Curso completo de física para CN</a></li>
                <li><a href="https://www.youtube.com/watch?v=7pWbthG-Kak" target="_blank">Especial Física Colégio Naval 2024 - com Prof. Fulconi</a></li>
                <li><a href="https://www.youtube.com/watch?v=U-RLmVsYKyI" target="_blank">COLÉGIO NAVAL 2021 | TODAS AS QUESTÕES | FÍSICA</a></li>
                <li><a href="https://www.youtube.com/watch?v=3Fw4N87BVmg" target="_blank">Revisão Final Colégio Naval 2025 - Física - Parte 1</a></li>
                <li><a href="https://www.youtube.com/watch?v=niczz_Gpag0" target="_blank">COLÉGIO NAVAL: FÍSICA, QUÍMICA E BIOLOGIA - Teorema Militar</a></li>
                <li><a href="https://www.tiktok.com/@fisicadisruptiva/video/7428248195865578757" target="_blank">Aprendendo Física e Matemática no Colégio Naval (TikTok)</a></li>
                <li><a href="https://www.youtube.com/watch?v=j1x740QS2vY" target="_blank">Como Estudar Para A FÍSICA Do Colégio Naval? [MINHA EXPERIÊNCIA]</a></li>
                <li><a href="https://www.youtube.com/watch?v=bxOp8w5uOf4" target="_blank">Concurso Colégio Naval 2026: Questões Comentadas de Física</a></li>
                <li><a href="https://www.tiktok.com/@fisicadisruptiva/video/7417861144284630277" target="_blank">Resolvendo Questões do Colégio Naval 1998 (TikTok)</a></li>
            </ul>
            
            <h3>Biologia</h3>
            <ul>
                <li><strong>Citologia:</strong> Estrutura celular, organelas.</li>
                <li><strong>Genética:</strong> Leis de Mendel, DNA, RNA.</li>
                <li><strong>Evolução:</strong> Teorias evolutivas, seleção natural.</li>
                <li><strong>Ecologia:</strong> Cadeias alimentares, ciclos biogeoquímicos.</li>
                <li><strong>Fisiologia:</strong> Sistemas do corpo humano.</li>
            </ul>
            <h4>Vídeos-aula de Biologia:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=JFG25L-WQsI" target="_blank">Ultimato Colégio Naval - Ciências (Física, Química e Biologia)</a></li>
                <li><a href="https://www.youtube.com/watch?v=uUkQHhc6SNs" target="_blank">Aulões de Questões - Colégio Naval - Biologia - Prof. Daniel Reis</a></li>
                <li><a href="https://www.youtube.com/watch?v=GxBYN6l9IGE" target="_blank">Premonição Colégio Naval 2023 - Biologia - Prof. Daniel Reis</a></li>
                <li><a href="https://www.youtube.com/watch?v=2Y_zQNOvmSg" target="_blank">Correção Colégio Naval 2020 - Ciências (Biologia e Química)</a></li>
                <li><a href="https://www.youtube.com/watch?v=niczz_Gpag0" target="_blank">COLÉGIO NAVAL: FÍSICA, QUÍMICA E BIOLOGIA - Teorema Militar</a></li>
                <li><a href="https://www.youtube.com/watch?v=bZSMrU-wLcw" target="_blank">BIOLOGIA PARA COLÉGIO NAVAL - AULA 02</a></li>
                <li><a href="https://www.youtube.com/watch?v=vl7U7s-MOFg" target="_blank">Hora da Verdade CN: Revisão Geral - Biologia</a></li>
                <li><a href="https://www.youtube.com/watch?v=P-fvFHgs9oA" target="_blank">CORREÇÃO - Colégio Naval 2022 - Biologia</a></li>
                <li><a href="https://www.youtube.com/watch?v=ZRMhevdSH14" target="_blank">Especial Biologia CN - Prof. Daniel Reis</a></li>
                <li><a href="https://www.qconcursos.com/questoes-militares/questoes?discipline_ids%5B%5D=244&institute_ids%5B%5D=6162&page=6" target="_blank">Questões Militares sobre Biologia para COLÉGIO NAVAL (QConcursos)</a></li>
            </ul>
        `
    },
    english: {
        title: "Inglês",
        icon: "fas fa-globe",
        content: `
            <h2><i class="fas fa-globe"></i> English</h2>
            
            <h3>Grammar</h3>
            <ul>
                <li><strong>Nouns and Pronouns:</strong> Types, usage, agreement.</li>
                <li><strong>Articles and Adjectives:</strong> Definite, indefinite articles, adjective order.</li>
                <li><strong>Verbs and Tenses:</strong> Present, past, future, perfect tenses.</li>
                <li><strong>Modal Verbs:</strong> Can, could, may, might, must, should.</li>
                <li><strong>Conditionals:</strong> Zero, first, second, third conditionals.</li>
                <li><strong>Prepositions:</strong> Time, place, movement prepositions.</li>
            </ul>
            <h4>Vídeos-aula de Grammar:</h4>
            <ul>
                <li><a href="https://www.youtube.com/watch?v=IXBIpHFtQzQ" target="_blank">Inglês para Colégio Naval - Adjectives and Adverbs</a></li>
                <li><a href="https://www.youtube.com/watch?v=HRocWaoWYcw" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Inglês | Gramática</a></li>
                <li><a href="https://www.youtube.com/watch?v=_5-t4J94CZg" target="_blank">Aulões de Questões - Colégio Naval - Inglês</a></li>
                <li><a href="https://www.youtube.com/watch?v=Tuw8bsas7lQ" target="_blank">Concurso Colégio Naval 2026: Gabaritando 20 questões de Inglês</a></li>
                <li><a href="https://www.youtube.com/watch?v=TouGiu3zut8" target="_blank">Correção COLÉGIO NAVAL 2024/2025 I INGLÊS</a></li>
                <li><a href="https://www.youtube.com/watch?v=efnlsQPATgI" target="_blank">Revisão Final Colégio Naval 2025 - Inglês - Parte 1</a></li>
                <li><a href="https://www.youtube.com/watch?v=jdpZoYuVjFw" target="_blank">INGLÊS COLÉGIO NAVAL + DICAS PROVA</a></li>
                <li><a href="https://www.youtube.com/watch?v=ay3baAomlHY" target="_blank">INGLÊS PARA COLÉGIO NAVAL - AULA 02</a></li>
                <li><a href="https://www.youtube.com/watch?v=JctkNMxHaC8" target="_blank">COLÉGIO NAVAL - O QUE VOCÊ PRECISA SABER DE INGLÊS!</a></li>
                <li><a href="https://www.youtube.com/watch?v=8GLavS5GK3U" target="_blank">Inglês para AFA e Escola Naval - Adjectives and Adverbs</a></li>
            </ul>
            
            <h3>Reading Comprehension</h3>
            <ul>
                <li><strong>Reading Strategies:</strong> Skimming, scanning, detailed reading.</li>
                <li><strong>Text Types:</strong> Narratives, descriptions, arguments.</li>
                <li><strong>Vocabulary in Context:</strong> Inferring meaning from context.</li>
                <li><strong>Main Ideas:</strong> Identifying topic sentences, supporting details.</li>
            </ul>
            
            <h3>Word Formation</h3>
            <ul>
                <li><strong>Prefixes and Suffixes:</strong> Common word formation patterns.</li>
                <li><strong>Connectors:</strong> Linking words and phrases.</li>
                <li><strong>Collocations:</strong> Common word combinations.</li>
            </ul>
        `
    }
};

// Variáveis globais
let currentQuiz = null;
let currentQuestion = 0;
let score = 0;
let userAnswers = [];
let quizStartTime = null;

// Função para scroll suave para o topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Mostrar/ocultar botão de scroll para o topo
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Scroll suave para links de navegação
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 100;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Destacar link ativo na navegação
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Função para mostrar material de estudo
function showMaterial(subject) {
    const modal = document.getElementById('materialModal');
    const content = document.getElementById('materialContent');
    
    if (studyMaterials[subject]) {
        content.innerHTML = studyMaterials[subject].content;
        modal.style.display = 'block';
    }
}

// Função para fechar modal de material
function closeMaterial() {
    document.getElementById('materialModal').style.display = 'none';
}

// Função para iniciar quiz
function startQuiz(subject) {
    if (!questionsData[subject] || questionsData[subject].length === 0) {
        alert('Quiz não disponível para esta disciplina ainda.');
        return;
    }
    
    currentQuiz = subject;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    quizStartTime = new Date();
    
    const modal = document.getElementById('quizModal');
    modal.style.display = 'block';
    
    showQuestion();
}

// Função para mostrar questão
function showQuestion() {
    const content = document.getElementById('quizContent');
    const questions = questionsData[currentQuiz];
    const question = questions[currentQuestion];
    
    content.innerHTML = `
        <div class="quiz-header">
            <h2><i class="${studyMaterials[currentQuiz].icon}"></i> Quiz de ${studyMaterials[currentQuiz].title}</h2>
            <div class="quiz-progress">
                <span>Questão ${currentQuestion + 1} de ${questions.length}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((currentQuestion + 1) / questions.length) * 100}%"></div>
                </div>
            </div>
        
        <div class="question-container">
            <h3>${question.question}</h3>
            <div class="options-container">
                ${question.options.map((option, index) => `
                    <button class="option-btn" onclick="selectAnswer(${index})" data-index="${index}">
                        ${String.fromCharCode(65 + index)}) ${option}
                    </button>
                `).join('')}
            </div>
        </div>
        
        <div class="quiz-actions">
            <button class="btn-quiz" onclick="nextQuestion()" id="nextBtn" disabled>
                ${currentQuestion === questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Questão'}
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
}

// Função para selecionar resposta
function selectAnswer(answerIndex) {
    const options = document.querySelectorAll('.option-btn');
    options.forEach(btn => btn.classList.remove('selected'));
    
    const selectedOption = document.querySelector(`[data-index="${answerIndex}"]`);
    selectedOption.classList.add('selected');
    
    userAnswers[currentQuestion] = answerIndex;
    document.getElementById('nextBtn').disabled = false;
}

// Função para próxima questão
function nextQuestion() {
    const questions = questionsData[currentQuiz];
    
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        finishQuiz();
    }
}

// Função para finalizar quiz
function finishQuiz() {
    const questions = questionsData[currentQuiz];
    score = 0;
    
    // Calcular pontuação
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            score++;
        }
    });
    
    const percentage = Math.round((score / questions.length) * 100);
    const timeElapsed = Math.round((new Date() - quizStartTime) / 1000);
    
    showQuizResults(percentage, timeElapsed);
}

// Função para mostrar resultados do quiz
function showQuizResults(percentage, timeElapsed) {
    const content = document.getElementById('quizContent');
    const questions = questionsData[currentQuiz];
    
    let performanceMessage = '';
    let performanceClass = '';
    
    if (percentage >= 80) {
        performanceMessage = 'Excelente! Você está muito bem preparado!';
        performanceClass = 'excellent';
    } else if (percentage >= 60) {
        performanceMessage = 'Bom trabalho! Continue estudando para melhorar ainda mais.';
        performanceClass = 'good';
    } else {
        performanceMessage = 'Você precisa estudar mais esta matéria. Não desista!';
        performanceClass = 'needs-improvement';
    }
    
    content.innerHTML = `
        <div class="quiz-results">
            <h2><i class="fas fa-trophy"></i> Resultado do Quiz</h2>
            
            <div class="score-display ${performanceClass}">
                <div class="score-circle">
                    <span class="score-percentage">${percentage}%</span>
                    <span class="score-fraction">${score}/${questions.length}</span>
                </div>
                <p class="performance-message">${performanceMessage}</p>
            </div>
            
            <div class="quiz-stats">
                <div class="stat">
                    <i class="fas fa-clock"></i>
                    <span>Tempo: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-check-circle"></i>
                    <span>Acertos: ${score}</span>
                </div>
                <div class="stat">
                    <i class="fas fa-times-circle"></i>
                    <span>Erros: ${questions.length - score}</span>
                </div>
            </div>
            
            <div class="quiz-review">
                <h3>Revisão das Questões</h3>
                ${questions.map((question, index) => `
                    <div class="question-review ${userAnswers[index] === question.correct ? 'correct' : 'incorrect'}">
                        <h4>Questão ${index + 1}: ${question.question}</h4>
                        <p><strong>Sua resposta:</strong> ${question.options[userAnswers[index]] || 'Não respondida'}</p>
                        <p><strong>Resposta correta:</strong> ${question.options[question.correct]}</p>
                        <p><strong>Explicação:</strong> ${question.explanation}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="quiz-actions">
                <button class="btn-quiz" onclick="startQuiz('${currentQuiz}')">
                    <i class="fas fa-redo"></i> Refazer Quiz
                </button>
                <button class="btn-quiz" onclick="closeQuiz()">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
        </div>
    `;
}

// Função para fechar quiz
function closeQuiz() {
    document.getElementById('quizModal').style.display = 'none';
    currentQuiz = null;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
}

// Função para iniciar simulado
function startSimulation(type) {
    alert(`Simulado ${type} será implementado em breve! Esta funcionalidade incluirá questões de todas as disciplinas com cronômetro e relatório detalhado de desempenho.`);
}

// Função para fechar simulado
function closeSimulation() {
    document.getElementById('simulationModal').style.display = 'none';
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(event) {
    const materialModal = document.getElementById('materialModal');
    const quizModal = document.getElementById('quizModal');
    const simulationModal = document.getElementById('simulationModal');
    
    if (event.target === materialModal) {
        closeMaterial();
    }
    if (event.target === quizModal) {
        closeQuiz();
    }
    if (event.target === simulationModal) {
        closeSimulation();
    }
});

// Adicionar estilos CSS dinamicamente para os componentes do quiz
const quizStyles = document.createElement('style');
quizStyles.textContent = `
    .quiz-header {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .quiz-progress {
        margin-top: 15px;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
    }
    
    .question-container {
        margin: 30px 0;
    }
    
    .question-container h3 {
        margin-bottom: 20px;
        font-size: 1.2rem;
        color: #2c3e50;
    }
    
    .options-container {
        display: grid;
        gap: 10px;
    }
    
    .option-btn {
        padding: 15px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        background: white;
        text-align: left;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
    }
    
    .option-btn:hover {
        border-color: #667eea;
        background: #f8f9ff;
    }
    
    .option-btn.selected {
        border-color: #667eea;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }
    
    .quiz-actions {
        text-align: center;
        margin-top: 30px;
    }
    
    .quiz-results {
        text-align: center;
    }
    
    .score-display {
        margin: 30px 0;
    }
    
    .score-circle {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        border: 8px solid;
    }
    
    .score-display.excellent .score-circle {
        border-color: #4CAF50;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
    }
    
    .score-display.good .score-circle {
        border-color: #FF9800;
        background: linear-gradient(135deg, #FF9800, #f57c00);
        color: white;
    }
    
    .score-display.needs-improvement .score-circle {
        border-color: #f44336;
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
    }
    
    .score-percentage {
        font-size: 2rem;
        font-weight: bold;
    }
    
    .score-fraction {
        font-size: 1rem;
        opacity: 0.8;
    }
    
    .performance-message {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 10px 0;
    }
    
    .quiz-stats {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    
    .stat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
    }
    
    .stat i {
        color: #667eea;
    }
    
    .quiz-review {
        text-align: left;
        margin: 30px 0;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .question-review {
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid;
    }
    
    .question-review.correct {
        border-left-color: #4CAF50;
        background: #f1f8e9;
    }
    
    .question-review.incorrect {
        border-left-color: #f44336;
        background: #ffebee;
    }
    
    .question-review h4 {
        margin-bottom: 10px;
        color: #2c3e50;
    }
    
    .question-review p {
        margin: 5px 0;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .quiz-stats {
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .score-circle {
            width: 120px;
            height: 120px;
        }
        
        .score-percentage {
            font-size: 1.5rem;
        }
    }
`;
document.head.appendChild(quizStyles);


// Sistema de Acompanhamento de Desempenho
class PerformanceTracker {
    constructor() {
        this.storageKey = 'colegioNavalPerformance';
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            quizzes: {},
            simulations: {},
            studyTime: {},
            achievements: [],
            totalQuizzes: 0,
            totalCorrectAnswers: 0,
            totalQuestions: 0,
            startDate: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
    }

    saveData() {
        this.data.lastActivity = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    recordQuizResult(subject, score, totalQuestions, timeSpent) {
        if (!this.data.quizzes[subject]) {
            this.data.quizzes[subject] = [];
        }

        const result = {
            date: new Date().toISOString(),
            score: score,
            totalQuestions: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            timeSpent: timeSpent
        };

        this.data.quizzes[subject].push(result);
        this.data.totalQuizzes++;
        this.data.totalCorrectAnswers += score;
        this.data.totalQuestions += totalQuestions;

        this.checkAchievements(subject, result);
        this.saveData();
    }

    recordStudyTime(subject, timeSpent) {
        if (!this.data.studyTime[subject]) {
            this.data.studyTime[subject] = 0;
        }
        this.data.studyTime[subject] += timeSpent;
        this.saveData();
    }

    checkAchievements(subject, result) {
        const achievements = [];

        // Primeira vez fazendo quiz
        if (this.data.totalQuizzes === 1) {
            achievements.push({
                id: 'first_quiz',
                title: 'Primeiro Quiz!',
                description: 'Parabéns por fazer seu primeiro quiz!',
                icon: '🎯',
                date: new Date().toISOString()
            });
        }

        // Pontuação perfeita
        if (result.percentage === 100) {
            achievements.push({
                id: 'perfect_score',
                title: 'Pontuação Perfeita!',
                description: `100% em ${this.getSubjectName(subject)}!`,
                icon: '🏆',
                date: new Date().toISOString()
            });
        }

        // Melhoria significativa
        const subjectQuizzes = this.data.quizzes[subject];
        if (subjectQuizzes.length >= 2) {
            const previousBest = Math.max(...subjectQuizzes.slice(0, -1).map(q => q.percentage));
            if (result.percentage > previousBest + 20) {
                achievements.push({
                    id: 'improvement',
                    title: 'Grande Melhoria!',
                    description: `Melhorou mais de 20% em ${this.getSubjectName(subject)}!`,
                    icon: '📈',
                    date: new Date().toISOString()
                });
            }
        }

        // Consistência
        if (subjectQuizzes.length >= 3) {
            const lastThree = subjectQuizzes.slice(-3);
            const allAbove80 = lastThree.every(q => q.percentage >= 80);
            if (allAbove80) {
                achievements.push({
                    id: 'consistency',
                    title: 'Consistência!',
                    description: `3 quizzes seguidos acima de 80% em ${this.getSubjectName(subject)}!`,
                    icon: '🎖️',
                    date: new Date().toISOString()
                });
            }
        }

        // Adicionar conquistas únicas
        achievements.forEach(achievement => {
            const exists = this.data.achievements.some(a => a.id === achievement.id && a.description === achievement.description);
            if (!exists) {
                this.data.achievements.push(achievement);
            }
        });
    }

    getSubjectName(subject) {
        const names = {
            math: 'Matemática',
            portuguese: 'Português',
            science: 'Ciências',
            social: 'Estudos Sociais',
            english: 'Inglês'
        };
        return names[subject] || subject;
    }

    getOverallPerformance() {
        if (this.data.totalQuestions === 0) return 0;
        return Math.round((this.data.totalCorrectAnswers / this.data.totalQuestions) * 100);
    }

    getSubjectPerformance(subject) {
        if (!this.data.quizzes[subject] || this.data.quizzes[subject].length === 0) {
            return { average: 0, improvement: 0, lastScore: 0, quizCount: 0 };
        }

        const quizzes = this.data.quizzes[subject];
        const average = Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length);
        const lastScore = quizzes[quizzes.length - 1].percentage;
        const firstScore = quizzes[0].percentage;
        const improvement = lastScore - firstScore;

        return {
            average,
            improvement,
            lastScore,
            quizCount: quizzes.length
        };
    }

    getProgressData() {
        const subjects = ['math', 'portuguese', 'science', 'social', 'english'];
        const progressData = subjects.map(subject => {
            const performance = this.getSubjectPerformance(subject);
            return {
                subject: this.getSubjectName(subject),
                performance: performance.average,
                improvement: performance.improvement,
                quizCount: performance.quizCount
            };
        });

        return {
            overall: this.getOverallPerformance(),
            subjects: progressData,
            totalQuizzes: this.data.totalQuizzes,
            achievements: this.data.achievements,
            studyDays: this.getStudyDays()
        };
    }

    getStudyDays() {
        const startDate = new Date(this.data.startDate);
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getRecentActivity() {
        const allQuizzes = [];
        Object.keys(this.data.quizzes).forEach(subject => {
            this.data.quizzes[subject].forEach(quiz => {
                allQuizzes.push({
                    ...quiz,
                    subject: this.getSubjectName(subject)
                });
            });
        });

        return allQuizzes
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }
}

// Instância global do tracker
const performanceTracker = new PerformanceTracker();

// Função para mostrar dashboard de desempenho
function showPerformanceDashboard() {
    const modal = document.getElementById('performanceModal') || createPerformanceModal();
    const content = document.getElementById('performanceContent');
    
    const data = performanceTracker.getProgressData();
    const recentActivity = performanceTracker.getRecentActivity();
    
    content.innerHTML = `
        <div class="performance-dashboard">
            <h2><i class="fas fa-chart-line"></i> Dashboard de Desempenho</h2>
            
            <div class="performance-overview">
                <div class="stat-card overall">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <h3>Desempenho Geral</h3>
                        <div class="stat-value">${data.overall}%</div>
                        <div class="stat-label">${data.totalQuizzes} quizzes realizados</div>
                    </div>
                </div>
                
                <div class="stat-card days">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <h3>Dias de Estudo</h3>
                        <div class="stat-value">${data.studyDays}</div>
                        <div class="stat-label">dias desde o início</div>
                    </div>
                </div>
                
                <div class="stat-card achievements">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-info">
                        <h3>Conquistas</h3>
                        <div class="stat-value">${data.achievements.length}</div>
                        <div class="stat-label">conquistas desbloqueadas</div>
                    </div>
                </div>
            </div>
            
            <div class="subjects-performance">
                <h3>Desempenho por Disciplina</h3>
                <div class="subjects-grid">
                    ${data.subjects.map(subject => `
                        <div class="subject-card">
                            <h4>${subject.subject}</h4>
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: ${subject.performance}%"></div>
                            </div>
                            <div class="performance-stats">
                                <span class="performance-value">${subject.performance}%</span>
                                <span class="quiz-count">${subject.quizCount} quizzes</span>
                            </div>
                            ${subject.improvement !== 0 ? `
                                <div class="improvement ${subject.improvement > 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${subject.improvement > 0 ? 'up' : 'down'}"></i>
                                    ${Math.abs(subject.improvement)}% desde o primeiro quiz
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${data.achievements.length > 0 ? `
                <div class="achievements-section">
                    <h3>Conquistas Recentes</h3>
                    <div class="achievements-list">
                        ${data.achievements.slice(-3).reverse().map(achievement => `
                            <div class="achievement-item">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-info">
                                    <h4>${achievement.title}</h4>
                                    <p>${achievement.description}</p>
                                    <small>${new Date(achievement.date).toLocaleDateString('pt-BR')}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${recentActivity.length > 0 ? `
                <div class="recent-activity">
                    <h3>Atividade Recente</h3>
                    <div class="activity-list">
                        ${recentActivity.map(activity => `
                            <div class="activity-item">
                                <div class="activity-score ${activity.percentage >= 80 ? 'good' : activity.percentage >= 60 ? 'average' : 'needs-improvement'}">
                                    ${activity.percentage}%
                                </div>
                                <div class="activity-info">
                                    <h4>Quiz de ${activity.subject}</h4>
                                    <p>${activity.score}/${activity.totalQuestions} questões corretas</p>
                                    <small>${new Date(activity.date).toLocaleDateString('pt-BR')}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="performance-actions">
                <button class="btn-performance" onclick="resetPerformanceData()">
                    <i class="fas fa-refresh"></i> Resetar Dados
                </button>
                <button class="btn-performance" onclick="closePerformance()">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Função para criar modal de desempenho
function createPerformanceModal() {
    const modal = document.createElement('div');
    modal.id = 'performanceModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content performance-modal">
            <span class="close" onclick="closePerformance()">&times;</span>
            <div id="performanceContent"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Função para fechar modal de desempenho
function closePerformance() {
    const modal = document.getElementById('performanceModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para resetar dados de desempenho
function resetPerformanceData() {
    if (confirm('Tem certeza que deseja resetar todos os dados de desempenho? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('colegioNavalPerformance');
        performanceTracker.data = performanceTracker.loadData();
        showPerformanceDashboard();
    }
}

// Modificar a função finishQuiz para registrar o desempenho
const originalFinishQuiz = finishQuiz;
finishQuiz = function() {
    const questions = questionsData[currentQuiz];
    score = 0;
    
    // Calcular pontuação
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            score++;
        }
    });
    
    const timeElapsed = Math.round((new Date() - quizStartTime) / 1000);
    
    // Registrar resultado no sistema de desempenho
    performanceTracker.recordQuizResult(currentQuiz, score, questions.length, timeElapsed);
    
    const percentage = Math.round((score / questions.length) * 100);
    showQuizResults(percentage, timeElapsed);
};

// Adicionar estilos CSS para o dashboard de desempenho
const performanceStyles = document.createElement('style');
performanceStyles.textContent = `
    .performance-modal {
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .performance-dashboard h2 {
        text-align: center;
        margin-bottom: 30px;
        color: #2c3e50;
    }
    
    .performance-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .stat-card {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .stat-card.overall {
        background: linear-gradient(135deg, #4CAF50, #45a049);
    }
    
    .stat-card.days {
        background: linear-gradient(135deg, #2196F3, #1976D2);
    }
    
    .stat-card.achievements {
        background: linear-gradient(135deg, #FF9800, #f57c00);
    }
    
    .stat-icon {
        font-size: 2rem;
    }
    
    .stat-info h3 {
        margin: 0 0 5px 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        margin: 5px 0;
    }
    
    .stat-label {
        font-size: 0.8rem;
        opacity: 0.8;
    }
    
    .subjects-performance {
        margin-bottom: 30px;
    }
    
    .subjects-performance h3 {
        margin-bottom: 20px;
        color: #2c3e50;
    }
    
    .subjects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
    }
    
    .subject-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .subject-card h4 {
        margin: 0 0 15px 0;
        color: #2c3e50;
    }
    
    .performance-bar {
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 10px;
    }
    
    .performance-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
    }
    
    .performance-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .performance-value {
        font-weight: bold;
        color: #2c3e50;
    }
    
    .quiz-count {
        font-size: 0.9rem;
        color: #666;
    }
    
    .improvement {
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .improvement.positive {
        color: #4CAF50;
    }
    
    .improvement.negative {
        color: #f44336;
    }
    
    .achievements-section, .recent-activity {
        margin-bottom: 30px;
    }
    
    .achievements-section h3, .recent-activity h3 {
        margin-bottom: 15px;
        color: #2c3e50;
    }
    
    .achievements-list, .activity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .achievement-item, .activity-item {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .achievement-icon {
        font-size: 2rem;
        width: 50px;
        text-align: center;
    }
    
    .achievement-info h4, .activity-info h4 {
        margin: 0 0 5px 0;
        color: #2c3e50;
    }
    
    .achievement-info p, .activity-info p {
        margin: 0 0 5px 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .achievement-info small, .activity-info small {
        color: #999;
        font-size: 0.8rem;
    }
    
    .activity-score {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 0.9rem;
    }
    
    .activity-score.good {
        background: #4CAF50;
    }
    
    .activity-score.average {
        background: #FF9800;
    }
    
    .activity-score.needs-improvement {
        background: #f44336;
    }
    
    .performance-actions {
        text-align: center;
        margin-top: 30px;
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .btn-performance {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .btn-performance:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    @media (max-width: 768px) {
        .performance-overview {
            grid-template-columns: 1fr;
        }
        
        .subjects-grid {
            grid-template-columns: 1fr;
        }
        
        .performance-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .stat-card {
            flex-direction: column;
            text-align: center;
        }
        
        .stat-icon {
            font-size: 3rem;
        }
    }
`;
document.head.appendChild(performanceStyles);


// Sistema de Plano de Estudos Anual
let studyPlanData = [];

// Carregar dados do plano de estudos
async function loadStudyPlan() {
    try {
        const response = await fetch('plano_de_estudos_anual.json');
        studyPlanData = await response.json();
        renderStudyPlan();
        updatePlanProgress();
    } catch (error) {
        console.error('Erro ao carregar plano de estudos:', error);
        // Fallback com dados estáticos se o arquivo não for encontrado
        studyPlanData = getDefaultStudyPlan();
        renderStudyPlan();
        updatePlanProgress();
    }
}

// Dados padrão do plano de estudos (fallback)
function getDefaultStudyPlan() {
    return [
        {
            "week": 1,
            "theme": "Fundamentos da Matemática e Português",
            "topics": [
                {
                    "subject": "Matemática",
                    "topic": "Aritmética Básica",
                    "materials": [
                        {"type": "text", "title": "Numeração e Operações Fundamentais", "link": "#matematica-aritmetica"},
                        {"type": "video", "title": "Introdução à Aritmética", "id": "aritmetica_basica_video1"}
                    ]
                },
                {
                    "subject": "Português",
                    "topic": "Fonética e Fonologia",
                    "materials": [
                        {"type": "text", "title": "Fonemas e Encontros Vocálicos", "link": "#portugues-gramatica"},
                        {"type": "video", "title": "Acentuação Gráfica", "id": "portugues_gramatica_video1"}
                    ]
                }
            ]
        },
        {
            "week": 2,
            "theme": "Álgebra e Classes de Palavras",
            "topics": [
                {
                    "subject": "Matemática",
                    "topic": "Conjuntos Numéricos e Expressões Algébricas",
                    "materials": [
                        {"type": "text", "title": "Conjuntos Numéricos", "link": "#matematica-algebra"},
                        {"type": "video", "title": "Expressões Algébricas", "id": "algebra_expressoes_video1"}
                    ]
                },
                {
                    "subject": "Português",
                    "topic": "Classes de Palavras I",
                    "materials": [
                        {"type": "text", "title": "Substantivo e Artigo", "link": "#portugues-gramatica"},
                        {"type": "video", "title": "Adjetivo e suas Flexões", "id": "portugues_gramatica_video2"}
                    ]
                }
            ]
        }
    ];
}

// Renderizar o plano de estudos
function renderStudyPlan() {
    const container = document.getElementById('studyPlanContainer');
    if (!container) return;

    let html = '';
    
    studyPlanData.forEach(week => {
        const weekProgress = getWeekProgress(week.week);
        const isCompleted = weekProgress === 100;
        
        html += `
            <div class="study-week-card" data-week="${week.week}">
                <div class="week-header ${isCompleted ? 'completed' : ''}">
                    <div class="week-info">
                        <h3>
                            <i class="fas fa-calendar-week"></i> 
                            Semana ${week.week}
                            ${isCompleted ? '<i class="fas fa-check-circle completed-icon"></i>' : ''}
                        </h3>
                        <p class="week-theme">${week.theme}</p>
                    </div>
                    <div class="week-progress">
                        <span class="progress-text">${weekProgress}% concluído</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${weekProgress}%"></div>
                        </div>
                    </div>
                </div>
                <div class="week-topics">
                    ${week.topics.map(topic => renderTopic(topic, week.week)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Renderizar um tópico
function renderTopic(topic, weekNumber) {
    const subjectClass = getSubjectClass(topic.subject);
    const topicId = `week${weekNumber}_${topic.subject.toLowerCase().replace(/\s+/g, '_')}_${topic.topic.toLowerCase().replace(/\s+/g, '_')}`;
    const isCompleted = isTopicCompleted(topicId);
    
    return `
        <div class="topic-card ${subjectClass} ${isCompleted ? 'completed' : ''}" data-subject="${topic.subject}" data-topic-id="${topicId}">
            <div class="topic-header">
                <div class="topic-info">
                    <h4>
                        ${getSubjectIcon(topic.subject)} 
                        ${topic.subject}
                        ${isCompleted ? '<i class="fas fa-check-circle topic-completed-icon"></i>' : ''}
                    </h4>
                    <p class="topic-title">${topic.topic}</p>
                </div>
                <button class="topic-toggle" onclick="toggleTopic('${topicId}')">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="topic-materials" id="materials_${topicId}" style="display: none;">
                <h5><i class="fas fa-book-open"></i> Materiais de Estudo</h5>
                <div class="materials-list">
                    ${topic.materials.map(material => renderMaterial(material, topicId)).join('')}
                </div>
                <div class="topic-actions">
                    <button class="btn-topic-action" onclick="markTopicAsCompleted('${topicId}')">
                        <i class="fas fa-check"></i> Marcar como Concluído
                    </button>
                    <button class="btn-topic-action secondary" onclick="addTopicNote('${topicId}')">
                        <i class="fas fa-sticky-note"></i> Adicionar Nota
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Renderizar um material
function renderMaterial(material, topicId) {
    const materialId = `${topicId}_${material.type}_${Date.now()}`;
    const isCompleted = isMaterialCompleted(materialId);
    
    let icon = '';
    let action = '';
    
    switch (material.type) {
        case 'text':
            icon = '<i class="fas fa-file-text"></i>';
            action = `onclick="openTextMaterial('${material.link}', '${materialId}')"`;
            break;
        case 'video':
            icon = '<i class="fas fa-play-circle"></i>';
            action = `onclick="openVideoMaterial('${material.id}', '${materialId}')"`;
            break;
        case 'quiz':
            icon = '<i class="fas fa-question-circle"></i>';
            action = `onclick="openQuizMaterial('${material.id}', '${materialId}')"`;
            break;
        default:
            icon = '<i class="fas fa-book"></i>';
            action = `onclick="openGenericMaterial('${material.link}', '${materialId}')"`;
    }
    
    return `
        <div class="material-item ${isCompleted ? 'completed' : ''}" data-material-id="${materialId}">
            <div class="material-info">
                ${icon}
                <span class="material-title">${material.title}</span>
                ${isCompleted ? '<i class="fas fa-check-circle material-completed-icon"></i>' : ''}
            </div>
            <button class="btn-material" ${action}>
                ${material.type === 'video' ? 'Assistir' : material.type === 'quiz' ? 'Fazer Quiz' : 'Estudar'}
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
}

// Funções auxiliares
function getSubjectClass(subject) {
    const classes = {
        'Matemática': 'math',
        'Português': 'portuguese',
        'Estudos Sociais': 'social',
        'Ciências': 'science',
        'Inglês': 'english',
        'Geral': 'general'
    };
    return classes[subject] || 'general';
}

function getSubjectIcon(subject) {
    const icons = {
        'Matemática': '<i class="fas fa-calculator"></i>',
        'Português': '<i class="fas fa-pen"></i>',
        'Estudos Sociais': '<i class="fas fa-globe-americas"></i>',
        'Ciências': '<i class="fas fa-flask"></i>',
        'Inglês': '<i class="fas fa-globe"></i>',
        'Geral': '<i class="fas fa-book"></i>'
    };
    return icons[subject] || '<i class="fas fa-book"></i>';
}

// Funções de interação
function toggleTopic(topicId) {
    const materials = document.getElementById(`materials_${topicId}`);
    const toggle = document.querySelector(`[data-topic-id="${topicId}"] .topic-toggle i`);
    
    if (materials.style.display === 'none') {
        materials.style.display = 'block';
        toggle.style.transform = 'rotate(180deg)';
    } else {
        materials.style.display = 'none';
        toggle.style.transform = 'rotate(0deg)';
    }
}

function markTopicAsCompleted(topicId) {
    const completedTopics = JSON.parse(localStorage.getItem('completedTopics') || '[]');
    if (!completedTopics.includes(topicId)) {
        completedTopics.push(topicId);
        localStorage.setItem('completedTopics', JSON.stringify(completedTopics));
        
        // Adicionar XP por completar tópico
        if (authManager.isLoggedIn()) {
            const sessionData = {
                subject: 'Geral',
                topic: 'Tópico Concluído',
                duration: 30,
                session_type: 'study'
            };
            authManager.saveStudySession(sessionData);
        }
        
        showNotification('Tópico marcado como concluído! +10 XP', 'success');
        renderStudyPlan();
        updatePlanProgress();
    }
}

function addTopicNote(topicId) {
    const note = prompt('Digite sua anotação sobre este tópico:');
    if (note) {
        const notes = JSON.parse(localStorage.getItem('topicNotes') || '{}');
        notes[topicId] = note;
        localStorage.setItem('topicNotes', JSON.stringify(notes));
        showNotification('Anotação salva!', 'success');
    }
}

// Funções para abrir materiais
function openTextMaterial(link, materialId) {
    // Navegar para a seção de materiais e abrir o conteúdo específico
    if (link.startsWith('#')) {
        const section = link.substring(1);
        showMaterial(section.split('-')[0]);
    }
    markMaterialAsCompleted(materialId);
}

function openVideoMaterial(videoId, materialId) {
    // Encontrar e reproduzir o vídeo
    videoPlayer.playVideo(videoId);
    markMaterialAsCompleted(materialId);
}

function openQuizMaterial(quizId, materialId) {
    // Abrir o quiz específico
    if (quizId === 'simulado_completo') {
        startSimulado('completo');
    } else {
        // Abrir quiz específico por disciplina
        const subject = quizId.split('_')[0];
        startQuiz(subject);
    }
    markMaterialAsCompleted(materialId);
}

function openGenericMaterial(link, materialId) {
    if (link.startsWith('http')) {
        window.open(link, '_blank');
    } else if (link.startsWith('#')) {
        document.querySelector(link)?.scrollIntoView({ behavior: 'smooth' });
    }
    markMaterialAsCompleted(materialId);
}

// Funções de progresso
function markMaterialAsCompleted(materialId) {
    const completedMaterials = JSON.parse(localStorage.getItem('completedMaterials') || '[]');
    if (!completedMaterials.includes(materialId)) {
        completedMaterials.push(materialId);
        localStorage.setItem('completedMaterials', JSON.stringify(completedMaterials));
        updatePlanProgress();
    }
}

function isMaterialCompleted(materialId) {
    const completedMaterials = JSON.parse(localStorage.getItem('completedMaterials') || '[]');
    return completedMaterials.includes(materialId);
}

function isTopicCompleted(topicId) {
    const completedTopics = JSON.parse(localStorage.getItem('completedTopics') || '[]');
    return completedTopics.includes(topicId);
}

function getWeekProgress(weekNumber) {
    const week = studyPlanData.find(w => w.week === weekNumber);
    if (!week) return 0;
    
    let totalMaterials = 0;
    let completedMaterials = 0;
    
    week.topics.forEach(topic => {
        totalMaterials += topic.materials.length;
        topic.materials.forEach(material => {
            const materialId = `week${weekNumber}_${topic.subject.toLowerCase().replace(/\s+/g, '_')}_${topic.topic.toLowerCase().replace(/\s+/g, '_')}_${material.type}_${Date.now()}`;
            if (isMaterialCompleted(materialId)) {
                completedMaterials++;
            }
        });
    });
    
    return totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
}

function updatePlanProgress() {
    const totalWeeks = studyPlanData.length;
    let completedWeeks = 0;
    
    studyPlanData.forEach(week => {
        if (getWeekProgress(week.week) === 100) {
            completedWeeks++;
        }
    });
    
    const overallProgress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
    
    const progressElement = document.getElementById('planProgress');
    const progressBarElement = document.getElementById('planProgressBar');
    
    if (progressElement) {
        progressElement.textContent = `${overallProgress}% concluído`;
    }
    
    if (progressBarElement) {
        progressBarElement.style.width = `${overallProgress}%`;
    }
}

// Função de filtro
function filterStudyPlan() {
    const weekFilter = document.getElementById('weekFilter')?.value;
    const subjectFilter = document.getElementById('subjectPlanFilter')?.value;
    
    const weekCards = document.querySelectorAll('.study-week-card');
    
    weekCards.forEach(card => {
        let showWeek = true;
        
        // Filtro por semana
        if (weekFilter && card.dataset.week !== weekFilter) {
            showWeek = false;
        }
        
        // Filtro por disciplina
        if (subjectFilter && showWeek) {
            const topicCards = card.querySelectorAll('.topic-card');
            let hasMatchingSubject = false;
            
            topicCards.forEach(topicCard => {
                if (topicCard.dataset.subject === subjectFilter) {
                    hasMatchingSubject = true;
                    topicCard.style.display = 'block';
                } else if (subjectFilter) {
                    topicCard.style.display = 'none';
                } else {
                    topicCard.style.display = 'block';
                }
            });
            
            if (subjectFilter && !hasMatchingSubject) {
                showWeek = false;
            }
        } else {
            // Mostrar todos os tópicos se não há filtro de disciplina
            const topicCards = card.querySelectorAll('.topic-card');
            topicCards.forEach(topicCard => {
                topicCard.style.display = 'block';
            });
        }
        
        card.style.display = showWeek ? 'block' : 'none';
    });
}

// Inicializar o plano de estudos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    loadStudyPlan();
});


