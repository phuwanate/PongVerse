import { addNavigate, fetchJson, getMainFrame, getUserName, getPongPublic } from "/static/frontend/js/components/Utils.js"

export class Friend extends HTMLElement {

	constructor() {
		super()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
	}

	template = () => {
		return `
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/chat/js/components/Friend.css">
			
			<td>
				<div class="d-flex align-items-center ms-0 ms-lg-3 gap-2">
					<div id="avatar" class="profile-photo">
						<img src="${this.dataset.avatar}" alt="Profile Photo" id="friendImg" class="rounded"
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>
					<p id="profileName" class="my-0">${this.dataset.username}</p>
				</div>
			</td>
			<td>
				<p id="status" class="status-offline"> Offline</p>
			</td>
			<td>
				<div class="all-btn">
					<i id="profileBtn" class="uil uil-user"
						data-url="friend-profile" data-title="baby cadet ${this.dataset.username}"
						data-user="${this.dataset.id}"></i>
					<i id="chatBtn" class="uil uil-comment-dots"></i>
					<i id="pongBtn" class="uil uil-upload"></i>
				</div>
			</td>
		`
	}

	setupWebsocket = (result) => {
		this.socket = new WebSocket(
			`${window.location.origin}/ws/chatroom/private/${result.chatroom}`)

		// Listen for messages
		this.socket.addEventListener("message", (event) => {
			const obj = JSON.parse(event.data)

			if (obj.type == "online_count_handler") {
				// console.log(obj)
				const status = this.shadowRoot.getElementById("status")
				const pongBtn = this.shadowRoot.getElementById("pongBtn")
				if (obj.online_count > 0) {
					status.innerText = 'Online'
					status.classList = 'status-online'
					pongBtn.style = ""
				} else {
					status.innerText = 'Offline'
					status.classList = 'status-offline'
					pongBtn.style.display = "none"
				}
			}
			else if (obj.type == "message_handler") {
				try{
					const dashBoardComponent = document.getElementById("dashBoardComponent")
					const liveChat = dashBoardComponent.shadowRoot.getElementById("liveChatComponent")
					// console.log(obj)
					// console.log(liveChat.dataset.userid)
					if (liveChat.dataset.username == this.dataset.username)
						liveChat.updateChatRoom(obj)
					else {
						// const avatar = this.shadowRoot.getElementById("avatar")
						// avatar.classList.add('new-message')
						// console.log("new message")
						const a = this.shadowRoot.getElementById("chatBtn")
						a.classList.add('new-message')
						console.log("new message")
					}
				} catch(error) {
					if (error instanceof TypeError) {
						console.log("new message")
					} else {
						console.error("Unexpected error:", error)
					}
				}
			} 
		});

		this.socket.addEventListener('close', () => {
			console.log(`friend ${this.dataset.username} has close websocket`)
		})
	}

	fetchChatRoom = async () => {
		const result = await fetchJson("fetchChatRoom", "GET", 
			`${window.location.origin}/chat/get/${this.dataset.username}`)
		
		if (result) {
			// console.log(result.chatroom)
			this.setupWebsocket(result)

			/* add event for live-chat*/
			const dashBoardComponent = document.getElementById("dashBoardComponent")
			const dashBoardShadowRoot = dashBoardComponent.shadowRoot
			const liveChatComponent = dashBoardShadowRoot.getElementById("liveChatComponent")
			const chatBtn = this.shadowRoot.getElementById("chatBtn")
			chatBtn.addEventListener('click', ()=>{
				liveChatComponent.setAttribute("data-username", this.dataset.username)
				liveChatComponent.setAttribute("data-userid", this.dataset.id)
				liveChatComponent.setAttribute("data-avatar", this.dataset.avatar)
				liveChatComponent.setAttribute("data-chatroom", result.chatroom)

				// remove new-message
				// const avatar = this.shadowRoot.getElementById("avatar")
				// avatar.classList.remove('new-message')
				const a = this.shadowRoot.getElementById("chatBtn")
				a.classList.remove('new-message')
			})
		}
	}

	connectedCallback() {
		// Attach click event listener to navigation items
		const friendProfileBtn = this.shadowRoot.getElementById("profileBtn")
		addNavigate(friendProfileBtn, getMainFrame())

		this.fetchChatRoom()
		/* websocket
		* get room name for URI to create websocket 
		* use fetch to get <room_name>
		* this.socket = new WebSocket("ws://localhost:8000/<room_name>")
		*/

		/** pong privage begin */
		const pongBtn = this.shadowRoot.getElementById("pongBtn")
		const pongPublic = getPongPublic()
		pongBtn.addEventListener("click", ()=>{
			const message = {
				"type": "private",
				"action": "inviter",
				"inviter": getUserName(), 
				"invited": this.dataset.username}
			pongPublic.socket.send(JSON.stringify(message))
		})
	}

	disconnectedCallback() {
		// console.log(`friend ${this.dataset.username} has gone`)
		if (this.socket) {
			this.socket.close();
			this.socket = null; // Clean up reference
		}
	}
}