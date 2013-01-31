from walls.models import Wall, Mark, Waypoint, Undo, Redo
from django.contrib import admin

class MarkInline(admin.TabularInline):
	model = Mark
	extra = 3

class WaypointInline(admin.TabularInline):
	model = Waypoint
	extra = 3

class UndoInline(admin.TabularInline):
	model = Undo
	extra = 3

class RedoInline(admin.TabularInline):
	model = Redo
	extra = 3

class WallAdmin(admin.ModelAdmin):
	fieldsets = [
		(None, {'fields': ['user'] }),
		(None, {'fields': ['title'] }),
		('Date information', {'fields': ['last_updated'] }),
	]
	inlines = [MarkInline, WaypointInline, UndoInline, RedoInline]
	list_display = ('title','last_updated')
	list_filter = ['last_updated']
	search_fields = ['title']
	date_hierarchy = 'last_updated'

admin.site.register(Wall, WallAdmin)