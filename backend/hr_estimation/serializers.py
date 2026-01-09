from rest_framework import serializers
from .models import EstimationRow

class EstimationRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstimationRow
        fields = '__all__'
