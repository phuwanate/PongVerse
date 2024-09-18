from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
from django.conf import settings

############################## For Custom Auth User ##############################
class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=15, unique=True)
    email = models.EmailField(max_length=120, blank=True, null=True)
    score = models.IntegerField(default=0)
    avatar = models.ImageField(upload_to='avatars', blank=True, null=True, default='avatars/default.png')
    is_online = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    friend = models.ManyToManyField('self', through='Friendship')
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    
    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
    
    def add_friend(self, friend_user):
        if friend_user == self:
            raise ValidationError("Users cannot be friends with themselves.")
        
        Friendship.objects.create(from_user=self, to_user=friend_user)
        Friendship.objects.create(from_user=friend_user, to_user=self)
    
    def get_avatar_url(self):
        avatar_path = str(self.avatar)
        if avatar_path.startswith("http"):
            return avatar_path
        return f'{settings.MEDIA_URL}{avatar_path}'
############################## For Custom Auth User ##############################

############################## Notification ##############################
class Notification(models.Model):
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, related_name='senders')
    accepter = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, related_name='accpeters')
    date = models.DateTimeField(auto_now_add=True, null=True)
    class Meta:
        unique_together = ('sender', 'accepter')

    def __str__(self):
        return f"{self.sender.username} -> {self.accepter.username}"
############################## Notification ##############################

############################## Block List ##############################
class BlockedList(models.Model):
    blocker = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, related_name='blockers')
    blocked = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, related_name='blocked')
    date = models.DateTimeField(auto_now_add=True, null=True)
    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} -> {self.blocked.username}"

############################## Block List ##############################

############################## Friend List ##############################
class Friendship(models.Model):
    from_user = models.ForeignKey(CustomUser, related_name='from_users', on_delete=models.CASCADE, null=True)
    to_user = models.ForeignKey(CustomUser, related_name='to_users', on_delete=models.CASCADE, null=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username}"
############################## Friend List ##############################

class PreRegister(models.Model):
    username = models.CharField(max_length=15, unique=True)
    email = models.EmailField(max_length=120, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars', blank=True, null=True, default='avatars/default.png')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + datetime.timedelta(hours=24)  # Code valid for 24 hours
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

class ActivationCode(models.Model):
    user = models.OneToOneField(PreRegister, on_delete=models.CASCADE)
    code = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + datetime.timedelta(hours=1)  # Code valid for 1 hours
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at
    
class RegenerateCode(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    code = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + datetime.timedelta(seconds=180)  # Code valid for 3 mins
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at