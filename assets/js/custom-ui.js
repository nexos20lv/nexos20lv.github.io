(function () {
    const currentYear = new Date().getFullYear();

    console.log(
        `%c👋 Bienvenue sur le portfolio de Pierre Bouteman !\n\n© ${currentYear} Tous droits réservés.\n\nSi vous aimez ce site, n'hésitez pas à me contacter : pierre.bouteman@icloud.com`,
        "color: #a784cd; font-size: 14px; line-height: 1.5;"
    );

    const createContextMenu = () => {
        const menu = document.createElement('div');
        menu.id = 'custom-context-menu';
        menu.style.zIndex = '200000';
        menu.innerHTML = `
            <div class="ctx-menu-item" id="ctx-copy">
                <i class="fas fa-copy"></i> Copier
            </div>
            <div class="ctx-menu-item" id="ctx-paste">
                <i class="fas fa-paste"></i> Coller
            </div>
            <div class="ctx-menu-item" id="ctx-reload">
                <i class="fas fa-rotate-right"></i> Recharger
            </div>
            <div class="ctx-menu-separator"></div>
            <div class="ctx-menu-footer">
                © ${currentYear} Pierre Bouteman
            </div>
        `;
        document.body.appendChild(menu);

        document.getElementById('ctx-copy').addEventListener('click', () => {
            document.execCommand('copy');
            menu.style.display = 'none';
        });

        document.getElementById('ctx-paste').addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    const start = document.activeElement.selectionStart;
                    const end = document.activeElement.selectionEnd;
                    const val = document.activeElement.value;
                    document.activeElement.value = val.slice(0, start) + text + val.slice(end);
                    document.activeElement.selectionStart = document.activeElement.selectionEnd = start + text.length;
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
            }
            menu.style.display = 'none';
        });

        document.getElementById('ctx-reload').addEventListener('click', () => {
            location.reload();
        });

        return menu;
    };

    const contextMenu = createContextMenu();

    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();

        const menu = document.getElementById('custom-context-menu');
        const copyBtn = document.getElementById('ctx-copy');
        const pasteBtn = document.getElementById('ctx-paste');

        if (window.getSelection().toString().length > 0) {
            copyBtn.classList.remove('disabled');
        } else {
            copyBtn.classList.add('disabled');
        }

        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            pasteBtn.classList.remove('disabled');
        } else {
            pasteBtn.classList.add('disabled');
        }

        let x = e.clientX;
        let y = e.clientY;

        if (x + 200 > window.innerWidth) x = window.innerWidth - 200;
        if (y + menu.offsetHeight > window.innerHeight) y = window.innerHeight - menu.offsetHeight;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'flex';
    });

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('custom-context-menu');
        if (menu && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    const addWatermark = () => {
        const watermark = document.createElement("div");
        watermark.id = "copyright-watermark";
        watermark.innerHTML = `<div style="position:fixed;bottom:10px;right:10px;background:rgba(167,132,205,0.1);color:rgba(227,209,245,0.5);padding:8px 15px;border-radius:8px;font-size:12px;font-family:'Outfit',sans-serif;z-index:999998;pointer-events:none;backdrop-filter:blur(5px);border:1px solid rgba(227,209,245,0.2)">© ${currentYear} Pierre Bouteman</div>`;

        if (!document.getElementById("copyright-watermark")) {
            document.body.appendChild(watermark);
        }
    };

    window.addEventListener("load", function () {
        addWatermark();
    });

    setInterval(() => {
        if (!document.getElementById("copyright-watermark")) {
            addWatermark();
        }
    }, 2000);

})();
