# Generated by Django 5.0.6 on 2024-08-23 12:42

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='PreRegister',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=150, unique=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('avatar', models.ImageField(blank=True, default='avatars/default.png', null=True, upload_to='avatars')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(max_length=150, unique=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('score', models.IntegerField(default=0)),
                ('avatar', models.ImageField(blank=True, default='avatars/default.png', null=True, upload_to='avatars')),
                ('is_online', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
                ('totp_secret', models.CharField(blank=True, max_length=64, null=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Friendship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='from_users', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='to_users', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('from_user', 'to_user')},
            },
        ),
        migrations.AddField(
            model_name='customuser',
            name='friend',
            field=models.ManyToManyField(through='backend.Friendship', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='ActivationCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='backend.preregister')),
            ],
        ),
        migrations.CreateModel(
            name='RegenerateCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=128, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='BlockedList',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(auto_now_add=True, null=True)),
                ('blocked', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='blocked', to=settings.AUTH_USER_MODEL)),
                ('blocker', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='blockers', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('blocker', 'blocked')},
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(auto_now_add=True, null=True)),
                ('accepter', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='accpeters', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='senders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('sender', 'accepter')},
            },
        ),
    ]
