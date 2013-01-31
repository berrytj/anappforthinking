from django.db import models
import datetime
from datetime import datetime
from django.utils import timezone
from django.contrib.auth.models import User
from accounts.models import MyProfile

class Wall(models.Model):
	user = models.ForeignKey(User)
	title = models.CharField(max_length=200)
	last_updated = models.DateTimeField('last updated', default = datetime.now)
	def __unicode__(self):
		return self.title
	class Meta:
		get_latest_by = "pk"
		ordering = ['-id']
    
class Mark(models.Model):
	wall = models.ForeignKey(Wall)
	text = models.CharField(max_length=10000, default="", blank=True)
	x = models.IntegerField()
	y = models.IntegerField()
	def __unicode__(self):
		return self.text
	class Meta:
		get_latest_by = "pk"

class Waypoint(models.Model):
	wall = models.ForeignKey(Wall)
	text = models.CharField(max_length=100, default="", blank=True)
	x = models.IntegerField()
	y = models.IntegerField()
	def __unicode__(self):
		return self.text
	class Meta:
		get_latest_by = "pk"

class Undo(models.Model):  # a snapshot of a mark, with its own undo pk
	wall = models.ForeignKey(Wall) # Probably not necessary since you have the mark/waypoint pk
	obj_pk = models.IntegerField()
	text = models.CharField(max_length=10000, default="", blank=True)
	x = models.IntegerField(default=0)
	y = models.IntegerField(default=0)
	type = models.CharField(max_length=50)
	def __unicode__(self):
		return str(self.pk)
	class Meta:
		ordering = ['-pk']
		get_latest_by = "pk"

class Redo(models.Model):  # a snapshot of a mark, with its own redo pk
	wall = models.ForeignKey(Wall)
	obj_pk = models.IntegerField()
	text = models.CharField(max_length=10000, default="", blank=True)
	x = models.IntegerField(default=0)
	y = models.IntegerField(default=0)
	type = models.CharField(max_length=50)
	def __unicode__(self):
		return str(self.pk)
	class Meta:
		ordering = ['-pk']
		get_latest_by = "pk"