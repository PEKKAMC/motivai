const user = localStorage.getItem("loggedInUser");

if (user) {
    // User is logged in. Redirect to main page.
    window.location.href = "../main";
}

const loginForm = document.getElementById("login-form");
const loginDetailsInput = document.getElementById("login-details");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");

// Function to show an error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove("hidden");
}

// Function to hide all messages
function hideMessages() {
    errorMessage.classList.add("hidden");
}

window.onload = () => {

    // Handle form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent the form from submitting traditionally
        hideMessages();

        const loginDetails = loginDetailsInput.value;
        const password = passwordInput.value;

        // Retrieve messages defined in HTML
        const invalidMsg = errorMessage.getAttribute("data-invalid-msg");
        const serverMsg = errorMessage.getAttribute("data-server-msg");

        // --- User Authentication ---
        try {
            // Fetch the user data from the JSON file
            const response = await fetch("../../database/users.json");
            if (!response.ok) {
                throw new Error("Cannot fetch user data.");
            }
            const users = await response.json();

            // Find the user
            const foundUser = users.find(user =>
                (user.email === loginDetails || user.name === loginDetails) &&
                user.password === password
            );

            if (foundUser) {
                // Store user info in localStorage to simulate a session
                localStorage.setItem("loggedInUser", JSON.stringify({ id: foundUser.id, name: foundUser.name, email: foundUser.email }));

                // Redirects to the main page
                window.location.href = "../main";
            } else {
                // No user found or password incorrect
                showError(invalidMsg);
            }

        } catch (error) {
            console.error("Login Error:", error);
            showError(serverMsg);
        }
    });
}