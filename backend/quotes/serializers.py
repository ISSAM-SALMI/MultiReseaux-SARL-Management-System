from rest_framework import serializers
from .models import Quote, QuoteLine, QuoteTracking, QuoteTrackingLine, QuoteGroup

class QuoteTrackingLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteTrackingLine
        fields = '__all__'
        read_only_fields = ('montant_ht',)

class QuoteTrackingSerializer(serializers.ModelSerializer):
    lines = QuoteTrackingLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuoteTracking
        fields = '__all__'

    def create(self, validated_data):
        quote = validated_data['quote']
        tracking = QuoteTracking.objects.create(**validated_data)
        
        # Automatically copy lines from the original quote
        for line in quote.lines.all():
            QuoteTrackingLine.objects.create(
                tracking=tracking,
                designation=line.designation,
                quantite=line.quantite,
                prix_unitaire=line.prix_unitaire
            )
        return tracking

class QuoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLine
        fields = '__all__'
        read_only_fields = ('montant_ht',)


class QuoteGroupSerializer(serializers.ModelSerializer):
    """Serializer pour les groupes de lignes de devis"""
    lines = QuoteLineSerializer(many=True, read_only=True)
    total_ht = serializers.SerializerMethodField()
    
    class Meta:
        model = QuoteGroup
        fields = ['id', 'quote', 'name', 'order', 'lines', 'total_ht']
    
    def get_total_ht(self, obj):
        return obj.get_total()


class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True, required=False)
    groups = QuoteGroupSerializer(many=True, read_only=True)
    ungrouped_lines = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ('total_ht', 'total_ttc')
    
    def get_ungrouped_lines(self, obj):
        """Retourne les lignes sans groupe"""
        lines = obj.lines.filter(group__isnull=True)
        return QuoteLineSerializer(lines, many=True).data

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        quote = Quote.objects.create(**validated_data)
        for line_data in lines_data:
            QuoteLine.objects.create(quote=quote, **line_data)
        quote.calculate_totals()
        return quote

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        
        # Update quote fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            # Simple strategy: delete all and recreate (or handle update logic)
            # For simplicity in this prompt, I'll delete and recreate
            instance.lines.all().delete()
            for line_data in lines_data:
                QuoteLine.objects.create(quote=instance, **line_data)
            instance.calculate_totals()
            
        return instance
