from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import sys
from collections import defaultdict
# import random

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

class PongConsumer(AsyncWebsocketConsumer):

	games = {}
	tasks = {}
	active_connection = defaultdict(int)

	async def connect(self):
		self.user = self.scope['user'] #get user from section
		print(self.user.username, file=sys.stderr) #debug 
		self.player_1 = self.scope['url_route']['kwargs']['player1']
		self.player_2 = self.scope['url_route']['kwargs']['player2']
		self.chatroom_name = f'{self.player_1}_{self.player_2}'
		
		if self.chatroom_name not in self.games:
			self.games[self.chatroom_name] = GameData()
		
		self.game = self.games[self.chatroom_name]
		
		await self.accept()
		await self.channel_layer.group_add(self.chatroom_name, self.channel_name)
		self.active_connection[self.chatroom_name] += 1

		if self.user.username == self.player_1:
			print ("player 1 connected", file=sys.stderr)
			self.game.player_one.set_name(self.player_1)
		if self.user.username == self.player_2:
			self.game.player_two.set_name(self.player_2)
			print ("player 2 connected", file=sys.stderr)

		#expect both player connect before game start
		if self.game.player_one.player_name \
			and self.game.player_two.player_name \
			and self.chatroom_name not in self.tasks:
			self.tasks[self.chatroom_name] = asyncio.create_task(self.send_game_data())

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.chatroom_name, self.channel_name)
		self.active_connection[self.chatroom_name] -= 1

		#when no client connect should save data and clean it
		if not self.active_connection[self.chatroom_name]:
			if self.chatroom_name in self.tasks:
				self.tasks[self.chatroom_name].cancel()
				del self.tasks[self.chatroom_name]
				#debug
				print(f"task was delete {self.chatroom_name}", file=sys.stderr)
			if self.chatroom_name in self.games:
				# save game_data to database
				del self.games[self.chatroom_name]
				print(f"game data was delete {self.chatroom_name}", file=sys.stderr)
		#debug
		print("disconnect was call", file=sys.stderr)
	
	async def send_game_data(self):
		try:
			# check game end or player disconnect
			while not self.game.end_game():
				self.game.init_game()
				await self.channel_layer.group_send(
					self.chatroom_name,
					{
						'type': 'game_data',
						'data': self.game.to_dict()
					}
				)
				await asyncio.sleep(5)
				self.game.game_loop = True
				while self.game.game_loop:
					self.game.ball_move()
					self.game.player_move()
					await self.channel_layer.group_send(
						self.chatroom_name,
						{
							'type': 'game_data',
							'data': self.game.to_dict()
						}
					)
					self.game.player_idle()
					await asyncio.sleep(1 / 12)  # 12 frames per second

			#game end send status for tell all client close socket
			await self.channel_layer.group_send(
				self.chatroom_name,
				{
					'type': 'game_end',
					#the data should be stat of game
					'data': 'game_end'
				}
			)
		except asyncio.CancelledError:
			pass

	async def game_data(self, event):
		await self.send(text_data=json.dumps(event))

	async def game_end(self, event):
		await self.send(text_data=json.dumps(event))

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		player = self.game.select_player(self.user.username)
		if player:
			# print(text_data_json, file=sys.stderr)
			player.set_move(text_data_json['move'])
			# Handle received data here (e.g., updating player positions)