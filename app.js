/**
 * Name Recall App MVP - Logic
 * Uses localStorage for data persistence
 */

// --- STATE MANAGEMENT ---
const AppState = {
    people: [],
    currentScreen: 'screen-home',
    filterTag: null,
    tempAvatar: null,

    // Gradients for avatars
    gradients: [
        'bg-gradient-1', 'bg-gradient-2', 'bg-gradient-3',
        'bg-gradient-4', 'bg-gradient-5', 'bg-gradient-6'
    ]
};

// --- STORAGE ---
const Storage = {
    KEY: 'name-recall-app-data',

    load() {
        const data = localStorage.getItem(this.KEY);
        if (data) {
            AppState.people = JSON.parse(data);
        } else {
            AppState.people = [];
        }
    },

    save() {
        localStorage.setItem(this.KEY, JSON.stringify(AppState.people));
    }
};

// --- UTILS ---
const Utils = {
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    },

    getRandomGradient() {
        const index = Math.floor(Math.random() * AppState.gradients.length);
        return AppState.gradients[index];
    },

    parseTags(tagString) {
        if (!tagString || !tagString.trim()) return [];
        return tagString.split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    },

    getAllUniqueTags() {
        const tagSet = new Set();
        AppState.people.forEach(p => {
            p.tags.forEach(t => tagSet.add(t));
        });
        return Array.from(tagSet).sort();
    }
};

// --- UI CONTROLLER ---
const UI = {
    // Navigate between screens
    navigateTo(screenId) {
        document.querySelectorAll('.screen').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        AppState.currentScreen = screenId;

        // Triggers based on screen
        if (screenId === 'screen-home') {
            this.renderPeopleList();
            document.getElementById('search-input').value = '';
        } else if (screenId === 'screen-tags') {
            this.renderAllTags();
        }

        // Scroll to top
        document.querySelector('.app-main').scrollTo(0, 0);
    },

    // Render the main list of people
    renderPeopleList(searchQuery = '') {
        const container = document.getElementById('people-list');
        const emptyState = document.getElementById('empty-state');

        container.innerHTML = '';

        // Filter logic
        let filteredPeople = AppState.people;

        // 1. Tag Filter
        if (AppState.filterTag) {
            filteredPeople = filteredPeople.filter(p => p.tags.includes(AppState.filterTag));
            document.getElementById('filter-status').style.display = 'flex';
            document.getElementById('current-filter-tag').innerHTML = `#${AppState.filterTag} <i class="fa-solid fa-xmark"></i>`;
        } else {
            document.getElementById('filter-status').style.display = 'none';
        }

        // 2. Search Box Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredPeople = filteredPeople.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.tags.some(tag => tag.toLowerCase().includes(query)) ||
                (p.memo && p.memo.toLowerCase().includes(query))
            );
        }

        // Display check
        if (filteredPeople.length === 0) {
            emptyState.style.display = 'flex';
            if (AppState.people.length > 0) {
                // Not totally empty, just search yielded no results
                emptyState.querySelector('h3').textContent = 'No results found';
                emptyState.querySelector('p').textContent = 'Please try changing your search terms';
            } else {
                emptyState.querySelector('h3').textContent = 'No one registered yet';
                emptyState.querySelector('p').textContent = 'Tap the + button to add someone';
            }
            container.appendChild(emptyState);
            return;
        }

        emptyState.style.display = 'none';
        container.appendChild(emptyState); // Keep it around but hidden

        // Render cards
        filteredPeople.forEach((person, index) => {
            const delay = index * 0.05; // Staggered animation

            const card = document.createElement('div');
            card.className = 'person-card glass-panel animate-slide-up';
            card.style.animationDelay = `${delay}s`;
            card.onclick = () => this.showDetail(person.id);

            const tagsHtml = person.tags.slice(0, 3).map(tag =>
                `<span class="tag-badge">#${tag}</span>`
            ).join('');

            const moreTags = person.tags.length > 3 ?
                `<span class="tag-badge" style="background: transparent; border: none; padding-left:0;">+${person.tags.length - 3}</span>` : '';

            let avatarContent = '';
            if (person.avatar) {
                avatarContent = `<div class="card-avatar" style="background-image: url(${person.avatar}); background-size: cover; background-position: center;"></div>`;
            } else {
                avatarContent = `<div class="card-avatar ${person.colorVariant}">${Utils.getInitials(person.name)}</div>`;
            }

            card.innerHTML = `
                ${avatarContent}
                <div class="card-info">
                    <h3 class="card-name">${person.name}</h3>
                    <div class="card-tags">
                        ${tagsHtml}
                        ${moreTags}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Render tag cloud in Add Form
    renderFormTags(tagsString) {
        const container = document.getElementById('tag-preview-container');
        const tags = Utils.parseTags(tagsString);
        container.innerHTML = tags.map(tag => `<span class="tag-badge active">#${tag}</span>`).join('');
    },

    // Render detail view
    showDetail(personId) {
        const person = AppState.people.find(p => p.id === personId);
        if (!person) return;

        // Populate detail screen
        const avatarEl = document.getElementById('detail-avatar');
        if (person.avatar) {
            avatarEl.className = 'detail-avatar';
            avatarEl.textContent = '';
            avatarEl.style.backgroundImage = `url(${person.avatar})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.style.border = '4px solid rgba(255,255,255,0.2)';
        } else {
            avatarEl.className = `detail-avatar ${person.colorVariant}`;
            avatarEl.textContent = Utils.getInitials(person.name);
            avatarEl.style.backgroundImage = '';
            avatarEl.style.border = 'none';
        }

        document.getElementById('detail-name').textContent = person.name;

        document.getElementById('detail-tags').innerHTML = person.tags.map(tag =>
            `<span class="tag-badge active">#${tag}</span>`
        ).join('');

        const memoEl = document.getElementById('detail-memo');
        memoEl.textContent = person.memo || 'No notes available';
        memoEl.style.color = person.memo ? 'var(--text-primary)' : 'var(--text-secondary)';
        memoEl.style.fontStyle = person.memo ? 'normal' : 'italic';

        // Set action buttons handlers
        document.getElementById('btn-edit-person').onclick = () => this.openForm(person);
        document.getElementById('btn-delete-person').onclick = () => this.deletePerson(person.id);

        this.navigateTo('screen-detail');
    },

    // Open form for Add or Edit
    openForm(personToEdit = null) {
        const formTitle = document.getElementById('form-title');
        const formId = document.getElementById('form-id');
        const inputName = document.getElementById('input-name');
        const inputTags = document.getElementById('input-tags');
        const inputMemo = document.getElementById('input-memo');

        if (personToEdit) {
            formTitle.textContent = 'Edit Profile';
            formId.value = personToEdit.id;
            inputName.value = personToEdit.name;
            inputTags.value = personToEdit.tags.join(', ');
            inputMemo.value = personToEdit.memo;
            AppState.tempAvatar = personToEdit.avatar || null;
        } else {
            formTitle.textContent = 'Add New Person';
            formId.value = '';
            inputName.value = '';
            inputTags.value = '';
            inputMemo.value = '';
            AppState.tempAvatar = null;
        }

        const avatarPreview = document.getElementById('avatar-preview');
        if (AppState.tempAvatar) {
            avatarPreview.innerHTML = '';
            avatarPreview.style.backgroundImage = `url(${AppState.tempAvatar})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.style.backgroundPosition = 'center';
            avatarPreview.style.border = '2px solid var(--accent-primary)';
        } else {
            avatarPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
            avatarPreview.style.backgroundImage = '';
            avatarPreview.style.border = '2px dashed var(--glass-border)';
        }

        this.renderFormTags(inputTags.value);
        this.navigateTo('screen-form');
        setTimeout(() => inputName.focus(), 300);
    },

    // Save person from form
    savePerson(e) {
        e.preventDefault();

        const id = document.getElementById('form-id').value;
        const name = document.getElementById('input-name').value;
        const tagsStr = document.getElementById('input-tags').value;
        const memo = document.getElementById('input-memo').value;

        const personData = {
            id: id || Utils.generateId(),
            name: name,
            tags: Utils.parseTags(tagsStr),
            memo: memo,
            avatar: AppState.tempAvatar,
            colorVariant: id ? AppState.people.find(p => p.id === id).colorVariant : Utils.getRandomGradient(),
            updatedAt: new Date().toISOString()
        };

        if (id) {
            // Edit
            const index = AppState.people.findIndex(p => p.id === id);
            if (index !== -1) AppState.people[index] = personData;
        } else {
            // Add new
            AppState.people.unshift(personData); // Add to top
        }

        Storage.save();

        // Go back to home or detail
        this.navigateTo('screen-home');
    },

    // Delete person
    deletePerson(id) {
        if (confirm('Are you sure you want to delete this person?')) {
            AppState.people = AppState.people.filter(p => p.id !== id);
            Storage.save();
            this.navigateTo('screen-home');
        }
    },

    // Render all tags screen
    renderAllTags() {
        const container = document.getElementById('all-tags-list');
        const emptyState = document.getElementById('tags-empty-state');
        const tags = Utils.getAllUniqueTags();

        container.innerHTML = '';
        container.appendChild(emptyState); // Keep reference

        if (tags.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tags.forEach((tag, index) => {
            const badge = document.createElement('span');
            badge.className = 'tag-badge animate-slide-up';
            badge.style.animationDelay = `${index * 0.03}s`;
            badge.textContent = `#${tag}`;

            // Get count of people with this tag
            const count = AppState.people.filter(p => p.tags.includes(tag)).length;

            const countSpan = document.createElement('span');
            countSpan.style.opacity = '0.7';
            countSpan.style.fontSize = '0.8em';
            countSpan.style.marginLeft = '6px';
            countSpan.textContent = `(${count})`;
            badge.appendChild(countSpan);

            badge.onclick = () => {
                AppState.filterTag = tag;
                this.navigateTo('screen-home');
            };

            container.appendChild(badge);
        });
    },

    // Setup clear filter event
    clearFilter() {
        AppState.filterTag = null;
        this.renderPeopleList(document.getElementById('search-input').value);
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    Storage.load();

    // Setup Event Listeners

    // Header actions
    document.getElementById('btn-add-person').addEventListener('click', () => UI.openForm());
    document.getElementById('btn-show-tags').addEventListener('click', () => UI.navigateTo('screen-tags'));

    // Form actions
    document.getElementById('person-form').addEventListener('submit', (e) => UI.savePerson(e));
    document.getElementById('input-tags').addEventListener('input', (e) => UI.renderFormTags(e.target.value));

    // Avatar upload handling
    document.getElementById('avatar-preview').addEventListener('click', () => {
        document.getElementById('input-avatar').click();
    });

    document.getElementById('input-avatar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                AppState.tempAvatar = e.target.result;
                const preview = document.getElementById('avatar-preview');
                preview.innerHTML = '';
                preview.style.backgroundImage = `url(${e.target.result})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.style.border = '2px solid var(--accent-primary)';
            };
            reader.readAsDataURL(file);
        }
    });

    // Back buttons
    document.getElementById('btn-back-form').addEventListener('click', () => UI.navigateTo('screen-home'));
    document.getElementById('btn-back-detail').addEventListener('click', () => UI.navigateTo('screen-home'));
    document.getElementById('btn-back-tags').addEventListener('click', () => UI.navigateTo('screen-home'));

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => UI.renderPeopleList(e.target.value));

    // Filter clear
    document.getElementById('current-filter-tag').addEventListener('click', () => UI.clearFilter());

    // Initial Render
    UI.navigateTo('screen-home');
});
