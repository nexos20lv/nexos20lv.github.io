const GITHUB_USERNAME = 'nexos20lv';
const CACHE_DURATION = 3600000;

class ProjectStatsManager {
    constructor(username) {
        this.username = username;
        this.cacheKey = `project_stats_${username}`;
    }

    getCachedData() {
        const cached = localStorage.getItem(this.cacheKey);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(this.cacheKey);
            return null;
        }

        return data;
    }

    setCachedData(data) {
        localStorage.setItem(this.cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    }

    async fetchRepoStats(repoName) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.username}/${repoName}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error(`Error fetching stats for ${repoName}:`, error);
            return null;
        }
    }

    async loadProjectStats() {
        const cached = this.getCachedData();
        if (cached) {
            console.log('Using cached project stats');
            return cached;
        }

        console.log('Fetching fresh project stats');

        const cards = document.querySelectorAll('.project-card[data-repo]');
        const statsData = {};

        for (const card of cards) {
            const repoName = card.dataset.repo;
            if (!repoName) continue;

            const stats = await this.fetchRepoStats(repoName);
            if (stats) {
                statsData[repoName] = {
                    stars: stats.stargazers_count || 0,
                    forks: stats.forks_count || 0,
                    watchers: stats.watchers_count || 0
                };
            }
        }

        this.setCachedData(statsData);
        return statsData;
    }

    displayStats(statsData) {
        const cards = document.querySelectorAll('.project-card[data-repo]');

        cards.forEach(card => {
            const repoName = card.dataset.repo;
            const statsContainer = card.querySelector('.project-stats');

            if (!repoName || !statsContainer) return;

            const stats = statsData[repoName];
            if (!stats) {
                statsContainer.style.display = 'none';
                return;
            }

            statsContainer.innerHTML = `
                <div class="github-card-stats">
                    <div class="stat-item">
                        <i class="fas fa-star"></i>
                        <span>${stats.stars}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-code-branch"></i>
                        <span>${stats.forks}</span>
                    </div>
                </div>
            `;
            statsContainer.style.display = 'block';
        });
    }

    async init() {
        const statsData = await this.loadProjectStats();
        this.displayStats(statsData);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const manager = new ProjectStatsManager(GITHUB_USERNAME);
        manager.init();
    });
} else {
    const manager = new ProjectStatsManager(GITHUB_USERNAME);
    manager.init();
}
