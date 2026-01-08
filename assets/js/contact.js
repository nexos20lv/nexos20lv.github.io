document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const submitBtn = contactForm.querySelector('.submit-btn');
    const submitBtnText = submitBtn.querySelector('span');
    const submitBtnIcon = submitBtn.querySelector('i');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            submitBtn.disabled = true;
            const originalText = submitBtnText.textContent;
            submitBtnText.textContent = 'Envoi en cours...';
            submitBtnIcon.className = 'fas fa-spinner fa-spin';
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            try {
                const response = await fetch("https://formspree.io/f/mnnevejq", {
                    method: "POST",
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = 'Message envoyé avec succès ! Je vous répondrai bientôt.';
                    formStatus.className = 'form-status success';
                    contactForm.reset();

                    setTimeout(() => {
                        submitBtnText.textContent = 'Envoyé !';
                        submitBtnIcon.className = 'fas fa-check';

                        setTimeout(() => {
                            submitBtn.disabled = false;
                            submitBtnText.textContent = originalText;
                            submitBtnIcon.className = 'fas fa-paper-plane';
                            formStatus.textContent = '';
                        }, 3000);
                    }, 500);
                } else {
                    throw new Error('Network response was not ok.');
                }

            } catch (error) {
                console.error('Error sending message:', error);
                formStatus.textContent = 'Une erreur est survenue. Veuillez réessayer.';
                formStatus.className = 'form-status error';

                submitBtn.disabled = false;
                submitBtnText.textContent = originalText;
                submitBtnIcon.className = 'fas fa-paper-plane';
            }
        });
    }
});
