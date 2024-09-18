import sys
from dataclasses import dataclass, asdict

@dataclass
class GamePlayer():
	name: str
	nickname: str
	x: int
	y: int
	move: str
	score: int

	def __init__(self, x: int, y: int):
		self.name = None
		self.nickname = None
		self.x = x
		self.y = y
		self.move = "idle"
		self.score = 0

	def set_name(self, name: str):
		self.name = name

	def set_nickname(self, nickname: str):
		self.nickname = nickname

	def set_move(self, move: str):
		self.move = move

	def set_move_idle(self):
		self.move = "idle"

@dataclass
class Table():
	width: int
	height: int

	def __init__(self, width: int, height: int):
		self.width = width
		self.height = height

@dataclass
class Ball():
	table: Table
	x: int
	y: int
	mx: int = 5
	my: int = 2

	def __init__(self, table: Table):
		self.table = table
		self.reset()

	def reset(self):
		self.x = self.table.width / 2
		self.y = self.table.height / 2

@dataclass
class GameData():

	table: Table
	ball: Ball
	player_one: GamePlayer
	player_two: GamePlayer
	game_loop: bool
	winner: GamePlayer
	player_radius: int = 10 #percent paddle/table_height
	ball_radius: int = 4
	player_speed: int = 2
	max_score: int = 5

	def __init__(self):
		self.table = Table(200, 100)
		self.ball = Ball(self.table)
		self.player_one = GamePlayer(0, self.table.height / 2)
		self.player_two = GamePlayer(self.table.width, self.table.height / 2)
		self.game_loop = False
		self.winner = None

	def init_game(self):
		self.ball.reset()

	def ball_move(self):

		self.ball.x += self.ball.mx
		self.ball.y += self.ball.my

		#player2
		if ((self.ball.x + self.ball_radius) >= self.table.width):
			if (self.ball.y < (self.player_two.y - self.player_radius)) \
				or (self.ball.y > (self.player_two.y + self.player_radius)):
				# print("player 2 lose", file=sys.stderr)
				self.player_one.score += 1
				self.game_loop = False
			# else:
			# 	print("player 2 hit ball", file=sys.stderr)
			self.ball.mx *= -1

		#player1
		if ((self.ball.x - self.ball_radius) <= 0):
			if (self.ball.y < (self.player_one.y - self.player_radius)) \
				or (self.ball.y > (self.player_one.y + self.player_radius)):
				# print("player 1 lose", file=sys.stderr)
				self.player_two.score += 1
				self.game_loop = False
			# else:
			# 	print("player 1 hit ball", file=sys.stderr)
			self.ball.mx *= -1

		if ((self.ball.y + self.ball_radius) >= self.table.height) \
			or ((self.ball.y - self.ball_radius) <= 0):
			self.ball.my *= -1

	def player_move(self):
		if self.player_one.move == "right":
			new_pos = self.player_one.y + self.player_speed
			if new_pos + self.player_radius <= self.table.height:
				self.player_one.y += self.player_speed
		if self.player_one.move == "left":
			new_pos = self.player_one.y + self.player_speed
			if new_pos - self.player_radius > self.player_speed:
				self.player_one.y -= self.player_speed
		if self.player_two.move == "right":
			new_pos = self.player_two.y + self.player_speed
			if new_pos - self.player_radius > self.player_speed:
				self.player_two.y -= self.player_speed
		if self.player_two.move == "left":
			new_pos = self.player_two.y + self.player_speed
			if new_pos + self.player_radius <= self.table.height:
				self.player_two.y += self.player_speed

	def player_idle(self):
		self.player_one.set_move_idle()
		self.player_two.set_move_idle()

	def select_player(self, player: str):
		if self.player_one.name == player:
			return self.player_one
		elif self.player_two.name == player:
			return self.player_two
		return None

	def end_game(self):
		if self.player_one.score >= self.max_score:
			self.winner = self.player_one
		elif self.player_two.score >= self.max_score:
			self.winner = self.player_two
		else:
			self.winner = None
		return self.winner
