/* ==========================================================================
   TITAN FIT Club - Interactive JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 12, 16, 0.95)';
            navbar.style.padding = '12px 0';
        } else {
            navbar.style.background = 'rgba(10, 12, 16, 0.7)';
            navbar.style.padding = '20px 0';
        }
    });

    // --- Form Submission & Modal Handling ---
    const bookingForm = document.getElementById('bookingForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.getElementById('closeModal');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('userName').value;
            const phone = document.getElementById('userPhone').value;

            if (name && phone) {
                successModal.classList.add('active');
                bookingForm.reset();
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }

    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });

    // --- Stat Counter Animation ---
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    let animated = false;

    function animateStats() {
        if (animated) return;
        statNumbers.forEach(stat => {
            const target = +stat.getAttribute('data-target');
            let count = 0;
            const speed = Math.ceil(target / 40);

            const updateCount = () => {
                count += speed;
                if (count < target) {
                    stat.textContent = count.toLocaleString() + '+';
                    setTimeout(updateCount, 30);
                } else {
                    stat.textContent = target.toLocaleString() + '+';
                }
            };
            updateCount();
        });
        animated = true;
    }

    // Trigger stat animation on scroll into view
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateStats();
            }
        }, { threshold: 0.5 });
        observer.observe(heroStats);
    }
});
