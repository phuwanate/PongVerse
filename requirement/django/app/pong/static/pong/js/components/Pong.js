import { getUserName, getPongPublic } from "/static/frontend/js/components/Utils.js"

export class PongBase extends HTMLElement {
	constructor () {
		super()
		this.user = getUserName()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
	}

	template() {
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/Pong.css" />
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
			<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css">
			
			<!--div style="text-align: center">Pong Game</div-->
			<!--div class="canvas-container border border-danger"-->
			<div class="canvas-container">
				<canvas id="canvas"></canvas>			
			${this.isMobile() 
				? `
						<div class="w-100" style="position: absolute; top: 70%; left: 0;">
							<div class="d-flex w-100 justify-content-between">
								<div class="w-50 text-center" role="button">
									<i id="arrowLeft" class="uil uil-arrow-left" style="font-size: 2rem; role="button""></i>
								</div>
								<div class="w-50 text-center">
									<i id="arrowRight" class="uil uil-arrow-right" style="font-size: 2rem; role="button""></i>
								</div>
							</div>
						</div>
					`
				: "<div></div>"}
				</div>
		`
	}

	isMobile() {
		if (navigator.userAgentData) {
			return navigator.userAgentData.mobile;
		}
		return /Mobi|Android/i.test(navigator.userAgent);
	}

	/** draw canvas */
	drawBall(canvas, ctx, data, isPortrait){
		let x, y, r
		if (isPortrait){		
			x = canvas.width - (this.scaleX * data.ball.y)
			y = this.scaleY * data.ball.x;
			if (this.user == data.player_one.name) {
				y = canvas.height - y
				x = canvas.width - x
			}
		} else {
			x = this.scaleX * data.ball.x;
			y = this.scaleY * data.ball.y
		}
		r = this.scaleY * data.ball_radius

		ctx.save()
		ctx.fillStyle = '#F8F9FA'
		ctx.beginPath()
		ctx.arc( x, y, r, 0, Math.PI * 2, true)
		ctx.closePath()
		ctx.fill();
		ctx.restore()
	}

	drawPlayer(canvas, ctx, data, isPortrait){
		const fontSize = 24
		const fontMargin = 10
		const paddingWidth = 10
		const paddingRadius = this.scaleY * data.player_radius

		if (isPortrait) {
			// let upper, lower
			let lower = this.scaleX * data.player_one.y - paddingRadius
			let upper = this.scaleX * data.player_two.y - paddingRadius
			// let upper = canvas.width - (this.scaleX * data.player_two_y) - paddingRadius
			if (this.user == data.player_two.name) {
				console.log(data.player_two.name)
				lower = canvas.width - (this.scaleX * data.player_two.y) - paddingRadius
				// upper = canvas.width - (this.scaleX * data.player_one_y - paddingRadius)
				upper = canvas.width - (this.scaleX * data.player_one.y)- paddingRadius
			}
			//owner
			ctx.save()
			ctx.fillStyle = "#E53E3E"
			ctx.fillRect(
				// this.scaleX * data.player_one_y - paddingRadius, 
				lower,
				canvas.height - paddingWidth,
				paddingRadius * 2,
				paddingWidth
				)

			ctx.font = `${fontSize}px serif`
			ctx.fillText (
				data.player_one.score,
				fontMargin,
				(canvas.height / 2 ) + fontSize,
				)
			
			//anothor
			ctx.fillStyle = "#2D3748"
			ctx.fillRect(
				// this.scaleX * data.player_two_y - paddingRadius,
				upper,
				0,
				paddingRadius * 2,
				paddingWidth
			)

			// ctx.font = `${fontSize}px serif`
			ctx.fillText (
				data.player_two.score,
				fontMargin,
				(canvas.height / 2 ) - fontMargin,
				)
			ctx.restore()
		}
		else {
			// player1
			ctx.save()
			ctx.fillStyle = "#E53E3E"
			ctx.fillRect(
				0,
				this.scaleY * data.player_one.y - paddingRadius, 
				paddingWidth,
				paddingRadius * 2,
				)
			
			ctx.font = `${fontSize}px serif`
			ctx.fillText (
				data.player_one.score,
				(canvas.width / 2 ) - (fontSize + fontMargin),
				fontSize + fontMargin
				)

			// player2
			ctx.fillStyle = "#2D3748"
			ctx.fillRect(
				canvas.width - paddingWidth,
				this.scaleY * data.player_two.y - paddingRadius,
				paddingWidth,
				paddingRadius * 2,
			)

			ctx.fillText (
				data.player_two.score,
				(canvas.width / 2 ) + fontMargin,
				fontSize + fontMargin
			)
			ctx.restore()
		}
	}

	drawScreen(canvas, ctx){
		ctx.save()
		ctx.fillStyle = '#4FD1C5'
		ctx.fillRect(
			0,
			0,
			canvas.width,
			canvas.height,
		)
		ctx.restore()
	}

	drawHalf(canvas, ctx, isPortrait){
		ctx.save()
		ctx.fillStyle = "#F8F9FA"
		if (isPortrait) {
			ctx.fillRect(
				0,
				(canvas.height / 2) - 1,
				canvas.width,
				2
			)
		} else {
			ctx.fillRect(
				(canvas.width / 2) - 1,
				0, 
				2,
				canvas.height)
		}
		ctx.restore()
	}

	setUpScale(canvas, data, isPortrait){
		if (isPortrait) {
			this.scaleX = canvas.width / data.table.height;
			this.scaleY = canvas.height / data.table.width;
		} else {
			this.scaleX = canvas.width / data.table.width;
			this.scaleY = canvas.height / data.table.height;
		}
	}

	draw(datas) {
		this.datas = datas
		const data = datas.game_datas[datas.match_index]
		const canvas = this.shadowRoot.getElementById("canvas")
		canvas.width = canvas.offsetWidth
		canvas.height = canvas.offsetHeight
		const ctx = canvas.getContext("2d")
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		const isPortrait = canvas.width < canvas.height;
		this.setUpScale(canvas, data, isPortrait)

		this.drawScreen(canvas, ctx)
		this.drawHalf(canvas, ctx, isPortrait)
		this.drawBall(canvas, ctx, data, isPortrait)
		this.drawPlayer(canvas, ctx, data, isPortrait)
	}

	/** game control */
	mobileEvent() {
		let moveInterval
		this.shadowRoot.getElementById('arrowLeft').addEventListener('touchstart', () => {
			moveInterval = setInterval( () => {
				this.sendMoveMent("left")
			}, 1000/12, )
		})
		this.shadowRoot.getElementById('arrowRight').addEventListener('touchstart', () => {
			moveInterval = setInterval( () => {
				this.sendMoveMent("right")
			}, 1000/12, )
		})
		this.shadowRoot.getElementById('arrowLeft').addEventListener('touchend', () => {
			clearInterval(moveInterval)
		})
		this.shadowRoot.getElementById('arrowRight').addEventListener('touchend', () => {
			clearInterval(moveInterval)
		})
	}

	sendMoveMent(direction) {
		console.log(direction)
	}
}
export class Pong extends PongBase {
	constructor(){
		super()
		this.pongPublic = getPongPublic()
		this.keyDownHandler = this.keyDownHandler.bind(this)
	}

	sendMoveMent(direction){
		this.datas.action = 'sendkey'
		this.datas.direction = direction
		this.pongPublic.socket.send(JSON.stringify(this.datas))
	}

	keyDownHandler(e){
		switch(e.key){
			case "a":
			case "w":
			case "ArrowLeft":
			case "ArrowUp":
				this.sendMoveMent("left");
				break;
			case "s":
			case "d":
			case "ArrowRight":
			case "ArrowDown":
				this.sendMoveMent("right"); 
				break;
			default: break
		}
	}

	connectedCallback(){
		if(this.user == this.dataset.player1 || this.user == this.dataset.player2) {
			if(this.isMobile()){
				this.mobileEvent()
			} else {
				document.addEventListener('keydown', this.keyDownHandler)
			}
		}
	}

	disconnectedCallback() {
		if(this.user == this.dataset.player1 || this.user == this.dataset.player2)
				document.removeEventListener('keydown', this.keyDownHandler)
		if (this.pongPublic.data.action != 'finish') {
			console.log(this.pongPublic.data)
			this.pongPublic.data.action = 'quit'
		}
		this.pongPublic.socket.send(JSON.stringify(this.pongPublic.data))
	}
}

class Player {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.move = "idle"
		this.score = 0
	}

	set_move(direction){
		this.move = direction
	}

	set_move_idle(){
		this.move = 'idle'
	}
}

class AIPlayer extends Player {
	constructor(x, y) {
		super(x, y);
	}

	moveToPosition(ball, player){
		if (player == 'player_two') {
			if (this.y > ball.table.height / 2) {
				this.set_move('right')
			}
			else if (this.y < ball.table.height / 2) {
				this.set_move('left')
			}
			else {
				this.set_move_idle()
			}
		}
		if (player == 'player_one') {
			if (this.y > ball.table.height / 2) {
				this.set_move('left')
			}
			else if (this.y < ball.table.height / 2) {
				this.set_move('right')
			}
			else {
				this.set_move_idle()
			}
		}
	}

	moveTowards(ball, player , player_radius) {

		const randomRadius = (player_radius) => {
			if (Math.floor(Math.random() * 10) >= 5)
				return Math.floor(Math.random() * (player_radius))
			return 0
		}

		if (player == 'player_two') {
			if (ball.mx < 0) {
				return this.moveToPosition(ball, player)
			}
			if (ball.y > this.y - randomRadius(player_radius)) {
				this.set_move('left');
			} else if (ball.y < this.y + randomRadius(player_radius)) {
				this.set_move('right');
			} else {
				this.set_move_idle();
			}
		}

		if (player == 'player_one') {
			if (ball.mx > 0) {
				return this.moveToPosition(ball, player)
			}
			if (ball.y > this.y - randomRadius(player_radius)) {
				this.set_move('right');
			} else if (ball.y < this.y + randomRadius(player_radius)) {
				this.set_move('left');
			} else {
				this.set_move_idle();
			}
		}
	}
}

class Table {
	constructor(width, height) {
		this.width = width
		this.height = height
	}
}

class Ball {
	constructor(table){
		this.table = table
		this.x = table.width / 2
		this.y = table.height / 2
		this.mx = -5
		this.my = 2
	}

	reset() {
		this.x = this.table.width / 2
		this.y = this.table.height / 2
	}
}

class GameData {
	constructor(){
		this.table = new Table(200, 100)
		this.ball = new Ball(this.table)
		this.player_one = new Player(0, this.table.height / 2)
		this.player_two = new Player(this.table.width, this.table.height / 2)
		this.game_loop = false
		this.ball_radius = 4
		this.player_radius = 10
		this.player_speed = 2
		this.max_score = 5
	}

	init_game(){
		this.ball.reset()
	}

	ball_move(){
		this.ball.x += this.ball.mx
		this.ball.y += this.ball.my

		/** player2 */
		if ((this.ball.x + this.ball_radius) >= this.table.width) {
			if (this.ball.y < (this.player_two.y - this.player_radius)
			|| this.ball.y > (this.player_two.y + this.player_radius)) {
				this.player_one.score += 1
				this.game_loop = false
			}
			this.ball.mx *= -1
		}

		/** player1 */
		if ((this.ball.x - this.ball_radius) <= 0) {
			if (this.ball.y < (this.player_one.y - this.player_radius)
			|| this.ball.y > (this.player_one.y + this.player_radius)) {
				this.player_two.score += 1
				this.game_loop = false
			}
			this.ball.mx *= -1
		}

		if ((this.ball.y + this.ball_radius) >= this.table.height
		|| (this.ball.y - this.ball_radius) <= 0) {
			this.ball.my *= -1
		}
		
		if (this.player_one instanceof AIPlayer) {
			this.player_one.moveTowards(this.ball, 'player_one', this.player_radius)
		}
		if (this.player_two instanceof AIPlayer) {
			this.player_two.moveTowards(this.ball, 'player_two', this.player_radius)
		}
	
	}

	player_move() {
		if (this.player_one.move == 'right') {
			const new_pos = this.player_one.y + this.player_speed
			if (new_pos + this.player_radius <= this.table.height) {
				this.player_one.y += this.player_speed
			}
		}
		if (this.player_one.move == 'left') {
			const new_pos = this.player_one.y + this.player_speed
			if (new_pos - this.player_radius > this.player_speed) {
				this.player_one.y -= this.player_speed
			}
		}
		if (this.player_two.move == 'right') {
			const new_pos = this.player_two.y + this.player_speed
			if (new_pos - this.player_radius > this.player_speed) {
				this.player_two.y -= this.player_speed
			}
		}
		if (this.player_two.move == 'left') {
			const new_pos = this.player_two.y + this.player_speed
			if (new_pos + this.player_radius <= this.table.height) {
				this.player_two.y += this.player_speed
			}
		}
	}

	player_idle(){
		this.player_one.set_move_idle()
		this.player_two.set_move_idle()
	}

	end_game(){
		return this.player_one.score >= this.max_score || this.player_two.score >= this.max_score
	}
}
class Datas {
	constructor () {
		this.players = [
			{name: "player1"},
			{name: "player2"}
		]
		this.game_datas = []
		this.match_index = 0
		this.game_datas.push(new GameData())
		this.fps = 12
		this.time_wait = 5000 //ms
	}
}

export class PongOffline extends PongBase {
	
	constructor() {
		super()
		this.datas = new Datas()
		this.keyDownHandler = this.keyDownHandler.bind(this)
		this.keyUpHandler = this.keyUpHandler.bind(this)
		this.keyPressed = {}
		this.shadowRoot.innerHTML += `
			<style>
				@media (max-width: 767px) {
					#canvas {
						max-width: 300px;
						aspect-ratio: 1 / 2;
					}
				}
			</style>
		`
	}

	draw(){
		super.draw(this.datas, false)
	}

	keyDownHandler(e) {
		const keys = ['a', 'd', 'ArrowLeft', 'ArrowRight']
		if (keys.includes(e.key)){
			this.keyPressed[e.key] = true
		}
		if (this.keyPressed['a']) this.datas.game_datas[0].player_one.set_move('left')
		if (this.keyPressed['d']) this.datas.game_datas[0].player_one.set_move('right')
		if (this.keyPressed['ArrowLeft']) this.datas.game_datas[0].player_two.set_move('left')
		if (this.keyPressed['ArrowRight']) this.datas.game_datas[0].player_two.set_move('right')
	}

	keyUpHandler(e){
		this.keyPressed[e.key] = false
	}

	async gameTask() {
		const game_data = this.datas.game_datas[0]
		let wait_task = false

		const new_turn = async() => {
			wait_task = true
			game_data.ball.reset()
			await sleep(this.datas.time_wait)
			game_data.game_loop = true
			wait_task = false
		}

		const sleep = async(ms) => {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		new_turn()
		while (!game_data.end_game()) {
			if (game_data.game_loop) game_data.ball_move()
			else if (!wait_task) new_turn()

			game_data.player_move()

			this.draw()

			game_data.player_idle()
			await sleep(1000 / this.datas.fps)
		}
		// console.log("game end")
	}

	connectedCallback(){
		this.draw()
		this.gameTask()
		document.addEventListener('keydown', this.keyDownHandler)
		document.addEventListener('keyup' , this.keyUpHandler)
	}

	disconnectedCallback() {
		document.removeEventListener('keydown', this.keyDownHandler)
		document.removeEventListener('keyup', this.keyUpHandler)
	}
}

export class PongAllAI extends PongOffline {
	constructor () {
		super()
		this.datas.game_datas[0].player_one.name = this.datas.players[0].name
		this.user = this.datas.players[0].name
		this.datas.game_datas[0].player_one = 
			new AIPlayer(
				0, 
				this.datas.game_datas[0].table.height / 2)
		this.datas.game_datas[0].player_two = 
			new AIPlayer(
				this.datas.game_datas[0].table.width, 
				this.datas.game_datas[0].table.height / 2)
			
			this.shadowRoot.innerHTML += `
			<style>
				@media (max-width: 767px) {
					#canvas {
						max-width: 300px;
						aspect-ratio: 1 / 2;
					}
				}
			</style>
		`
	}

	connectedCallback(){
		this.draw()
		this.gameTask()
	}
}

export class PongAI extends PongOffline {
	constructor() {
		super()
		this.datas.game_datas[0].player_one.name = this.datas.players[0].name
		this.user = this.datas.players[0].name

		this.datas.game_datas[0].player_two = 
			new AIPlayer(
				this.datas.game_datas[0].table.width, 
				this.datas.game_datas[0].table.height / 2)

		this.shadowRoot.innerHTML += `
			<style>
				@media (max-width: 767px) {
					#canvas {
						max-width: 300px;
						aspect-ratio: 1 / 2;
					}
				}
			</style>
		`
	}

	keyDownHandler(e) {
		switch(e.key){
			case "a": return this.datas.game_datas[0].player_one.set_move('left');
			case "d": return this.datas.game_datas[0].player_one.set_move('right');
			default: break
		}
	}

	sendMoveMent(direction) {
		this.datas.game_datas[0].player_one.set_move(direction)
	}

	connectedCallback(){
		this.draw()
		this.gameTask()
		if(this.isMobile()){
			this.mobileEvent()
		} else {
			document.addEventListener('keydown', this.keyDownHandler)
		}
	}
}

export class PongAllOffline extends HTMLElement{
	constructor () {
		super()
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
		this.pong = this.shadowRoot.getElementById('pong')
	}

	template(){
		return `
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
			<link rel="stylesheet" href="${window.location.origin}/static/pong/js/components/Pong.css" />
			<div class="custom-bg">
				<div class="btn-all d-flex flex-row justify-content-center align-items-center">
					<button id="onePlayer" class="btn btn-dark btn-cus d-flex align-items-center justify-content-center"">Solo Mode</button>
					<button id="twoPlayer" class="ms-2 btn btn-dark btn-cus d-flex align-items-center justify-content-center"">2-Player Mode</button>
					<button id="allAI" class="ms-2 btn btn-dark btn-cus d-flex align-items-center justify-content-center">AI Mode</button>
				</div>
				<div id="pong"></div>
			</div>
		`
	}

	isMobile = () => {
		if (navigator.userAgentData) {
			return navigator.userAgentData.mobile;
		}
		return /Mobi|Android/i.test(navigator.userAgent);
	}

	connectedCallback(){
		this.pong.innerHTML = `<pong-all-ai-component></pong-all-ai-component>`
		this.shadowRoot.getElementById('allAI').addEventListener('click', ()=>{
			this.pong.innerHTML = `
				<div class="mode">
					<p>AI Mode</p>
					<pong-all-ai-component></pong-all-ai-component>
				</div>
			`
		})
		this.shadowRoot.getElementById('twoPlayer').addEventListener('click', ()=>{
			if (this.isMobile())
			this.pong.innerHTML = `<div>Two Player not support on mobile</div>`
			else
			this.pong.innerHTML = `
				<div class="mode">
					<p>2-Player Mode</p>
					<pong-offline-component></pong-offline-component>
				</div>
			`
		})
		this.shadowRoot.getElementById('onePlayer').addEventListener('click', ()=>{
			this.pong.innerHTML = `
				<div class="mode">
					<p>Solo Mode</p>
					<pong-ai-component></pong-ai-component>
				</div>
			`
		})
	}
}
