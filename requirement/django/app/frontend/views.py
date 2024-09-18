from django.shortcuts import render, redirect
from django.conf import settings
from backend.views import jwt_manual_validate
from django.contrib.auth import logout
from backend import views
from django.http import JsonResponse
import sys
import jwt
from jwt.exceptions import ExpiredSignatureError

# Create your views here.
def index(request):
    if request.user.is_authenticated:
        if settings.ALLOW_API_WITHOUT_JWT == False:
            err = jwt_manual_validate(request)
            if err is not None:
                if err['error'] == 'JWT token is missing':
                    logout(request)
                    return render(request, "index.html")
                else:
                    return JsonResponse(err, status=401)
        return redirect('frontend:dashboard')
    return render(request, "index.html")

def validate_token_life(request):
    try:
        raw_token = request.session['access_token']
        jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.SIMPLE_JWT['ALGORITHM']])
    except ExpiredSignatureError:
        return ('Token has expired')
    return ('')

def dashboard(request):
    if not request.user.is_authenticated:
        return redirect('frontend:index')
    context = {
        "id": request.user.id,
        "username": request.user.username,
        "avatar": request.user.get_avatar_url(),
        "session_id": request.session.session_key
    }
    try:
        if (settings.ALLOW_API_WITHOUT_JWT == False):
            err = validate_token_life(request)
            if err == 'Token has expired':
                print ('Token has expired', file=sys.stderr)
                new_context = views.get_token_for_authenticated_user(request)
                request.session['access_token'] = new_context['access']
                context['access_token'] = new_context['access']
                context['refresh_token'] = request.session['refresh_token']
            else:
                context['access_token'] = request.session['access_token']
                context['refresh_token'] = request.session['refresh_token']
    except KeyError as e:
        print (e, file=sys.stderr)
        return redirect('frontend:index')
    return render(request, "dashboard.html", {"user": context})
