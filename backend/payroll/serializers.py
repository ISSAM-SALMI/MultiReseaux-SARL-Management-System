from rest_framework import serializers
from .models import SalaryPeriod, Leave
from budget.models import Employee

class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = '__all__'

class SalaryPeriodSerializer(serializers.ModelSerializer):
    leaves = LeaveSerializer(many=True, read_only=True)
    employee_name = serializers.CharField(source='employee.nom', read_only=True)
    employee_prenom = serializers.CharField(source='employee.prenom', read_only=True)

    class Meta:
        model = SalaryPeriod
        fields = '__all__'
        read_only_fields = ('real_salary', 'total_deductions', 'theoretical_salary')

    def create(self, validated_data):
        employee = validated_data['employee']
        # Auto-fetch weekly salary as theoretical
        # Note: If period is > 1 week, we might need logic.
        # User said: "Week or Month". 
        # If it's a month, how many weeks? 
        # Let's rely on user Input or simple logic for now. 
        # The prompt says: "Récupère automatiquement le salaire hebdomadaire... Calcule le salaire théorique de la période".
        # We'll calculate strictly based on days difference for theoretical? Or just default to weekly * number of weeks?
        # Let's stick to: Theoretical Salary is set at creation based on Employee's weekly salary scaled to the duration?
        
        # Simplified logic for MVP: The user creates a period. We default theoretical to Employee.salaire_semaine. 
        # If they want a month, they might expect x4.
        # Let's calculate based on duration in days.
        
        start = validated_data['start_date']
        end = validated_data['end_date']
        days = (end - start).days + 1
        weeks = days / 7
        
        # Base salary on the Employee weekly rate
        weekly_rate = employee.salaire_semaine
        # Pro-rate it? 
        # If I select 1 week (7 days) -> 1 * weekly_rate.
        # If I select 1 month (30 days) -> (30/7) * weekly_rate.
        
        theoretical = float(weekly_rate) * (days / 7)
        
        validated_data['theoretical_salary'] = round(theoretical, 2)
        validated_data['real_salary'] = round(theoretical, 2) # Initial
        
        instance = super().create(validated_data)
        return instance
