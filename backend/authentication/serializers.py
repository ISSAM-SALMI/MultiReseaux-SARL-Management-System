from rest_framework import serializers
from .models import User, Role, Permission, UserRole

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Role
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'roles', 'is_active', 'is_staff', 'is_superuser', 'password')
        read_only_fields = ('roles',)

    def get_roles(self, obj):
        user_roles = UserRole.objects.filter(user=obj)
        return [ur.role.role_name for ur in user_roles]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
