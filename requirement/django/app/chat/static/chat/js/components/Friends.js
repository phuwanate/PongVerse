import { getUserId, addNavigate, fetchJson, getMainFrame, getUserName } from "/static/frontend/js/components/Utils.js";

export class Friends extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.friends = []
		this.shadowRoot.innerHTML = this.template()
		this.username = getUserName()
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/chat/js/components/Friends.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header">
					<p id="headerText">Friends</p>
					<button id="friendRecommendBtn" data-url="recommend-friend" data-title="Baby cadet friend recommend" class="d-flex align-items-center justify-content-center gap-1 border-0">
						<i class="uil uil-user-plus"></i> Find Friends
					</button>
				</div>
				<table>
					<tbody id="friendTableBody">
					</tbody>
				</table>
			</div>
		`;
	};

	generateRows(friends) {
		return friends.map(
			(friend) => `
				<friend-component 
					id="${friend.username}" class="d-flex"
					data-username="${friend.username}" 
					data-id="${friend.id}"
					data-avatar="${friend.avatar}">
				</friend-component>
		`).join('');
	}

	fetchFriends = async () => {
		const result = await fetchJson("fetchFriends", "GET", 
			`${window.location.origin}/api/users/${getUserId()}/friends`)
		// console.log(result)
		if (result) this.render(result)
		else this.shadowRoot.getElementById('friendTableBody').innerHTML = ""


		const dashBoardComponent = document.getElementById("dashBoardComponent")
		let liveChat = dashBoardComponent.shadowRoot.getElementById("liveChatComponent")
		liveChat.remove()
		liveChat = document.createElement('live-chat-component')
		liveChat.setAttribute("id", "liveChatComponent")
		dashBoardComponent.shadowRoot.getElementById("bodyRight").appendChild(liveChat)
	};

	appendFriend = (id, username, avatar) => {
		const friend = document.createElement('friend-component')
		friend.setAttribute("id", username)
		friend.setAttribute("data-username", username)
		friend.setAttribute("data-id", id)
		friend.setAttribute("data-avatar", avatar)

		this.shadowRoot.getElementById("friendTableBody").appendChild(friend)
	}

	render(friends) {
		this.shadowRoot.getElementById('friendTableBody')
			.innerHTML = this.generateRows(friends)
	}

	setupWebsocket(){
		this.socket = new WebSocket(`${window.location.origin}/ws/chatroom/public_chat`)

		this.socket.addEventListener("message", (event) => {
			const obj = JSON.parse(event.data)
			if (obj.type = "new_friend") {
				if (obj.accepter == this.username)
					this.fetchFriends()
				else if (obj.requester == this.username) {
					setTimeout(this.fetchFriends, 3000)
				}
			}
		})
	}

	connectedCallback() {
		this.setupWebsocket()
		this.fetchFriends()
		const mainFrame = getMainFrame()

		// Attach click event listener to navigation items
		const friendRecommendBtn = this.shadowRoot.querySelector('#friendRecommendBtn')
		addNavigate(friendRecommendBtn, mainFrame)
	}

	disconnectedCallback(){
		this.socket.close()
	}
}
