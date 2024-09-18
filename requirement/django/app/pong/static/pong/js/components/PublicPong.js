import { getMainFrame, getUserName, getSessionID } from "/static/frontend/js/components/Utils.js";

export class PublicPong extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = this.template();
		this.username = getUserName()
		this.mainFrame = getMainFrame()
		this.session_id = getSessionID()
		this.tourBoardcast = this.shadowRoot.querySelector("toutnament-broadcast-component")
	}

	template = () => {
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/PublicPong.css">
			<toutnament-broadcast-component id="tourBoardcast"></toutnament-broadcast-component>
		`;
	};

	setupWebsocket = () => {
		this.socket = new WebSocket(`${window.location.origin}/ws/pong/public`)
		this.socket.addEventListener("message", (ws)=>{
			const {type, data} = JSON.parse(ws.data)
			if (data.action != "error")
				this.data = data

			if (type == 'pong_private_message') {
				// console.log(this.data)
				switch (data.action) {
					case 'error': return alert(data.message)
					case 'update': 
					case 'waitmatch': 
					case 'playpong': return this.tourBoardcast.update()
					default: return console.log(`Unknow action: ${data.action}`)
				}
			}
			else if (type == 'pong_public_message') {
				// console.log(this.data)
				
				switch(data.action) {
					case 'inviter': return this.inviter()
					case 'invited': return this.invited()
					case 'reject': return this.reject()
					case 'update': return this.tourBoardcast.update()
					case 'waitmatch': return this.tourBoardcast.update()
					default: console.log(`unknow action: ${data.action}`)
				}
			}
			else if (type == 'pong_group_message') {
				switch (data.action) {
					// case 'inviter': return this.inviter()
					// case 'invited': return this.invited()
					case 'reject': return this.reject()
					case 'update': return this.update()
					case 'waitmatch': return this.waitmatch()
					case 'beginpong': return this.beginpong()
					case 'playpong': return this.playpong()
					case 'finish': return this.finish()
					case 'game_end': return this.gameEnd()
					case 'quit': return this.quit()
					default: console.log(`unknow action: ${data.action}`)
				}
			}
			else {
				console.log(`Unknow type: ${type}`)
			}
		})
	}

	/** acction ****************************************/
	quit = () => {
		console.log(this.data)
		this.mainFrame.innerHTML = ""
	}

	inviter = () => {
		this.tourBoardcast.privateInviteUpdate()
	}

	invited = () => {
		this.tourBoardcast.privateInvited()
	}

	reject = () => {
		if (this.is_player()) {
			console.log('reject called')
			if (this.mainFrame.querySelector('pong-tour-match-component')) {
				this.mainFrame.innerHTML = ''
			}
			this.tourBoardcast.privateInvite = false
			// this.data.action = 'quit'
			// this.socket.send(JSON.stringify(this.data))
			this.data.action = 'request_tour_message'
			this.socket.send(JSON.stringify(this.data))
		}
	}

	update = () => {
		// console.log(this.data)
		if (this.is_player_active) this.updatePongTourMatch()
	}

	waitmatch = () => {
		this.mainFrame.innerHTML = `
			<wait-match-component id="waitMatchComponent">
			<wait-match-component>
		`
	}

	beginpong = () => {
		// console.log('beginpong')
		this.mainFrame.innerHTML = `
			<pong-component id="pongComponent"
			data-player1=${this.data.game_datas[this.data.match_index].player_one.name}
			data-player2=${this.data.game_datas[this.data.match_index].player_two.name}
			>
			</pong-component>
		`
		this.data.action = 'playpong'
		this.socket.send(JSON.stringify(this.data))
	}

	playpong = () => {
		const pongComponent = this.mainFrame.querySelector("#pongComponent")
		pongComponent.draw(this.data)
	}

	finish = () => {
		this.mainFrame.innerHTML = ""
	}

	gameEnd = () => {
		this.mainFrame.innerHTML = "<final-component></final-component>"
		this.socket.send(JSON.stringify(this.data))
	}

	/** utility ******************************************/
	is_tournament = () => {
		return this.data.type == 'tournament'
	}

	is_session = () => {
		for (const player of this.data.players)
			if (player.session_id == this.session_id) return true
		return false
	}

	is_player = () => {
		for (const player of this.data.players)
			if (player.name == this.username) return true
		return false
	}

	is_player_active = () => {
		for (const player of player) {
			if (player.status == 'quit')
				return false
		}
		return true
	}

	updatePongTourMatch = () => {
		// console.log(this.mainFrame)
		let pongTourMatch = this.mainFrame.querySelector("pong-tour-match-component")
		if (pongTourMatch == null) {
			// console.log("new pongTourMatchComponent")
			this.mainFrame.innerHTML = `
				<pong-tour-match-component 
					id="pongTourMatch"
					data-type="Pong ${this.data.type == 'tournament' ? 'Tournament' : 'Private'}"
					>
				</pong-tour-match-component>`
			pongTourMatch = this.mainFrame.querySelector("pong-tour-match-component")
		}
		// console.log(pongTourMatch)
		pongTourMatch.update()
	}

	/** life cycle *****************************************/
	connectedCallback() {
		this.setupWebsocket()
		// console.log("tournament was connected")
	}

	disconnectedCallback() {
		this.socket.close()
	}
}
