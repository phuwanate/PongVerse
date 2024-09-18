import { getPongPublic, getUserName } from "/static/frontend/js/components/Utils.js"

export class PongPrivateMatch extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
	}

	template = () => {
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/PongPrivateMatch.css">
			
			<div class="bg-white overflow-auto custom-bg">
				<div id="header" class="fw-bold">
					<p>Pong Private Match</p>
				</div>
				<div class="border-line"></div>
				<div id="waitRoom"></div>
			</div>
		`
	}
			
	templatePlayers = (players) => {
		return players.map((player, index) => {
			return `
				<pong-player-component data-index="${index}" 
					data-name="${player.name}"
					data-avatar="${player.avatar}"
					data-status="${player.status}">
				</pong-player-component>
			`
		}).join("")
	}

	btnClick = (e) => {
		e.preventDefault()
		const index = e.target.dataset.index
		// const player = this.data.
		const {inviter, invited} = this.data
		const player = index === '0' ? inviter : invited
		player.status = player.status === 'wait' ? 'ready' : 'wait'
		// console.log (index, player.name)
		const pongPublic = getPongPublic()
		pongPublic.socket.send(JSON.stringify(this.data))
	}

	/** expect action = [update, beginpong] */
	update = (data) => {
		this.data = data
		// console.log("from PongPrivateMatch:")
		// console.log(this.data)
		if (this.data.action == 'update') {
			const players = [this.data.inviter, this.data.invited]
			this.shadowRoot.getElementById("waitRoom").innerHTML = this.templatePlayers(players)
			const player = this.shadowRoot.querySelector(`[data-name=${getUserName()}]`)
			const btn = player.shadowRoot.querySelector("button")
			btn.disabled = false
			btn.addEventListener("click", this.btnClick)
		} else {
			this.remove()
		}
	}

	connectedCallback() {

	}

	disconnectedCallback() {
		if (this.data.action == 'update'){
			this.data.action = 'quit'
			const pongPublic = getPongPublic()
			pongPublic.socket.send(JSON.stringify(this.data))
		}
	}
}