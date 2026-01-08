class ProjectsCarousel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.carousel = this.container.querySelector('.projects-carousel');
        this.currentIndex = 0;
        this.isAnimating = false;
        this.cards = [];

        this.radius = 600;
        this.angleStep = 0;

        this.init();
    }

    async init() {
        await this.loadProjects();

        this.createNavigation();

        this.updateCarousel(false);

        this.addSwipeSupport();

        this.addKeyboardSupport();

        if (window.initModals) {
            window.initModals();
        }

        if (window.updateTranslations) {
            window.updateTranslations();
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('./assets/data/projects.json');
            const projects = await response.json();

            this.carousel.innerHTML = ''; // Clear existing content

            projects.forEach(project => {
                const card = this.createProjectCard(project);
                this.carousel.appendChild(card);
            });

            this.cards = Array.from(this.carousel.querySelectorAll('.project-card'));
            this.angleStep = (2 * Math.PI) / this.cards.length;

        } catch (error) {
            console.error('Error loading projects:', error);
            this.carousel.innerHTML = '<p class="error-message">Impossible de charger les projets.</p>';
        }
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card gradientBorder';
        card.dataset.project = project.id;
        card.dataset.repo = project.repo;

        // Image Wrapper
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'projectImgWrapper';

        if (project.image.startsWith('icon:')) {
            const iconClass = project.image.split(':')[1];
            imgWrapper.innerHTML = `<i class="${iconClass}" style="font-size: 64px; color: var(--secondary-text-color); opacity: 0.6;"></i>`;
        } else {
            imgWrapper.innerHTML = `<img src="${project.image}" alt="${project.title}" loading="lazy">`;
        }
        card.appendChild(imgWrapper);

        // Project Infos
        const infos = document.createElement('div');
        infos.className = 'projectInfos';

        infos.innerHTML = `
            <h3 class="projectTitle" data-i18n="${project.i18n.title}">${project.title}</h3>
            <p class="projectDesc" data-i18n="${project.i18n.desc}">${project.description}</p>
            <div class="project-stats" style="display: none;"></div>
            <div class="projectButtons">
                <a href="javascript:void(0)" data-show-modal="modal-project${project.id}"
                    class="projectButton projectDetails"><span data-i18n="projects.viewDetails">Voir Détails</span><i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        card.appendChild(infos);

        // Modal (Dialog)
        const dialog = document.createElement('dialog');
        dialog.id = `modal-project${project.id}`;
        dialog.className = 'gradientBorder';

        let modalImgContent = '';
        if (project.image.startsWith('icon:')) {
            const iconClass = project.image.split(':')[1];
            modalImgContent = `<i class="${iconClass}" style="font-size: 80px; color: var(--accent-color); opacity: 0.8;"></i>`;
        } else {
            modalImgContent = `<img src="${project.image}" alt="${project.title}" loading="lazy">`;
        }

        let linksHtml = '';
        project.links.forEach(link => {
            linksHtml += `
                <a href="${link.url}" target="_blank" class="modal-link">
                    <i class="${link.icon}"></i> <span data-i18n="${link.i18n}">${link.text}</span>
                </a>
            `;
        });

        dialog.innerHTML = `
            <h3 data-i18n="${project.i18n.modalTitle}">${project.modalTitle}</h3>
            <div class="projectImgWrapper" style="margin-bottom: 15px;">
                ${modalImgContent}
            </div>
            <p data-i18n="${project.i18n.modalDesc}">${project.modalDesc}</p>
            <div class="modal-links">
                ${linksHtml}
            </div>
            <button data-close="modal-project${project.id}" aria-label="Fermer la fenêtre"><i class="fas fa-xmark"></i></button>
        `;
        card.appendChild(dialog);

        return card;
    }

    createNavigation() {
        const navContainer = document.createElement('div');
        navContainer.className = 'carousel-navigation';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-nav-btn carousel-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', () => this.prev());

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-nav-btn carousel-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', () => this.next());

        navContainer.appendChild(prevBtn);
        navContainer.appendChild(nextBtn);
        this.carousel.parentElement.appendChild(navContainer);
    }

    updateCarousel(animate = true) {
        if (!animate) {
            this.carousel.style.transition = 'none';
        } else {
            this.carousel.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        const len = this.cards.length;
        // Calculate the active index safely (handling negative values)
        const activeIndex = ((this.currentIndex % len) + len) % len;

        this.cards.forEach((card, index) => {
            // Calculate angle based on the continuous currentIndex
            // We adjust the index relative to the current position to keep the rotation continuous
            const angle = this.angleStep * (index - this.currentIndex);
            const x = Math.sin(angle) * this.radius;
            const z = Math.cos(angle) * this.radius - this.radius;
            const rotateY = -angle * (180 / Math.PI);

            // Apply transform
            card.style.transform = `
                translate3d(${x}px, 0, ${z}px)
                rotateY(${rotateY}deg)
            `;

            // Update opacity and scale based on position
            // We calculate distance based on the circular nature
            let distanceFromCenter = Math.abs(index - activeIndex);
            if (distanceFromCenter > len / 2) {
                distanceFromCenter = len - distanceFromCenter;
            }

            const normalizedDistance = distanceFromCenter / (len / 2);

            if (index === activeIndex) {
                card.classList.add('active');
                card.style.opacity = '1';
                card.style.filter = 'brightness(1.2)';
                card.style.zIndex = '100';
            } else {
                card.classList.remove('active');
                card.style.opacity = Math.max(0.3, 1 - normalizedDistance * 0.7);
                card.style.filter = 'brightness(0.7)';
                card.style.zIndex = String(50 - Math.floor(distanceFromCenter * 10));
            }
        });

        // Re-enable transitions after initial positioning
        if (!animate) {
            setTimeout(() => {
                this.carousel.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 50);
        }
    }

    next() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.currentIndex++; // Increment continuously
        this.updateCarousel();

        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }

    prev() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.currentIndex--; // Decrement continuously
        this.updateCarousel();

        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    }

    addSwipeSupport() {
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        this.carousel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;

            // Prevent vertical scroll if horizontal swipe is detected
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }, { passive: false });

        this.carousel.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;

            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            }

            isDragging = false;
        });
    }

    addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }
}

// Initialize carousel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProjectsCarousel('projects');
    });
} else {
    new ProjectsCarousel('projects-container');
}
