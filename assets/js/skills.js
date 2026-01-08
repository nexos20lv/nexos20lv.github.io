class SkillsManager {
    constructor(containerId) {
        this.container = document.querySelector(containerId);
        if (!this.container) return;
        this.init();
    }

    async init() {
        await this.loadSkills();
    }

    async loadSkills() {
        try {
            const response = await fetch('./assets/data/skills.json');
            const skills = await response.json();

            this.container.innerHTML = '';

            skills.forEach(skill => {
                const card = this.createSkillCard(skill);
                this.container.appendChild(card);
            });

            // Trigger animation if it exists
            if (typeof animateSkillBars === 'function') {
                animateSkillBars();
            }

        } catch (error) {
            console.error('Error loading skills:', error);
            this.container.innerHTML = '<p class="error-message">Impossible de charger les compétences.</p>';
        }
    }

    createSkillCard(skill) {
        const card = document.createElement('div');
        card.className = 'skill-card gradientBorder';

        card.innerHTML = `
            <i class="${skill.icon} gradientText"></i>
            <h3>${skill.name}</h3>
            <div class="skill-level-bar">
                <div class="skill-level" data-level="${skill.level}"></div>
            </div>
        `;

        return card;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SkillsManager('.skills-grid');
});
