import { getUserId, fetchJson } from "./Utils.js";
export class RecommendFriends extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template()
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/frontend/js/components/RecommendFriends.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Recommend Friends</p>
				</div>
				<table>
					<tbody id="recommendFriendsTableBody">
					</tbody>
				</table>
			</div>
		`;
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
						<p id="profileName" class="my-0 ms-2 ms-sm-3">${user.username}</p>
					</div>
				</td>
				<td >
					<button id="${user.username}FriendRequest" data-user="${user.id}" class="d-flex align-items-center justify-content-center gap-2 border-0">
						<i class="uil uil-user-plus"></i> Send Request
					</button>
				</td>
			</tr>
		`).join('');
	}

	fetchRecommendFriends = async () => {
		const result = await fetchJson("fetchRecommendFriends", 
			"GET", `/api/users/${getUserId()}/friends/find_new`)
		if (result){
			this.render(result)
			// console.log(result)
		} else {
			this.shadowRoot.getElementById("recommendFriendsTableBody").innerHTML = ""
		}
	};

	sendFriendRequest = async (e) => {
		const payload = {
			"owner_id": getUserId(),
			"user_id": e.target.dataset.user
		}
		// console.log(payload)
		const result = await fetchJson("sendFriendRequest", "POST",
			"/api/users/notifications/friend_request", payload)
		if (result) {
			// console.log(result)
			this.fetchRecommendFriends();
		} 
	}

	render = (users) => {
		const tableBody = this.shadowRoot.getElementById("recommendFriendsTableBody")
		tableBody.innerHTML = ""
		tableBody.innerHTML = this.generateRows(users)
		for (const user of users) {
			this.shadowRoot.getElementById(`${user.username}FriendRequest`)
				.addEventListener("click", this.sendFriendRequest)
		}
	}

	connectedCallback() {
		this.fetchRecommendFriends();
	}

	disconnectedCallback() {
		console.log("delete recommend friend components");
	}
}
