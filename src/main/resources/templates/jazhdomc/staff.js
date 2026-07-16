// Firebase imports
import { initializeApp } from "@firebase/app";
import { getFirestore, collection, getDocs } from "@firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA8ZAK0d32nqqB99mzNds_b7oZ8laNXKMY",
    authDomain: "jazhdomc.firebaseapp.com",
    projectId: "jazhdomc",
    storageBucket: "jazhdomc.firebasestorage.app",
    messagingSenderId: "194265089094",
    appId: "1:194265089094:web:8bdb609aa4980c55537647",
    measurementId: "G-5HWRNSBK5H"
};

// Initialize firebase and firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Go through all the users and record their roles with usernames
const usersSnapshot = await getDocs(collection(db, "users"));
const staffList = {};
usersSnapshot.forEach(doc => {
    const rolesList = doc.get("roles");
    const username = doc.get("usernames").minecraft[0] || (doc.get("usernames").discord[0] || doc.id);
    rolesList.forEach((/** @type {string} */ role) => {
        if (!staffList[role]) staffList[role] = [];
        let rolePosition = staffList[role];
        rolePosition[rolePosition.length] = username;
    });
});

// Display everyone's roles
const rolesElement = document.getElementById("roles");
if (rolesElement) {
    const heading = document.createElement("h2");
    heading.textContent = "People";
    rolesElement.append(heading);
    const staffOrderList = window.getStaffOrder(true);
    staffOrderList.splice(-2);
    staffOrderList.forEach(rank => {
        if (staffList[rank] && staffList[rank].length > 0) {
            const title = document.createElement("h3");
            title.textContent = window.capitalizeString(rank.replaceAll("-", " ").replace(" admin", " administrator").replace(" mod", " moderator").replace(" dev", " developer"));
            const userList = document.createElement("ul");
            staffList[rank].forEach(user => {
                const userElement = document.createElement("li");
                userElement.textContent = user;
                userList.append(userElement);
            });
            rolesElement.append(title, userList);
        }
    });

    // Event rank's special parsing
    Object.entries(staffList).forEach(([rankName, users]) => {
        if (rankName.endsWith("event-winner")) {
            const title = document.createElement("h3");
            title.textContent = window.capitalizeString(rankName.replaceAll("-", " "));
            const userList = document.createElement("ul");
            users.forEach(user => {
                const userElement = document.createElement("li");
                userElement.textContent = user;
                userList.append(userElement);
            });
            rolesElement.append(title, userList);
        }
    });

    // Player rank
    const title = document.createElement("h3");
    title.textContent = "Player"
    const userList = document.createElement("ul");
    staffList["player"].forEach(user => {
        const userElement = document.createElement("li");
        userElement.textContent = user;
        userList.append(userElement);
    });
    rolesElement.append(title, userList);
}