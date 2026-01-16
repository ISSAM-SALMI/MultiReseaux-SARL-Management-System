from rest_framework import serializers
from .models import Project, ProjectHR, ProjectCost, Revenue, Expense, ProjectWorker, ProjectWorkerAttendance

class ProjectWorkerAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectWorkerAttendance
        fields = '__all__'

class ProjectWorkerSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()
    daily_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = ProjectWorker
        fields = '__all__'

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.nom} {obj.employee.prenom}"
        return obj.worker_name

    def get_project_details(self, obj):
        return {
            "nom_projet": obj.project.nom_projet,
            "date_debut": obj.project.date_debut,
            "date_fin": obj.project.date_fin,
            "etat_projet": obj.project.etat_projet
        }

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

