from rest_framework import serializers
from .models import Project, ProjectHR, ProjectCost, Revenue, Expense

class ProjectHRSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectHR
        fields = '__all__'

class ProjectCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCost
        fields = '__all__'

class RevenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Revenue
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    hr_resources = ProjectHRSerializer(many=True, read_only=True)
    costs = ProjectCostSerializer(many=True, read_only=True)
    revenues = RevenueSerializer(many=True, read_only=True)
    expenses = ExpenseSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.nom_client', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

