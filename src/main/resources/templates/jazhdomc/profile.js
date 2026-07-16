// @ts-check

// Firebase imports
import { initializeApp } from "@firebase/app";
import { onAuthStateChanged, getAuth, signOut, unlink, linkWithPopup, reauthenticateWithPopup, deleteUser, GoogleAuthProvider, GithubAuthProvider, OAuthProvider } from "@firebase/auth";
import { deleteDoc, doc, getDoc, getFirestore } from "@firebase/firestore";

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
 * Shows a reauthentication menu so that user is recently logged in enough to run the callback
 * 
 * @param {import("@firebase/auth").User} user The user object
 * @param {function} callback The callback to run after the user authenticates
 */
async function showReauthenticationMenu(user, callback = () => {}) {
    const popup = document.createElement("div"), background = document.createElement("div"), main = document.getElementById("main");
    popup.id = "popup";
    popup.innerHTML = `<h1 style="margin: 0px;">Sign in again</h1><p id="errorMsg"></p><div id="google-auth-button"class="auth-button"style="display:none;" ><svg style="padding: 4px;"width="24"height="24"viewBox="0 0 48 48"fill="none"xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg><span>Sign in with Google</span></div><div id="microsoft-auth-button" class="auth-button" style="display:none;"><svg style="padding: 6px;" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="9" height="9" fill="#f25022" /><rect x="0" y="10" width="9" height="9" fill="#00a4ef" /><rect x="10" y="0" width="9" height="9" fill="#7fba00" /><rect x="10" y="10" width="9" height="9" fill="#ffb900" /></svg><span>Sign in with Microsoft</span></div><div id="github-auth-button" class="auth-button" style="display:none;"><svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56.7937 84.9688C44.4187 83.4688 35.7 74.5625 35.7 63.0313C35.7 58.3438 37.3875 53.2813 40.2 49.9063C38.9812 46.8125 39.1687 40.25 40.575 37.5313C44.325 37.0625 49.3875 39.0313 52.3875 41.75C55.95 40.625 59.7 40.0625 64.2937 40.0625C68.8875 40.0625 72.6375 40.625 76.0125 41.6563C78.9187 39.0313 84.075 37.0625 87.825 37.5313C89.1375 40.0625 89.325 46.625 88.1062 49.8125C91.1062 53.375 92.7 58.1563 92.7 63.0313C92.7 74.5625 83.9812 83.2813 71.4187 84.875C74.6062 86.9375 76.7625 91.4375 76.7625 96.5938L76.7625 106.344C76.7625 109.156 79.1062 110.75 81.9187 109.625C98.8875 103.156 112.2 86.1875 112.2 65.1875C112.2 38.6563 90.6375 17 64.1062 17C37.575 17 16.2 38.6562 16.2 65.1875C16.2 86 29.4187 103.25 47.2312 109.719C49.7625 110.656 52.2 108.969 52.2 106.438L52.2 98.9375C50.8875 99.5 49.2 99.875 47.7 99.875C41.5125 99.875 37.8562 96.5 35.2312 90.2188C34.2 87.6875 33.075 86.1875 30.9187 85.9063C29.7937 85.8125 29.4187 85.3438 29.4187 84.7813C29.4187 83.6563 31.2937 82.8125 33.1687 82.8125C35.8875 82.8125 38.2312 84.5 40.6687 87.9688C42.5437 90.6875 44.5125 91.9063 46.8562 91.9063C49.2 91.9063 50.7 91.0625 52.8562 88.9063C54.45 87.3125 55.6687 85.9063 56.7937 84.9688Z"fill="light-dark(black, white)" /></svg><span>Sign in with GitHub</span></div>`;
    background.id = "background";
    background.append(popup);
    if (main) main.append(background);
    else console.error("Element by the ID main was not found. Its current state: " + main);

    // @ts-ignore
    window.popupHeight = 70;
    user.providerData.forEach((userInfo) => {
        const authButton = document.getElementById(userInfo.providerId.split(".")[0] + "-auth-button");
        if (authButton) {
            // @ts-ignore
            window.popupHeight += 60;
            authButton.style.display = "flex";
            authButton.addEventListener("click", async () => {
                let userCredential;
                let err = false;
                try {
                    userCredential = await reauthenticateWithPopup(user, userInfo.providerId == "google.com" ? new GoogleAuthProvider() : userInfo.providerId == "microsoft.com" ? new OAuthProvider("microsoft.com") : new GithubAuthProvider());
                } catch (error) {
                    err = true;
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

                        // @ts-ignore
                        // Add height for the error message to fit
                        popup.style.height = `calc(${window.popupHeight}px + ${errorMsg.getBoundingClientRect().height}px)`;
                    } else console.error("Unable to find errorMsg element to show error message to user.");
                }
                if (!err) {
                    background.remove();
                    callback(userCredential);
                }
            });
        }
    });
    background.addEventListener("click", () => background.remove());
    popup.addEventListener("click", (e) => e.stopPropagation());
    
    // @ts-ignore
    popup.style.height = window.popupHeight + "px";
}

/**
 * Deletes a user account and their data
 * 
 * @param {import("@firebase/auth").User} user 
 */
async function deleteAccount(user) {
    await showReauthenticationMenu(user, async (/** @type {import("@firebase/auth").UserCredential} */ newUserCredential) => {
        const newUser = newUserCredential.user;
        try {
            await deleteDoc(doc(db, "users", newUser.uid));
        } catch (error) {
            console.error("An error occurred while removing the user doc: " + error);
        }
        deleteUser(newUser);
    });
}

/**
 * Capitalizes the first character of the string
 * 
 * @param {string} input The string to capitalize
 * @returns The capitalized string
 */
function capitalizeFirst(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

// Add user details when they come availble or redirect to login page if they logged out
onAuthStateChanged(auth, async user => {
    if (user) {
        // Show user details from all providers
        const providers = document.getElementById("providers");
        const /** @type {string[]} */ providersList = [];
        if (providers) {
            providers.innerHTML = "";
            user.providerData.forEach(userInfo => {
                const heading = document.createElement("h3"), pfp = /** @type {HTMLImageElement} */ document.createElement("img"),
                displayName = document.createElement("p"), email = document.createElement("p"),
                phoneNumber = document.createElement("p"), uid = document.createElement("uid");
                const providerName = userInfo.providerId.split(".")[0];
                heading.textContent = capitalizeFirst(providerName) + " User Details";
                providersList[providersList.length] = providerName;
                providers.append(heading);
                if (userInfo.photoURL) pfp.src = userInfo.photoURL;
                if (userInfo.displayName) displayName.textContent = "Display Name: " + userInfo.displayName;
                if (userInfo.email) email.textContent = "Email: " + userInfo.email;
                if (userInfo.phoneNumber) phoneNumber.textContent = userInfo.phoneNumber;
                const list = ["photoURL", pfp, "displayName", displayName, "email", email, "phoneNumber", phoneNumber];
                for (let i = 0; i < list.length; i += 2)
                    // @ts-ignore
                    if (userInfo[list[i]]) providers.append(list[i + 1]);
                uid.textContent = "User ID: " + userInfo.uid;
                providers.append(uid);
            })
        }

        // Show JazhdoMC user details
        const jazhdomcUserDetails = document.getElementById("jazhdomc-user-details")
        if (jazhdomcUserDetails) {
            jazhdomcUserDetails.innerHTML = "<h3>JazhdoMC User Details</h3>";
            const uid = document.createElement("p"), lastSignin = document.createElement("p"), accCreation = document.createElement("p"),
            minecraftHeader = document.createElement("h4"), discordHeader = document.createElement("h4"),
            minecraftUser = document.createElement("ul"), discordUser = document.createElement("ul");
            uid.textContent = "User ID: " + user.uid;
            lastSignin.textContent = "Last Sign In: " + user.metadata.lastSignInTime;
            accCreation.textContent = "Account Creation: " + user.metadata.creationTime;
            jazhdomcUserDetails.append(uid, lastSignin, accCreation);
            const userSnapshot = await getDoc(doc(db, "users", user.uid));
            const userData = userSnapshot.data();
            if (userData) {
                // Show minecraft usernames
                minecraftHeader.textContent = "Minecraft Usernames:";
                userData.usernames.minecraft.forEach((/** @type {string} */ username) => {
                    const listPart = document.createElement("li");
                    listPart.textContent = username;
                    minecraftUser.append(listPart);
                });

                // Show discord usernames
                discordHeader.textContent = "Discord Usernames:";
                userData.usernames.discord.forEach((/** @type {string} */ username) => {
                    const listPart = document.createElement("li");
                    listPart.textContent = username;
                    discordUser.append(listPart);
                });
            }
            jazhdomcUserDetails.append(minecraftHeader, minecraftUser, discordHeader, discordUser);
        }

        // Add logout functionality
        document.getElementById("logout")?.addEventListener("click", async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("An error occurred while signing out: " + error);
            }
        });

        // Add account deletion functionality
        document.getElementById("delete-acc")?.addEventListener("click", () => deleteAccount(user));

        // Change text
        providersList.forEach(provider => {
            const textElement = document.querySelector("#" + provider + "-auth span");
            if (textElement) textElement.textContent = "Remove " + capitalizeFirst(provider);
        });

        const providersTotalList = ["google", "microsoft", "github"];
        const errorMessage = document.getElementById("error-message");
        for (let i = 0; i < providersTotalList.length; i++) {
            if (providersList.includes(providersTotalList[i])) {
                document.getElementById(providersTotalList[i] + "-auth")?.addEventListener("click", async () => {
                    let error = false;
                    try {
                        await unlink(user, [GoogleAuthProvider.PROVIDER_ID, "microsoft.com", GithubAuthProvider.PROVIDER_ID][i])
                    } catch (err) {
                        error = true;
                        if (errorMessage) errorMessage.textContent = "Error: " + err;
                    }
                    if (!error) window.location.reload();
                });
            } else {
                document.getElementById(providersTotalList[i] + "-auth")?.addEventListener("click", async () => {
                    let error = false;
                    try {
                        await linkWithPopup(user, [new GoogleAuthProvider(), new OAuthProvider("microsoft.com"), new GithubAuthProvider()][i])
                    } catch (err) {
                        error = true;
                        if (errorMessage) errorMessage.textContent = "Error: " + err;
                    }
                    if (!error) window.location.reload();
                });
            }
        }
    // @ts-ignore
    } else window.redirectUser("login");
});