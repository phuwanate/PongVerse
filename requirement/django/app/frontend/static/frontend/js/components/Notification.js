import { fetchJson, getUserId, getUserName } from "./Utils.js";

export class Notification extends HTMLElement{
	constructor(){
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
		this.username = getUserName()
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/Notification.css" >

			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Notification</p>
				</div>
				<table>
					<tbody id="notificationTableBody">
					</tbody>
				</table>
			</div>
		`
	}

	generateRows(users) {
		return users.map(user => `
			<tr>
				<td>
					<div class="d-flex align-items-center ms-0 ms-sm-3">
						<img src="${user.avatar}"
							alt="Profile Photo" id="friendImg"
							class="rounded"
							onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
						<p id="text" class="my-0 ms-2 ms-sm-3 gap-1"> <b id="profileName">${user.username}</b> send you a friend request</p>
					</div>
				</td>
				<td class="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-0 gap-sm-2">
					<button id="${user.username}FriendAccept" data-userid="${user.user_id}" 
						data-avatar="${user.avatar}" data-username="${user.username}"
						class="accept-btn d-flex align-items-center justify-content-center gap-2 border-0">
						<i class="uil uil-user-plus"></i> Accept
					</button>
					<button id="${user.username}FriendDecline" data-userid="${user.user_id}" data-username="${user.username}"
						class="btn btn-danger d-flex align-items-center justify-content-center gap-2 border-0">
						<i class="uil uil-user-minus"></i> Decline
					</button>
				</td>
			</tr>
		`).join('');
	}

	friendDecline = async (e) => {
		const payload = {
			"owner_id": getUserId(),
			"user_id": e.target.dataset.userid
		}
		// console.log(payload)
		const result = await fetchJson("friendDecline", "DELETE", 
			`${window.location.origin}/api/users/notifications/delete`, payload)
		if (result) {
			console.log(result)
			this.fetchNotification()
		}
	}

	friendAccept = async (e) => {
		// const {userid, username, avatar} = e.target.dataset
		const payload = {
			"owner_id": getUserId(),
			"user_id": e.target.dataset.userid
		}
		const message = {
			'type': 'new_friend', 
			'requester': e.target.dataset.username,
			'accepter': this.username, 
		}

		const result = await fetchJson("friendAccept", "POST", 
		`${window.location.origin}/api/users/friends/accept`, payload)
		if (result) {
			// console.log(result)
			this.fetchNotification()
			
			//update friendsComponent
			const dashBoard = document.getElementById("dashBoardComponent").shadowRoot
			const friends = dashBoard.getElementById("friendsComponent")
			friends.socket.send(JSON.stringify(message))
		}
		
	}

	render = (result) => {
		const tableBody = this.shadowRoot.getElementById("notificationTableBody")
		tableBody.innerHTML = ""
		tableBody.innerHTML = this.generateRows(result)
		for (const user of result) {
			this.shadowRoot.getElementById(`${user.username}FriendDecline`)
				.addEventListener("click", this.friendDecline)
			this.shadowRoot.getElementById(`${user.username}FriendAccept`)
				.addEventListener("click", this.friendAccept)
		}
	}

	fetchNotification = async() => {
		const result = await fetchJson("fetchNotification", "GET", `/api/users/${getUserId()}/notifications`)
		if (result) {
			// console.log(result)
			this.render(result)
		} else {
			this.shadowRoot.getElementById("notificationTableBody").innerHTML = ""
		}
	}

	connectedCallback(){
		this.fetchNotification()
	}

	disconnectedCallback() {
		console.log("delete notification components");
	}
}