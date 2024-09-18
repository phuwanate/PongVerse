from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Friendship
from django import forms
from django.core.exceptions import ValidationError

class CustomUserAdmin(UserAdmin):
    # Define the fields to be displayed in the admin interface
    list_display = ('username', 'email', 'is_staff', 'is_active', 'date_joined')
    # Define the fields to be used in the form for adding or changing users
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'avatar', 'score')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'avatar', 'score', 'is_active', 'is_staff', 'is_superuser')}
        ),
    )
    # Define the fields to be used in the form for viewing a user's details
    readonly_fields = ('date_joined', 'last_login')


class FriendshipAdminForm(forms.ModelForm):
    class Meta:
        model = Friendship
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        from_user = cleaned_data.get('from_user')
        to_user = cleaned_data.get('to_user')

        if from_user == to_user:
            raise ValidationError("Users cannot be friends with themselves.")

        # Ensure bidirectional friendship
        existing_friendship = Friendship.objects.filter(from_user=from_user, to_user=to_user).exists()
        if not existing_friendship:
            Friendship.objects.create(from_user=from_user, to_user=to_user)
            Friendship.objects.create(from_user=to_user, to_user=from_user)

class FriendshipAdmin(admin.ModelAdmin):
    form = FriendshipAdminForm
    list_display = ('from_user', 'to_user')


admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Friendship, FriendshipAdmin)
