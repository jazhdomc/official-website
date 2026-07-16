// @ts-check

// Firebase imports
import { initializeApp } from "@firebase/app";
import { onAuthStateChanged, getAuth } from "@firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "@firebase/app-check";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA8ZAK0d32nqqB99mzNds_b7oZ8laNXKMY",
    authDomain: "jazhdomc.firebaseapp.com",
    projectId: "jazhdomc",
    storageBucket: "jazhdomc.firebasestorage.app",
    messagingSenderId: "194265089094",
    appId: "1:194265089094:web:8bdb609aa4980c55537647",
    measurementId: "G-5HWRNSBK5H"
};

// Initialize firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth detection to load dashboard or not
const dashboardElement = document.getElementById("dashboardBtn");
onAuthStateChanged(auth, user => {
    if (dashboardElement) {
        if (user) dashboardElement.style.display = "";
        else dashboardElement.style.display = "none";
    }
});

/**
 * Checks whether or not a user has consented to cookies, and redirects them to the homepage if not
 */
// @ts-ignore
window.checkCookies = () => {
    const cookies = localStorage.getItem("cookies");
    // @ts-ignore
    if (cookies !== "true") window.redirectUser("home?cookieCheck=true");
    else {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider("6LfJHU8tAAAAALFfSOSTPsVIKgvnkC_yZcGRAxvz"),
            isTokenAutoRefreshEnabled: true
        });
    }
}


/**
 * Redirects user to a page
 * 
 * @param {String} location The page to redirect the user to
 */
// @ts-ignore
window.redirectUser = (location) => {
    console.log("Redirecting user to " + location + " page.");
    window.location.href = window.location.protocol + "//" + window.location.host + "/" + location;
}

/**
 * Returns a list with all the staff ranks
 * 
 * @param {boolean} direction True for highest to lowest, false for lowest to highest
 * @returns The list with all the staff ranks
 */
// @ts-ignore
window.getStaffOrder = (direction) => {
    const list = ["player", "event-winner", "builder", "junior-mod", "junior-dev", "experienced-mod", "experienced-dev", "senior-mod", "senior-dev", "vice-admin", "lead-mod", "owner", "lead-dev", "admin"];
    if (direction) return list.toReversed();
    return list;
}

/**
 * Capitalizes each word in a string
 * 
 * @param {string} input The string to capitalize
 * @returns The capitalized string
 */
// @ts-ignore
window.capitalizeString = (input) => {
    input = input.toLowerCase();
    let output = input.charAt(0).toUpperCase();
    let previousChar = null;
    for (let i = 1; i < input.length; i++) {
        const currentChar = input.charAt(i);
        if (previousChar === " ") output += currentChar.toUpperCase();
        else output += currentChar;
        previousChar = currentChar;
    }
    return output;
}

document.getElementById("pancake-menu")?.addEventListener("click", () => {
    // Show navigation popup
    const navElement = document.getElementsByTagName("nav")[0];
    if (navElement) navElement.style.display = "flex";

    const cancelElement = document.createElement("div"), headerElement = document.getElementsByTagName("header")[0];
    cancelElement.id = "mobile-cancel";
    cancelElement.addEventListener("click", () => {
        navElement.style.display = "";
        cancelElement.remove();
    })
    if (headerElement) headerElement.append(cancelElement);
});