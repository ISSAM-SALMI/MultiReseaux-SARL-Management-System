from .models import AuditLog

class AuditLogMixin:
    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(instance, 'CREATE')

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_action(instance, 'UPDATE')

    def perform_destroy(self, instance):
        self._log_action(instance, 'DELETE')
        instance.delete()

    def _log_action(self, instance, action):
        user = self.request.user if self.request.user.is_authenticated else None
        table_name = instance._meta.db_table
        record_id = str(instance.pk)
        
        AuditLog.objects.create(
            table_name=table_name,
            record_id=record_id,
            action=action,
            user=user,
            details={'str_repr': str(instance)}
        )
