#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'multisarl.settings')
django.setup()

from authentication.models import User, UserRole

users = User.objects.all()
for u in users:
    roles = list(u.user_roles.values_list('role__role_name', flat=True))
    print(f'User: {u.username}, is_superuser: {u.is_superuser}, is_staff: {u.is_staff}, roles: {roles}')
