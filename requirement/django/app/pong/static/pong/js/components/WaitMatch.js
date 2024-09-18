import { getPongPublic } from "/static/frontend/js/components/Utils.js"


class Player{
	constructor(name){
		this.name = name
	}
}

class Game_data{
	constructor(player_one, player_two) {
		this.player_one = new Player(player_one)
		this.player_two = new Player(player_two)
		this.winner = new Player('')
	}

	setWinnerName(name){
		this.winner.name = name
	}
}

class Data{
	constructor() {
		this.type = 'tournament'
		this.action = 'waitmatch'
		this.players = [
			{
				"name":"pnamnil",
				"nickname":"pnamnil",
				"status":"ready",
				"avatar":"/user-media/avatars/small_pnamnil.webp",
				"session_id":"w7ly9j9qqcb96d8t058cqb3fuki2uqjn"
			},
			{
				"name":"spipitku",
				"nickname":"spipitku",
				"status":"ready",
				"avatar":"/user-media/avatars/small_spipitku.webp",
				"session_id":"y4bu1ixpo8itoj67d854rzxrzk38i0ul"
			},
					{
				"name":"plertsir",
				"nickname":"plertsir",
				"status":"ready",
				"avatar":"/user-media/avatars/small_plertsir.webp",
				"session_id":"y4bu1ixpo8itoj67d854rzxrzk38i0ul"
			},
					{
				"name":"kburalek",
				"nickname":"spipitku",
				"status":"ready",
				"avatar":"/user-media/avatars/small_kburalek.webp",
				"session_id":"y4bu1ixpo8itoj67d854rzxrzk38i0ul"
			}
		]
		this.match_index = 0
		this.game_datas = []
	}

	shuffle() {
		for (let i = this.players.length - 1; i > 0; i-- ){
			const j = Math.floor(Math.random() * (i + 1));
			[this.players[i], this.players[j]] = [this.players[j], this.players[i]]
		}
	}

	private() {
		this.type = 'private'
		this.shuffle()
		const game = new Game_data(this.players[0].name, this.players[1].name)
		this.game_datas = []
		this.game_datas.push(game)
	}

	matchOne(){
		this.type = 'tournament'
		this.shuffle()
		const game = new Game_data(this.players[0].name, this.players[2].name)
		this.game_datas = []
		this.game_datas.push(game)
	}
	
	matchTwo(){
		this.matchOne()
		this.match_index = 1;
		const ran = Math.floor(Math.random() * 10)
		const winner = ran >= 5 ? this.game_datas[0].player_one : this.game_datas[0].player_two
		this.game_datas[0].setWinnerName(winner.name)
		const game = new Game_data(this.players[1].name, this.players[3].name)
		this.game_datas.push(game)
	}

	matchThree(){
		this.matchOne()
		this.matchTwo()
		this.match_index = 2;
		const ran = Math.floor(Math.random() * 10)
		const winner = ran >= 5 ? this.game_datas[1].player_one : this.game_datas[1].player_two
		this.game_datas[1].setWinnerName(winner.name)
		const game = new Game_data(this.game_datas[0].winner.name, this.game_datas[1].winner.name)
		this.game_datas.push(game)
	}

	final(){
		this.matchOne()
		this.matchTwo()
		this.matchThree()
		// this.match_index = 2;
		const ran = Math.floor(Math.random() * 10)
		const winner = ran >= 5 ? this.game_datas[0].winner : this.game_datas[1].winner
		this.game_datas[2].setWinnerName(winner.name)
	}
}

export class WaitMatchBase extends HTMLElement{
	constructor(data){
		super()
		this.attachShadow({mode: 'open'})

		if (typeof data === 'undefined') {
			this.data = new Data()
			// this.data.matchOne()
			// this.data.matchTwo()
			this.data.matchThree()
			// this.data.private()
		}
		else {
			this.data = data
		}
	}

	tournamentTemplate(){
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/WaitMatch.css" >
			<div class="waitmatch-container">
				<div id="header" class="fw-bold mt-0">
					<p>Pong Tournament</p>
				</div>
				<div id="trophy" style="text-align: center">
					<img alt="trophy" src="/static/pong/images/pic-trophy.png"/>
				</div>
				<div class="winner">
					<div class="b-rigth"></div>
					<div class=""></div>
				</div>
				<div class="semi">
					<div class=""></div>
					<div class=""></div>
					<div class="b-top b-left b-top-left-round"></div>
					<div class="b-top"></div>
					<div class="b-top"></div>
					<div class="b-rigth b-top b-top-right-round"></div>
					<div class=""></div>
					<div class=""></div>
				</div>
				<div class="first-round">
					<div class=""></div>
					<div class="b-top b-left b-top-left-round player-one-line"></div>
					<div class="b-rigth b-top b-top-right-round player-two-line"></div>
					<div class=""></div>
					<div class=""></div>
					<div class="b-top b-left b-top-left-round player-one-line"></div>
					<div class="b-rigth b-top b-top-right-round player-two-line"></div>
					<div class=""></div>
				</div>
				<div class="avatar-container">
					<div class="image-container">
						<img class="avatar player-one" id="playerOne" alt="profile player one" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>
					<div class="image-container">
						<img class="avatar player-two" id="playerTwo" alt="profile player two" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>
					<div class="image-container">
						<img class="avatar player-one" id="playerThree" alt="profile player three" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default-white.png';">
					</div>
					<div class="image-container">
						<img class="avatar player-two" id="playerFour" alt="profile player four" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default-white.png';">
					</div>
				</div>
				<div class="name-container">
					<div class="name-tour">
						<p id="nicknameOne"></p>
					</div>
					<div class="name-tour">
						<p id="nicknameTwo"></p>
					</div>
					<div class="name-tour">
						<p id="nicknameThree"></p>
					</div>
					<div class="name-tour">
						<p id="nicknameFour"></p>
					</div>
				</div>
			</div>  
		`
	}

	privateTemplate(){
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/WaitMatch.css" >
			<div class="waitmatch-container">
				<div id="header" class="fw-bold mt-0">
					<p>Pong Private</p>
				</div>
				<div id="trophy" style="text-align: center">
					<img alt="trophy" src="/static/pong/images/pic-trophy.png"/>
				</div>
				<div class="winner">
					<div class="b-rigth"></div>
					<div class=""></div>
				</div>
				<div class="semi">
					<div class=""></div>
					<div class=""></div>
					<div class="b-top b-left b-top-left-round"></div>
					<div class="b-top"></div>
					<div class="b-top"></div>
					<div class="b-rigth b-top b-top-right-round"></div>
					<div class=""></div>
					<div class=""></div>
				</div>
				<div class="avatar-container">
					<div class="image-container" style="width: 50%;">
						<img class="avatar player-one" id="playerOne" alt="profile player one" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>

					<div class="image-container" style="width: 50%;">
						<img class="avatar player-two" id="playerTwo" alt="profile player two" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>
				</div>
				<div class="name-container">
					<div class="name-private">
						<p id="nicknameOne"></p>
					</div>
					<div class="name-private">
						<p id="nicknameTwo"></p>
					</div>
				</div>
			</div>  
		`
	}

	findAvatar (name) {
		for(const player of this.data.players){
			if (player.name == name)
				return player.avatar
		}
		return null
	}

	setupAvatar(id, player) {
		const image = this.shadowRoot.getElementById(id)
		let avatar = this.findAvatar(player.name)
		image.src = avatar ? avatar : ''
	}

	setupNickname(id, player) {
		const nicknameElement = this.shadowRoot.getElementById(id)
		const playerNickname = player.nickname
		nicknameElement.textContent = playerNickname;
	}

	drawMatch_0() {
		const player_one = this.data.game_datas[0].player_one
		const player_two = this.data.game_datas[0].player_two

		this.setupAvatar('playerOne', player_one)
		this.setupAvatar('playerTwo', player_two)
		this.setupNickname('nicknameOne', player_one)
		this.setupNickname('nicknameTwo', player_two)

		const playerThree = this.shadowRoot.getElementById('playerThree')
		const playerFour = this.shadowRoot.getElementById('playerFour')
		playerThree.classList.add("image-round")
		playerFour.classList.add("image-round")
	}

	drawMatch_1(){
		const player_one = this.data.game_datas[0].player_one
		const player_two = this.data.game_datas[0].player_two
		const player_three = this.data.game_datas[1].player_one
		const player_four = this.data.game_datas[1].player_two
		const winner = this.data.game_datas[0].winner

		this.setupAvatar('playerThree', player_three)
		this.setupAvatar('playerFour', player_four)
		this.setupNickname('nicknameThree', player_three)
		this.setupNickname('nicknameFour', player_four)

		const playerThree = this.shadowRoot.getElementById('playerThree')
		const playerFour = this.shadowRoot.getElementById('playerFour')
		playerThree.classList.remove("image-round")
		playerFour.classList.remove("image-round")

		// draw winner line and remove loser line
		const playerOneLines = this.shadowRoot.querySelectorAll("div.player-one-line")
		const playerTwoLines = this.shadowRoot.querySelectorAll("div.player-two-line")
		playerOneLines[0].classList.add(player_one.name == winner.name ? 'winner-line': 'loser-line')
		playerTwoLines[0].classList.add(player_two.name == winner.name ? 'winner-line': 'loser-line')

		// drop color loser 1
		const idLoser = player_one.name == winner.name ? 'playerTwo' : 'playerOne'
		const imgLoser = this.shadowRoot.getElementById(idLoser)
		imgLoser.classList.add("drop-color")
	}

	drawMatch_2(){
		const player_three = this.data.game_datas[1].player_one
		const player_four = this.data.game_datas[1].player_two
		const winnerTwo = this.data.game_datas[1].winner

		// draw winner line and remove loser line
		const playerOneLines = this.shadowRoot.querySelectorAll("div.player-one-line")
		const playerTwoLines = this.shadowRoot.querySelectorAll("div.player-two-line")
		playerOneLines[1].classList.add(player_three.name == winnerTwo.name ? 'winner-line': 'loser-line')
		playerTwoLines[1].classList.add(player_four.name == winnerTwo.name ? 'winner-line': 'loser-line')

		// drop color loser 2
		const idLoserTwo = player_three.name == winnerTwo.name ? 'playerFour' : 'playerThree'
		const imgLoserTwo = this.shadowRoot.getElementById(idLoserTwo)
		imgLoserTwo.classList.add("drop-color")
	}

	drawTournamnet() {
		this.shadowRoot.innerHTML = this.tournamentTemplate()
		if (this.data.match_index == 0) {
			this.drawMatch_0()
		}
		else if (this.data.match_index == 1) {
			this.drawMatch_0()
			this.drawMatch_1()
		}
		else if (this.data.match_index == 2) {
			this.drawMatch_0()
			this.drawMatch_1()
			this.drawMatch_2()
		}
	}

	drawPrivate() {
		this.shadowRoot.innerHTML = this.privateTemplate()
		const player_one = this.data.game_datas[0].player_one
		const player_two = this.data.game_datas[0].player_two

		this.setupAvatar('playerOne', player_one)
		this.setupAvatar('playerTwo', player_two)
		this.setupNickname('nicknameOne', player_one)
		this.setupNickname('nicknameTwo', player_two)
	}

	connectedCallback(){
		if (this.data.type == 'tournament')
			this.drawTournamnet()
		else if (this.data.type == 'private')
			this.drawPrivate()
	}
}
export class WaitMatch extends WaitMatchBase {
	constructor() {
		super(getPongPublic().data)
		this.pongPublic = getPongPublic()
	}

	connectedCallback() {
		super.connectedCallback()
	}


	disconnectedCallback() {
		if (this.pongPublic.data.action == 'waitmatch') {
			console.log("send quit to server")
			this.pongPublic.data.action = 'quit'
			this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
		}
	}
}

export class Final extends HTMLElement{
	constructor(){
		super()
		this.pongPublic = getPongPublic()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
	}

	template(){
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/WaitMatch.css" >
			<div class="waitmatch-container">
				<div id="header" class="fw-bold mt-0">
					<p>Pong Winner</p>
				</div>
				<div id="trophy" style="text-align: center">
					<img alt="trophy" src="/static/pong/images/pic-trophy.png"/>
				</div>
				<div class="winner">
					<div class="b-rigth winner-line"></div>
					<div class=""></div>
				</div>
				<div class="avatar-container">
					<div class="image-container" style="width: 100%;">
						<img class="avatar" id="winner" alt="profile winner" src=""
						onerror="this.onerror=null; this.src='/user-media/avatars/default.png';">
					</div>
				</div>
				<div class="name-container">
					<div class="name-winner">
						<p id="nickname"></p>
					</div>
				</div>
			</div>  
		`
	}

	getWinnerAvatar(name){
		for (const player of this.pongPublic.data.players) {
			if (player.name == name) {
				return player.avatar
			}
		}
		return ""
	}

	connectedCallback(){
		// console.log(this.pongPublic.data.match_index)
		// console.log(this.pongPublic.data.game_datas[this.pongPublic.data.match_index])
		const winnerName = this.pongPublic.data.game_datas[this.pongPublic.data.match_index].winner.name
		const winnerAvatar = this.getWinnerAvatar(winnerName)
		const winner = this.shadowRoot.getElementById('winner')
		winner.src = winnerAvatar
		const winnerNickname = this.pongPublic.data.game_datas[this.pongPublic.data.match_index].winner.nickname
		const nicknameElement = this.shadowRoot.getElementById('nickname');
		nicknameElement.textContent = winnerNickname;
	}
}