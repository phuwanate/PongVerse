import os
import json
from django.urls import reverse
from django.conf import settings
from .models import Notification, BlockedList, PreRegister, ActivationCode, RegenerateCode
from django.shortcuts import render, redirect
from django.middleware.csrf import get_token, rotate_token
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate, login, logout, get_user_model
from authlib.integrations.requests_client import OAuth2Session
from django.contrib.auth.hashers import make_password, check_password

import io
import jwt
import pyotp
import qrcode
from jwt.exceptions import ExpiredSignatureError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

import secrets
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

User = get_user_model()

class CustomRefreshToken(RefreshToken):
    @property
    def access_token(self):
        token = super().access_token
        CustomUser = get_user_model()
        # Add custom claims
        token['user_id'] = self['user_id']
        user = CustomUser.objects.get(id=self['user_id'])
        token['username'] = user.username
        token['score'] = user.score

        return token

def two_factor_auth_qr(request):
    return render(request, 'backend/two_factor_auth_qr.html')

def two_factor_auth(request):
    return render(request, 'backend/two_factor_auth.html')

# def regen_code(request):
#     return render(request, 'backend/regen_qr_code.html')

def get_csrf_token_and_session_id(request):
    csrf_token = get_token(request)
    session_id = request.session.session_key
    return JsonResponse({'csrf_token': csrf_token, 'sessionid': session_id}, status=200)


def getUserProfile(User, user, owner, func):
    blocker = User.objects.get(id=user.id)
    try:
        if func == 'blocklist':
            if BlockedList.objects.filter(blocked=owner, blocker=blocker).exists():
                return
        else:
            if BlockedList.objects.filter(blocked=owner, blocker=blocker).exists() or BlockedList.objects.filter(blocked=blocker, blocker=owner).exists():
                return
    except BlockedList.DoesNotExist:
        pass
    return( {
        'id': user.id,
        'username': user.username,
        'avatar': user.get_avatar_url(),
        'is_online': user.is_online
    })

def getUserNotification(User, noti, request):
    try:
        user = User.objects.get(id=noti.sender.id)
        blockedlist = BlockedList.objects.get(blocked=request.user, blocker=user)
        if blockedlist:
            return None
    except BlockedList.DoesNotExist:
        pass 
    except User.DoesNotExist:
        return ({'error': 'User not found'})
    return( {
        'noti_id': noti.id,
        'user_id': user.id,
        'username': user.username, 
        'avatar': user.get_avatar_url(),
        'is_online': user.is_online
    })

def get_token_for_authenticated_user(request):
    if request.user.is_authenticated:
        refresh = CustomRefreshToken.for_user(request.user)
        return ({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

def update_token(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            data = json.loads(request.body)
            new_token = data.get('access')
            request.session['access_token'] = new_token
            return JsonResponse({'message': 'Update success'}, status=201)
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def jwt_manual_validate(request):
    try:
        auth = JWTAuthentication()
        header = auth.get_header(request)
        if header is None:
            return ({'error': 'JWT token is missing'})
        raw_token = auth.get_raw_token(header)
        jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.SIMPLE_JWT['ALGORITHM']])
    except ExpiredSignatureError:
        return ({'error': 'Token has expired'})
    except Exception:
        return ({'error': 'Authentication failed'})
    return

def generate_totp_secret(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            user = request.user
            if user.totp_secret is None:
                #User login to website first time
                totp_secret = pyotp.random_base32()
                user.totp_secret = totp_secret
                user.save()
            else:
                totp_secret = user.totp_secret
            totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
                user.username, issuer_name="Transcendence"
            )

            qr = qrcode.make(totp_uri)
            stream = io.BytesIO() #creates an in-memory binary stream to store the QR code image
            qr.save(stream, 'PNG') #saves the QR code image into the stream in PNG format.
            stream.seek(0) #moves the stream pointer to the beginning, preparing it for reading.
            return HttpResponse(stream.getvalue(), content_type='image/png')
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def verify_totp(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            try:
                data = json.loads(request.body)
                otp = data.get('otp')
            except json.JSONDecodeError :
                return JsonResponse({'error':"Invalid OTP. Please try again."}, status=401)
            user = request.user
            totp = pyotp.TOTP(user.totp_secret)
            if totp.verify(otp):
                jwt_token = get_token_for_authenticated_user(request)
                request.session['access_token'] = jwt_token['access']
                request.session['refresh_token'] = jwt_token['refresh']
                access_token = request.session['access_token']
                refresh_token = request.session['refresh_token']
                user.is_online = True
                user.save()
                rotate_token(request)
                return JsonResponse({
                                'message': 'Login success',
                                'owner_id': user.id,
                                'refresh': refresh_token,
                                'access': access_token,
                                }, status=200)
            else:
                logout(request)
                return JsonResponse({'error':"Invalid OTP. Please try again."}, status=401)
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def jwt_and_auth_validate(request, owner_id):
    if settings.ALLOW_API_WITHOUT_JWT == False:
        err = jwt_manual_validate(request)
        if err is not None:
            return err
    if settings.ALLOW_API_WITHOUT_AUTH == False:
        if request.user.id != int(owner_id):
            return ({'error': 'Session mismatch'})
    return

#1.1 POST /api/auth/login
def UserLogin(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        if request.user.is_authenticated:
            return redirect ("frontend:dashboard")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            if settings.ALLOW_API_WITHOUT_JWT == False:
                login(request, user)
                user.save()
                if (user.totp_secret is None):
                    return JsonResponse({'message': '2fa-qr'}, status=200)
                else:
                    return JsonResponse({'message': '2fa'}, status=200)
            else:
                login(request, user)
                user.is_online = True
                user.save()
                return JsonResponse({
                            'message': 'Login success',
                            'owner_id': user.id
                            }, status=200)
        else:
            return JsonResponse({'error': 'Invalid username or password'}, status=401)    
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def UserRegister(request, preUser, password):
        username = preUser.username
        password = password
        avatar = preUser.avatar
        email = preUser.email
        
        preUser.delete()
        if not username or not password:
            return JsonResponse({'error': 'Both username and password are required'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)

        user = User.objects.create_user(username=username, password=password, email=email)
        if avatar:
            user.avatar = avatar
        login(request, user)
        user.is_online = True
        user.save()
        return JsonResponse({'success': True, 'redirect_url': reverse('two_factor_auth_qr')}, status=201)

#1.3 POST /api/auth/logout
def UserLogout(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            if settings.ALLOW_API_WITHOUT_JWT == False:
                err = jwt_manual_validate(request)
                if err is not None:
                    return JsonResponse(err, status=401)
            user = User.objects.get(id=request.user.id)
            user.is_online = False
            user.save()
            logout(request)
            return JsonResponse({'message': 'Logout success'}, status=200)
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#1.4 POST /api/auth/login42
def UserLogin42(request):
    client = OAuth2Session(settings.CLIENT_ID, redirect_uri=settings.REDIRECT_URI)
    authorization_url, state = client.create_authorization_url(settings.AUTHORIZATION_URL)
    request.session['oauth_state'] = state
    return redirect(authorization_url)

def callback(request):
    if 'oauth_token' in request.session:
        return redirect ("frontend:dashboard")
    
    stored_state = request.session.get('oauth_state')
    received_state = request.GET.get('state')
    if stored_state != received_state:
        return JsonResponse({'error': 'State mismatch. Possible CSRF attack.'}, status=400)
    
    client = OAuth2Session(settings.CLIENT_ID, 
                           state=request.session['oauth_state'], 
                           redirect_uri=settings.REDIRECT_URI
                           )
    # Need to fetch access token for get 42User's Profile
    request.session['oauth_token'] = client.fetch_token(settings.TOKEN_URL, 
                               client_secret=settings.CLIENT_SECRET, 
                               authorization_response=request.build_absolute_uri()
                               )
    user_info = client.get(settings.PROFILE_URL).json()
    username = user_info['login']
    user_id = user_info['id']
    email = user_info['email']
    avatar = user_info['image']['link']
    hash_password = make_password(f'{username}{user_id}')

    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.backend = 'django.contrib.auth.backends.ModelBackend'
    else:
        user = User.objects.create_user(username=username, password=hash_password, email=email, avatar=avatar)
    if settings.ALLOW_API_WITHOUT_JWT == False:
        login(request, user)
        user.save()
        if (user.totp_secret is None):
            return redirect (two_factor_auth_qr)
        else:
            return redirect (two_factor_auth)
    else:
        login(request, user)
        user.is_online = True
        user.save()
        return redirect ("frontend:dashboard")

#2.1.1 /api/users/:user_id/:owner_id/profile
def UserProfile(request, user_id, owner_id):
    if request.method == 'GET':
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    try:
                        user = User.objects.get(id = user_id)
                        owner = User.objects.get(id = owner_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)     
                    avatar_url = user.get_avatar_url()
                    if not avatar_url.startswith("https://cdn.intra.42.fr"):
                        avatar_url = f'{settings.MEDIA_ROOT}/{user.avatar}'
                        if not (avatar_url and os.path.exists(avatar_url)):
                            user.avatar = 'avatars/default.png'
                            user.save()
                            # return JsonResponse({'error': 'Not Found the avatar file'}, status=404) 
                    payload = getUserProfile(User=User, user=user, owner=owner, func='general')
                    if payload is None:
                        return JsonResponse({'error': 'User was blocked'}, status=401)
                    return JsonResponse(payload, status=200, safe=False)
            else:
                return JsonResponse({'error': 'User is not logged in'}, status=401)  
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.1.2 POST /api/users/update_avatar
def UpdateUserAvatar(request):
    if request.method == 'POST':
        if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
            if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                user_id = request.POST.get('user_id')
                if settings.ALLOW_API_WITHOUT_JWT == False:
                    err = jwt_and_auth_validate(request, user_id)
                    if err is not None:
                        return JsonResponse(err, status=401)
                try:
                    user = User.objects.get(id = user_id)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)
                avatar = request.FILES.get('avatar')
                if avatar:
                    old_avatar_path = f'{settings.MEDIA_ROOT}/{user.avatar}'
                    if user.avatar != 'avatars/default.png' and os.path.isfile(old_avatar_path):
                        os.remove(old_avatar_path)
                    user.avatar = avatar
                    user.save()
                    return JsonResponse({
                            'message': 'User update avatar success',
                            'avatar_url': user.get_avatar_url()
                            }, status=201)
                else:
                    return JsonResponse({'error': 'Not Found the avatar file'}, status=404) 
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.1.5 POST /api/users/block
def BlockUser(request):
    if request.method == 'POST':
            data = json.loads(request.body)
            owner_id = data.get('owner_id')
            user_id = data.get('user_id')
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    if (request.user.id == user_id):
                        return JsonResponse({'error': 'Users try to block themselves'}, status=400)
                    try:    
                        blocker = User.objects.get(id=owner_id)
                        blocked = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)  
                    try:
                        BlockedList.objects.get(blocker=blocked, blocked=blocker)
                        return JsonResponse({'error': 'Users is blocked now'}, status=400)
                    except BlockedList.DoesNotExist:
                        pass
                    try:
                        BlockedList.objects.get(blocker=blocker, blocked=blocked)
                        return JsonResponse({'error': 'Users is blocker now'}, status=400)
                    except BlockedList.DoesNotExist:
                        blockedlist = BlockedList(blocker=blocker, blocked=blocked)
                        blockedlist.save()
                        return JsonResponse({'message': 'Block user success'}, status=200)
            else:
                return JsonResponse({'message': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
#2.1.7 POST /api/users/unblock
def UnblockUser(request):
    if request.method == 'POST':
            data = json.loads(request.body)
            owner_id = data.get('owner_id')
            user_id = data.get('user_id')
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    if (request.user.id == user_id):
                        return JsonResponse({'error': 'Users try to unblock themselves'}, status=400) 
                    try:
                        blocker = User.objects.get(id=request.user.id)
                        blocked = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)
                    try:
                        BlockedList.objects.get(blocker=blocked, blocked=blocker)
                        return JsonResponse({'error': 'Blocked users cannot unblock blocker'}, status=400)
                    except BlockedList.DoesNotExist:
                        pass
                    try:
                        blocked_list = BlockedList.objects.get(blocker=blocker, blocked=blocked)
                        blocked_list.delete()
                        return JsonResponse({'message': 'Unblock success'}, status=200)
                    except BlockedList.DoesNotExist:
                        return JsonResponse({'error': 'BlockedList not found'}, status=404)
            else:
                return JsonResponse({'message': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.1.6 GET: /api/users/user_id/blocked_list
def GetUserBlockedList(request, user_id):
    if request.method == 'GET':
        if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
            if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, user_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)
                try:
                    blocked_set = BlockedList.objects.filter(blocker=user)
                except BlockedList.DoesNotExist:
                    return JsonResponse({'error': 'Blockedlist not found'}, status=404)
                blocked_list = [getUserProfile(User=User, user=blockeds.blocked, owner=user, func='blocklist') for blockeds in blocked_set]
                if len(blocked_list) == 0:
                    return JsonResponse({'error': 'BlockedList not found'}, status=404)
                return JsonResponse(blocked_list, status=200 , safe=False)
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.2.1 GET /api/users/user_id/friends
def GetAllFriends(request, user_id):
    if request.method == 'GET':
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, user_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    try:
                        user = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)
                    friend_set = user.friend.all()
                    friends = []
                    for friend in friend_set:
                        profile = getUserProfile(User=User, user=friend, owner=user, func='general')
                        if profile is not None:
                            friends.append(profile)
                    if len(friends) == 0:
                        return JsonResponse({'error': 'Friends not found'}, status=404)
                    return JsonResponse(friends, status=200 , safe=False)
            else:
                return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.2.2 GET: /api/users/user_id/friends/find_new
def FindNewFriends(request, user_id):
    if request.method == 'GET':
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, user_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    try:
                        user = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)
                    not_friend_set =  User.objects.exclude(id=user_id).exclude(friend=user)
                    not_friends = []
                    for not_friend in not_friend_set:
                        if (not Notification.objects.filter(sender=user, accepter=not_friend).exists() and
                    not Notification.objects.filter(sender=not_friend, accepter=user).exists()):
                            profile = getUserProfile(User=User, user=not_friend, owner=user, func='general')
                            if profile is not None:
                                not_friends.append(profile)
                    if len(not_friends) == 0:
                        return JsonResponse({'error': 'Not found other users'}, status=404)
                    return JsonResponse(not_friends, status=200 , safe=False)
            else:
                return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
#2.3.1 GET /api/users/user_id/notifications
def GetNotifications(request, user_id):
    if request.method == 'GET':
        if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
            if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, user_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    return JsonResponse({'error': 'User not found'}, status=404)
                try:
                    requester_set = Notification.objects.filter(accepter=user)
                except Notification.DoesNotExist:
                    return JsonResponse({'error': 'Notifications not found'}, status=404)
                requesters = []
                for requester in requester_set:
                    profile = getUserNotification(User=User, noti=requester, request=request)
                    if profile is not None:
                        requesters.append(profile)
                if len(requesters) == 0:
                    return JsonResponse({'error': 'Notifications not found'}, status=404)
                return JsonResponse(requesters, status=200 , safe=False)
        else:
            return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
#2.3.2 POST: /api/users/friends/accept
def AcceptFriend(request):
    if request.method == 'POST':
            data = json.loads(request.body)
            owner_id = data.get('owner_id')
            user_id = data.get('user_id')
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    if (request.user.id == user_id):
                        return JsonResponse({'error': 'Users try to accept friend to themselves'}, status=400) 
                    try:
                        accepter = User.objects.get(id=owner_id)
                        sender = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)
                    try:
                        blockedlist = BlockedList.objects.get(blocked=accepter, blocker=sender)
                        if blockedlist:
                            return JsonResponse({'error': 'User was blocked'}, status=401)
                    except BlockedList.DoesNotExist:
                        pass          
                    if sender in accepter.friend.all():
                        return JsonResponse({'error': 'User was already be friends'}, status=400)      
                    try:
                        notification = Notification.objects.get(sender=sender, accepter=accepter)
                        notification.delete()
                        accepter.add_friend(sender)
                        accepter.save()
                        return JsonResponse({'message': 'Accept friend success'}, status=201)
                    except Notification.DoesNotExist:
                        return JsonResponse({'error': 'Notification was not found'}, status=404)
            else:
                return JsonResponse({'error': 'User is not logged in'}, status=401)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.3.3 POST: /api/users/notifications/friend_request 
def SendFriendRequest(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            owner_id = data.get('owner_id')
            user_id = data.get('user_id')
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)
                    if (owner_id == user_id):
                        return JsonResponse({'error': 'Users try to send request to themselves'}, status=400) 
                    accepter = User.objects.get(id = user_id)
                    sender = User.objects.get(id = owner_id)
                    try:
                        blockedlist = BlockedList.objects.get(blocked=sender, blocker=accepter)
                        if blockedlist:
                            return JsonResponse({'error': 'User was blocked'}, status=401)
                    except BlockedList.DoesNotExist:
                        pass
                    try:
                        Notification.objects.get(sender=sender, accepter=accepter)
                        return JsonResponse({'error': 'User already send friend request'}, status=400)
                    except Notification.DoesNotExist:
                        notification = Notification(sender=sender, accepter=accepter)
                        notification.save()
                    return JsonResponse({'message': 'Send friend request success'}, status=200)
            else:
                return JsonResponse({'message': 'User is not logged in'}, status=401)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404) 
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

#2.3.4 DELETE: /api/users/notifications/delete
def DeleteNotification(request):
    if request.method == 'DELETE':
            data = json.loads(request.body)
            owner_id = data.get('owner_id')
            user_id = data.get('user_id')
            if settings.ALLOW_API_WITHOUT_AUTH or request.user.is_authenticated:
                if request.user.is_authenticated or settings.ALLOW_API_WITHOUT_AUTH:
                    if settings.ALLOW_API_WITHOUT_JWT == False:
                        err = jwt_and_auth_validate(request, owner_id)
                        if err is not None:
                            return JsonResponse(err, status=401)              
                    try:    
                        accpeter = User.objects.get(id=owner_id)
                        sender = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        return JsonResponse({'error': 'User not found'}, status=404)
                    try:
                        notification = Notification.objects.get(sender=sender, accepter=accpeter)
                    except Notification.DoesNotExist:
                        return JsonResponse({'error': 'Notification was not found'}, status=404)
                    notification.delete()
                    return JsonResponse({'message': 'Delete Notificantion Success'}, status=200)
            else:
                return JsonResponse({'message': 'User is not logged in'}, status=401)

    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def generate_activation_code(lenght):
    token = secrets.token_urlsafe(32)
    if (lenght != 0):
        return token[:lenght]
    return token

def recover_qr(request):
    if request.user.is_authenticated:
            user = User.objects.get(id=request.user.id)
            if RegenerateCode.objects.filter(user=user).exists():
               RegenerateCode.objects.get(user=user).delete()
            code = generate_activation_code(lenght=6)
            RegenerateCode.objects.create(user=user, code=make_password(code))
                
            subject = f'Recovery Code: {code}'
            html_message = render_to_string('backend/recover_code_email.html', {
                'username': user.username,
                'code':code
            })

            email_from = settings.EMAIL_HOST_USER
            recipient_list = [user.email]
            email = EmailMultiAlternatives(subject, '', email_from, recipient_list)
            email.attach_alternative(html_message, "text/html")
    
            # Send the email
            email.send()
            # return redirect (regen_code)
            return JsonResponse({'message': 'Good morning'}, status=201)
    else:
        return JsonResponse({'message': 'User is not logged in'}, status=401)
    

def regenerate_qr_code(request):
    if request.user.is_authenticated:
        data = json.loads(request.body)
        code = data.get('code')
        try:
            user = User.objects.get(id=request.user.id)
            stored_code = RegenerateCode.objects.get(user=user)
        except RegenerateCode.DoesNotExist:
            return JsonResponse({'error': 'Regenerate code not found.'}, status=404)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found.'}, status=404)     
   
        if not check_password(code, stored_code.code):
            return JsonResponse({'error': 'Regenerate code is mismatch.'}, status=404)
        if stored_code.is_expired():
            stored_code.delete()
            return JsonResponse({"error": "Regenerate code has expired."}, status=400)
        stored_code.delete()
        user.totp_secret = None
        user.save()
        return JsonResponse({'message': 'Regenerate QR-code Success'}, status=200)
    else:
        return JsonResponse({'message': 'User is not logged in'}, status=401)

def activate_account_page(request):
    return render(request, 'backend/activate_account.html')

def final_register(request):
    if request.method == 'POST':
        code = request.POST.get('code')
        password = request.POST.get('password')
        
        try:
            activation_code = ActivationCode.objects.get(code=code)
        except ActivationCode.DoesNotExist:
            return redirect ("frontend:dashboard")
        if activation_code.is_expired():
            activation_code.delete()
            return redirect ("frontend:dashboard")
        user = activation_code.user
        activation_code.delete()  # Remove the activation code once it's used
        return UserRegister(request, user, password)
        
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)

def activate_account(request, code):
        try:
            activation_code = ActivationCode.objects.get(code=code)
        except ActivationCode.DoesNotExist:
            return redirect ("frontend:dashboard")
        if activation_code.is_expired():
            activation_code.delete()
            return redirect ("frontend:dashboard")

        user = activation_code.user
        
        context = {
            'code': code
        }
        return render(request, 'backend/activate_account.html', {'context': context})

def generate_activation_code(lenght):
    token = secrets.token_urlsafe(32)
    if (lenght != 0):
        return token[:lenght]
    return token

def send_activation_email(user, code):
    activation_link = f"{settings.SITE_URL}{reverse('activate', kwargs={'code': code})}"
    subject = 'Activate your account'

    html_message = render_to_string('backend/activation_email.html', {
        'username': user.username,
        'activation_link': activation_link
    })
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [user.email]
    email = EmailMultiAlternatives(subject, '', email_from, recipient_list)
    email.attach_alternative(html_message, "text/html")
    # Send the email
    email.send()

def pre_register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        avatar = request.FILES.get('avatar')
        
        if not username:
                return JsonResponse({'error': 'Both username and password are required'}, status=400)
        if User.objects.filter(username=username).exists() or PreRegister.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        user = PreRegister.objects.create(username=username, email=email, avatar=avatar)
        user.save()
        code = generate_activation_code(lenght=0)
        ActivationCode.objects.create(user=user, code=code)
        
        send_activation_email(user, code)
        return JsonResponse({'message': 'Waiting for activation'}, status=200)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
def check_email(request):
    return render(request, 'backend/check_email.html') 

def pre_regen(request):
    if request.user.is_authenticated:
        email = request.POST.get('email')
        try:
            User.objects.get(id=request.user.id ,email=email)
            return JsonResponse({'success': True}, status=200)
        except:
            return JsonResponse({'success': False, 'error': 'Wrong email'}, status=400)
    else:
        return JsonResponse({'message': 'User is not logged in'}, status=401)

def pre_regen_page(request):
    return render(request, 'backend/pre_regen.html')

def get_totp_secret(request):
    if request.user.is_authenticated:
        user = User.objects.get(id=request.user.id)
        return JsonResponse({'key': user.totp_secret})
    else:
        return JsonResponse({'message': 'User is not logged in'}, status=401)

def get_setup_key(request):
    if request.user.is_authenticated:
        return render(request, 'backend/setup_key.html')
    else:
        return JsonResponse({'message': 'User is not logged in'}, status=401)