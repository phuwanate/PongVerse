from django.http import JsonResponse
from django.core import serializers
from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.http import Http404
from .models import *
from django.db.models import Q
import sys
from django.views.decorators.cache import cache_control
from backend.views import jwt_manual_validate
from django.conf import settings

User = get_user_model()
# Create your views here.

@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def index(request):
    return render(request, "pong/test.html")

def waitmatch(request):
	return render(request, "pong/waitmatch.html")

def match_history(request, user_id):
	if request.user.is_authenticated:
		if settings.ALLOW_API_WITHOUT_JWT == False:
			err = jwt_manual_validate(request)
			if err is not None:
				return JsonResponse(err, status=401)
		try:
			user: User = User.objects.get(id=user_id)
			matches: list[Match] = Match.objects.filter(Q(player_one=user) | Q(player_two=user))[:5]
			data = []
			for match in matches:
				outcome: str
				if match.winner is None:
					outcome = 'draw'
				else:
					outcome = 'win' if user.username == match.winner.username else 'lose'
				opponentPlayer: str
				if match.player_one is None or match.player_two is None:
					opponentPlayer = 'None'
				else:
					opponentPlayer = match.player_two.username if match.player_one.username == user.username else match.player_one.username
				
				data.append({
						'id': match.id,
						'matchType': match.match_type,
						'date': match.created,
						'opponentPlayer': opponentPlayer,
						'outcome': outcome
				})
			return JsonResponse(data, safe=False,  status=200)
		except User.DoesNotExist:
			return JsonResponse({'error: User not found'}, safe=False, status=400)
	else:
		return JsonResponse({'error': 'User is not logged in'}, status=401)

def statictis(request, user_id):
	if request.user.is_authenticated:
		if settings.ALLOW_API_WITHOUT_JWT == False:
			err = jwt_manual_validate(request)
			if err is not None:
				return JsonResponse(err, status=401)
		try:
			user: User = User.objects.get(id=user_id)
			match_count = Match.objects.filter(Q(player_one=user) | Q(player_two=user)).count()
			match_win = Match.objects.filter(winner=user).count()
			match_draw = Match.objects.filter(Q(winner=None) & (Q(player_one=user) | Q(player_two=user))).count()
			match_lose = match_count - match_win - match_draw

			data = {
				'id': user.id,
				'username': user.username,
				'match': match_count,
				'win': match_win,
				'draw': match_draw,
				'lose': match_lose
			}
			return JsonResponse(data, safe=False,  status=200)
		except User.DoesNotExist:
			return JsonResponse({'error: User not found'}, safe=False, status=400)
	else:
		return JsonResponse({'error': 'User is not logged in'}, status=401)
