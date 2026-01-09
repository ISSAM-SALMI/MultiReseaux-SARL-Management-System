from rest_framework import serializers
from .models import Employee, Material, MaterialCost

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class MaterialCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialCost
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    costs = MaterialCostSerializer(many=True, read_only=True)
    
    class Meta:
        model = Material
        fields = '__all__'
