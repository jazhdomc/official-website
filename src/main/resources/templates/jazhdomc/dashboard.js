// @ts-check

// Firebase imports
import { initializeApp } from "@firebase/app";
import { onAuthStateChanged, getAuth } from "@firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp } from "@firebase/firestore";

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
 * @typedef {Object} entry
 * @property {string} action
 * @property {Timestamp | Date} timestamp
 * @property {string} type
 * @property {string} uid
 */

const miniProgramScripts = {
    "Guides": {
        desc: "A few informational guides describing many parts of the server.",
        perm: 0,
        func: (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ perm, /** @type {string} */ highestRank, /** @type {string[]} */ _roleList) => {
            const list = document.createElement("ul");
            /**
             * Makes a page link with the name and href
             * 
             * @param {string} name The display name of the page
             * @param {string} href The link url of the page
             */
            function makePage(name, href) {
                const element = document.createElement("a");
                const listItem = document.createElement("li");
                element.textContent = name;
                element.href = "/guides/" + href;
                element.target = "_blank";
                listItem.append(element);
                list.append(listItem);
            }
            makePage("Starter Guide", "starter");
            if (highestRank.includes("dev") || perm == 4) makePage("Developer Guide", "developer");
            if (highestRank.includes("mod") || perm == 4) makePage("Moderator Guide", "moderator");
            container.append(list);
        }
    },
    "Your Roles": {
        desc: "All your roles at JazhdoMC, listed from highest to lowest.",
        perm: 0,
        func: (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ roleList) => {
            // @ts-ignore
            const staffList = window.getStaffOrder(true);
            staffList.splice(-2);
            const /** @type {string[]} */ rankList = [];
            staffList.forEach((/** @type {string} */ rank) => {
                if (roleList.includes(rank)) rankList.push(rank);
            });
            const notice = document.createElement("p");
            notice.textContent = "The roles listed here are refreshed every page refresh. Refresh the page for the latest info.";
            container.append(notice);
            /**
             * Adds a rank to to the list element
             * 
             * @param {string} rankName The rank's name
             */
            function addRank(rankName) {
                const rankElement = document.createElement("li");
                rankElement.textContent = formatRole(rankName);
                rankContainer.append(rankElement);
            }
            const rankContainer = document.createElement("ul");
            rankList.forEach(rank => addRank(rank));
            roleList.forEach(rank => {
                if (rank.endsWith("-event-winner")) addRank(rank);
            });
            if (roleList.includes("player")) addRank("Player");
            container.append(rankContainer);
        }
    },
    "Mod Log": {
        desc: "A mandatory log of all moderation actions done.",
        perm: 1,
        func: async (/** @type {import("@firebase/auth").User} */ user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const header1 = document.createElement("h2"), text1 = document.createElement("p"),
            form = document.createElement("form"), input = document.createElement("input"),
            submitInfo = document.createElement("p"), submit = document.createElement("button"),
            header2 = document.createElement("h2"), text2 = document.createElement("p");
            header1.textContent = "New Log";
            text1.textContent = "Make this nice and simple. Be reasonable.";
            submitInfo.textContent = "";
            submitInfo.style.display = "none";
            submit.type = "submit";
            submit.textContent = "Submit";
            form.append(input, submitInfo, submit);
            header2.textContent = "Log";
            text2.innerHTML = "Format: \"[<b>date</b>T<b>time</b>.000Z] <b>user-id</b> <b>type-of-log</b> <b>log-action</b>\"";
            container.append(header1, text1, form, header2, text2);
            const currentRef = doc(db, "mod-log", "log-" + (await getDoc(doc(db, "mod-log", "logs"))).get("current-log"));
            form.addEventListener("submit", async (e) => {
                e.preventDefault();

                submitInfo.style.color = "";
                submitInfo.textContent = "Submitting log...";
                submitInfo.style.display = "";

                // Setup and get values for the updated log
                const currentLog = (await getDoc(doc(db, "mod-log", "logs"))).get("current-log");
                const currentRef = doc(db, "mod-log", "log-" + currentLog);
                const currentSnap = (await getDoc(currentRef));
                const currentCount = currentSnap.get("count") + 1;
                let /** @type {entry[]} */ currentEntries = currentSnap.get("entries");
                const info = {
                    action: input.value,
                    timestamp: new Date(),
                    type: "manually",
                    uid: user.uid
                };
                if (currentEntries && currentEntries.length > 0) currentEntries.push(info);
                else currentEntries = [ info ];

                // Update database with the new log
                let error = false;
                try {
                    await setDoc(currentRef, {
                        count: currentCount || currentEntries.length,
                        entries: currentEntries
                    }, { merge: true });
                } catch (err) {
                    error = true;
                    submitInfo.style.color = "red";
                    submitInfo.textContent = "Error submitting mod log: " + err;
                    setTimeout(() => {
                        submitInfo.style.display = "none";
                    }, 5000);
                }
                if (!error) {
                    input.value = "";
                    submitInfo.style.color = "green";
                    submitInfo.textContent = "Successfully submitted log.";
                    setTimeout(() => {
                        submitInfo.style.display = "none";
                    }, 5000);
                }

                // Add to current log if it's past 50
                if (currentCount == 50) await setDoc(doc(db, "mod-log", "log"), { "current-log": Number.parseInt(currentLog) + 1 }, { merge: true });
            });
            onSnapshot(currentRef, (newSnap) => {
                document.querySelectorAll(".log-item").forEach(e => e.remove());
                const /** @type {entry[]} */ newEntries = newSnap.get("entries");
                if (newEntries && newEntries.length > 0) {
                    newEntries.toReversed().forEach((/** @type {entry} */ entry) => {
                        const entryElement = document.createElement("p");
                        entryElement.className = "log-item";
                        if (entry.timestamp instanceof Timestamp) entryElement.textContent = "[" + entry.timestamp.toDate().toISOString() + "] \"" + entry.uid + "\" " + entry.type + " logged \"" + entry.action + "\"";
                        container.append(entryElement);
                    });
                }
            });
        }
    },
    "Change Roles": {
        desc: "Request a change of role(s).",
        perm: 0,
        func: async (/** @type {import("@firebase/auth").User} */ user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const title1 = document.createElement("h2"), rolesBox = document.createElement("div"),
            addRole = document.createElement("button"), whyText = document.createElement("h3"),
            why = document.createElement("textarea"), submitChanges = document.createElement("button"),
            title2 = document.createElement("h2"), requestsBox = document.createElement("div");
            title1.textContent = "Change your roles";
            const userSnap = await getDoc(doc(db, "users", user.uid));
            const /** @type {string[]} */ newRoleList = userSnap.get("roles") || {};
            newRoleList.forEach((/** @type {string} */ role) => {
                const div = document.createElement("div"), input = document.createElement("input"), exit = document.createElement("button");
                input.value = formatRole(role);
                exit.append(document.createElement("hr"));
                exit.addEventListener("click", () => div.remove());
                exit.className = "minus-icon";
                div.append(input, exit);
                rolesBox.append(div);
            });
            rolesBox.id = "roles-box";
            addRole.textContent = "Add a role";
            addRole.addEventListener("click", () => {
                const div = document.createElement("div"), input = document.createElement("input"), exit = document.createElement("button");
                exit.append(document.createElement("hr"));
                exit.addEventListener("click", () => div.remove());
                exit.className = "minus-icon";
                div.append(input, exit);
                rolesBox.append(div);
            });
            whyText.textContent = "Why should we accept?";
            submitChanges.textContent = "Request Changes";
            submitChanges.addEventListener("click", async () => {
                const /** @type {string[]} */ updatedRoleList = [];
                document.querySelectorAll("#roles-box div input").forEach((inputElement) => {
                    if (inputElement instanceof HTMLInputElement) updatedRoleList.push(inputElement.value);
                });
                const /** @type {{ role: string, type: string }[]} */ changes = [];
                updatedRoleList.forEach((role, i) => {
                    role = role.toLowerCase().replaceAll(" ", "-").replace("administrator", "admin").replace("developer", "dev").replace("moderator", "mod");
                    if (!newRoleList.includes(role)) {
                        changes.push({
                            role: role,
                            type: "addition"
                        });
                    }
                    updatedRoleList[i] = role;
                });
                newRoleList.forEach((role) => {
                    if (!updatedRoleList.includes(role)) {
                        changes.push({
                            role: role,
                            type: "subtraction"
                        });
                    }
                });

                // Verify changes are all valid roles
                // @ts-ignore
                const validRoles = window.getStaffOrder(false).splice(2);
                const /** @type {{ role: string, type: string }[]} */ validChanges = [];
                const /** @type {string[]} */ invalidChanges = [];
                changes.forEach(change => {
                    if (change.type == "subtraction" || validRoles.includes(change.role) || change.role.endsWith("-event-winner") || change.role == "player") validChanges.push(change);
                    else invalidChanges.push(change.role);
                });
                if (invalidChanges.length > 0) {
                    alert("Invalid Roles: \"" + invalidChanges.join("\", \"") + "\".");
                    return;
                }
                if (changes.length == 0) {
                    alert("Must have some change of roles.");
                    return;
                }

                const requestsRef = doc(db, "role-requests", user.uid);
                const previousRequests = (await getDoc(requestsRef)).get("requests") || [];
                previousRequests.push({
                    body: why.value,
                    changes: validChanges,
                    timestamp: new Date(),
                });
                why.value = "";
                await setDoc(requestsRef, {
                    requests: previousRequests
                }, { merge: true });
            });
            title2.textContent = "Your role change requests";
            onSnapshot(doc(db, "role-requests", user.uid), (newSnap) => {
                requestsBox.innerHTML = "";
                requestsBox.style.display = "flex";
                requestsBox.style.flexDirection = "column-reverse";
                const /** @type {{ accepted: boolean | undefined, body: string, changes: { role: string, type: string }[], timestamp: Timestamp }[]} */ requests = newSnap.get("requests");
                if (requests && requests.length > 0) {
                    requests.forEach((request) => {
                        const requestElement = document.createElement("p");
                        const /** @type {string[]} */ changes = [];
                        request.changes.forEach((change) => changes.push((change.type == "addition" ? "+" : "-") + change.role));
                        requestElement.textContent = "[" + request.timestamp.toDate().toISOString() + "] Changes: " + changes.join(", ") + ", Reason: \"" + request.body + "\"" + ((request.accepted != undefined) ? (", Accepted: " + request.accepted) : "");
                        requestsBox.append(requestElement);
                    });
                }
            });
            container.append(title1, rolesBox, addRole, whyText, why, document.createElement("br"), submitChanges, title2, requestsBox);
        }
    },
    "Role Requests": {
        desc: "Approve or deny role requests.",
        perm: 3,
        func: async (/** @type {import("@firebase/auth").User} */ user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const allRequests = await getDocs(collection(db, "role-requests"));
            let requestCount = 0;
            allRequests.forEach((requestSection) => {
                const /** @type {{ accepted: boolean | undefined, body: string, changes: { role: string, type: string }[], timestamp: Timestamp }[]} */ requests = requestSection.get("requests");
                requests.forEach((request, i) => {
                    if (request.accepted == undefined) {
                        requestCount++;
                        const requestContainer = document.createElement("div"), requestElement = document.createElement("p"),
                        /** @type {string[]} */ changesList = [], statusElement = document.createElement("p"),
                        accept = document.createElement("button"), reject = document.createElement("button");
                        request.changes.forEach((change) => changesList.push((change.type == "addition" ? "+" : "-") + change.role));
                        requestElement.textContent = "[" + request.timestamp.toDate().toISOString() + "] User ID: " + requestSection.id + " | Changes: " + changesList.join(", ") + " | Reason: \"" + request.body + "\" | ";
                        requestElement.style.display = "inline";
                        statusElement.style.display = "none";
                        accept.textContent = "Accept";
                        reject.textContent = "Reject";
                        async function submit(/** @type {boolean} */ status) {
                            if (requestSection.id == user.uid) {
                                alert("You cannot " + (status ? "accep" : "rejec") + "t your own request.");
                                return;
                            }
                            statusElement.style.color = "";
                            statusElement.textContent = (status ? "Accep" : "Rejec") + "ting request...";
                            statusElement.style.display = "inline";
                            let error = false;
                            try {
                                const originalRef = doc(db, "role-requests", requestSection.id);
                                const originalRequests = (await getDoc(originalRef)).get("requests");
                                request.accepted = status;
                                originalRequests[i] = request;
                                await setDoc(originalRef, {
                                    requests: originalRequests
                                }, { merge: true });
                                if (status) {
                                    const userRef = doc(db, "users", requestSection.id);
                                    const /** @type {string[]} */ originalRoles = (await getDoc(userRef)).get("roles");
                                    function removeRole(/** @type {string[]} */ rolesList, /** @type {string} */ role) {
                                        const index = rolesList.indexOf(role);
                                        if (index >= 0) rolesList.splice(index, 1);
                                    }
                                    request.changes.forEach(change => {
                                        if (change.type === "subtraction") removeRole(originalRoles, change.role);
                                        else if (change.type === "addition") originalRoles.push(change.role);
                                    });
                                    await setDoc(userRef, {
                                        roles: originalRoles
                                    }, { merge: true });
                                }
                            } catch (err) {
                                error = true;
                                statusElement.style.color = "red";
                                statusElement.textContent = "Error " + (status ? "accep" : "rejec") + "ting request: " + err;
                                setTimeout(() => {
                                    statusElement.style.display = "none";
                                }, 5000);
                            }
                            if (!error) {
                                addModLog(user.uid, (status ? "Accep" : "Rejec") + "ted role change request from " + requestSection.id + " with changes: " + changesList.join(", "));
                                statusElement.style.color = "green";
                                statusElement.textContent = "Successfully " + (status ? "accep" : "rejec") + "ted request.";
                                accept.remove();
                                reject.remove();
                                setTimeout(() => {
                                    statusElement.style.display = "none";
                                    requestContainer.remove();
                                    requestCount--;
                                    if (requestCount == 0) {
                                        const noneElement = document.createElement("p");
                                        noneElement.textContent = "No requests currently active. Check back later to see if anyone makes one. You have to reopen this popup to refresh the list.";
                                        container.append(noneElement);
                                    }
                                }, 5000);
                            }
                        }
                        accept.addEventListener("click", () => submit(true));
                        reject.addEventListener("click", () => submit(false));
                        requestContainer.append(requestElement, statusElement, accept, reject);
                        container.append(requestContainer);
                    }
                });
            });
            if (requestCount == 0) {
                const noneElement = document.createElement("p");
                noneElement.textContent = "No requests currently active. Check back later to see if anyone makes one. You have to reopen this popup to refresh the list.";
                container.append(noneElement);
            }
        }
    },
    "Change Usernames": {
        desc: "Request a change of username(s).",
        perm: 0,
        func: async (/** @type {import("@firebase/auth").User} */ user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const title1 = document.createElement("h2"), minecraftHeader = document.createElement("h3"), minecraftDiv = document.createElement("div"), minecraftAddMore = document.createElement("button"),
            discordHeader = document.createElement("h3"), discordDiv = document.createElement("div"), discordAddMore = document.createElement("button"), whyText = document.createElement("h3"),
            why = document.createElement("textarea"), status = document.createElement("p"), submit = document.createElement("button"), title2 = document.createElement("h2"), requestsDiv = document.createElement("div");
            title1.textContent = "Change your usernames";
            minecraftHeader.textContent = "Minecraft Usernames";
            const userSnap = await getDoc(doc(db, "users", user.uid));
            const usernames = userSnap.get("usernames");
            function addInput(/** @type {HTMLDivElement} */ container, /** @type {string} */ username) {
                const usernameDiv = document.createElement("div"), usernameElement = document.createElement("input"), remove = document.createElement("button");
                usernameElement.value = username;
                remove.addEventListener("click", () => usernameDiv.remove());
                remove.append(document.createElement("hr"));
                remove.className = "minus-icon";
                usernameDiv.append(usernameElement, remove);
                container.append(usernameDiv);
            }
            usernames.minecraft.forEach((/** @type {string} */ username) => addInput(minecraftDiv, username));
            minecraftAddMore.textContent = "Add a username";
            minecraftAddMore.addEventListener("click", () => addInput(minecraftDiv, ""));
            minecraftDiv.id = "minecraft-usernames";
            discordHeader.textContent = "Discord Usernames";
            usernames.discord.forEach((/** @type {string} */ username) => addInput(discordDiv, username));
            discordAddMore.textContent = "Add a username";
            discordAddMore.addEventListener("click", () => addInput(discordDiv, ""));
            discordDiv.id = "discord-usernames";
            whyText.textContent = "Why should we accept?";
            status.style.display = "none";
            submit.textContent = "Request Changes";
            submit.style.display = "block";
            const requestRef = doc(db, "username-requests", user.uid);
            submit.addEventListener("click", async () => {
                status.style.color = "";
                status.textContent = "Sending request...";
                status.style.display = "";
                // Make sure request is valid and get contents
                /**
                 * Returns the greater value of two values
                 * 
                 * @param {Number} a The first value
                 * @param {Number} b The second value
                 * @returns The greater value
                 */
                function max(a,b){return a>b?a:b;}
                const /** @type {{ minecraft: string[], discord: string[] }} */ newUsernames = {
                    minecraft: [],
                    discord: []
                }
                const /** @type {{ minecraft: { old: string, new: string }[], discord: { old: string, new: string }[] }} */ changes = {
                    minecraft: [],
                    discord: []
                };
                ["minecraft", "discord"].forEach((name) => {
                    document.querySelectorAll("#" + name + "-usernames div input").forEach((element) => {
                        // @ts-ignore
                        if (element instanceof HTMLInputElement) newUsernames[name].push(element.value);
                    });
                    // @ts-ignore
                    for (let i = max(usernames[name].length, newUsernames[name].length) - 1; i >= 0; i--) {
                        // @ts-ignore
                        if (usernames[name][i] !== newUsernames[name][i]) {
                            // @ts-ignore
                            changes[name].push({
                                old: usernames[name][i] || null,
                                // @ts-ignore
                                new: newUsernames[name][i] || null
                            });
                        }
                    }
                });

                // Validate request
                if (changes.discord.length == 0 && changes.minecraft.length == 0) {
                    status.style.color = "red";
                    status.textContent = "Error sending request: A change of usernames is required.";
                    setTimeout(() => {
                        status.style.display = "none";
                    }, 5000);
                    return;
                }
                let /** @type {string[]} */ parsedThrough = [];
                for (let i = 0; i < newUsernames.discord.length; i++) {
                    const currentUsername = newUsernames.discord[i];
                    if (parsedThrough.includes(currentUsername)) {
                        status.style.color = "red";
                        status.textContent = "Error sending request: Duplicate discord username " + currentUsername + " found. Duplicates are not allowed.";
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                        return;
                    } else parsedThrough.push(currentUsername);
                }
                parsedThrough = [];
                for (let i = 0; i < newUsernames.minecraft.length; i++) {
                    const currentUsername = newUsernames.minecraft[i];
                    if (parsedThrough.includes(currentUsername)) {
                        status.style.color = "red";
                        status.textContent = "Error sending request: Duplicate minecraft username " + currentUsername + " found. Duplicates are not allowed.";
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                        return;
                    } else parsedThrough.push(currentUsername);
                }
                for (let i = 0; i < newUsernames.discord.length; i++) {
                    if (newUsernames.discord[i] === "") {
                        status.style.color = "red";
                        status.textContent = "Error sending request: A discord username is blank. Please put something as the username.";
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                        return;
                    }
                }
                for (let i = 0; i < newUsernames.minecraft.length; i++) {
                    if (newUsernames.minecraft[i] === "") {
                        status.style.color = "red";
                        status.textContent = "Error sending request: A minecraft username is blank. Please put something as the username.";
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                        return;
                    }
                }

                // Send request
                let error = false;
                try {
                    const originalDoc = await getDoc(requestRef);
                    const originalRequests = originalDoc.get("requests") || [];
                    originalRequests.push({
                        body: why.value,
                        changes: changes,
                        timestamp: new Date(),
                    });
                    await setDoc(requestRef, {
                        requests: originalRequests
                    }, { merge: true });
                } catch (err) {
                    error = true;
                    status.style.color = "red";
                    status.textContent = "Error sending request: " + err;
                    setTimeout(() => {
                        status.style.display = "none";
                    }, 5000);
                }
                if (!error) {
                    status.style.color = "green";
                    why.value = "";
                    status.textContent = "Successfully sent request.";
                    setTimeout(() => {
                        status.style.display = "none";
                    }, 5000);
                }
            });
            title2.textContent = "Your username change requests";
            requestsDiv.style.display = "flex";
            requestsDiv.style.flexDirection = "column-reverse";
            onSnapshot(requestRef, (updatedDoc) => {
                const /** @type {{ accepted: boolean | undefined, body: string, changes: { discord: { new: string, old: string }[], minecraft: { new: string, old: string }[] }, timestamp: Timestamp }[]} */ requests = updatedDoc.get("requests");
                if (requests) {
                    requestsDiv.innerHTML = "";
                    requests.forEach((request) => {
                        const requestElement = document.createElement("p");
                        const /** @type {string[]} */ changes = [];
                        // @ts-ignore
                        ["Discord", "Minecraft"].forEach((part) => request.changes[part.toLowerCase()].forEach((change) => changes.push(part + ": -" + change.old + " +" + change.new)));
                        requestElement.textContent = "[" + request.timestamp.toDate().toISOString() + "] Changes: (" + changes.join("), (") + ") | Reason: \"" + request.body + "\"" + (request.accepted !== undefined ? (" | Accepted: " + (request.accepted ? "true" : "false")) : "");
                        requestsDiv.append(requestElement);
                    });
                }
            });
            container.append(title1, minecraftHeader, minecraftDiv, minecraftAddMore, discordHeader, discordDiv, discordAddMore, whyText, why, status, submit, title2, requestsDiv);
        }
    },
    "Username Requests": {
        desc: "Approve or deny username change requests.",
        perm: 1,
        func: async (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const requestsDoc = await getDocs(collection(db, "username-requests")), requestsDiv = document.createElement("div");
            requestsDoc.forEach((requestDoc) => {
                const /** @type {{ accepted: boolean | undefined, body: string, changes: { discord: { new: string, old: string }[], minecraft: { new: string, old: string }[] }, timestamp: Timestamp }[]} */ requests = requestDoc.get("requests");
                if (requests && requests.length > 0) {
                    requests.forEach((request, index) => {
                        if (request.accepted === undefined) {
                            const requestDiv = document.createElement("div"), requestElement = document.createElement("p"), status = document.createElement("p"), accept = document.createElement("button"), reject = document.createElement("button");
                            const /** @type {string[]} */ changes = [];
                            // @ts-ignore
                            ["Discord", "Minecraft"].forEach((part) => request.changes[part.toLowerCase()].forEach((change) => changes.push(part + ": -" + change.old + " +" + change.new)));
                            requestElement.textContent = "[" + request.timestamp.toDate().toISOString() + "] User ID: " + requestDoc.id + " | Changes: (" + changes.join("), (") + ") | Reason: " + request.body + " | ";
                            requestElement.style.display = "inline";
                            status.style.display = "none";
                            async function finish(/** @type {boolean} */ accepted) {
                                const acceptedMsg = accepted ? "Accept" : "Reject";
                                status.textContent = acceptedMsg + "ing request... ";
                                status.style.display = "inline";
                                status.style.color = "";
                                let error = false;
                                try {
                                    const originalDoc = await getDoc(requestDoc.ref);
                                    const originalRequests = originalDoc.get("requests") || [];
                                    request.accepted = accepted;
                                    originalRequests[index] = request;
                                    await setDoc(requestDoc.ref, {
                                        requests: originalRequests
                                    }, { merge: true });
                                    if (accepted) {
                                        const userRef = doc(db, "users", requestDoc.id);
                                        const originalUserDoc = await getDoc(userRef);
                                        /**
                                         * Finds a element in a list and replaces it with another
                                         * 
                                         * @param {string} find The string to find
                                         * @param {string} replace The string to replace
                                         * @param {string[]} list The string array to search in
                                         */
                                        function findAndReplace(find, replace, list) {
                                            for (let i = 0; i < list.length; i++) {
                                                if (list[i] === find) {
                                                    list[i] = replace;
                                                    return;
                                                }
                                            }
                                        }
                                        /**
                                         * Removes the first occurrence of a string from a string array
                                         * 
                                         * @param {string} username The string to find
                                         * @param {string[]} list The array to search in
                                         */
                                        function removeUsername(username, list) {
                                            const index = list.indexOf(username);
                                            if (index >= 0) list.splice(index, 1);
                                        }
                                        const updated = originalUserDoc.get("usernames");
                                        // @ts-ignore
                                        ["discord", "minecraft"].forEach((part) => request.changes[part].forEach(change => {
                                            if (change.old == null) updated[part].push(change.new)
                                            else if (change.new == null) removeUsername(change.old, updated[part]);
                                            else findAndReplace(change.old, change.new, updated[part]);
                                        }));
                                        await setDoc(userRef, {
                                            usernames: updated
                                        }, { merge: true });
                                    }
                                } catch (err) {
                                    error = true;
                                    status.style.color = "red";
                                    status.textContent = "Error " + acceptedMsg.toLowerCase() + "ing request: " + err + " ";
                                    setTimeout(() => {
                                        status.style.display = "none";
                                    }, 5000);
                                }
                                if (!error) {
                                    status.style.color = "green";
                                    status.textContent = "Successfully " + acceptedMsg.toLowerCase() + "ed request ";
                                    accept.remove();
                                    reject.remove();
                                    setTimeout(() => {
                                        status.style.display = "none";
                                        requestDiv.remove();
                                        if (!requestsDiv.hasChildNodes()) requestsDiv.innerHTML = "<p>No requests currently active. Check back later to see if anyone makes one. You have to reopen this popup to refresh the list.</p>";
                                    }, 5000);
                                }
                            }
                            accept.addEventListener("click", () => finish(true));
                            reject.addEventListener("click", () => finish(false));
                            accept.textContent = "Accept";
                            reject.textContent = "Reject";
                            requestDiv.append(requestElement, status, accept, reject);
                            requestsDiv.append(requestDiv);
                        }
                    });
                }
                if (!requestsDiv.hasChildNodes()) requestsDiv.innerHTML = "<p>No requests currently active. Check back later to see if anyone makes one. You have to reopen this popup to refresh the list.</p>";
            });
            container.append(requestsDiv);
        }
    },
    "Report Viewing": {
        desc: "View suggestions and bug reports",
        perm: 1,
        func: async (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const reportSnap = await getDocs(query(collection(db, "reports"), orderBy("timestamp", "desc")));
            reportSnap.forEach((report) => {
                // @ts-ignore
                const /** @type {{ identification: string[], message: string, timestamp: Timestamp, title: string, uid: string }} */ reportData = report.data();
                if (reportData) {
                    const title = document.createElement("h3"), uid = document.createElement("p"), idHeader = document.createElement("p"), id = document.createElement("ul"), timestamp = document.createElement("p"), message = document.createElement("p");
                    title.textContent = reportData.title;
                    uid.textContent = "User ID: " + reportData.uid;
                    idHeader.textContent = "Identification Methods:";
                    reportData.identification.forEach((idMethod) => {
                        const li = document.createElement("li");
                        li.textContent = idMethod;
                        id.append(li);
                    });
                    timestamp.textContent = "Time: " + reportData.timestamp.toDate().toISOString();
                    message.textContent = "Message: " + reportData.message;
                    container.append(title, uid, idHeader, id, timestamp, message);
                }
            });
        }
    },
    "User ID Map": {
        desc: "A map of user IDs to their usernames",
        perm: 1,
        func: async (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            const userDocs = await getDocs(collection(db, "users"));
            userDocs.forEach((userDoc) => {
                const userElement = document.createElement("p"), usernames = userDoc.get("usernames");;
                userElement.textContent = userDoc.id + " - Minecraft: \"" + usernames.minecraft.join("\", \"") + "\" - Discord: \"" + usernames.discord.join("\", \"") + "\"";
                container.append(userElement);
            });
        }
    },
    "Legal Docs": {
        desc: "Edit the legal documents here.",
        perm: 4,
        func: (/** @type {import("@firebase/auth").User} */ user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            ["Privacy Policy", "Terms of Service"].forEach(async (documentName) => {
                const title = document.createElement("h2"), docRef = doc(db, "legal", documentName.toLowerCase().replaceAll(" ", "-")), edit = document.createElement("textarea"), status = document.createElement("p"), save = document.createElement("button");
                title.textContent = "Update the " + documentName;
                edit.value = (await getDoc(docRef)).get("content");
                edit.style.width = "100%";
                status.style.display = "none";
                save.textContent = "Update Document";
                save.addEventListener("click", async () => {
                    status.style.color = "";
                    status.textContent = "Updating document...";
                    status.style.display = "";
                    let error = false;
                    try {
                        await setDoc(docRef, {
                            timestamp: serverTimestamp(),
                            content: edit.value
                        }, { merge: true });
                    } catch (err) {
                        error = true;
                        status.style.color = "red";
                        status.textContent = "Error updating document: " + err;
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                    }
                    if (!error) {
                        addModLog(user.uid, "Updated the " + documentName + " legal document.");
                        status.style.color = "green";
                        status.textContent = "Successfully updated document.";
                        setTimeout(() => {
                            status.style.display = "none";
                        }, 5000);
                    }
                });
                container.append(title, edit, status, save);
            });
        }
    },
    "Eaglercraft Clients": {
        desc: "A collection of Eaglercraft clients in case you need one.",
        perm: 0,
        func: (/** @type {import("@firebase/auth").User} */ _user, /** @type {HTMLDivElement} */ container, /** @type {Number} */ _perm, /** @type {string} */ _highestRank, /** @type {string[]} */ _roleList) => {
            container.innerHTML += "<p>1.8.8 as a version is faster than 1.12.2 because it contains less features to load. WASM is usually faster than JS versions of the same client version.</p><ul><li><a href=\"/html/eagler/1.8.8-u53-JS\">Eaglercraft 1.8.8 u53 JavaScript</a></li><li><a href=\"/html/eagler/1.8.8-u53-WASM\">Eaglercraft 1.8.8 u53 WASM</a></li><li><a href=\"/html/eagler/1.12.2-JS\">Eaglercraft 1.12.2 JavaScript</a></li><li><a href=\"/html/eagler/1.12.2-WASM\">Eaglercraft 1.12.2 WASM</a></li></ul>";
        }
    }
};

/**
 * Gets the index of the specified element in the list
 * 
 * @param {string[]} list The list to search in
 * @param {string} element The target element
 * @returns The index of the target element, or -1 if not found
 */
function findIndex(list, element) {
    for (let i = 0; i < list.length; i++) if (list[i] === element) return i;
    return -1;
}

/**
 * Returns the highest role
 * 
 * @param {string[]} rolesList The list to find the highest role in
 * @returns The highest role
 */
function getHighestRole(rolesList) {
    const roles = Array.from(rolesList);

    // Replace event winning titles with just event-winner
    for (let i = 0; i < roles.length; i++) if (roles[i].endsWith("-event-winner")) roles[i] = "event-winner";

    // @ts-ignore
    const rolesOrder = window.getStaffOrder(false);
    let top = {
        role: "player",
        index: 0
    };
    roles.forEach((role) => {
        const index = findIndex(rolesOrder, role);
        if (index > top.index) {
            top.role = role;
            top.index = index;
        }
    });
    return top.role;
}

/**
 * Returns the numbered position of the role
 * 
 * @param {string} role The role to check the position of
 * @returns The number of its position
 */
function role2num(role) {
    if (["player", "builder"].includes(role) || role.endsWith("event-winner")) return 0;
    else if (role.startsWith("junior-")) return 1;
    else if (role.startsWith("experienced-")) return 2;
    else if (role.startsWith("senior-")) return 3;
    else if (["admin", "vice-admin", "owner"].includes(role) || role.startsWith("lead-")) return 4;
    else return 0;
}

/**
 * Formats a role string
 * 
 * @param {string} role The string to format
 * @returns The formatted role
 */
function formatRole(role) {
    // @ts-ignore
    return window.capitalizeString(role.replaceAll("-", " ").replace(" admin", " administrator").replace(" mod", " moderator").replace(" dev", " developer"));
}

// Detect auth changes like signin/signout
const grid = document.getElementById("grid");
const titleElement = document.getElementById("title");
const main = document.getElementById("main");
onAuthStateChanged(auth, async (/** @type {import("@firebase/auth").User | null} */user) => {
    // Make sure user is logged in, or else make them login
    if (user) {
        // Update title
        const rolesList = (await getDoc(doc(db, "users", user.uid))).get("roles");
        const highestRole = getHighestRole(rolesList);
        if (titleElement) titleElement.textContent = formatRole(highestRole) + " Dashboard";
        else console.error("Element by ID title not found. The dashboard title will not be updated.");

        // Create grid layout of miniprograms
        if (grid) {
            const highestRoleNum = role2num(highestRole);
            Object.entries(miniProgramScripts).forEach(async ([/** @type {string} */ key, /** @type {{ type: string, perm: Number, perm: function(import("@firebase/auth").User, HTMLDivElement, Number, string, string[]): void }} */ value]) => {
                if (highestRoleNum >= value.perm) {
                    const container = document.createElement("div");
                    const title = document.createElement("h2");
                    const desc = document.createElement("p");
                    title.textContent = key;
                    desc.textContent = value.desc;
                    container.append(title, desc);
                    container.addEventListener("click", () => {
                        const background = document.createElement("div"), popup = document.createElement("div"), title = document.createElement("h1");
                        title.textContent = key;
                        popup.id = "popup";
                        popup.addEventListener("click", e => e.stopPropagation());
                        popup.append(title);
                        background.id = "background";
                        background.addEventListener("click", () => background.remove());
                        background.append(popup);
                        if (main) main.append(background);
                        else console.error("Element by the ID main not found. Popup pages will not load.");
                        value.func(user, popup, highestRoleNum, highestRole, rolesList);
                    });
                    grid.append(container);
                }
            }); 
        } else console.error("Element by the ID grid was not found. Miniprograms will not be visible");
    // @ts-ignore
    } else window.redirectUser("login");
});

/**
 * Reports a staff member's action as automatic in the mod log
 * 
 * @param {string} uid The uid of the staff member
 * @param {string} msg The action that they did
 */
async function addModLog(uid, msg) {
    // Setup and get values for the updated log
    const currentLog = (await getDoc(doc(db, "mod-log", "logs"))).get("current-log");
    const currentRef = doc(db, "mod-log", "log-" + currentLog);
    const currentSnap = (await getDoc(currentRef));
    const currentCount = currentSnap.get("count") + 1;
    let /** @type {entry[]} */ currentEntries = currentSnap.get("entries");
    const info = {
        action: msg,
        timestamp: new Date(),
        type: "automatically",
        uid: uid
    };
    if (currentEntries && currentEntries.length > 0) currentEntries.push(info);
    else currentEntries = [ info ];

    // Update database with the new log
    await setDoc(currentRef, {
        count: currentCount || currentEntries.length,
        entries: currentEntries
    }, { merge: true });

    // Add to current log if it's past 50
    if (currentCount == 50) await setDoc(doc(db, "mod-log", "log"), { "current-log": Number.parseInt(currentLog) + 1 }, { merge: true });
}