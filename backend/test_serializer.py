#!/usr/bin/env python
"""
Script pour vérifier la sortie du sérialiseur
"""
import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'multisarl.settings')
django.setup()

from quotes.models import QuoteLine
from quotes.serializers import QuoteLineSerializer

print("🔍 Checking QuoteLine Serializer Output...")
print("-" * 50)

line = QuoteLine.objects.first()
if not line:
    print("❌ No QuoteLine found")
    sys.exit(1)

print(f"✅ Found line ID: {line.id}")
print(f"   Designation: {line.designation}")
print(f"   change_status: {line.change_status}")
print(f"   original_designation: {line.original_designation}")

print("\n📤 Serializer Output:")
print("-" * 50)
serializer = QuoteLineSerializer(line)
print(json.dumps(serializer.data, indent=2, default=str))

print("\n✅ Fields included:")
for key in serializer.data.keys():
    print(f"   - {key}")

if 'change_status' in serializer.data:
    print("\n✅ change_status is included in serializer output!")
else:
    print("\n❌ change_status is NOT included in serializer output!")
