from django.db import models
from backend.models import CustomUser as User
from django.core.exceptions import ValidationError
# from django.utils import timezone

# Create your models here.

class Tournament(models.Model):
	is_finish = models.BooleanField(default=False)
	created = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created']

class Match(models.Model):
	is_finish = models.BooleanField(default=False)
	player_one = models.ForeignKey(User, related_name="player_one", null=True, blank=True, on_delete=models.CASCADE)
	player_two = models.ForeignKey(User, related_name="player_two", null=True, blank=True, on_delete=models.CASCADE)
	player_one_score = models.IntegerField(default=0)
	player_two_score = models.IntegerField(default=0)
	winner = models.ForeignKey(User, related_name="winner", null=True, blank=True, on_delete=models.CASCADE)
	MATCH_TYPE_CHOICES = [
		('private', 'Private'),
		('tournament', 'Tournament'),
	]
	match_type = models.CharField(max_length=10, choices=MATCH_TYPE_CHOICES, default='private')
	tournament = models.ForeignKey(Tournament, related_name="tournament", null=True, blank=True, on_delete=models.CASCADE)
	tour_match_round = models.IntegerField(default=0)
	created = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created']
	
	def save(self, *args, **kwargs):
		if self.match_type == "private" and self.tournament:
			raise ValidationError("Private match should not have tournament")
		if self.match_type == "tournament" and not self.tournament:
			raise ValidationError("Tournament match must have tournament")
		# if self.match_type == "tournament" and not self.tour_match_round:
		# 	raise ValidationError("Tournament match must have tour_match_round")
		super().save(*args, **kwargs)

	def __str__(self):
		return f"Match {self.id}: {self.player_one.username if self.player_one else 'None'} vs {self.player_two.username if self.player_two else 'None'} ({self.match_type}), the winner is {self.winner.username if self.winner else 'None'}"
