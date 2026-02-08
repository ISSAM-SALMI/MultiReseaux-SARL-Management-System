from rest_framework import serializers
from .models import Employee, Material, MaterialCost, MonthlyLabourCost

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

class GeneralExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import GeneralExpense
        model = GeneralExpense
        fields = '__all__'

class MonthlyLabourCostSerializer(serializers.ModelSerializer):
    month_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyLabourCost
        fields = '__all__'
    
    def get_month_name(self, obj):
        months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        return months[obj.month] if 1 <= obj.month <= 12 else str(obj.month)
    
    def validate_month(self, value):
        if not 1 <= value <= 12:
            raise serializers.ValidationError("Le mois doit être entre 1 et 12.")
        return value
    
    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Le montant ne peut pas être négatif.")
        return value
