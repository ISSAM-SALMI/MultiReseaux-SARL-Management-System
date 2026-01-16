from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Leave, SalaryPeriod


@receiver(post_save, sender=Leave)
@receiver(post_delete, sender=Leave)
def update_salary_period_on_leave_change(sender, instance, **kwargs):
    if instance.salary_period_id:
        try:
            if instance.salary_period:
                instance.salary_period.calculate_salary()
        except SalaryPeriod.DoesNotExist:
            pass

