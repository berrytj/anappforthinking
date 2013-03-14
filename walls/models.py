from django.db import models
import datetime
from datetime import datetime
from django.utils import timezone
from django.contrib.auth.models import User
from accounts.models import MyProfile

class Wall(models.Model):
    '''A surface for users to create and manipulate marks.'''
    
    user = models.ForeignKey(User)
    title = models.CharField(max_length=200)
    last_updated = models.DateTimeField('last updated', default = datetime.now)
    def __unicode__(self):
        return self.title
    class Meta:
        get_latest_by = "pk"
        ordering = ['-id']
    
class Mark(models.Model):
    '''A thought, idea, link, or other piece of text created by the user.'''
    
    wall = models.ForeignKey(Wall)
    text = models.CharField(max_length=10000, default="", blank=True)
    x = models.IntegerField()
    y = models.IntegerField()
    def __unicode__(self):
	    return self.text
    class Meta:
    	get_latest_by = "pk"

class Waypoint(models.Model):
    '''A short piece of text used to denote a category of marks for quick access.'''
    
    wall = models.ForeignKey(Wall)
    text = models.CharField(max_length=100, default="", blank=True)
    x = models.IntegerField()
    y = models.IntegerField()
    def __unicode__(self):
        return self.text
    class Meta:
        get_latest_by = "pk"

class Undo(models.Model):
    '''A snapshot of a mark or waypoint containing the pk of its corresponding live object.'''
    
    # Needed so you can create the right undo stack:
    wall = models.ForeignKey(Wall)
    
    # Needed (rather than ForeignKey) so you can include marks, waypoints, etc:
    obj_pk = models.IntegerField()
    type = models.CharField(max_length=50)
    
    text = models.CharField(max_length=10000, default="", blank=True)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    
    def __unicode__(self):
        return str(self.pk)
    class Meta:
        ordering = ['-pk']
        get_latest_by = "pk"

class Redo(models.Model):
    '''A snapshot of a mark or waypoint containing the pk of its corresponding live object.'''
    
    wall = models.ForeignKey(Wall)
    obj_pk = models.IntegerField()
    type = models.CharField(max_length=50)
    text = models.CharField(max_length=10000, default="", blank=True)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    def __unicode__(self):
        return str(self.pk)
    class Meta:
        ordering = ['-pk']
        get_latest_by = "pk"

class TagOrder(models.Model):
    '''An stringified array specifying the order of the user's waypoint tags.'''

    wall = models.OneToOneField(Wall)
    text = models.CharField(max_length=10000, default="", blank=True)









