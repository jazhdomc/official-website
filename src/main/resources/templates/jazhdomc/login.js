// @ts-check

// Firebase imports
import { initializeApp } from "@firebase/app";
import { onAuthStateChanged, getAuth, GoogleAuthProvider, OAuthProvider, signOut, signInWithPopup, GithubAuthProvider } from "@firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "@firebase/firestore";

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
const db = getFirestore();

/**
 * Sign in with a auth provider (used for signin button clicks)
 * 
 * @param {import("@firebase/auth").AuthProvider} authProvider
 */
async function signIn(authProvider) {
    try {
        const result = await signInWithPopup(auth, authProvider);
        if (result) {
            // Log user details in console
            const user = result.user;
            console.log("User has signed in with details:\nDisplay Name: " + user.displayName + "\nEmail: " + user.email + "\nProvider: " + result.providerId);

            // Add starting info if starting
            const userRef = doc(db, "users", user.uid);
            if (!(await getDoc(userRef)).exists()) {
                await setDoc(userRef, {
                    roles: ["player"],
                    usernames: {
                        minecraft: [],
                        discord: []
                    }
                }, { merge: true });
            }

            // @ts-ignore
            // Redirect on login
            window.redirectUser("dashboard");
        }
    } catch (error) {
        // @ts-ignore
        // Error code and message
        const errorCode = error.code, errorMessage = error.message;

        // Log error to console
        console.error("An error occurred while signing in.\nError Code: " + errorCode + "\nError Message: " + errorMessage + "\nSpecific Error: " + error);

        // Display error to user
        const errorMsg = document.getElementById("errorMsg");
        if (errorMsg) {
            // Show error message
            errorMsg.textContent = "Error: " + errorCode + ": " + errorMessage;

            // Add height for the error message to fit
            const authPage = document.getElementById("auth-page");
            if (authPage) authPage.style.height = `calc(250px + ${errorMsg.getBoundingClientRect().height}px)`;
        } else console.error("Unable to find errorMsg element to show error message to user.");
    }
}

// Login/Logout changes
let firstLoad = true;
onAuthStateChanged(auth, user => {
    // If its the first time loading the page, load the login methods separately to not show a bang of content before user is automatically redirected to dashboard
    if (firstLoad == true) {
        // Redirect user if they are already logged in
        if (user) {
            // @ts-ignore
            // Redirect user to dashboard
            window.redirectUser("dashboard");
        }

        // Prevent future runs while not on first load
        firstLoad = false;

        // Show auth page with logins
        const authPage = document.getElementById("auth-page");
        if (authPage) authPage.style.display = "flex";
        else console.error("Unable to find auth page element to show. ID selector #auth-page not found.");

        // Add login to auth buttons
        document.getElementById("google-auth-button")?.addEventListener("click", async () => await signIn(new GoogleAuthProvider));
        document.getElementById("microsoft-auth-button")?.addEventListener("click", async () => await signIn(new OAuthProvider("microsoft.com")));
        document.getElementById("github-auth-button")?.addEventListener("click", async () => await signIn(new GithubAuthProvider));
    }
});