from rest_framework import serializers
from .models import Quote, QuoteLine, QuoteTracking, QuoteTrackingLine

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
        # quote is required for creation via QuoteLineViewSet

class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True, required=False)

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ('total_ht', 'total_ttc')

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
