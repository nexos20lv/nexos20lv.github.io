window.initModals = function () {
    document.querySelectorAll('[data-show-modal]').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const modalId = newBtn.getAttribute('data-show-modal');
            const dialog = document.getElementById(modalId);

            if (!dialog) return;

            const backdrop = document.createElement('div');
            backdrop.className = 'custom-backdrop';
            backdrop.dataset.modalId = modalId;
            backdrop.dataset.close = modalId;
            document.body.appendChild(backdrop);

            dialog.showModal();
            dialog.classList.add('opening');

            requestAnimationFrame(() => {
                backdrop.classList.add('show');
            });

            setTimeout(() => dialog.classList.remove('opening'), 300);

            backdrop.addEventListener('click', () => {
                closeModal(dialog, backdrop);
            });
        });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const modalId = newBtn.getAttribute('data-close');
            const dialog = document.getElementById(modalId);
            const backdrop = document.querySelector(`.custom-backdrop[data-modal-id="${modalId}"]`);

            closeModal(dialog, backdrop);
        });
    });
};

if (!window.modalGlobalListenerAdded) {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-backdrop')) {
            const modalId = e.target.getAttribute('data-modal-id');
            const dialog = document.getElementById(modalId);
            closeModal(dialog, e.target);
        }
    });
    window.modalGlobalListenerAdded = true;
}

function closeModal(dialog, backdrop) {
    if (!dialog) return;

    dialog.classList.add('closing');

    if (backdrop) {
        backdrop.classList.remove('show');
    }

    setTimeout(() => {
        dialog.classList.remove('closing');
        dialog.close();
        if (backdrop) {
            backdrop.remove();
        }
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    window.initModals();
});