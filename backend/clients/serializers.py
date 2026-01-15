from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

    def validate_ice(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("L'ICE doit contenir uniquement des chiffres.")
        return value
