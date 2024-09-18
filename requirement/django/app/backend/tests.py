import json
from django.test import Client
from django.test import TestCase
from django.conf import settings
from .models import Notification
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import authenticate, login, logout, get_user_model

#CLENT_NUMB need to be more than or equal to 3 persons.
CLIENT_NUMB = 3
print(f">>>>>>>>>>>>>>>>>Start tester with [{CLIENT_NUMB}] Clients<<<<<<<<<<<<<<<<<<<<")

# Create your tests here.
class LoginTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.login_url ='/api/auth/login'
        self.payload = {
            "username": "user1234",
            "password": "password1234"
        }
        
    def test_login_success(self):
        """
            If login success should return 200
        """
        User = get_user_model()
        user = User.objects.create_user(username="user1234", password="password1234")
        
        response = self.client.post(
            self.login_url, 
            json.dumps(self.payload),
            content_type='application/json')
        updated_user = User.objects.get(username="user1234")
 
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Login success')
        self.assertEqual(response.json()['owner_id'], updated_user.id)
        self.assertEqual(updated_user.is_online , True)
        
    def test_login_with_invalid_username(self):
        """
            If login with invalid username should return 401
        """
        User = get_user_model()
        user = User.objects.create_user(username="user1234", password="password1234")
        payload = {
            "username": "user12345",
            "password": "password1234"
        }
        
        response = self.client.post(
            self.login_url, 
            json.dumps(payload),
            content_type='application/json')

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'Invalid username or password')
    
    def test_duplicate_login(self):
        """
            If user login 2 times with the same session 
        """
        User = get_user_model()
        user = User.objects.create_user(username="user1234", password="password1234")
        for i in range(2):        
            response = self.client.post(
            self.login_url, 
            json.dumps(self.payload),
            content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'User is already logged in')

    def test_login_with_method_not_allowed(self):
        """
            If login with invalid username should return 405
        """
        response = self.client.get(self.login_url,)
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['error'], 'Method not allowed')
        

class RegiterTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url ='/api/auth/register'
        self.payload = {
            "username": "user1234",
            "password": "password1234"
        }
        self.file_upload = {
            'name': 'test_avatar.jpg',
            'content': b'test image content',
            'content_type': 'image/jpeg'
        }
   
    def test_register_success(self):
        """
            Expect response body as a multipart/form-data
            If user registeration success should return status 201
        """
        avatar = SimpleUploadedFile(
            name=self.file_upload['name'],
            content=self.file_upload['content'],
            content_type=self.file_upload['content_type']
        )
        response = self.client.post(
            self.register_url,
            data={
                'username': self.payload['username'],
                'password': self.payload['password'],
                'avatar': avatar
            }
        )
        User = get_user_model()
        user = User.objects.get(username=self.payload['username'])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['message'], 'Create user success')
        self.assertEqual(user.avatar, f'avatars/{self.file_upload['name']}')
  
    def test_register_success_without_avatar(self):
        """
            Expect response body is multipart/form-data
            If user registered success should return status 201
        """
        response = self.client.post(
            self.register_url,
            data={
                'username': self.payload['username'],
                'password': self.payload['password'],
            }
        )
        User = get_user_model()
        user = User.objects.get(username=self.payload['username'])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['message'], 'Create user success')
        self.assertEqual(user.avatar, f'avatars/default.png')

    def test_register_with_method_not_allowed(self):
        """
            If login with invalid username should return 405
        """
        response = self.client.get(self.register_url,)
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['error'], 'Method not allowed')

class LogoutTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.client2 = Client()
        self.logout_url ='/api/auth/logout'
        self.login_url = '/api/auth/login'
        
        User = get_user_model()
        self.user = User.objects.create_user(username="user1234", password="password1234")
        self.payload = {
            "username": "user1234",
            "password": "password1234"
        }
        self.client.post(
            self.login_url, 
            json.dumps(self.payload),
            content_type='application/json')

    def test_logout_success(self):
        """
            If logout success should return 200
        """
        response = self.client.post(self.logout_url, content_type='application/json')
        User = get_user_model()
        updated_user = User.objects.get(username="user1234")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Logout success')
        self.assertEqual(updated_user.is_online, False)

    def test_logout_failed(self):
        """
            If logout before login should return 401
        """
        response = self.client2.post(self.logout_url, content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'User is not logged in')

    def test_logout_with_method_not_allowed(self):
        """
            If logout with method other than POST should return 405
        """
        response = self.client.get(self.logout_url)
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()['error'], 'Method not allowed')

class UserProfileTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url ='/api/users/'
        User = get_user_model()
        self.user = User.objects.create_user(username="user1234", password="password1234")
        self.payload = {
            "username": "user1234", 
            "password": "password1234"
        }
        response = self.client.post(
            "/api/auth/login", 
            json.dumps(self.payload),
            content_type='application/json')
    
    def test_exist_user_profile(self):
        payload = {
	        "id": 1,
	        "username": "user1234",
	        "avatar": f"{settings.MEDIA_URL}avatars/default.png",
	        "is_online": True 
        }
        response = self.client.get(f'{self.url}{self.user.id}/{self.user.id}/profile')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), payload)


    def setUp(self):
        self.client = Client()
        self.url ='/api/users/'
        User = get_user_model()
        self.user = User.objects.create_user(username="user1234", password="password1234")
        self.payload = {
            "username": "user1234", 
            "password": "password1234"
        }
        response = self.client.post(
            "/api/auth/login", 
            json.dumps(self.payload),
            content_type='application/json')

class UpdateUserAvatarTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url ='/api/users/'
        self.User = get_user_model()
        self.user = self.User.objects.create_user(username="user1234", password="password1234")
        self.payload = {
            "username": "user1234",
            "password": "password1234"
        }
        self.file_upload = {
            'name': 'test_avatar2.jpg',
            'content': b'test image content',
            'content_type': 'image/jpeg'
        }
        self.response_login = self.client.post(
            "/api/auth/login", 
            json.dumps(self.payload),
            content_type='application/json')

    def test_update_user_avatar_success(self):
        """
            if success new avatar path should not be the same as the old avatar path.
        """
        avatar = SimpleUploadedFile(
            name=self.file_upload['name'],
            content=self.file_upload['content'],
            content_type=self.file_upload['content_type']
        )
        #/api/users/:id/update_avatar
        response = self.client.post(
            f'{self.url}update_avatar',
            data={
                'avatar': avatar,
                'user_id': self.response_login.json()['owner_id'] 
            }
        )
        
        update_user = self.User.objects.get(username="user1234")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'User update avatar success')
        self.assertNotEqual(update_user.avatar, self.user.avatar)
    
    def test_update_user_avatar_with_empty_file(self):
        """
            If upload empty file should return 404 Not found the avatar file
        """
        response = self.client.post(
            f'{self.url}update_avatar',
            data={ 
                    'user_id': self.response_login.json()['owner_id'] 
                },
        )
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Not Found the avatar file')

class SendFriendRequest(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        
        for i in range(CLIENT_NUMB):
            self.client[i].post(
                "/api/auth/login", 
                json.dumps(self.payload[i]),
                content_type='application/json')
    
    def test_send_friend_request_success(self):
        """
            If success notification table should map correct sender and accepter to table.
        """ 
        for i in range(CLIENT_NUMB - 1):
           response = self.client[i].post(f'{self.url}notifications/friend_request',
                                            json.dumps({
                                                'owner_id': self.user[i].id,
                                                'user_id': self.user[CLIENT_NUMB - 1].id
                                            }),
                                            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Send friend request success')
    
    def test_repeatly_send_friend_request(self):
        """
            If User try to repeatly send friend request to the same user, should return 400
        """ 
        for i in range(2):
           response = self.client[CLIENT_NUMB - 1].post(f'{self.url}notifications/friend_request',
                                                        json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id': self.user[1].id
                                                        }),
                                                        content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'User already send friend request')
    
    def test_user_send_request_to_themselves(self):
        """
            If User try to send friend request to themselves, should return 400
        """
        response = self.client[0].post(f'{self.url}notifications/friend_request',
                                        json.dumps({
                                            'owner_id': self.user[0].id,
                                            'user_id': self.user[0].id
                                        }),
                                        content_type='application/json') 
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users try to send request to themselves')
        
class GetNotificationTest(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json')  

    def test_get_notification_success(self):
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications')
        expected_load = [
                {
                    'noti_id': i + 1,
                    'user_id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1)
            ]
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_notification_not_found(self):
        """
            If User doesn't have any of notifications yet, should return 404
        """
        response = self.client[0].get(f'{self.url}{self.user[0].id}/notifications')
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Notifications not found')

class AcceptFriend(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
    
    def test_accept_friend_success(self):
        """
            If accept success the last user should be freind with all users.
            Notification should decrement by CLIENT_NUMB - 1.
        """
        #Before
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications')
        notification = response.json()

        for i in range(CLIENT_NUMB - 1):
            sender_id = notification[i]['user_id']
            accept_response = self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept',json.dumps({
                                                                    'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                                    'user_id': sender_id
                                                                }),
                                                                content_type='application/json')
        #After
        new_response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications')
        new_notification = new_response.json()

        self.assertEqual(accept_response.status_code, 201)
        self.assertEqual(accept_response.json()['message'], 'Accept friend success')
        self.assertNotEqual(len(notification), len(new_notification))
        
        #Query friend's id to compare with all users'id that was send friend request to the last user.
        update_user = self.User.objects.get(id=self.user[CLIENT_NUMB - 1].id)
        friend = update_user.friend.all()
        for i in range(CLIENT_NUMB - 1):
            self.assertEqual(self.user[i].id, friend[i].id)
    
    def test_repeatly_accept_friend(self):
        for i in range(2):
            response=self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept', json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id': self.user[0].id
                                                        }),
                                                        content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'User was already be friends')
    
    def test_user_accept_friend_for_themselves(self):
        response=self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept', json.dumps({
                                                        'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                        'user_id': self.user[CLIENT_NUMB - 1].id
                                                    }),
                                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users try to accept friend to themselves')
        
class GetAllFriend(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
    
    def test_get_all_friend_success(self):
        """
            If success should return list of friends include all users but the last user.
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept',
                                                json.dumps({
                                                    'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                    'user_id': self.user[i].id
                                                }),
                                                content_type='application/json')
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends')

        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1)
            ]
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_get_friend_not_found(self):
        """
            If User doesn't have any friend before, should return 401
        """
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends')
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Friends not found') 
        
class FindNewFriend(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        for i in range(CLIENT_NUMB - 1):
            if i % 2 == 0:
                self.client[CLIENT_NUMB - 1].post(f'{self.url}notifications/friend_request',
                                    json.dumps({
                                        'owner_id': self.user[CLIENT_NUMB - 1].id,
                                        'user_id': self.user[i].id
                                    }),
                                    content_type='application/json') 
    def test_find_new_friend_success(self):
        """
            if client send friend request the othe users
            findnewfriend should list all users exclude user in notification list
        """
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i % 2 != 0
            ]
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends/find_new')
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_accept_friend_and_find_new_friend(self):
        for i in range(CLIENT_NUMB - 1):
            if i % 2 == 0:
                accept_response = self.client[i].post(f'{self.url}friends/accept',json.dumps({
                                                                    'owner_id': self.user[i].id,
                                                                    'user_id': CLIENT_NUMB - 1
                                                                }),
                                                                content_type='application/json')
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i % 2 != 0
            ]
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends/find_new')
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)

class DeleteNotification(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
    
    def test_delete_notification_success(self):
        """
            If success notification should disappear 1 item.
        """
        before  = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications')
        
        
        response = self.client[CLIENT_NUMB - 1].delete(f'{self.url}notifications/delete',
                                                        json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id': self.user[0].id
                                                        }),
                                                        content_type='application/json') 
        after = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Delete Notificantion Success')
        self.assertNotEqual(before.json(), after.json())

class BlockUser(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
            
    def test_block_user_success(self):
        for i in range(CLIENT_NUMB - 1):
            response = self.client[CLIENT_NUMB - 1].post(f'{self.url}block',
                                                        json.dumps({
                                                                'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                                'user_id': self.user[i].id  
                                                                }),
                                                        content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Block user success')
        
        #Get blocker's profile by blocked should return 401
        for i in range(CLIENT_NUMB - 1):
            response = self.client[i].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/{self.user[i].id}/profile'))
            
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()['error'], 'User was blocked')

        #Get blocked's profile by blocker should return 401
        for i in range(CLIENT_NUMB - 1):
            response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[i].id}/{self.user[CLIENT_NUMB - 1].id}/profile'))
            
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()['error'], 'User was blocked')
    
    def test_block_some_friend_success(self): 
        #Get all friends should see everyone but friends who's blocker
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept',json.dumps({
                                                    'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                    'user_id': self.user[i].id
                                                }),
                                                content_type='application/json')
            if i % 2 == 0:
                self.client[i].post(f'{self.url}block',json.dumps({
                                                            'owner_id': self.user[i].id,
                                                            'user_id': self.user[CLIENT_NUMB - 1].id    
                                                        }),
                                                        content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends'))
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i % 2 != 0
            ]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)

    def test_block_all_friend_success(self): 
        #Get all blocker profile who's friends by blocked user should return 401
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            self.client[CLIENT_NUMB - 1].put(f'{self.url}friends/accept',json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id': self.user[i].id
                                                        }),
                                                        content_type='application/json')

            self.client[i].post(f'{self.url}block',json.dumps({
                                                                'owner_id': self.user[i].id,
                                                                'user_id': self.user[CLIENT_NUMB - 1].id
                                                            }),
                                                            content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends'))
        # print(response.json())
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Friends not found')
        
    def test_block_some_user_and_find_new_friend(self):
        for i in range(CLIENT_NUMB - 1):
            # self.client[i].post(f'{self.url}notifications/friend_request',
            #                     json.dumps({
            #                         'owner_id': self.user[i].id,
            #                         'user_id': self.user[CLIENT_NUMB - 1].id
            #                     }),
            #                     content_type='application/json') 
            if i % 2 == 0:
                self.client[i].post(f'{self.url}block',json.dumps({
                                                                    'owner_id': self.user[i].id,
                                                                    'user_id': self.user[CLIENT_NUMB - 1].id    
                                                                }),
                                                        content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends/find_new'))
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i % 2 != 0
            ]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_block_all_user_and_find_new_friend(self):
        """
            If User was blocked by all users, User should can not find any user to send a request.
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            self.client[i].post(f'{self.url}block',json.dumps({
                                                        'owner_id': self.user[i].id,
                                                        'user_id': self.user[CLIENT_NUMB - 1].id
                                                        }),
                                                        content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/friends/find_new'))
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'User was blocked by all users')
    
    def test_block_bysome_user_get_notification(self):
        """
            If User was blocked by some users, User should can not see blocker's friend request
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            if i % 2 == 0:
                self.client[i].post(f'{self.url}block',
                                                        json.dumps({
                                                                'owner_id': self.user[i].id,
                                                                'user_id': self.user[CLIENT_NUMB - 1].id   
                                                            }),
                                                        content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications'))
        expected_load = [
                {
                    'noti_id': i + 1,
                    'user_id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i % 2 != 0
            ]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_block_by_all_user_get_notification(self):
        """
        If User was blocked by all users, User should cannot see any of request's send by blocker
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            self.client[i].post(f'{self.url}block',
                                                        json.dumps({
                                                                'owner_id': self.user[i].id,
                                                                'user_id': self.user[CLIENT_NUMB - 1].id
                                                            }),
                                                        content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get((f'{self.url}{self.user[CLIENT_NUMB - 1].id}/notifications'))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'Notifications not found')
    
    def test_block_user_accpet_friend(self):
        """
            If User was blocked, sender can send a request to accepter but accepter
            shouldn't can accpet the request.
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id 
                                }),
                                content_type='application/json') 
            self.client[i].post(f'{self.url}block',json.dumps({
                                                            'owner_id': self.user[i].id,
                                                            'user_id': self.user[CLIENT_NUMB - 1].id    
                                                        }),
                                                        content_type='application/json')
        
            response = self.client[CLIENT_NUMB - 1].post(f'{self.url}friends/accept',json.dumps({
                                                                'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                                'user_id': self.user[i].id
                                                                }),
                                                        content_type='application/json')
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()['error'], 'User was blocked')
    
    def test_block_user_send_request(self):
        """
            If User was blocked and try to send a friend request to blocker 
            should return 401
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[i].post(f'{self.url}notifications/friend_request',
                                json.dumps({
                                    'owner_id': self.user[i].id,
                                    'user_id': self.user[CLIENT_NUMB - 1].id
                                }),
                                content_type='application/json') 
            self.client[i].post(f'{self.url}block',json.dumps({
                                                        'owner_id': self.user[i].id,
                                                        'user_id': self.user[CLIENT_NUMB - 1].id   
                                                    }),
                                                    content_type='application/json')
        
            response = self.client[CLIENT_NUMB - 1].post(f'{self.url}notifications/friend_request',
                                                        json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id': self.user[i].id
                                                        }),
                                                        content_type='application/json') 
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()['error'], 'User was blocked')
        
    def test_repeatly_block(self):
        """
            If User try to repeatly block the same user, should return 400
        """
        for i in range(2):
            response = self.client[0].post(f'{self.url}block',
                                                        json.dumps({
                                                            'owner_id': self.user[0].id,
                                                            'user_id': self.user[CLIENT_NUMB - 1].id
                                                        }),
                                                        content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users is blocker now')
    
    def test_users_block_themselves(self):
        """
            If Users try to block themselve, should return 400
        """
        response = self.client[0].post(f'{self.url}block',json.dumps({
                                                        'owner_id': self.user[0].id,
                                                        'user_id': self.user[0].id
                                                        }),
                                                        content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users try to block themselves')
    
    def test_blocked_try_to_block_blocker(self):
        """
            If Users is blocked and try to block the blocker, should reuturn 400
        """
        self.client[0].post(f'{self.url}block',json.dumps({
                                                        'owner_id': self.user[0].id,
                                                        'user_id': self.user[CLIENT_NUMB - 1].id
                                                        }),
                                                        content_type='application/json')
        response = self.client[CLIENT_NUMB - 1].post(f'{self.url}block',json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id':self.user[0].id    
                                                        }),
                                                        content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users is blocked now')
    
class GetBlockedList(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
        
    def test_get_blocked_list_success(self):
        for i in range(CLIENT_NUMB - 1):
            self.client[CLIENT_NUMB - 1].post(f'{self.url}block',
                                                json.dumps({
                                                    'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                    'user_id': self.user[i].id
                                                    }),
                                                content_type='application/json')
        
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/blocked_list')
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1)
            ]
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_get_blocked_list_not_found(self):
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/blocked_list')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'BlockedList not found')

class UnBlockUser(TestCase):
    def setUp(self):
        self.url ='/api/users/'
        self.User = get_user_model()
        self.client = [Client() for i in range(CLIENT_NUMB)]
        self.user = [self.User.objects.create_user(username=f"user{i+1}", password=f"password{i+1}") for i in range(CLIENT_NUMB)]
        self.payload = [{"username": f"user{i+1}", "password": f"password{i+1}"} for i in range(CLIENT_NUMB)]
        for i in range(CLIENT_NUMB):
            self.client[i].post(
            "/api/auth/login", 
            json.dumps(self.payload[i]),
            content_type='application/json')
    
    def test_unblock_user_success(self):
        """
            If user unblock success shoud return 200 and delete the blocked record.
        """
        for i in range(CLIENT_NUMB - 1):
            self.client[CLIENT_NUMB - 1].post(f'{self.url}block',json.dumps({
                                                            'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                            'user_id':self.user[i].id
                                                            }),
                                                        content_type='application/json')
        #Before Unblock Uer should fail to get blocker UserProfile.
        response = self.client[0].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/{self.user[0].id}/profile')
        self.assertEqual(response.json()['error'], 'User was blocked')
        
        response = self.client[CLIENT_NUMB - 1].post(f'{self.url}unblock',json.dumps({
                                                        'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                        'user_id': self.user[0].id,
                                                        }),
                                                        content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'Unblock success')
        
        #After Unblock Users should successfulry get unblocked user.
        expected_load = {
            'id': self.user[CLIENT_NUMB - 1].id,
            'username': self.user[CLIENT_NUMB - 1].username,
            'avatar': self.user[CLIENT_NUMB - 1].avatar.url,
            'is_online': True 
        } 
        response = self.client[0].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/{self.user[0].id}/profile')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)

        #After unblock bloced_list should decrement.
        response = self.client[CLIENT_NUMB - 1].get(f'{self.url}{self.user[CLIENT_NUMB - 1].id}/blocked_list')
        expected_load = [
                {
                    'id': self.user[i].id,
                    'username': self.user[i].username,
                    'avatar': self.user[i].avatar.url,
                    'is_online': True
                }
                for i in range(CLIENT_NUMB - 1) if i != 0
            ]
        # print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_load)
    
    def test_unblock_themselves(self):  
        """
        If Users try to unblock themselves should return 400
        """     
        response = self.client[0].post(f'{self.url}unblock',
                                        json.dumps({
                                            'owner_id': self.user[0].id,
                                            'user_id': self.user[0].id
                                        }),
                                        content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Users try to unblock themselves')
    
    def test_blockedUser_unblock_blockerUser(self):
        """
        If Blocked users try to unblock Blocker user should return 400
        """
        self.client[CLIENT_NUMB - 1].post(f'{self.url}block',json.dumps({
                                                'owner_id': self.user[CLIENT_NUMB - 1].id,
                                                'user_id':self.user[0].id    
                                            }),
                                            content_type='application/json')
        response = self.client[0].post(f'{self.url}unblock',
                                        json.dumps({
                                            'owner_id': self.user[0].id,
                                            'user_id': self.user[CLIENT_NUMB - 1].id,
                                        }),
                                        content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Blocked users cannot unblock blocker')
    
    def test_unblock_to_unblockedUser(self):
        """
        If User try to unblock who's not blocked should return 404
        """
        response = self.client[0].post(f'{self.url}unblock',
                                        json.dumps({
                                            'owner_id': self.user[0].id,
                                            'user_id': self.user[CLIENT_NUMB - 1].id    
                                        }),
                                        content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()['error'], 'BlockedList not found')
