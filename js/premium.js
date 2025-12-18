const user = localStorage.getItem("loggedInUser");

if (!user) {
    // User is NOT logged in. Redirect to login page.
    window.location.href = "../login";
}

const menuToggleButton = document.getElementById('menu-toggle-button');
const menuOverlay = document.getElementById('menu-overlay');
const slideMenu = document.getElementById('slide-menu');
const menuCloseButton = document.getElementById('menu-close-button');
const upgradeBtn = document.getElementById("upgrade-btn");

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

function logout() {
    localStorage.removeItem("loggedInUser");
}

window.onload = () => {
    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', openMenu);
    }
    if (menuCloseButton) {
        menuCloseButton.addEventListener('click', closeMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    window.returnToHome = returnToHome;
    window.selectCategory = selectCategory;
    window.showChatInterface = showChatInterface;

    upgradeBtn.addEventListener("click", async () => { // THIS THING ISN'T WORKING
        // Load messages from HTML
        const msgLoginRequired = upgradeBtn.dataset.msgLoginRequired;
        const msgSuccess = upgradeBtn.dataset.msgSuccess;
        const msgNetworkError = upgradeBtn.dataset.msgNetworkError;
        const msgErrorPrefix = upgradeBtn.dataset.msgErrorPrefix;
        const processingText = upgradeBtn.dataset.processingText;
        const originalText = upgradeBtn.dataset.originalText;

        console.log("Button clicked") // IF IT WORKS, THIS MESSAGE MUST BE SENT IN THE LOG

        // Check Login Status
        const userJson = localStorage.getItem("loggedInUser");
        if (!userJson) {
            alert(msgLoginRequired);
            window.location.href = "../login";
            return;
        }

        const user = JSON.parse(userJson);

        // UI Loading State
        upgradeBtn.disabled = true;
        upgradeBtn.textContent = processingText;

        try {
            // Send Request
            const response = await fetch("/api/upgrade-premium", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            const result = await response.json();

            if (response.ok) {
                // Update Local Storage
                user.premium = true;
                localStorage.setItem("loggedInUser", JSON.stringify(user));

                alert(msgSuccess);
                window.location.reload();
            } else {
                // Server returned an error
                alert(msgErrorPrefix + (result.message || "Unknown error"));
                upgradeBtn.disabled = false;
                upgradeBtn.textContent = originalText;
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            alert(msgNetworkError);
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = originalText;
        }
    });
}