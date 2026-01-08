document.addEventListener('DOMContentLoaded', () => {
    const animatedEls = document.querySelectorAll('.animated');
    const heroAnimatedEls = document.querySelectorAll('.hero-animated');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            entry.target.style.setProperty("--delay", `${i * 0.1}s`);
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                entry.target.addEventListener(
                    "transitionend",
                    function handler(event) {
                        if (event.propertyName === "opacity") {
                            entry.target.style.pointerEvents = "auto";
                            entry.target.removeEventListener(
                                "transitionend",
                                handler
                            );
                        }
                    }
                );
            } else {
                entry.target.classList.remove("show");
                entry.target.style.pointerEvents = "none";
            }
        });
    },
        { threshold: 0.1 }
    );

    const heroObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, i) => {
                entry.target.style.setProperty("--delay", `${i * 0.2}s`);
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                }
            });
        },
        { threshold: 0.1 }
    );

    function startOpeningAnimations() {
        animatedEls.forEach((el) => observer.observe(el));
        heroAnimatedEls.forEach((el) => heroObserver.observe(el));
    }

    window.addEventListener("loaderFinished", () => {
        startOpeningAnimations();
    });
});