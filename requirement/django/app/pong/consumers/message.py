from dataclasses import dataclass, asdict
from .game_data import *
import random
import sys
import shortuuid

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

PRIVATE = 'private'
TOURNAMENT = 'tournament'

@dataclass
class Message:
	type: str
	action: str

	# def __init__(self, type: str, action: str):
	# 	self.type = type
	# 	self.action = action

	def to_dict(self):
		return asdict(self)

@dataclass
class ErrorMessage(Message):
	message: str

	def __init__(self, type: str, message: str):
		super().__init__(type=type, action="error")
		self.message = message
@dataclass
class Player():
	name: str
	nickname: str
	status: str
	avatar: str
	session_id: str
	connection_id: str

	def __init__(self, name: str, avatar: str=None, session_id: str=None, \
		connection_id: str=None, nickname: str=None):
		self.status = 'wait'
		self.name = name
		self.avatar = avatar
		self.session_id = session_id
		self.connection_id = connection_id
		self.nickname = nickname if nickname is not None else name

@dataclass
class GameMessage(Message):
	players: list[Player]
	game_datas: list[GameData]
	match_index: int
	channel_name: str
	wait_match_time: int = 10

	def __init__(self, type: str, action: str):
		super().__init__(type=type, action=action)
		self.players = []
		self.game_datas = []
		self.match_index = -1
		self.channel_name = TOURNAMENT if self.type == TOURNAMENT else shortuuid.uuid()

	def get_player_by_name(self, name: str):
		for player in self.players:
			if player.name == name:
				return player
		return None

	def get_player_by_session(self, session_id: str):
		for player in self.players:
			if player.session_id == session_id:
				return player
		return None

	def get_player_by_nickname(self, nickname: str):
		for player in self.players:
			if player.nickname == nickname:
				return player
		return None

	def get_player_by_connection_id(self, connection_id: str):
		for player in self.players:
			if player.connection_id == connection_id:
				return player
		return None

	# use for private only
	def get_another_player_by_session(self, session_id: str):
		if self.type == PRIVATE:
			return self.players[1] if self.players[0].session_id == session_id else self.players[0]
		return None

	def is_private_ready(self):
		return self.players[0].status == 'ready' and self.players[1].status == "ready"

	def is_tournament_ready(self):
		if len(self.players) != 4:
			return False
		for player in self.players:
			if player.status != 'ready':
				return False
		return True

	def player_update_direction(self, username, direction):
		game_data: GameData = self.game_datas[self.match_index]
		if game_data.player_one.name == username:
			game_data.player_one.set_move(direction)
		elif game_data.player_two.name == username:
			game_data.player_two.set_move(direction)

	def is_both_player_alive(self):
		# print (f'{RED}is_both_player_alive index: {self.match_index}{RESET}', file=sys.stderr)
		if self.type == PRIVATE:
			if self.players[0].status == 'quit' or self.players[1].status == 'quit':
				return False
		elif self.match_index < 2:
			if self.players[self.match_index].status == 'quit' or self.players[self.match_index + 2].status == 'quit':
				return False
		elif self.match_index == 2:
			if self.game_datas[0].winner is not None:
				player = self.get_player_by_name(self.game_datas[0].winner.name)
				if player.status == 'quit':
					# print (f'{RED}is_both_player_alive: winner match 1 is quit{RESET}', file=sys.stderr)
					return False
			else:
				# print (f'{RED}is_both_player_alive: no winner in match 1{RESET}', file=sys.stderr)
				return False
			if self.game_datas[1].winner is not None:
				player = self.get_player_by_name(self.game_datas[1].winner.name)
				if player.status == 'quit':
					# print (f'{RED}is_both_player_alive: winner match 2 is quit{RESET}', file=sys.stderr)
					return False
			else:
				# print (f'{RED}is_both_player_alive: no winner in match 2{RESET}', file=sys.stderr)
				return False
		return True

	def is_player_in_match(self, username: str):
		game_data: GameData = self.game_datas[self.match_index]
		# return game_data.player_one.name == username or game_data.player_two.name == username
		if game_data.player_one is not None:
			if game_data.player_one.name == username:
				return True
		if game_data.player_two is not None:
			if game_data.player_two.name == username:
				return True
		return False

	def set_another_player_win(self, username: str):
		game_data: GameData = self.game_datas[self.match_index]
		another_player = game_data.player_two if game_data.player_one.name == username else game_data.player_one
		game_data.winner = another_player

	def set_winner_without_competition(self):
		index = self.match_index
		game_data = self.game_datas[index]
		player_one: Player = None
		player_two: Player = None

		if self.type == PRIVATE:
			player_one = self.get_player_by_name(self.players[0].name)
			player_two = self.get_player_by_name(self.players[1].name)
		elif index < 2:
			player_one = self.get_player_by_name(self.players[index].name)
			player_two = self.get_player_by_name(self.players[index + 2].name)
		elif index == 2:
			if self.game_datas[0].winner is not None:
				player_one = self.get_player_by_name(self.game_datas[0].winner.name)
				# print(f'{RED}{player_one}{RESET}', file=sys.stderr)
			if self.game_datas[1].winner is not None:
				player_two = self.get_player_by_name(self.game_datas[1].winner.name)
				# print(f'{GREEN}{player_two}{RESET}', file=sys.stderr)

		if player_one is not None and player_two is not None:
			if player_one.status == 'quit' and player_two.status == 'quit':
				game_data.winner = None
			elif player_one.status == 'quit':
				self.set_another_player_win(player_one.name)
			elif player_two.status == 'quit':
				self.set_another_player_win(player_two.name)
		elif player_one is not None:
			if player_one.status == 'quit':
				game_data.winner = None
			else:
				game_data.winner = game_data.player_one
		elif player_two is not None:
			if player_two.status == 'quit':
				game_data.winner = None
			else:
				game_data.winner = game_data.player_two
		else:
			game_data.winner = None

	def shuffle_player(self):
		random.shuffle(self.players)

	def cleanup(self):
		self.action = 'update'
		self.players.clear()
		self.game_datas.clear()
		self.match_index = -1
