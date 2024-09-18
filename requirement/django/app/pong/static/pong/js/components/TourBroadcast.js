import { getPongPublic, getSessionID, getUserName } from "/static/frontend/js/components/Utils.js"

export class TourBroadcast extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
		this.pongPublic = getPongPublic()
		this.boardCast = this.shadowRoot.getElementById("tourBroadcast")
		this.privateInvite = false
		this.sessionID = getSessionID()
		this.username = getUserName()
	}

	template = () => {
	return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v3.0.6/css/line.css">
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/TourBroadcast.css">
			
			<div id="tourBroadcast" class="d-flex flex-column flex-lg-row align-items-center"></div>
		`;
	}

	joinTourTemplate = (number) => {
		return `
			<span class="icon-main d-none d-lg-flex align-items-center">
				<i class="uil uil-check-circle position-relative d-inline-flex justify-content-center align-items-center m-0"></i>
			</span>
			<div id="content" class="d-flex flex-column justify-content-center me-auto">
				<h4 class="m-0 text-white fw-bold">TOURNAMENT is upcoming...</h4>
				<small>
					registered member (
					<span id="amountPlayer">${number}</span>
					/ 4 )
				</small>
			</div>
			<button class="btn btn-light" id="joinBtn">JOIN TOURNAMENT</button>
		`
	}

	waitmatchTemplate = () => {
		const game_data = this.pongPublic.data.game_datas[this.pongPublic.data.match_index]
		return `
			<span class="icon-main d-none d-lg-flex align-items-center">
				<i class="uil uil-clock position-relative d-inline-flex justify-content-center align-items-center m-0"></i>
			</span>
			<div id="content" class="d-flex flex-column justify-content-center">
				<small>TOURNAMENT is ongoing...</small>
				<h4 class="m-0 text-white fw-bold">Match : ${game_data.player_one.nickname} <i class="uil uil-table-tennis"></i> ${game_data.player_two.nickname}</h4>
			</div>
		`
	}

	privateInviteUpdate = () => {
		const inviter = this.pongPublic.data.players[0]
		const invited = this.pongPublic.data.players[1]
		if (this.username == inviter.name){
			this.privateInvite = true
			this.boardCast.innerHTML = `
				<span class="icon-main d-none d-lg-flex align-items-center">
					<i class="uil uil-clock position-relative d-inline-flex justify-content-center align-items-center m-0"></i>
				</span>
				<div id="content">
					<h4 class="m-0 text-white fs-4">You invite game with <span class="fw-bold">${invited.name}</span>, wait for accept</h4>
				</div>
			`
		}
		else if (this.username == invited.name){
			this.privateInvite = true
			this.boardCast.innerHTML = `
				<span class="icon-main d-none d-lg-flex align-items-center">
					<i class="uil uil-clock position-relative d-inline-flex justify-content-center align-items-center m-0"></i>
				</span>
				<div id="inviteContent" class="d-flex flex-column flex-lg-row">
					<h4 class="m-0 text-white fs-4 me-2 mb-2"><span class="fw-bold">${inviter.name}</span> invite you to play pong</h4>
					<div class="d-flex flex-row gap-2 justify-content-center align-items-center">
						<button class="btn btn-light primary d-flex align-items-center justify-content-center gap-2 border-0" id="acceptBtn">
							<i class="uil uil-check icon-btn primary"></i> Accept
						</button>
						<button class="btn btn-danger d-flex align-items-center justify-content-center gap-2 border-0" id="rejectBtn">
							<i class="uil uil-times icon-btn"></i> Decline
						</button>
					</div>
				</div>
			`
			this.shadowRoot.getElementById('acceptBtn').addEventListener('click', ()=>{
				this.pongPublic.data.action = 'invited'
				this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
			})
			this.shadowRoot.getElementById('rejectBtn').addEventListener('click', ()=>{
				this.pongPublic.data.action = 'reject'
				this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
			})
		}
	}

	/** privateInvited */
	privateInvited = () => {
		const inviter = this.pongPublic.data.players[0]
		const invited = this.pongPublic.data.players[1]

		if (this.username == inviter.name || this.username == invited.name) {
			this.privateInvite = false
			this.pongPublic.data.action = 'request_tour_message'
			this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
			/** make sure only one session can send request update */
			if (this.sessionID == inviter.session_id) {
				this.pongPublic.data.action = 'update'
				this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
			}
		}
	}

	/** only inviter can handle message */
	// privateReject = () => {
	// 	const inviter = this.pongPublic.data.players[0]
	// 	const invited = this.pongPublic.data.players[1]

	// 	if (this.username == inviter.name || this.username == invited.name) {
	// 		this.privateInvite = false
	// 		this.pongPublic.data.action = 'request_tour_message'
	// 		this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
	// 	}
	// }

	isPlayerInTour(){
		const username = getUserName()
		for (const player of this.pongPublic.data.players) {
			if (player.name == username) {
				return true
			}
		}
		return false
	}

	update = () => {
		if (this.privateInvite) return
		if (this.pongPublic.data.action == 'update') {
			this.boardCast.innerHTML = this.joinTourTemplate(this.pongPublic.data.players.length)
			const joinBtn = this.shadowRoot.getElementById('joinBtn');
			if (this.isPlayerInTour()){
				joinBtn.style.display = 'None'
			} else {	
				joinBtn.addEventListener('click', this.joinTour)
			}
		}
		else if (this.pongPublic.data.action == "waitmatch" || this.pongPublic.data.action == "playpong") {
			this.boardCast.innerHTML = this.waitmatchTemplate()
		}
	}

	joinTour = () => {
		let nickname = prompt("nickname: ")
		nickname = nickname.substring(0,10);
		if (nickname != null) {
			const data = {
				"type": "tournament",
				"action": "join",
				"nickname": nickname
			}
			this.pongPublic.socket.send(JSON.stringify(data))
		}
	}

	connectedCallback() {
	}
}
