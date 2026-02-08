#!/usr/bin/env python
"""
Script de test pour vérifier la logique de change_status
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'multisarl.settings')
django.setup()

from quotes.models import Quote, QuoteLine

print("🔍 Testing change_status logic...")
print("-" * 50)

# Trouver un devis existant
quote = Quote.objects.first()
if not quote:
    print("❌ No quote found for testing")
    sys.exit(1)

print(f"✅ Using quote: {quote.numero_devis}")

# Test 1: Création d'une nouvelle ligne
print("\n📝 Test 1: Creating new line...")
line = QuoteLine(
    quote=quote,
    designation='Test New Line',
    quantite=1,
    prix_unitaire=100
)
line.save()
print(f"   New line ID: {line.id}")
print(f"   change_status: {line.change_status}")
print(f"   ✅ Expected 'new', Got '{line.change_status}' - {'PASS' if line.change_status == 'new' else 'FAIL'}")

# Test 2: Modification de la ligne
print("\n✏️  Test 2: Modifying line...")
old_designation = line.designation
line.designation = 'Modified Line'
line.save()
print(f"   change_status: {line.change_status}")
print(f"   original_designation: {line.original_designation}")
print(f"   ✅ Expected 'modified', Got '{line.change_status}' - {'PASS' if line.change_status == 'modified' else 'FAIL'}")
print(f"   ✅ Original value saved: {line.original_designation == old_designation}")

# Test 3: Réinitialisation
print("\n🔄 Test 3: Resetting change_status...")
line.change_status = 'unchanged'
line.original_designation = None
line.original_quantite = None
line.original_prix_unitaire = None
line.save()
print(f"   change_status: {line.change_status}")
print(f"   ✅ Expected 'unchanged', Got '{line.change_status}' - {'PASS' if line.change_status == 'unchanged' else 'FAIL'}")

# Cleanup
line.delete()
print("\n🗑️  Test line deleted")
print("\n✅ All tests completed!")
