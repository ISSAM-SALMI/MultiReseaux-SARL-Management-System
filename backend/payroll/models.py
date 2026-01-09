from django.db import models
from budget.models import Employee

class SalaryPeriod(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    theoretical_salary = models.DecimalField(max_digits=10, decimal_places=2) # Salaire théorique (hebdomadaire ou calculé)
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    real_salary = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def calculate_salary(self):
        # Retrieve all non-paid leaves within this period
        leaves = self.leaves.filter(type__in=['UNP', 'ABS']) # Non Billable / Absence
        
        # Calculate daily rate based on theoretical weekly salary (assuming 6 days a week? or 5? Standard is usually 6 or variable. 
        # Requirement says: "Récupère automatiquement le salaire hebdomadaire".
        # Let's assume 1 week = 6 working days implies Daily Rate = Weekly / 6 
        # OR we can just simple logic: 
        # 1 day deduction = (Weekly Salary / 6) * days_count
        # User didn't specify work days per week. I'll assume 6 for construction/industry or provide a field.
        # Let's use 6 as a default for "daily rate" calculation from "weekly".
        
        daily_rate = self.theoretical_salary / 6 
        
        deduction = 0
        for leave in leaves:
             # Simple validation: checks if leave is fully inside, or overlaps... 
             # For MVP, assuming the user links the leave to this period correctly or we calculate overlap.
             # The simplest approach requested: "Create tables for Salaries and Leaves".
             # To keep it robust yet simple: The Leave will have a duration in days.
             deduction += leave.duration * daily_rate
             
        self.total_deductions = deduction
        self.real_salary = self.theoretical_salary - deduction
        self.save()

class Leave(models.Model):
    PAID = 'PAY'
    UNPAID = 'UNP'
    ABSENCE = 'ABS'
    
    TYPE_CHOICES = [
        (PAID, 'Congé Payé'),
        (UNPAID, 'Congé Non Payé'),
        (ABSENCE, 'Absence'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    salary_period = models.ForeignKey(SalaryPeriod, on_delete=models.CASCADE, related_name='leaves', null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    type = models.CharField(max_length=3, choices=TYPE_CHOICES, default=UNPAID)
    duration = models.DecimalField(max_digits=4, decimal_places=1, help_text="Durée en jours") 
    reason = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.salary_period:
            self.salary_period.calculate_salary()

