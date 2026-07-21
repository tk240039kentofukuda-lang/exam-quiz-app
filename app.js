// ==========================================
// QUIZ APP - MAIN LOGIC
// ==========================================
(function () {
    'use strict';

    // ── State ──
    let currentCategory = null;
    let currentQuestions = [];
    let currentIndex = 0;
    let score = 0;
    let answered = 0;
    let userAnswers = []; // { questionIndex, selectedIndex, correctIndex, isCorrect }
    let startTime = null;
    let elapsedMs = 0;

    // ── DOM Refs ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const screens = {
        start: $('#startScreen'),
        quiz: $('#quizScreen'),
        result: $('#resultScreen'),
        review: $('#reviewScreen')
    };

    // ── Background Particles ──
    function initParticles() {
        const container = $('#bgParticles');
        const colors = ['#818cf8', '#c084fc', '#f472b6', '#a78bfa', '#6366f1'];
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            const size = Math.random() * 4 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.background = color;
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (Math.random() * 20 + 15) + 's';
            p.style.animationDelay = (Math.random() * 15) + 's';
            container.appendChild(p);
        }
    }

    // ── Screen Navigation ──
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
        // Re-trigger animation
        screens[name].style.animation = 'none';
        screens[name].offsetHeight; // force reflow
        screens[name].style.animation = '';
    }

    // ── Shuffle ──
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Start Quiz ──
    function startQuiz(category) {
        currentCategory = category;
        score = 0;
        answered = 0;
        currentIndex = 0;
        userAnswers = [];
        startTime = Date.now();

        // Collect questions
        let questions = [];
        if (category === 'all') {
            Object.keys(QUESTIONS).forEach(key => {
                QUESTIONS[key].questions.forEach((q, i) => {
                    questions.push({ ...q, categoryKey: key, originalIndex: i });
                });
            });
        } else {
            QUESTIONS[category].questions.forEach((q, i) => {
                questions.push({ ...q, categoryKey: category, originalIndex: i });
            });
        }

        const shouldShuffle = $('#shuffleToggle').checked;
        currentQuestions = shouldShuffle ? shuffle(questions) : questions;

        // Update header
        if (category === 'all') {
            $('#categoryLabel').textContent = '全問チャレンジ';
        } else {
            $('#categoryLabel').textContent = QUESTIONS[category].title;
        }

        showScreen('quiz');
        renderQuestion();
    }

    // ── Render Question ──
    function renderQuestion() {
        const q = currentQuestions[currentIndex];
        const total = currentQuestions.length;

        // Counter
        $('#questionCounter').textContent = `${currentIndex + 1} / ${total}`;
        $('#scoreCorrect').textContent = score;
        $('#scoreAnswered').textContent = answered;

        // Progress bar
        $('#progressBar').style.width = ((currentIndex) / total * 100) + '%';

        // Question
        $('#questionNumber').textContent = `Q${currentIndex + 1}`;
        $('#questionText').textContent = q.q;

        // Re-trigger question card animation
        const card = $('#questionCard');
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = '';

        // Choices
        const container = $('#choicesContainer');
        container.innerHTML = '';
        const labels = ['A', 'B', 'C', 'D'];
        q.choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.style.animationDelay = (0.05 + i * 0.05) + 's';
            btn.innerHTML = `
                <span class="choice-label">${labels[i]}</span>
                <span class="choice-text">${choice}</span>
            `;
            btn.addEventListener('click', () => selectAnswer(i));
            container.appendChild(btn);
        });

        // Hide explanation & next
        $('#explanationCard').classList.add('hidden');
        $('#btnNext').classList.add('hidden');
    }

    // ── Select Answer ──
    function selectAnswer(selectedIndex) {
        const q = currentQuestions[currentIndex];
        const correctIndex = q.answer;
        const isCorrect = selectedIndex === correctIndex;

        if (isCorrect) score++;
        answered++;

        userAnswers.push({
            questionData: q,
            selectedIndex,
            correctIndex,
            isCorrect
        });

        // Update score display
        $('#scoreCorrect').textContent = score;
        $('#scoreAnswered').textContent = answered;

        // Mark choices
        const buttons = $$('.choice-btn');
        buttons.forEach((btn, i) => {
            btn.disabled = true;
            if (i === correctIndex) {
                btn.classList.add('correct');
            } else if (i === selectedIndex && !isCorrect) {
                btn.classList.add('wrong');
            } else {
                btn.classList.add('dimmed');
            }
        });

        // Show explanation
        const expCard = $('#explanationCard');
        const expIcon = $('#explanationIcon');
        const expTitle = $('#explanationTitle');
        const expText = $('#explanationText');

        expCard.classList.remove('hidden');
        expCard.style.animation = 'none';
        expCard.offsetHeight;
        expCard.style.animation = '';

        if (isCorrect) {
            expIcon.textContent = '✅';
            expTitle.textContent = '正解！';
            expTitle.className = 'explanation-title correct-title';
        } else {
            expIcon.textContent = '❌';
            expTitle.textContent = '不正解…';
            expTitle.className = 'explanation-title wrong-title';
        }
        expText.textContent = q.explanation;

        // Show next button
        const btnNext = $('#btnNext');
        btnNext.classList.remove('hidden');
        const isLast = currentIndex >= currentQuestions.length - 1;
        btnNext.textContent = isLast ? '結果を見る' : '';
        btnNext.innerHTML = isLast
            ? '結果を見る <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4L13 9L7 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '次の問題へ <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4L13 9L7 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        // Scroll to explanation smoothly
        expCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Next Question ──
    function nextQuestion() {
        if (currentIndex >= currentQuestions.length - 1) {
            showResult();
        } else {
            currentIndex++;
            renderQuestion();
            // Scroll to top of quiz
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ── Show Result ──
    function showResult() {
        elapsedMs = Date.now() - startTime;
        const total = currentQuestions.length;
        const percent = Math.round((score / total) * 100);
        const wrong = total - score;

        // Time formatting
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

        showScreen('result');

        // Animate ring
        const circle = $('#resultCircle');
        const circumference = 2 * Math.PI * 70; // r=70
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = circumference;
        requestAnimationFrame(() => {
            circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
            circle.style.strokeDashoffset = offset;
        });

        // Animate percent number
        animateValue($('#resultPercent'), 0, percent, 1000);

        // Summary text
        $('#resultSummary').textContent = `${total}問中 ${score}問正解`;

        // Message
        let message = '';
        if (percent === 100) {
            message = '🎉 パーフェクト！ 完璧な理解度です。自信を持って試験に臨みましょう！';
        } else if (percent >= 80) {
            message = '🌟 素晴らしい！ よく理解できています。間違えた問題を復習すれば万全です。';
        } else if (percent >= 60) {
            message = '📚 良い調子！ あと少し復習すれば合格ラインに到達できます。';
        } else if (percent >= 40) {
            message = '💪 もう少し頑張りましょう！ 解説を読んで理解を深めてください。';
        } else {
            message = '📖 基礎から見直しましょう。教科書をもう一度読んでから再挑戦してみてください。';
        }
        $('#resultMessage').textContent = message;

        // Stats
        $('#statCorrect').textContent = score;
        $('#statWrong').textContent = wrong;
        $('#statTime').textContent = timeStr;

        // Confetti for high scores
        if (percent >= 80) {
            launchConfetti();
        }
    }

    // ── Animate counter ──
    function animateValue(el, start, end, duration) {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.textContent = Math.round(start + (end - start) * eased);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // ── Confetti ──
    function launchConfetti() {
        const canvas = document.createElement('canvas');
        canvas.id = 'confettiCanvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let frame = 0;
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;

            particles.forEach(p => {
                p.x += p.vx;
                p.vy += 0.05;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                if (frame > 60) {
                    p.opacity -= 0.015;
                }

                if (p.opacity > 0) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    ctx.restore();
                }
            });

            if (particles.some(p => p.opacity > 0)) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }
        requestAnimationFrame(animate);
    }

    // ── Review ──
    function showReview(filterWrongOnly = false) {
        showScreen('review');
        renderReviewList(filterWrongOnly ? 'wrong' : 'all');

        // Set active filter button
        $$('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === (filterWrongOnly ? 'wrong' : 'all'));
        });
    }

    function renderReviewList(filter) {
        const list = $('#reviewList');
        list.innerHTML = '';

        const labels = ['A', 'B', 'C', 'D'];

        userAnswers.forEach((ua, idx) => {
            if (filter === 'wrong' && ua.isCorrect) return;

            const item = document.createElement('div');
            item.className = `review-item ${ua.isCorrect ? 'is-correct' : 'is-wrong'}`;
            item.style.animationDelay = (idx * 0.04) + 's';

            const answersHtml = ua.questionData.choices.map((c, i) => {
                let classes = 'review-answer';
                if (i === ua.correctIndex) classes += ' was-correct';
                if (i === ua.selectedIndex && !ua.isCorrect) classes += ' was-selected was-wrong';
                return `<div class="${classes}">${labels[i]}. ${c}</div>`;
            }).join('');

            item.innerHTML = `
                <div class="review-item-header">
                    <span class="review-q-num">Q${idx + 1}</span>
                    <span class="review-result-tag ${ua.isCorrect ? 'correct' : 'wrong'}">
                        ${ua.isCorrect ? '正解' : '不正解'}
                    </span>
                </div>
                <p class="review-question">${ua.questionData.q}</p>
                <div class="review-answers">${answersHtml}</div>
                <div class="review-explanation">${ua.questionData.explanation}</div>
            `;
            list.appendChild(item);
        });

        if (list.children.length === 0) {
            list.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">不正解の問題はありません 🎉</p>';
        }
    }

    // ── Event Listeners ──
    function init() {
        initParticles();

        // Category buttons
        $$('.category-card').forEach(btn => {
            btn.addEventListener('click', () => {
                startQuiz(btn.dataset.category);
            });
        });

        // Back to start
        $('#btnBackToStart').addEventListener('click', () => {
            if (confirm('クイズを中断してカテゴリ選択に戻りますか？')) {
                showScreen('start');
            }
        });

        // Next question
        $('#btnNext').addEventListener('click', nextQuestion);

        // Result actions
        $('#btnRetry').addEventListener('click', () => {
            startQuiz(currentCategory);
        });

        $('#btnReview').addEventListener('click', () => {
            showReview(false);
        });

        $('#btnHome').addEventListener('click', () => {
            showScreen('start');
        });

        // Review screen
        $('#btnBackToResult').addEventListener('click', () => {
            showScreen('result');
        });

        $$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderReviewList(btn.dataset.filter);
            });
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (!screens.quiz.classList.contains('active')) return;

            // 1-4 or A-D to select choice
            const choiceBtns = $$('.choice-btn:not(:disabled)');
            if (choiceBtns.length > 0) {
                let idx = -1;
                if (e.key >= '1' && e.key <= '4') idx = parseInt(e.key) - 1;
                if (e.key === 'a' || e.key === 'A') idx = 0;
                if (e.key === 'b' || e.key === 'B') idx = 1;
                if (e.key === 'c' || e.key === 'C') idx = 2;
                if (e.key === 'd' || e.key === 'D') idx = 3;
                if (idx >= 0 && idx < choiceBtns.length) {
                    choiceBtns[idx].click();
                }
            }

            // Enter or Space for next
            if ((e.key === 'Enter' || e.key === ' ') && !$('#btnNext').classList.contains('hidden')) {
                e.preventDefault();
                nextQuestion();
            }
        });
    }

    // ── Boot ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
