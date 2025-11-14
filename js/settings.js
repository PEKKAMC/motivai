const menuToggleButton = document.getElementById('menu-toggle-button');
const menuOverlay = document.getElementById('menu-overlay');
const slideMenu = document.getElementById('slide-menu');
const menuCloseButton = document.getElementById('menu-close-button');

// Attach event listeners after the DOM is loaded
window.onload = () => {
    // Open Menu
    function openMenu() {
        if (menuOverlay) menuOverlay.classList.remove('hidden');
        if (slideMenu) {
            slideMenu.classList.remove('hidden');
            requestAnimationFrame(() => {
                slideMenu.classList.remove('-translate-x-full');
                slideMenu.classList.add('translate-x-0');
            });
        }
    }

    // Close Menu
    function closeMenu() {
        if (menuOverlay) menuOverlay.classList.add('hidden');
        if (slideMenu) {
            slideMenu.classList.add('-translate-x-full');
            slideMenu.classList.remove('translate-x-0');
            setTimeout(() => {
                slideMenu.classList.add('hidden');
            }, 300);
        }
    }

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', openMenu);
    }
    if (menuCloseButton) {
        menuCloseButton.addEventListener('click', closeMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Make functions globally accessible (since they are referenced in HTML onclick)
    window.returnToHome = returnToHome;
    window.selectCategory = selectCategory;
    window.showChatInterface = showChatInterface;
}