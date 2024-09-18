from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import sys
from collections import defaultdict
from .game_data import *

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