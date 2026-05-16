// JavaScript для сайта со стихами - версия с добавлением стихов

document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const addPoemForm = document.getElementById('add-poem-form');
    const clearFormBtn = document.getElementById('clear-form');
    const poemsGrid = document.getElementById('poems-grid');
    const emptyState = document.getElementById('empty-state');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('poem-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalTitle = document.getElementById('modal-poem-title');
    const modalAuthor = document.getElementById('modal-poem-author');
    const modalText = document.getElementById('modal-poem-text');
    const collectionStats = document.getElementById('collection-stats');
    
    // Элементы для предпросмотра
    const previewTitle = document.querySelector('.preview-title');
    const previewAuthor = document.querySelector('.preview-author');
    const previewContent = document.querySelector('.preview-content');
    const previewCategories = document.querySelector('.preview-categories');
    
    // Поля формы
    const titleInput = document.getElementById('poem-title');
    const authorInput = document.getElementById('poem-author');
    const textInput = document.getElementById('poem-text');
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    
    // Ключ для localStorage
    const STORAGE_KEY = 'userPoems';
    let poems = [];
    let currentPoemId = null;
    
    // Инициализация
    loadPoems();
    updateUI();
    setupEventListeners();
    setupFormPreview();
    
    // Загрузка стихов из localStorage
    function loadPoems() {
        const stored = localStorage.getItem(STORAGE_KEY);
        poems = stored ? JSON.parse(stored) : [];
    }
    
    // Сохранение стихов в localStorage
    function savePoems() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(poems));
    }
    
    // Обновление интерфейса
    function updateUI() {
        renderPoems();
        updateStats();
        updateEmptyState();
    }
    
    // Обновление статистики
    function updateStats() {
        const poemCount = poems.length;
        const authorCount = new Set(poems.map(p => p.author)).size;
        const categoryCount = new Set(poems.flatMap(p => p.categories)).size;
        
        document.querySelectorAll('.collection-stats h3')[0].textContent = poemCount;
        document.querySelectorAll('.collection-stats h3')[1].textContent = authorCount;
        document.querySelectorAll('.collection-stats h3')[2].textContent = categoryCount;
    }
    
    // Обновление состояния пустой коллекции
    function updateEmptyState() {
        if (poems.length === 0) {
            emptyState.style.display = 'block';
            poemsGrid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            poemsGrid.style.display = 'grid';
        }
    }
    
    // Рендеринг стихов
    function renderPoems(filter = 'all') {
        poemsGrid.innerHTML = '';
        
        const filteredPoems = filter === 'all' 
            ? poems 
            : poems.filter(poem => poem.categories.includes(filter));
        
        filteredPoems.forEach(poem => {
            const poemCard = createPoemCard(poem);
            poemsGrid.appendChild(poemCard);
        });
    }
    
    // Создание карточки стиха
    function createPoemCard(poem) {
        const card = document.createElement('div');
        card.className = 'poem-card';
        card.dataset.id = poem.id;
        card.dataset.categories = poem.categories.join(' ');
        
        // Преобразование текста для предпросмотра (первые 4 строки)
        const lines = poem.text.split('\n').filter(line => line.trim() !== '');
        const previewLines = lines.slice(0, 4);
        const previewText = previewLines.join('<br>');
        
        card.innerHTML = `
            <div class="poem-header">
                <h3 class="poem-title">${escapeHtml(poem.title)}</h3>
                <span class="poem-author">${escapeHtml(poem.author)}</span>
            </div>
            <div class="poem-content">
                <p>${previewText}</p>
                ${lines.length > 4 ? '<p>...</p>' : ''}
            </div>
            <div class="poem-footer">
                <button class="read-more-btn" data-id="${poem.id}">Читать полностью</button>
                <div class="poem-actions">
                    <button class="like-btn" data-id="${poem.id}">
                        <i class="far fa-heart"></i> <span class="like-count">${poem.likes || 0}</span>
                    </button>
                    <button class="delete-btn" data-id="${poem.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Форма добавления стиха
        if (addPoemForm) {
            addPoemForm.addEventListener('submit', handleAddPoem);
        }
        
        // Кнопка очистки формы
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', clearForm);
        }
        
        // Фильтрация стихов
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                renderPoems(this.dataset.filter);
            });
        });
        
        // Модальное окно
        if (closeModal) {
            closeModal.addEventListener('click', closeModalFunc);
        }
        
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModalFunc);
        }
        
        if (modalDeleteBtn) {
            modalDeleteBtn.addEventListener('click', deleteCurrentPoem);
        }
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModalFunc();
            }
        });
        
        // Плавная прокрутка для навигации
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Настройка предпросмотра формы
    function setupFormPreview() {
        titleInput.addEventListener('input', updatePreview);
        authorInput.addEventListener('input', updatePreview);
        textInput.addEventListener('input', updatePreview);
        
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updatePreview);
        });
        
        updatePreview();
    }
    
    // Обновление предпросмотра
    function updatePreview() {
        const title = titleInput.value || 'Название появится здесь';
        const author = authorInput.value || 'Автор';
        const text = textInput.value || 'Текст стиха будет отображен здесь после ввода.';
        
        // Форматирование текста для предпросмотра
        const formattedText = text.split('\n')
            .filter(line => line.trim() !== '')
            .slice(0, 6)
            .map(line => escapeHtml(line))
            .join('<br>');
        
        // Категории
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => {
                const labels = {
                    'russian': 'Русская поэзия',
                    'foreign': 'Зарубежная поэзия',
                    'love': 'Любовная лирика',
                    'nature': 'Природа',
                    'philosophy': 'Философская'
                };
                return labels[cb.value] || cb.value;
            });
        
        previewTitle.textContent = title;
        previewAuthor.textContent = author;
        previewContent.innerHTML = formattedText + (text.split('\n').filter(l => l.trim() !== '').length > 6 ? '<br>...' : '');
        previewCategories.textContent = selectedCategories.length > 0 
            ? `Категории: ${selectedCategories.join(', ')}`
            : 'Категории: не выбраны';
    }
    
    // Обработка добавления стиха
    function handleAddPoem(e) {
        e.preventDefault();
        
        const title = titleInput.value.trim();
        const author = authorInput.value.trim();
        const text = textInput.value.trim();
        
        if (!title || !author || !text) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        const newPoem = {
            id: Date.now(),
            title,
            author,
            text,
            categories: selectedCategories,
            likes: 0,
            createdAt: new Date().toISOString()
        };
        
        poems.unshift(newPoem);
        savePoems();
        updateUI();
        clearForm();
        
        // Прокрутка к коллекции
        document.querySelector('#my-poems').scrollIntoView({ behavior: 'smooth' });
        
        // Анимация успешного добавления
        const submitBtn = addPoemForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Стих добавлен!';
        submitBtn.style.background = 'linear-gradient(to right, #2E8B57, #3CB371)';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = 'linear-gradient(to right, var(--primary-color), var(--secondary-color))';
        }, 2000);
    }
    
    // Очистка формы
    function clearForm() {
        titleInput.value = '';
        authorInput.value = '';
        textInput.value = '';
        categoryCheckboxes.forEach(cb => cb.checked = false);
        updatePreview();
    }
    
    // Открытие модального окна с полным текстом стиха
    function openModal(poemId) {
        const poem = poems.find(p => p.id === poemId);
        if (!poem) return;
        
        currentPoemId = poemId;
        modalTitle.textContent = poem.title;
        modalAuthor.textContent = poem.author;
        
        // Форматирование текста
        const formattedText = poem.text.split('\n\n')
            .map(paragraph => {
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            })
            .join('');
        
        modalText.innerHTML = formattedText;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // Закрытие модального окна
    function closeModalFunc() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentPoemId = null;
    }
    
    // Удаление текущего стиха
    function deleteCurrentPoem() {
        if (!currentPoemId) return;
        
        if (confirm('Вы уверены, что хотите удалить этот стих?')) {
            poems = poems.filter(p => p.id !== currentPoemId);
            savePoems();
            updateUI();
            closeModalFunc();
        }
    }
    
    // Делегирование событий для динамически созданных элементов
    document.addEventListener('click', function(e) {
        // Кнопка "Читать полностью"
        if (e.target.classList.contains('read-more-btn') || e.target.closest('.read-more-btn')) {
            const button = e.target.classList.contains('read-more-btn') ? e.target : e.target.closest('.read-more-btn');
            const poemId = parseInt(button.dataset.id);
            openModal(poemId);
        }
        
        // Кнопка лайка
        if (e.target.classList.contains('like-btn') || e.target.closest('.like-btn')) {
            const button = e.target.classList.contains('like-btn') ? e.target : e.target.closest('.like-btn');
            const poemId = parseInt(button.dataset.id);
            toggleLike(poemId, button);
        }
        
        // Кнопка удаления
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const poemId = parseInt(button.dataset.id);
            deletePoem(poemId);
        }
    });
    
    // Переключение лайка
    function toggleLike(poemId, button) {
        const poem = poems.find(p => p.id === poemId);
        if (!poem) return;
        
        poem.likes = poem.likes || 0;
        const icon = button.querySelector('i');
        const countSpan = button.querySelector('.like-count');
        
        if (button.classList.contains('liked')) {
            poem.likes--;
            button.classList.remove('liked');
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
        } else {
            poem.likes++;
            button.classList.add('liked');
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#e74c3c';
            
            // Анимация
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 300);
        }
        
        countSpan.textContent = poem.likes;
        savePoems();
    }
    
    // Удаление стиха
    function deletePoem(poemId) {
        if (confirm('Вы уверены, что хотите удалить этот стих?')) {
            poems = poems.filter(p => p.id !== poemId);
            savePoems();
            updateUI();
        }
    }
    
    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Инициализация анимаций
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Наблюдаем за карточками стихов
    document.querySelectorAll('.poem-card').forEach(card => {
        observer.observe(card);
    });
    
    // Добавляем CSS для анимации
    const style = document.createElement('style');
    style.textContent = `
        .poem-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .poem-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .poem-card:nth-child(1) { transition-delay: 0.1s; }
        .poem-card:nth-child(2) { transition-delay: 0.2s; }
        .poem-card:nth-child(3) { transition-delay: 0.3s; }
        .poem-card:nth-child(4) { transition-delay: 0.4s; }
        .poem-card:nth-child(5) { transition-delay: 0.5s; }
        .poem-card:nth-child(6) { transition-delay: 0.6s; }
        
        .delete-btn {
            background: none;
            border: none;
            color: #dc3545;
            cursor: pointer;
            font-size: 1.1rem;
            transition: color 0.3s ease;
        }
        
        .delete-btn:hover {
            color: #bd2130;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Сайт "Мир Поэзии" загружен. Добавляйте и читайте стихи!');
});