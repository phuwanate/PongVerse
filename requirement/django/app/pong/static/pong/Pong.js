export class Pong extends HTMLElement {
	constructor () {
		super()
		this.user = document.querySelector("[name=context-user]").value || null
		this.attachShadow({mode: 'open'})
		this.shadowRoot.innerHTML = this.template()
		this.keyDownHandler = this.keyDownHandler.bind(this)
	}

	template() {
		return `
			<link rel="stylesheet" href="${window.location.origin}/static/pong/Pong.css" />
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
			
			<div class="canvas-container border border-danger">
				<canvas id="canvas"></canvas>
			</div>
		`
	}

	drawBall(canvas, ctx, data, isPortrait){
		let x, y, r
		if (isPortrait){		
			x = canvas.width - (this.scaleX * data.ball_y)
			// x = this.scaleX * data.ball_y
			y = this.scaleY * data.ball_x;
			
			if (this.user == data.player_one_name) {
				y = canvas.height - y
				x = canvas.width - x
			}

		} else {
			x = this.scaleX * data.ball_x;
			y = this.scaleY * data.ball_y

			//invert
			// x = canvas.width - (this.scaleX * data.ball_x);
			// y = canvas.height - (this.scaleY * data.ball_y);
		}
		r = this.scaleY * data.ball_radius

		ctx.beginPath()
		ctx.arc( x, y, r, 0, Math.PI * 2, true)
		ctx.closePath()
		ctx.fill();
	}

	drawPlayer(canvas, ctx, data, isPortrait){
		const paddingWidth = 10
		const paddingRadius = this.scaleY * data.player_radius

		if (isPortrait) {

			// let upper, lower
			let lower = this.scaleX * data.player_one_y - paddingRadius
			let upper = this.scaleX * data.player_two_y - paddingRadius
			// let upper = canvas.width - (this.scaleX * data.player_two_y) - paddingRadius
			if (this.user == data.player_two_name) {
				lower = canvas.width - (this.scaleX * data.player_two_y) - paddingRadius
				// upper = canvas.width - (this.scaleX * data.player_one_y - paddingRadius)
				upper = canvas.width - (this.scaleX * data.player_one_y)- paddingRadius
			}
			//owner
			ctx.fillRect(
				// this.scaleX * data.player_one_y - paddingRadius, 
				lower,
				canvas.height - paddingWidth,
				paddingRadius * 2,
				paddingWidth
				)

			//anothor
			ctx.fillRect(
				// this.scaleX * data.player_two_y - paddingRadius,
				upper,
				0,
				paddingRadius * 2,
				paddingWidth
			)
		}
		else {
			// player1
			ctx.fillRect(
				0,
				this.scaleY * data.player_one_y - paddingRadius, 
				paddingWidth,
				paddingRadius * 2,
				)

			// player2
			ctx.fillRect(
				canvas.width - paddingWidth,
				this.scaleY * data.player_two_y - paddingRadius,
				paddingWidth,
				paddingRadius * 2,
			)
		}
	}

	setUpScale(canvas, data, isPortrait){
		if (isPortrait) {
			this.scaleX = canvas.width / data.table_height;
			this.scaleY = canvas.height / data.table_width;
		} else {
			this.scaleX = canvas.width / data.table_width;
			this.scaleY = canvas.height / data.table_height;
		}
	}

	draw(data) {
		const canvas = this.shadowRoot.getElementById("canvas")
		canvas.width = canvas.offsetWidth
		canvas.height = canvas.offsetHeight
		const ctx = canvas.getContext("2d")
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		const isPortrait = canvas.width < canvas.height;

		this.setUpScale(canvas, data, isPortrait)
		// console.log(`{${x}: ${y}}`)
		this.drawBall(canvas, ctx, data, isPortrait)
		this.drawPlayer(canvas, ctx, data, isPortrait)
	}

	sendMoveMent(direction){
		const data = {
			user: this.user,
			type: "move",
			move: direction
		}
		this.socket.send(JSON.stringify(data))
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

	async setupWebsocket(){
		
		this.socket = new WebSocket(`${window.location.origin}/ws/pong/ponggame/${this.dataset.player1}/${this.dataset.player2}`)

		this.socket.addEventListener('message', (event) => {
			
			const data = JSON.parse(event.data)
			// console.log(data)
			if(data.type === "game_data")
			{
				this.draw(data.data)
				console.log(`x: ${data.data.ball_x},y: ${data.data.ball_y}`)
			}
			else if(data.type === "game_end") {
				this.socket.close()
			}
			else console.log(data.data)
		})

		this.socket.addEventListener('open', () => {
			if(this.user == this.dataset.player1 || this.user == this.dataset.player2)
				document.addEventListener('keydown', this.keyDownHandler)
		})

		this.socket.addEventListener("close", () => {
			if(this.user == this.dataset.player1 || this.user == this.dataset.player2)
				document.removeEventListener('keydown', this.keyDownHandler)
			console.log("websocket closed!")
		})
	}

	connectedCallback(){
		// this.draw()
		this.setupWebsocket()
	}

	disconnectedCallback() {
		if (this.socket) {
			this.socket.close()
			this.socket = null
		}
	}
}