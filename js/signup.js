const user = localStorage.getItem("loggedInUser");

if (user) {
    // User is logged in. Redirect to main page.
    window.location.href = "../main";
}

const signupForm = document.getElementById("signup-form");
const emailInput = document.getElementById("email");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
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

    // Handle Submission Form
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission
        hideMessages();

        const email = emailInput.value;
        const username = usernameInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Retrieve messages defined in HTML
        const mismatchMsg = errorMessage.getAttribute("data-pass-mismatch");
        const serverErrorDefault = errorMessage.getAttribute("data-server-error");
        const networkErrorMsg = errorMessage.getAttribute("data-network-error");

        // 1. Check if passwords match
        if (password !== confirmPassword) {
            showError(mismatchMsg);
            return; // Stop the function
        }

        // 2. Client-side data package
        const userData = { email, username, password };

        // --- Send Data to Server Endpoint ---
        try {
            // Target the server-side endpoint for signup
            const response = await fetch("/api/signup", {
                method: "POST", // Use POST for creating resources
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData), // Send data as JSON
            });

            const result = await response.json(); // Server should respond with JSON

            if (!response.ok) {
                showError(result.message || serverErrorDefault);
                return;
            }

            // Success!
            console.log("Signup successful:", result);
            window.location.href = "../login"; // Redirects to the login page

        } catch (error) {
            console.error("Network or Fetch Error:", error);
            showError(networkErrorMsg);
        }
    });
}