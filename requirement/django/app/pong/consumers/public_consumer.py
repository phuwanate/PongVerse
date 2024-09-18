from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
import json
from .message import *
from channels.db import database_sync_to_async
import asyncio
from pong.models import *

User = get_user_model()

class PublicConsumer(AsyncWebsocketConsumer):
	players: list[str] = []
	rooms: dict[str, GameMessage] = {} # keep PrivateMessageRoom
	rooms[TOURNAMENT] = GameMessage(TOURNAMENT, 'update')
	channel_public: str = 'pong_public_message'
	group_message: str = 'pong_group_message'
	tasks: dict[str, asyncio.Task] = {}

	async def connect(self):
		self.user: User = self.scope['user']
		self.session_id = self.scope['session'].session_key
		self.connection_id = shortuuid.uuid()
		print(f'{GREEN}{self.user.username}: {self.session_id} connect{RESET}', file=sys.stderr)

		await self.accept()
		await self.channel_layer.group_add(self.channel_public, self.channel_name)
		await self.request_tour_message()

	async def disconnect(self, close_code):
		# user: User = self.scope['user']
		if self.is_player(self.user.username):
			await self.quit()
		await self.channel_layer.group_discard(self.channel_public, self.channel_name)

	async def receive(self, text_data):
		# self.username = self.scope['user'].username
		data = json.loads(text_data)
		if data['action'] == 'join':
			await self.join(data)
		elif data['action'] == 'inviter':
			await self.inviter(data)
		elif data['action'] == 'invited':
			await self.invited(data)
		elif data['action'] == 'reject':
			await self.reject(data)
		elif data['action'] == 'request_tour_message':
			await self.request_tour_message()
		elif data['action'] == 'update':
			await self.update(data)
		elif data['action'] == 'playpong':
			await self.playpong(data)
		elif data['action'] == 'sendkey':
			await self.sendkey(data)
		elif data['action'] == 'finish':
			await self.finish(data)
		elif data['action'] == 'game_end':
			await self.game_end(data)
		elif data['action'] == 'quit':
			await self.quit(data)
		else:
			print (f'{RED}recive: {data}{RESET}', file=sys.stderr)

	async def pong_public_message(self, event: dict):
		await self.send(text_data=json.dumps(event))

	async def pong_group_message(self, event: dict):
		await self.send(text_data=json.dumps(event))

	async def pong_private_message(self, event: dict):
		message = {
			"type": "pong_private_message",
			"data": event
		}
		await self.send(text_data=json.dumps(message))

	def is_player(self, name: str):
		room: str
		player: Player
		for room in self.rooms:
			for player in self.rooms[room].players:
				if player.name == name:
					return True
		return False

################### sequent action #############################
	async def join(self, data: dict):
		# user: User = self.scope['user']
		# session_id = self.scope['session'].session_key
		room: GameMessage = self.rooms.get(TOURNAMENT)
		
		if room is None:
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Join: Room not found").to_dict())

		if 'nickname' not in data:
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Join: Tournament require nickname").to_dict())
		
		if self.is_player(self.user.username):
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Join: User unavailable").to_dict())

		if room.get_player_by_nickname(data['nickname']) is not None:
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Join: Nickname exist").to_dict())

		if len(room.players) >= 4:
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Join: Tournament is full").to_dict())

		player: Player = Player(name=self.user.username, avatar=self.user.get_avatar_url(), \
			session_id=self.session_id, connection_id=self.connection_id, nickname=data['nickname'])
		room.players.append(player)

		await self.channel_layer.group_add(room.channel_name, self.channel_name)
		await self.channel_layer.group_send(self.channel_public, {'type': self.channel_public, 'data': room.to_dict()})
		await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})
	
	async def inviter(self, data: dict):
		# print(f'{GREEN}inviter work{RESET}', file=sys.stderr)
		# user: User = self.scope['user']
		# session_id = self.scope['session'].session_key
		inviter: str = self.user.username
		invited: str = data['invited']

		if self.is_player(inviter) or self.is_player(invited):
			await self.pong_private_message(ErrorMessage(PRIVATE, "Inviter: User unavailable").to_dict())
		else:
			room: GameMessage = GameMessage(PRIVATE, "inviter")
			inviter_player: Player = Player(
				name=inviter, 
				session_id=self.session_id,
				connection_id=self.connection_id,
				avatar=self.user.get_avatar_url())
			room.players.append(inviter_player)
			invited_player: Player = Player(name=invited)
			room.players.append(invited_player)

			self.rooms[room.channel_name] = room
			await self.channel_layer.group_add(room.channel_name, self.channel_name)

			room.action = 'inviter'
			await self.channel_layer.group_send(self.channel_public,{'type': self.channel_public,'data': room.to_dict()})

			room.action = 'update'
			await self.channel_layer.group_send(room.channel_name,{'type': self.group_message,'data': room.to_dict()})

	async def invited(self, data: dict):
		# user: User = self.scope['user']
		# session_id = self.scope['session'].session_key
		room: GameMessage = self.rooms.get(data['channel_name'])
		
		if room is None:
			print(f'{RED}Invited: Room not found{RESET}', file=sys.stderr)
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Invited: Room not found").to_dict())
		
		invited: Player = room.get_player_by_name(self.user.username)
		if invited is None:
			print(f'{RED}Invite: can not get_player_by_name: {self.user.username}{RESET}', file=sys.stderr)
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Invited: Player not found").to_dict())

		invited.avatar = self.user.get_avatar_url()
		invited.session_id = self.session_id
		invited.connection_id = self.connection_id

		room.action = "invited"
		await self.channel_layer.group_send(self.channel_public, {'type': self.channel_public,'data': room.to_dict()})

		room.action = 'update'
		await self.channel_layer.group_add(room.channel_name, self.channel_name)

	async def reject(self, data: dict):
		# user: User = self.scope['user']
		room = self.rooms.get(data['channel_name'])
		room.action = 'reject'
		player: Player = room.get_player_by_name(self.user.username)

		if player is None:
			return await self.pong_private_message(ErrorMessage(PRIVATE, "Reject: error player is none").to_dict())
		
		player.status = 'quit'

		await self.channel_layer.group_add(room.channel_name, self.channel_name)
		await self.channel_layer.group_send(room.channel_name, {'type': self.group_message,'data': room.to_dict()})

		print(f'{GREEN}reject: room was reject by {user.username}{RESET}', file=sys.stderr)

	async def request_tour_message(self):
		await self.pong_private_message(self.rooms[TOURNAMENT].to_dict())

	async def update(self, data: dict):
		# print(f'{GREEN}update work{RESET}', file=sys.stderr)

		# user: User = self.scope['user']
		# session_id = self.scope['session'].session_key

		room: GameMessage = self.rooms.get(data['channel_name'])
		if room is None:
			print(f'{RED}update: can not get room{RESET}', file=sys.stderr)
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Update: Room not found").to_dict())

		if room.action != 'update':
			print(f'{RED}update: action is not update{RESET}', file=sys.stderr)
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Update: Action not update").to_dict())

		player: Player = room.get_player_by_session(self.session_id)
		if player is None:
			print(f'{RED}update: {self.user.username} player not found{RESET}', file=sys.stderr)
			return await self.pong_private_message(ErrorMessage(TOURNAMENT, "Update: Wrong session").to_dict())


		for p in data['players']:
			if p['session_id'] == player.session_id:				
				player.status = p['status']
		
		await self.channel_layer.group_send(room.channel_name,{'type': self.group_message,'data': room.to_dict()})

		# check all ready to change action
		if room.type == PRIVATE and room.is_private_ready():
			return await self.create_match(data)

		if room.type == TOURNAMENT and room.is_tournament_ready():
			room.shuffle_player()
			return await self.create_match(data)

	async def create_match(self, data: dict):

		room: GameMessage = self.rooms.get(data['channel_name'])

		if room is None:
			print(f'{RED}create_match: Room not found{RESET}', file=sys.stderr)
			return
		# end game should send game_end to client to tell client
		# when client receive game_end it send action game end to server
		# game_end will channel_layer.group_discard() all player to clean channel
		if room.match_index == 2:
			# send game_end here
			return await self.save(data)
		if room.match_index == 0 and room.type == PRIVATE:
			# send game_end here
			return await self.save(data)

		room.match_index += 1
		game_data: GameData = GameData()
		room.game_datas.append(game_data)

		if room.type == PRIVATE:
			player_one = room.players[0]
			player_two = room.players[1]
			game_data.player_one.set_name(player_one.name)
			game_data.player_one.set_nickname(player_one.nickname)
			game_data.player_two.set_name(player_two.name)
			game_data.player_two.set_nickname(player_two.nickname)
		elif room.match_index < 2:
			index = room.match_index
			player_one = room.players[index]
			player_two = room.players[index + 2]
			game_data.player_one.set_name(player_one.name)
			game_data.player_one.set_nickname(player_one.nickname)
			game_data.player_two.set_name(player_two.name)
			game_data.player_two.set_nickname(player_two.nickname)
		else:
			# expected index == 2
			# set game data
			if room.game_datas[0].winner is not None:
				game_data.player_one.set_name(room.game_datas[0].winner.name)
				game_data.player_one.set_nickname(room.game_datas[0].winner.nickname)
			else:
				game_data.player_one = None
			if room.game_datas[1].winner is not None:
				game_data.player_two.set_name(room.game_datas[1].winner.name)
				game_data.player_two.set_nickname(room.game_datas[1].winner.nickname)
			else:
				game_data.player_two = None
	
		if not room.is_both_player_alive():
			room.set_winner_without_competition()
			return	await self.create_match(data)

		room.action = 'waitmatch'
		#for update pongPublic
		if room.type == TOURNAMENT:
			await self.channel_layer.group_send(
				self.channel_public, {'type': self.channel_public,'data': room.to_dict()})
		#for player in room
		await self.channel_layer.group_send(
			room.channel_name, {'type': self.group_message,'data': room.to_dict()})
		asyncio.create_task(self.wait_to_begin_pong(data))

	async def wait_to_begin_pong(self, data: dict):
		room: GameMessage = self.rooms.get(data['channel_name'])
		if room is None:
			print(f'{RED}wait_to_begin_pong: Room not found{RESET}', file=sys.stderr)
			return
		await asyncio.sleep(room.wait_match_time)

		#check player quit when waitmatch
		if not room.is_both_player_alive():
			room.set_winner_without_competition()
			return	await self.create_match(data)

		# tell player to make pong table
		room.action = 'beginpong'
		await self.channel_layer.group_send(
			room.channel_name,{'type': self.group_message,'data': room.to_dict()})

	async def playpong(self, data: dict):
		room: GameMessage = self.rooms.get(data['channel_name'])
		# print(f'{GREEN}task pong should begin{RESET}', file=sys.stderr)
		if room.channel_name not in self.tasks:
			room.action = 'playpong'
			self.tasks[room.channel_name] = asyncio.create_task(self.send_game_data(room))

	async def sendkey(self, data: dict):
		# print(f'{RED}{data}{RESET}', file=sys.stderr)
		# user: User = self.scope['user']
		room: GameMessage = self.rooms.get(data['channel_name'])
		if room is None:
			print(f'{RED}sendkey: Room not found{RESET}', file=sys.stderr)
			return
		room.player_update_direction(self.user.username, data['direction'])

	async def finish(self, data:dict):
		room: GameMessage = self.rooms.get(data['channel_name'])
		if room is None:
			print(f'{RED}finish: Room not found{RESET}', file=sys.stderr)
			return
		# print (f'{GREEN} tournament finish should create new match', file=sys.stderr)
		if room is not None and room.channel_name in self.tasks:
			print (f'{RED} tournament finish should create new match', file=sys.stderr)
			del self.tasks[room.channel_name]
			await self.create_match(data)

	async def game_end(self, data:dict):
		await self.channel_layer.group_discard(data['channel_name'], self.channel_name)

	async def save(self, data: dict):
		print (f'{GREEN}Tournament finished should save match to database{RESET}', file=sys.stderr)
		
		room: GameMessage = self.rooms.get(data['channel_name'])
		if room is None:
			print(f'{RED}save: Room not found{RESET}', file=sys.stderr)
			return
			

		for game_data in room.game_datas:
			player_one_name = game_data.player_one.name if game_data.player_one is not None else 'None'
			player_one_score = game_data.player_one.score if game_data.player_one is not None else 0
			player_two_name = game_data.player_two.name if game_data.player_two is not None else 'None'
			player_two_score = game_data.player_two.score if game_data.player_two is not None else 0
			winner_name = game_data.winner.name if game_data.winner is not None else "None"
			print (f'{GREEN}{player_one_name} {player_one_score}: {player_two_name} {player_two_score}, the winner is {winner_name}{RESET}', file=sys.stderr)
		
		# end game should send game_end to client to tell client
		# when client receive game_end it send action game end to server
		# game_end will channel_layer.group_discard() all player to clean channel
		room.action = 'game_end'
		await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})

		# save database
		if room.type == TOURNAMENT:
			tournament:Tournament = await self.tour_save_database()
			for index, game_data in enumerate(room.game_datas):
				await self.private_save_database(game_data, match_type=TOURNAMENT, \
					tournament=tournament, match_index=index)
				if index == 2 and room.game_datas[2].winner is not None:
					tournament.is_finish = True
					await self.tour_save(tournament)
		elif room.type == PRIVATE:
			await self.private_save_database(room.game_datas[0])
		else:
			print(f'{RED}save: unknow type to save{RESET}', file=sys.stderr)

		# should check room type, delete if room type private else clean up
		# if type tournament must send boardcast to update new tournament
		if room.type == PRIVATE:
			del self.rooms[room.channel_name]
		if room.type == TOURNAMENT:
			room.cleanup()
			await self.channel_layer.group_send(
				self.channel_public,
				{
					'type': self.channel_public,
					'data': room.to_dict()
				}
			)

	async def quit(self, data: dict=None):
		# user: User = self.scope['user']
		# session_id = self.scope['session'].session_key

		room: GameMessage = None
		if data is not None:
			room = self.rooms.get(data['channel_name'])
		else:
			for key in self.rooms:
				if self.rooms[key].get_player_by_connection_id(self.connection_id) is not None:
					room = self.rooms[key]
					break

		if room is None:
			# private pong on invited quit it can not get room by session or connection_id
			for key in self.rooms:
				if self.rooms[key].get_player_by_name(self.user.username) is not None:
					room = self.rooms[key]
					break
			if room is not None and room.action == "inviter":	
				room.action = 'reject'
				room.players[1].status = 'quit'
				await self.channel_layer.group_send(self.channel_public, \
					{'type': self.channel_public,'data': room.to_dict()})
			else:
				print(f'{RED}quit: can not get room{RESET}', file=sys.stderr)			
			return
			
		player: Player = room.get_player_by_session(self.session_id)
		if player is None:
			print(f'{RED}quit: player not found{RESET}', file=sys.stderr)
			return

		player.status = 'quit'
		
		if room.type == PRIVATE:
			await self.quit_private(room, self.session_id)
		else:		
			await self.quit_tournament(room, player, self.user)

		await self.channel_layer.group_discard(room.channel_name, self.channel_name)

	async def quit_private(self, room: GameMessage, session_id: str):
		anothor_player: Player = room.get_another_player_by_session(session_id)
		if anothor_player is None:
			print(f'{RED}quit: anothor_player not found{RESET}', file=sys.stderr)
			return

		if anothor_player.session_id is None:
			room.action = 'reject'
			await self.channel_layer.group_send(
				self.channel_public,
				{
					'type': self.channel_public,
					'data': room.to_dict()
				}
			)

			# await self.reject(data)
			del self.rooms[room.channel_name]
			print(f'{GREEN}quit: room delete with out invited{RESET}', file=sys.stderr)
		# this is last player in room
		elif anothor_player.status == 'quit':
			del self.rooms[room.channel_name]
			print(f'{GREEN}quit: all player quit room was delete{RESET}', file=sys.stderr)
		# have another player in room, tell him to quit
		else:
			room.action = 'quit'
			await self.channel_layer.group_send(
				room.channel_name,
				{
					'type': self.group_message,
					'data': room.to_dict()
				}
			)

	async def quit_tournament(self, room: GameMessage, player: Player, user: User):
		print(f'{RED}{user.username} quit unexpected{RESET}', file=sys.stderr)

		if room.action == 'update':
			room.players.remove(player)
			await self.channel_layer.group_send(self.channel_public, {'type': self.channel_public, 'data': room.to_dict()})
			await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})
		else:
			# check player is next or now game
			if room.is_player_in_match(user.username):
				# if game task is loop, stop it then delete it when tour_finish() work
				# task.cancel() it raise error, handle by send action finish in task exception
				if room.channel_name in self.tasks:
					self.tasks[room.channel_name].cancel()
				else:
					print (f'{GREEN}no task to cancel, it check again when create task{RESET}', file=sys.stderr)
				room.set_another_player_win(user.username)
			else:
				print (f'{GREEN}{user.username} not in present match it will check when next match create{RESET}', file=sys.stderr)

################## play pong ############################
	async def send_game_finish(self, room: GameMessage):
		room.action = 'finish'
		await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})

	async def new_turn(self, game_data: GameData, room: GameMessage):
		game_data.init_game()
		await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})
		await asyncio.sleep(3)
		game_data.game_loop = True

	async def send_game_data(self, room: GameMessage):
		# print (f'{GREEN}{room}', file=sys.stderr)	
		game_data: GameData = room.game_datas[room.match_index]
		wait_task: asyncio.Task = None
		try:
			while game_data.end_game() is None:
				if game_data.game_loop:
					if wait_task is not None:
						wait_task = None
					game_data.ball_move()
				else:
					if wait_task is None:
						wait_task = asyncio.create_task(self.new_turn(game_data, room))
				game_data.player_move()
				await self.channel_layer.group_send(room.channel_name, {'type': self.group_message, 'data': room.to_dict()})
				game_data.player_idle()
				await asyncio.sleep(1 / 12)
			#game finish send status for tell all client close socket
			await self.send_game_finish(room)
		except asyncio.CancelledError:
			await self.send_game_finish(room)

####################### database #####################################
	@database_sync_to_async
	def tour_save_database(self):
		return Tournament.objects.create()

	@database_sync_to_async
	def tour_save(self, tournament: Tournament):
		tournament.save()

	@database_sync_to_async
	def private_save_database(self, game_data: GameData, \
		match_type: str='private', tournament: Tournament=None, match_index: int=0):
		match: Match = Match()
		match.match_type=match_type
		if game_data.player_one is not None:
			match.player_one = User.objects.get(username=game_data.player_one.name)
			match.player_one_score = game_data.player_one.score
		if game_data.player_two is not None:
			match.player_two = User.objects.get(username=game_data.player_two.name)
			match.player_two_score = game_data.player_two.score
		if game_data.winner is not None:
			match.winner = User.objects.get(username=game_data.winner.name)
			match.is_finish = True
		if match.match_type == 'tournament':
			match.tournament = tournament
			match.tour_match_round = match_index
		match.save()
		print (f'{GREEN}{match}{RESET}', file=sys.stderr)
