const DISCORD_USER_ID = '1288079115248992297';
const LANYARD_WS_URL = `wss://api.lanyard.rest/socket`;

let ws;
let heartbeatInterval;

function connectLanyard() {
    ws = new WebSocket(LANYARD_WS_URL);

    ws.onopen = () => {
        // Connected
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.op === 1) {
            const heartbeat_interval = data.d.heartbeat_interval;
            heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ op: 3 }));
                }
            }, heartbeat_interval);

            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_USER_ID }
            }));
        } else if (data.op === 0) {
            updateLanyardUI(data.d);
        }
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setTimeout(connectLanyard, 3000);
    };
}

function updateLanyardUI(data) {
    if (!data) return;

    // Update User Info
    const avatar = document.getElementById('lanyard-avatar');
    const username = document.getElementById('lanyard-username');
    const customStatus = document.getElementById('lanyard-custom-status');
    const statusIndicator = document.getElementById('lanyard-status-indicator');
    const statusText = document.getElementById('lanyard-status-text');

    if (avatar && data.discord_user) {
        avatar.src = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=128`;
    }

    if (username && data.discord_user) {
        username.textContent = data.discord_user.username;
    }

    if (statusIndicator && statusText) {
        const status = data.discord_status || 'offline';
        statusIndicator.style.backgroundColor = getStatusColor(status);
        statusText.textContent = getStatusText(status);
    }

    // Handle Activities
    let activities = data.activities || [];

    // Extract Custom Status (Type 4)
    const customStatusActivity = activities.find(a => a.type === 4);
    if (customStatus && customStatusActivity) {
        customStatus.textContent = customStatusActivity.state || '';
        customStatus.style.display = 'block';
    } else if (customStatus) {
        customStatus.style.display = 'none';
    }

    // Filter out custom status from activities list
    activities = activities.filter(a => a.type !== 4);

    // Sort activities: Spotify > VS Code > Others
    const sortedActivities = activities.sort((a, b) => {
        const getPriority = (act) => {
            if (act.name === 'Spotify') return 3;
            if (act.name === 'Visual Studio Code' || act.name === 'Code') return 2;
            return 1;
        };
        return getPriority(b) - getPriority(a);
    });

    const primaryActivity = sortedActivities[0];
    const otherActivities = sortedActivities.slice(1);

    renderPrimaryActivity(primaryActivity);
    renderOtherActivities(otherActivities);
}

function renderPrimaryActivity(activity) {
    const container = document.getElementById('lanyard-primary-activity');
    const img = document.getElementById('lanyard-primary-img');
    const name = document.getElementById('lanyard-primary-name');
    const details = document.getElementById('lanyard-primary-details');
    const state = document.getElementById('lanyard-primary-state');

    if (!activity) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    name.textContent = activity.name;
    details.textContent = activity.details || '';
    state.textContent = activity.state || '';

    // Image logic
    let imageUrl = './assets/img/logo.png';
    if (activity.name === 'Spotify' && activity.assets && activity.assets.large_image) {
        imageUrl = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
    } else if (activity.assets && activity.assets.large_image) {
        if (activity.assets.large_image.startsWith('mp:')) {
            imageUrl = activity.assets.large_image.replace('mp:', 'https://media.discordapp.net/');
        } else {
            imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
        }
    }
    img.src = imageUrl;
}

function renderOtherActivities(activities) {
    const moreBtn = document.getElementById('lanyard-more');
    const moreText = document.getElementById('lanyard-more-text');
    const otherList = document.getElementById('lanyard-other-activities');

    if (activities.length === 0) {
        moreBtn.style.display = 'none';
        otherList.style.display = 'none';
        return;
    }

    moreBtn.style.display = 'flex';
    moreText.textContent = `${activities.length} autre${activities.length > 1 ? 's' : ''} activité${activities.length > 1 ? 's' : ''}`;

    // Clear previous list
    otherList.innerHTML = '';

    activities.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'lanyard-activity';

        // Image logic
        let imageUrl = './assets/img/logo.png';
        if (activity.name === 'Spotify' && activity.assets && activity.assets.large_image) {
            imageUrl = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
        } else if (activity.assets && activity.assets.large_image) {
            if (activity.assets.large_image.startsWith('mp:')) {
                imageUrl = activity.assets.large_image.replace('mp:', 'https://media.discordapp.net/');
            } else {
                imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
            }
        }

        div.innerHTML = `
            <img src="${imageUrl}" alt="${activity.name}">
            <div class="lanyard-activity-details">
                <p class="activity-name">${activity.name}</p>
                <p class="activity-details">${activity.details || ''}</p>
                <p class="activity-state">${activity.state || ''}</p>
            </div>
        `;
        otherList.appendChild(div);
    });

    // Toggle logic
    moreBtn.onclick = () => {
        const isExpanded = otherList.style.display === 'flex';
        otherList.style.display = isExpanded ? 'none' : 'flex';
        moreBtn.classList.toggle('expanded', !isExpanded);
    };
}

function getStatusColor(status) {
    const colors = {
        online: '#43b581',
        idle: '#faa61a',
        dnd: '#f04747',
        offline: '#747f8d'
    };
    return colors[status] || colors.offline;
}

function getStatusText(status) {
    const texts = {
        online: 'En ligne',
        idle: 'Absent',
        dnd: 'Ne pas déranger',
        offline: 'Hors ligne'
    };
    return texts[status] || 'Hors ligne';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectLanyard);
} else {
    connectLanyard();
}
