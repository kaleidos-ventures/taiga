# Generated by Django 2.2.24 on 2022-01-20 10:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '0005_auto_20211201_1121'),
    ]

    operations = [
        migrations.AddField(
            model_name='workspace',
            name='is_premium',
            field=models.BooleanField(default=False),
        ),
    ]