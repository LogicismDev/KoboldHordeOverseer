let split
let modelTable
let workers
let userinfo
let userworkers = []

function secondsToDHM(seconds) {
    seconds = Number(seconds);

    if (seconds == 0) {
        return "0s";
    }

    let days = Math.floor(seconds / 86400);
    let hours = Math.floor(seconds % 86400 / 3600);
    let minutes = Math.floor(seconds % 86400 % 3600 / 60);

    return (days > 0 ? days + "d " : "") + (hours > 0 ? hours + "h " : "") + (minutes > 0 ? minutes + "m" : "");
}

async function update() {
    if (localStorage.getItem("models_enabled") == "true") {
        grabModelsList();
    }
    grabLeaderboard();
    grabPerformance();

    await grabWorkersList();

    if (localStorage.getItem("api_key") != null) {
        grabUserInfo();
    }
}

function toggleNavbar() {
    let navbar = document.getElementById("mainNavbar");

    if (navbar.style.height === '' || navbar.style.height === "75px") {
        navbar.style.height = "274px";
    } else if (navbar.style.height === "274px") {
        navbar.style.height = "75px";
    }
}

function openWorkerInfo(info) {
    document.getElementById("modalText").innerHTML = info
    document.getElementById("modalContainer").style = "display: block;";
    document.getElementById("workerModal").style = "display: block;";
}

function closeWorkerInfo() {
    document.getElementById("workerModal").style = "display: none;";
    document.getElementById("modalContainer").style = "display: none;";
    document.getElementById("modalText").innerHTML = "";
}

function openOptions() {
    document.getElementById("modalContainer").style = "display: block;";
    document.getElementById("optionsModal").style = "display: block;";
}

function closeOptions() {
    document.getElementById("optionsModal").style = "display: none;"
    document.getElementById("modalContainer").style = "display: none;";
}

function openLeaderboard() {
    document.getElementById("modalContainer").style = "display: block;";
    document.getElementById("leaderboardModal").style = "display: block;";
}

function closeLeaderboard() {
    document.getElementById("leaderboardModal").style = "display: none;"
    document.getElementById("modalContainer").style = "display: none;";
}

function openManageWorkers() {
    let manageWorkersList = document.getElementById("manageWorkersList");

    if (userinfo !== undefined && userinfo.worker_count !== 0) {
        Promise.all(userinfo.worker_ids.map(id => fetch("https://aihorde.net/api/v2/workers/" + id, {
            headers: {
                "apikey": localStorage.getItem("api_key")
            }
        }).then(response => response.json()).catch(error => error))).then(values => {
            let workercount = 1;
            for (let i = 0; i < values.length; i++) {
                let worker = values[i];

                if (worker.type != "text") continue;

                let workerListNode = document.createElement("tr");
                workerListNode.innerHTML = `
					<td>${worker.name}</td>
            		<td><input id="worker${workercount}textbox"></td>
					<td>${secondsToDHM(worker.uptime)}<br>(${worker.requests_fulfilled} jobs)</td>
					<td ${worker.online ? "style=\"color: #3bf723;\"" : ""}>${worker.online ? "Online" : "Offline"}<br>(${worker.kudos_rewards} Kudos)</td>
					<td><input id="worker${workercount}checkbox" type="checkbox"></td>
					<td><i class="link fa-solid fa-xmark" onclick="confirmDelete('${worker.name.replace(/'/g, "\\\'")}', '${worker.id}')" style="color: red;"></i></td>
				`;

                manageWorkersList.appendChild(workerListNode);

                document.getElementById("worker" + workercount + "textbox").value = worker.info;
                document.getElementById("worker" + workercount + "checkbox").checked = worker.maintenance_mode;

                workercount++;
            }

            userworkers = values;
        });
    }

    document.getElementById("modalContainer").style = "display: block;";
    document.getElementById("manageWorkersModal").style = "display: block;";
}

function confirmDelete(name, id) {
    openYesNoPopup("Confirm Delete", "Do you wish to delete worker \"" + name + "\" with the ID \"" + id + "\"? This action is irreverisable and cannot be undone.", "deleteWorker(" + id + ")", "closePopup()")
}

async function deleteWorker(id) {
    closePopup();

    let response = await fetch("https://aihorde.net/api/v2/workers/" + id, {
        method: "DELETE",
        headers: {
            "apikey": localStorage.getItem("api_key")
        }
    })
    if (response.status == 404) {
        openOkPopup("Error", "We weren't able to delete your worker, since we weren't able to find it. It has been probably deleted already.", "closePopup()");
    } else if (response.status == 200) {
        openOkPopup("Deleted Worker", "Deleted Worker \"" + deleted.deleted_name + "\" with the ID \"" + deleted.deleted_id + "\".", "closePopup()");
    }
}

function openYesNoPopup(header, message, yesFunction, noFunction) {
    document.getElementById("popupHeader").innerHTML = header;
    document.getElementById("popupModalText").innerHTML = message;

    document.getElementById("yesButton").style = "display: inline;";
    document.getElementById("yesButton").setAttribute("onclick", yesFunction);
    document.getElementById("noButton").style = "display: inline;";
    document.getElementById("noButton").setAttribute("onclick", noFunction);


    document.getElementById("popupModalContainer").style = "display: block;"
    document.getElementById("confirmPopupModal").style = "display: block;"
	document.getElementById("modalButtons").style = "display: block;"
}

function openOkPopup(header, message, okFunction) {
    document.getElementById("popupHeader").innerHTML = header;
    document.getElementById("popupModalText").innerHTML = message;

    document.getElementById("okButton").style = "display: inline;";
    document.getElementById("okButton").setAttribute("onclick", okFunction);

    document.getElementById("popupModalContainer").style = "display: block;"
    document.getElementById("confirmPopupModal").style = "display: block;"
	document.getElementById("modalButtons").style = "display: block;"
}

function openMessagePopup(header, message) {
    document.getElementById("popupHeader").innerHTML = header + " <i class=\"close-worker-button fa-solid fa-xmark\" onClick=\"closePopup()\"></i>";
    document.getElementById("popupModalText").innerHTML = message;

    document.getElementById("popupModalContainer").style = "display: block;";
    document.getElementById("confirmPopupModal").style = "display: block;";
	document.getElementById("modalButtons").style = "display: none;"
}

function closePopup() {
    document.getElementById("yesButton").style = "display: none;";
    document.getElementById("yesButton").removeAttribute("onclick");

    document.getElementById("noButton").style = "display: none;";
    document.getElementById("noButton").removeAttribute("onclick");

    document.getElementById("okButton").style = "display: none;";
    document.getElementById("okButton").removeAttribute("onclick");

    document.getElementById("popupModalContainer").style = "display: none;"
    document.getElementById("confirmPopupModal").style = "display: none;"
}

function closeManageWorkers(persistcache = false) {
    document.getElementById("modalContainer").style = "display: none;"
    document.getElementById("manageWorkersModal").style = "display: none;";

    if (!persistcache) {
        let payloads = [];
        for (let i = 1; i < userworkers.length + 1; i++) {
            let payloaddata = {};

            let textbox = document.getElementById("worker" + i + "textbox");
            if (textbox.value !== userworkers[i - 1].info) {
				if (textbox.value === undefined) {
					payloaddata.info = "";
				} else {
                	payloaddata.info = textbox.value;
				}
            }

            let checkbox = document.getElementById("worker" + i + "checkbox");
            if (checkbox.checked !== Boolean(userworkers[i - 1].maintenance_mode)) {
                payloaddata.maintenance = checkbox.checked;
            }

            if (Object.keys(payloaddata).length !== 0) {
				console.log(payloaddata)
                let payload = {
                    id: userworkers[i - 1].id,
                    data: payloaddata
                }
                payloads[payloads.length] = payload;
            }
        }

        if (payloads.length !== 0) {
            Promise.all(payloads.map(payload => fetch("https://aihorde.net/api/v2/workers/" + payload.id, {
                method: "PUT",
                headers: {
                    "apikey": localStorage.getItem("api_key"),
					"Content-Type": "application/json"
                },
                body: JSON.stringify(payload.data)
            }).then(response => response.json()).catch(error => error))).then(values => {
                openOkPopup("Modified Workers", "Modified " + (values.length === 1 ? "1 Worker" : values.length + " Workers") + "<br>" + values.map(x => JSON.stringify(x)).join(", "), "closePopup()");
            });
        }

        userworkers = [];
    }
	
	document.getElementById("manageWorkersList").innerHTML = `
		<tbody id="manageWorkersList">
			<tr class="table-header">
				<th scope="col">Name</th>
				<th scope="col">Description</th>
				<th scope="col">Uptime</th>
				<th scope="col">Status</th>
				<th scope="col">Maintenance</th>
				<th scope="col">Delete</th>
			</tr>
		</tbody>
	`;
}

function revealAPIKey() {
    document.getElementById("apiKeyTextBox").type = "text";
}

function hideAPIKey() {
    document.getElementById("apiKeyTextBox").type = "password";
}

function saveAPIKey() {
    localStorage.setItem("api_key", document.getElementById("apiKeyTextBox").value);
    grabUserInfo();
}

function toggleModelsStats() {
    let bool = document.getElementById("modelscheckbox").checked;

    localStorage.setItem("models_enabled", bool);

    let table = document.getElementById("modelstable");
    if (bool) {
        table.style = "display: table;"
    } else {
        table.style = "display: none;"
    }

    if (modelTable.childElementCount == 1) {
        grabModelsList();
    }
}

function changeTheme() {
    let themeselect = document.getElementById("themeselect");

    localStorage.setItem("theme", themeselect.value);

    let themelink = document.getElementById("themelink");

    themelink.setAttribute("href", "./" + themeselect.value + ".css")
}

function sortWorkersList() {
    let sortselect = document.getElementById("sortselect");

    localStorage.setItem("sort_workers", sortselect.value);
    grabWorkersList(true);
}

async function grabWorkersList(cached = false) {
    if (!cached) {
        let response = await fetch("https://aihorde.net/api/v2/workers?type=text")
        if (!response.ok) return;

        workers = await response.json();
    }
    if (localStorage.getItem("sort_workers") == "alphabetical") {
        workers.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
    } else if (localStorage.getItem("sort_workers") == "kudos") {
        workers.sort((a, b) => b.requests_fulfilled - a.requests_fulfilled);
    } else if (localStorage.getItem("sort_workers") == "uptime") {
        workers.sort((a, b) => b.uptime - a.uptime);
    } else if (localStorage.getItem("sort_workers") == "requests") {
        workers.sort((a, b) => b.requests_fulfilled - a.requests_fulfilled);
    } else if (localStorage.getItem("sort_workers") == "contextlength") {
        workers.sort((a, b) => b.max_context_length - a.max_context_length);
    } else if (localStorage.getItem("sort_workers") == "length") {
        workers.sort((a, b) => b.max_length - a.max_length);
    }

    document.getElementById("container").innerHTML = '';

    for (let i = 0; i < workers.length; i++) {
        let worker = workers[i];

        let workerElement = document.createElement("div");
        workerElement.className = "worker-node" + (worker.maintenance_mode == true ? " maintenance" : "");

        workerElement.innerHTML = `
			<div>
        		<div class="${worker.maintenance_mode == true ? "maintenance-text " : ""}${worker.info != null && worker.info != "" ? "link" : ""}" ${worker.info != null && worker.info != "" ? "onclick=\"openWorkerInfo(\'" + worker.info.replace(/'/g, "\\'") + "\')\"" : ""} style="font-weight: bold; font-size: 1.2em; width: inherit; float: left;">${worker.name}</div>
        		<div style="font-weight: normal; width: 100%; text-align: right; padding-top: 2px; padding-bottom: 3px;">${secondsToDHM(worker.uptime)}</div>
      		</div>
      		<div>
        		<div style="font-weight: lighter; font-size: 0.8em; width: inherit; float: left;">ID: ${worker.id}</div>
        		<div style="font-size: 0.7em; width: 100%; text-align: right;">${(worker.threads == 1 ? "1 Thread" : worker.threads + " Threads") + (worker.trusted == true ? " | Trusted" : "") + (worker.accepts_chat_jobs == true ? " | Chat" : "")}</div>
      		</div>
      		<div style="border-top: 2px solid; margin-top: 8px; padding-bottom: 6px;"></div>
      		<div style="text-wrap: wrap;"><b>Model:</b> ${worker.models[0]}</div>
      		<div><b>Max Length:</b> ${worker.max_length}</div>
		  	<div><b>Max Context Length:</b> ${worker.max_context_length}</div>
		  	<div><b>Requests Fulfilled:</b> ${worker.requests_fulfilled}</div>
		  	<div><b>Performance:</b> ${worker.performance.split(" ")[0]} Tokens/s</div>
		  	<div><b>Kudos Rewarded:</b> ${worker.kudos_rewards}</div>
		  	<div>
				<ul style="margin: 0">
			  		<li><b>from Generated:</b> ${worker.kudos_details.generated}</li>
			  		<li><b>from Uptime:</b> ${worker.kudos_details.uptime}</li>
				</ul>
		  	</div>
		`

        document.getElementById("container").appendChild(workerElement);
    }
}

async function grabModelsList() {
    let response = await fetch("https://aihorde.net/api/v2/status/models?type=text&model_state=all")
    if (!response.ok) return;

    let models = await response.json();
    models.sort((a, b) => b.queued - a.queued);

    document.getElementById("models").innerHTML = `
		<tr class="table-header">
          <th scope="col">Model</th>
          <th scope="col">Count</th>
          <th scope="col">ETA</th>
          <th scope="col">Jobs</th>
          <th scope="col">Queue</th>
          <th scope="col">T/s</th>
        </tr>
	`

    for (let i = 0; i < models.length; i++) {
        let model = models[i];

        let modelElement = document.createElement("tr");
        modelElement.innerHTML = `
			 <td>${model.name}</td>
			 <td>${model.count}</td>
			 <td>${model.eta}</td>
			 <td>${model.jobs}</td>
			 <td>${model.queued}</td>
             <td>${model.performance}</td>
		`;

        modelTable.appendChild(modelElement)
    }
}

async function grabLeaderboard() {
    let response = await fetch("https://aihorde.net/api/v2/users?page=1&sort=kudos")
    if (!response.ok) return;

    let users = await response.json();

    document.getElementById("leaderboardList").innerHTML = "";

    for (let i = 0; i < 10; i++) {
        let user = users[i];

        let userElement = document.createElement("div");
        userElement.innerHTML = (i + 1) + ". " + user.username + " - " + user.kudos

        document.getElementById("leaderboardList").appendChild(userElement);
    }
}

async function grabPerformance() {
    let response = await fetch("https://aihorde.net/api/v2/status/performance")
    if (!response.ok) return;

    let performance = await response.json();

    document.getElementById("workertotal").innerHTML = "<br>There are a total of <b>" + performance.text_worker_count + "</b> workers with <b>" + performance.queued_text_requests + "</b> requests in queue with <b>" + performance.queued_tokens + "</b> tokens."
    document.getElementById("pastminutetotal").innerHTML = "In the past minute, a total of <b>" + performance.past_minute_tokens + "</b> tokens has been requested."
}

async function grabUserInfo() {
    let response = await fetch("https://aihorde.net/api/v2/find_user", {
        headers: {
            "apikey": localStorage.getItem("api_key")
        }
    })
    if (!response.ok) {
        if (response.status = 400) {
            document.getElementById("username").innerHTML = "Welcome, User";
            document.getElementById("userkudos").innerHTML = "Validation Error. Can't connect to the Horde API. Please try again in a bit.";
            document.getElementById("usertokens").innerHTML = "";
            document.getElementById("userworkers").innerHTML = "";
        } else if (response.status = 404) {
            document.getElementById("username").innerHTML = "Welcome, User";
            document.getElementById("userkudos").innerHTML = "Cannot find your user through the provided API Key. Please check if it is correct.";
            document.getElementById("usertokens").innerHTML = "";
            document.getElementById("userworkers").innerHTML = "";
        }
    } else {
        userinfo = await response.json();

        document.getElementById("username").innerHTML = "Welcome, " + userinfo.username;
        document.getElementById("userkudos").innerHTML = "You have a balance of <b>" + userinfo.kudos + "</b> Kudos.";
        document.getElementById("usertokens").innerHTML = "You have contributed <b>" + userinfo.records.contribution.tokens + "</b> tokens and fulfilled <b>" + userinfo.records.fulfillment.text + "</b> requests.";

        let workersonline = 0;
        for (let i = 0; i < workers.length; i++) {
            let worker = workers[i]
            for (let i1 = 0; i1 < userinfo.worker_ids.length; i1++) {
                let workerid = userinfo.worker_ids[i1];

                if (workerid == worker.id) {
                    workersonline++;
                    break;
                }
            }
        }

        document.getElementById("userworkers").innerHTML = "You currently have <b>" + workersonline + "</b> workers online.";
    }
}

function initialize() {
    document.addEventListener("DOMContentLoaded", () => {
        let sizes = localStorage.getItem("split_sizes");

        if (sizes === null) {
            sizes = [40, 80];
            localStorage.setItem("split_sizes", JSON.stringify(sizes));
        } else {
            sizes = JSON.parse(sizes);
        }
        if (window.innerWidth > 1287) {
            split = Split(['#left', '#right'], {
                sizes: sizes,
                minSize: 500,
                gutterSize: 4,
                onDragEnd: function (sizes) {
                    localStorage.setItem("split_sizes", JSON.stringify(sizes))
                }
            })
        } else {
            split = Split(['#left', '#right'], {
                sizes: sizes,
                minSize: 100,
                gutterSize: 4,
                direction: "vertical",
                onDragEnd: function (sizes) {
                    localStorage.setItem("split_sizes", JSON.stringify(sizes))
                }
            })
        }

        if (localStorage.getItem("api_key") != null) {
            document.getElementById("apiKeyTextBox").value = localStorage.getItem("api_key");
        }
        if (localStorage.getItem("theme") == null) {
            localStorage.setItem("theme", "dark");
            document.getElementById("themeselect").value = "dark";
        } else {
            document.getElementById("themeselect").value = localStorage.getItem("theme");
            document.getElementById("themelink").setAttribute("href", "./" + localStorage.getItem("theme") + ".css")
        }
        if (localStorage.getItem("models_enabled") == null) {
            localStorage.setItem("models_enabled", true);
            document.getElementById("modelscheckbox").checked = true;
        } else {
            document.getElementById("modelscheckbox").checked = (localStorage.getItem("models_enabled") == "true");

            let table = document.getElementById("modelstable");
            if (localStorage.getItem("models_enabled") == "true") {
                table.style = "display: table;"
            } else {
                table.style = "display: none;"
            }
        }
        if (localStorage.getItem("sort_workers") == null) {
            localStorage.setItem("sort_workers", "none");
        } else {
            document.getElementById("sortselect").value = localStorage.getItem("sort_workers");
        }

        modelTable = document.getElementById("models")

        update()
        setInterval(update, 30000)
    });
    window.addEventListener('resize', function () {
        let sizes = JSON.parse(localStorage.getItem("split_sizes"));

        if (split.pairs[0].direction = "vertical" && window.innerWidth > 1287) {
            split.destroy();

            split = Split(['#left', '#right'], {
                sizes: sizes,
                minSize: 100,
                gutterSize: 4,
                direction: "horizontal",
                onDragEnd: function (sizes) {
                    localStorage.setItem("split_sizes", JSON.stringify(sizes))
                }
            });
			
			if (document.getElementById("mainNavbar").style.height !== '') {
                document.getElementById("mainNavbar").removeAttribute("style");
            }
        } else if (split.pairs[0].direction = "horizontal" && window.innerWidth < 1287) {
            split.destroy();

            split = Split(['#left', '#right'], {
                sizes: sizes,
                minSize: 100,
                gutterSize: 4,
                direction: "vertical",
                onDragEnd: function (sizes) {
                    localStorage.setItem("split_sizes", JSON.stringify(sizes))
                }
            });
        }
    });
}

initialize();
