from django.db import models
from datetime import datetime

class TelegramUser(models.Model):
    telegram_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=100)
    tellonym_token = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} (ID: {self.telegram_id})"

class TellonymChat(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('ACCEPTED', 'Accepted'),
        ('REPLIED', 'Replied'),
        ('ARCHIVED', 'Archived'),
    ]

    telegram_user = models.ForeignKey(TelegramUser, on_delete=models.CASCADE, related_name='chats')
    tellonym_message_id = models.IntegerField()
    message_text = models.CharField(max_length=500)
    reply_text = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    received_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('telegram_user', 'tellonym_message_id')
        ordering = ['-received_at']

    def __str__(self):
        return f"Message {self.tellonym_message_id} - {self.status}"
