import { fetchJson, getUserId } from "./Utils.js";

export class BlockedList extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/BlockedList.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Blocked List</p>
				</div>
				<table>
					<tbody id="blockedListTableBody">
					</tbody>
				</table>
			</div>
		`;
	};

	generateRows(users) {
		return users.map(user => `
			<tr id="${user.username}">
				<td>
					<div class="d-flex align-items-center ms-0 ms-sm-3">
						<img src="${user.avatar}"
							alt="Profile Photo" id="friendImg"
							class="rounded"
							onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
						<p id="profileName" class="my-0 ms-2 ms-sm-3">${user.username}</p>
					</div>
				</td>
				<td>
					<button id="${user.username}UnBlockBtn" data-userid="${user.id}"class="d-flex align-items-center justify-content-center gap-2 border-0">
						<i class="uil uil-user-check"></i> Unblock
					</button>
				</td>
			</tr>
		`).join('');
	}

	render = (users) => {
		const blockedListTableBody = this.shadowRoot.getElementById("blockedListTableBody")
		blockedListTableBody.innerHTML = this.generateRows(users)
		// const trEl = this.shadowRoot.querySelectorAll("tr")
		// console.log(trEl)
		users.forEach(user => {
			const unBlockBtn = this.shadowRoot.getElementById(`${user.username}UnBlockBtn`)
			// console.log(unBlockBtn)
			unBlockBtn.addEventListener("click", this.unBlockFriend)
		})
	}

	unBlockFriend = async(e) => {
		const payload = {
			owner_id: getUserId(),
			user_id: e.target.dataset.userid
		}
		const result = await fetchJson("unBlockFriend", "POST", "/api/users/unblock", payload)
		console.log(result)
		if (result) {
			this.fetchFriendBlocked()

			// re render friendsComponent
			const dashBoardComponent = document.getElementById("dashBoardComponent")
			const friendsComponent = dashBoardComponent.shadowRoot.getElementById("friendsComponent")
			friendsComponent.fetchFriends()
		}
	}

	fetchFriendBlocked = async () => {
		const result = await fetchJson("fetchFriendBlocked", "GET",
			`/api/users/${getUserId()}/blocked_list`)
		if(result){
			this.render(result)
		} else {
			this.shadowRoot.getElementById("blockedListTableBody").innerHTML = ""
		}
	}

	connectedCallback() {
		this.fetchFriendBlocked()
	}

	disconnectedCallback() {
		console.log("delete blocked list components");
	}
}