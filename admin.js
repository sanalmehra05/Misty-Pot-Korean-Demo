/* admin.js */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const modules = document.querySelectorAll('.module');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links and modules
            navLinks.forEach(l => l.classList.remove('active'));
            modules.forEach(m => m.classList.remove('active'));

            // Add active class to clicked link
            link.classList.add('active');

            // Show target module
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Re-trigger animation on charts if overview is active
            if (targetId === 'overview') {
                animateBars();
            }
        });
    });

    // 2. Bar Chart Animation
    function animateBars() {
        // Horizontal Bars
        const hBars = document.querySelectorAll('.bar');
        hBars.forEach(bar => {
            const finalWidth = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = finalWidth;
            }, 50); // slight delay to ensure transition runs
        });

        // Vertical Bars
        const vBars = document.querySelectorAll('.v-bar');
        vBars.forEach(bar => {
            const finalHeight = bar.style.height;
            bar.style.height = '0%';
            setTimeout(() => {
                bar.style.height = finalHeight;
            }, 50);
        });
    }

    // Run animation on initial load
    animateBars();

    // 3. Toggle Switch Status Label update (Optional enhancement)
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const label = toggle.nextElementSibling.nextElementSibling;
            if (label && label.classList.contains('toggle-label')) {
                label.textContent = e.target.checked ? 'In Stock' : 'Sold Out';
                if (!e.target.checked) {
                    label.style.color = 'var(--retro-red)';
                } else {
                    label.style.color = 'var(--text-dark)';
                }
            }
        });
    });

    // 4. Drag and drop file mock interaction
    const dropzones = document.querySelectorAll('.image-dropzone');
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--cobalt-blue)';
            zone.style.background = '#e8f0fe';
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#bbb';
            zone.style.background = '#f9f9f9';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#bbb';
            zone.style.background = '#f9f9f9';
            zone.innerHTML = '<span class="drop-text">Uploaded</span>';
            // Mock file upload logic here
        });
    });

    // 5. Mobile Sidebar Toggle
    const adminMenuBtn = document.getElementById('admin-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (adminMenuBtn && sidebar) {
        adminMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            // Animate hamburger to X
            adminMenuBtn.classList.toggle('active');
            const spans = adminMenuBtn.querySelectorAll('span');
            if (adminMenuBtn.classList.contains('active')) {
                spans[0].style.transform = 'translateY(10px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-10px) rotate(-45deg)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close sidebar on link click (mobile)
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                    adminMenuBtn.classList.remove('active');
                    const spans = adminMenuBtn.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            });
        });
    }
});
