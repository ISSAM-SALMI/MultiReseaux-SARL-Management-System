from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # id_user is implicit as id
    # username, password_hash (password), email, is_active, created_at (date_joined) are in AbstractUser
    # We can add created_at alias if needed, but date_joined is standard.
    
    class Meta:
        db_table = 'USERS'

class Role(models.Model):
    role_name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'ROLES'

    def __str__(self):
        return self.role_name

class Permission(models.Model):
    MODULE_CHOICES = [
        ('auth', 'Authentication'),
        ('dashboard', 'Dashboard'),
        ('projects', 'Projects'),
        ('quotes', 'Quotes'),
        ('quote_lines', 'Quote Lines'),
        ('quote_trackings', 'Quote Trackings'),
        ('quote_tracking_lines', 'Quote Tracking Lines'),
        ('quote_groups', 'Quote Groups'),
        ('quote_tracking_groups', 'Quote Tracking Groups'),
        ('budget', 'Budget'),
        ('hr_estimation', 'HR Estimation'),
        ('invoices', 'Invoices'),
        ('documents', 'Documents'),
        ('notifications', 'Notifications'),
        ('clients', 'Clients'),
    ]
    
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    can_read = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        db_table = 'PERMISSIONS'
        unique_together = ('role', 'module')

class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = 'USER_ROLES'
        unique_together = ('user', 'role')
