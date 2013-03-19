from django.db import models
from django.contrib.auth.models import User

class Token(models.Model):
    '''A string providing access to a user's third-party data.'''

    user = models.ForeignKey(User)
    string = models.CharField(max_length=2000)
    service = models.CharField(max_length=200)
    def __unicode__(self):
        return self.string


