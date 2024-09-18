import sys

class Player():
	def __init__(self, x, y):
		self.player_name = None
		self.x = x
		self.y = y
		self.move = "idle"
		self.score = 0

	def set_name(self, name):
		self.player_name = name

	def set_move(self, move):
		self.move = move

	def set_move_idle(self):
		self.move = "idle"

class Table():
	def __init__(self, width, height):
		self.width = width
		self.height = height

class Ball():
	def __init__(self, table):
		self.table = table
		self.mx = 5
		self.my = 2
		self.reset()

	def reset(self):
		self.x = self.table.width / 2
		self.y = self.table.height / 2

class GameData():
	def __init__(self):
		self.table = Table(200, 100)
		self.ball = Ball(self.table)
		self.player_one = Player(0, self.table.height / 2)
		self.player_two = Player(self.table.width, self.table.height / 2)
		self.player_radius = 10 #percent paddle/table_height
		self.ball_radius = 4
		self.player_speed = 2
		self.max_score = 5
		self.game_loop = False

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
			else:
				print("player 2 hit ball", file=sys.stderr)
			self.ball.mx *= -1

		#player1
		if ((self.ball.x - self.ball_radius) <= 0):
			if (self.ball.y < (self.player_one.y - self.player_radius)) \
				or (self.ball.y > (self.player_one.y + self.player_radius)):
				# print("player 1 lose", file=sys.stderr)
				self.player_two.score += 1
				self.game_loop = False
			else:
				print("player 1 hit ball", file=sys.stderr)
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

	def select_player(self, player):
		if self.player_one.player_name == player:
			return self.player_one
		elif self.player_two.player_name == player:
			return self.player_two
		return None

	def end_game(self):
		return self.player_one.score >= self.max_score \
			or self.player_two.score >= self.max_score

	def to_dict(self):
		return {
			"table_width": self.table.width,
			"table_height": self.table.height,
			"ball_radius": self.ball_radius,
			"ball_x": self.ball.x,
			"ball_y": self.ball.y,
			"player_radius": self.player_radius,
			"player_one_name": self.player_one.player_name,
			"player_one_x": self.player_one.x,
			"player_one_y": self.player_one.y,
			"player_two_name": self.player_two.player_name,
			"player_two_x": self.player_two.x,
			"player_two_y": self.player_two.y,
			"player_radius": self.player_radius,
		}