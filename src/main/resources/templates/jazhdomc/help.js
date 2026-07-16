// @ts-check

// Firebase imports
import { initializeApp } from "@firebase/app";
import { onAuthStateChanged, getAuth } from "@firebase/auth";
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp } from "@firebase/firestore";

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

// Global user
let /** @type {import("@firebase/auth").User | null} */ globalUser = null;

/**
 * Reloads the username/email options for including in a help message
 * 
 * @param {import("@firebase/auth").User | null} user 
 */
async function reloadOptions(user) {
    /**
     * Adds a checkbox item to the container
     * 
     * @param {string} name 
     */
    function addItem(name) {
        const label = document.createElement("label"), input = document.createElement("input");
        input.type = "checkbox";
        input.value = name;
        label.append(input, name);
        container?.append(label);
    }
    if (container) container.innerHTML = "";
    if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const usernames = userSnap.get("usernames");
        usernames.minecraft.forEach((/** @type {string} */ username) => addItem("Minecraft User: " + username));
        usernames.discord.forEach((/** @type {string} */ username) => addItem("Discord User: " + username));
        addItem("User ID: " + user.uid);
    } else addItem("Anonymous");
}

const container = document.getElementById("include");
document.getElementById("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loading
    const loadingElement = document.getElementById("loading");
    if (loadingElement) loadingElement.style.display = "";

    // Get form values
    const /** @type {string[]} */ checked = [];
    const /** @type {HTMLInputElement[]} */ checkboxes = [];
    document.querySelectorAll("#include input:checked").forEach(inputElement => {
        if (inputElement instanceof HTMLInputElement) {
            const valueAttribute = inputElement.value;
            if (valueAttribute) checked[checked.length] = valueAttribute;
            checkboxes[checkboxes.length] = inputElement;
        }
    });
    const titleElement = /** @type {HTMLInputElement | null} */ (document.getElementById("title"));
    let title = "";
    if (titleElement) title = titleElement.value;
    
    const messageElement = /** @type {HTMLTextAreaElement | null} */ (document.getElementById("message"));
    let message = "";
    if (messageElement) message = messageElement.value;

    // Add report and show result
    let error = false;
    const errorElement = document.getElementById("error");
    try {
        await addDoc(collection(db, "reports"), {
            identification: checked,
            title: title,
            message: message,
            timestamp: serverTimestamp(),
            uid: globalUser == null ? "" : globalUser.uid
        });
    } catch (err) {
        error = true;
        if (errorElement) {
            errorElement.textContent = "Error sending: " + err;
            errorElement.style.display = "";
        }
    }
    if (loadingElement) loadingElement.style.display = "none";
    const successElement = document.getElementById("success");
    if (!error) {
        if (successElement) successElement.style.display = "";
        checkboxes.forEach(e => e.checked = false);
        if (titleElement) titleElement.value = "";
        if (messageElement) messageElement.value = ""
    }
    setTimeout(() => {
        if (successElement && !error) successElement.style.display = "none";
        if (errorElement && error) errorElement.style.display = "none";
    }, 5000);
});

// If user logs out or in
onAuthStateChanged(auth, user => {
    reloadOptions(user);
    if (user) globalUser = user;
    else globalUser = null;
});

// Add server status
const serverStatusElement = document.getElementById("server-status");
if (serverStatusElement) {
    if ((await (await fetch("https://api.mcsrvstat.us/3/itsjaz.com")).json()).online) serverStatusElement.textContent = "Yes. It is online.";
    else serverStatusElement.textContent = "No. It is offline.";
} else console.error("Unable to find element with id server-status.");