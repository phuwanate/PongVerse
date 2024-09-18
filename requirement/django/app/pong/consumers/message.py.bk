from dataclasses import dataclass, asdict
from .game_data import *
import random
import sys

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

@dataclass
class Message:
	type: str
	action: str

	def to_dict(self):
		return asdict(self)

@dataclass
class PrivateMessage(Message):
	def __init__(self, action: str):
		super().__init__(type='private', action=action)

@dataclass
class PrivateMessageError(PrivateMessage):
	message: str

	def __init__(self, message: str):
		super().__init__(action='error')
		self.message = message

@dataclass
class Player():
	name: str
	nickname: str
	status: str
	avatar: str = ''

	def __init__(self, name: str):
		self.name = name
		self.status = 'wait'
		self.nickname = None

@dataclass
class PrivateMessageRoom(PrivateMessage):
	inviter: Player
	invited: Player
	channel_name: str
	game_data: GameData

	def __init__(self, inviter: str, invited: str, ch=None):
		super().__init__(action='inviter')
		self.inviter = Player(name=inviter)
		self.invited = Player(name=invited)
		if not ch:
			ch = f'{self.type}_{self.inviter.name}_{self.invited.name}'
		self.channel_name = ch
		self.game_data = GameData()

	def get_player(self, username: str):
		if self.inviter.name == username:
			return self.inviter
		elif self.invited.name == username:
			return self.invited
		else:
			return None
	
	def get_another(self, player: Player):
		return self.invited if self.inviter is player else self.inviter

@dataclass
class TournamentMessage(Message):
	players: list[Player]
	game_datas: list[GameData] 
	match_index: int
	channel_name: str = 'tournament_channel'
	wait_match_time: int = 3

	def __init__(self):
		super().__init__(type='tournament', action='update')
		self.players = []
		self.game_datas = []
		self.match_index = -1

	def is_nickname_exist(self, nickname: str):
		for player in self.players:
			if player.nickname == nickname:
				return True
		return False

	def find_player(self, username: str):
		for player in self.players:
			if player.name == username:
				return player
		return None

	def set_another_player_win(self, username: str):
		game_data: GameData = self.game_datas[self.match_index]
		another_player = game_data.player_two if game_data.player_one.name == username else game_data.player_one
		game_data.winner = another_player

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
	
	def player_update_direction(self, username, direction):
		game_data: GameData = self.game_datas[self.match_index]
		if game_data.player_one.name == username:
			game_data.player_one.set_move(direction)
		elif game_data.player_two.name == username:
			game_data.player_two.set_move(direction)

	def is_all_ready(self):
		for player in self.players:
			if player.status != 'ready':
				return False
		return True

	def is_both_player_alive(self):
		# print (f'{RED}is_both_player_alive index: {self.match_index}{RESET}', file=sys.stderr)

		if self.match_index < 2:
			if self.players[self.match_index].status == 'quit' or self.players[self.match_index + 2].status == 'quit':
				return False
		elif self.match_index == 2:
			if self.game_datas[0].winner is not None:
				player = self.find_player(self.game_datas[0].winner.name)
				if player.status == 'quit':
					# print (f'{RED}is_both_player_alive: winner match 1 is quit{RESET}', file=sys.stderr)
					return False
			else:
				# print (f'{RED}is_both_player_alive: no winner in match 1{RESET}', file=sys.stderr)
				return False
			if self.game_datas[1].winner is not None:
				player = self.find_player(self.game_datas[1].winner.name)
				if player.status == 'quit':
					# print (f'{RED}is_both_player_alive: winner match 2 is quit{RESET}', file=sys.stderr)
					return False
			else:
				# print (f'{RED}is_both_player_alive: no winner in match 2{RESET}', file=sys.stderr)
				return False
		return True

	def set_winner_without_competition(self):
		index = self.match_index
		game_data = self.game_datas[index]
		player_one: Player = None
		player_two: Player = None
		if index < 2:
			player_one = self.find_player(self.players[index].name)
			player_two = self.find_player(self.players[index + 2].name)
		elif index == 2:
			if self.game_datas[0].winner is not None:
				player_one = self.find_player(self.game_datas[0].winner.name)
				# print(f'{RED}{player_one}{RESET}', file=sys.stderr)
			if self.game_datas[1].winner is not None:
				player_two = self.find_player(self.game_datas[1].winner.name)
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
