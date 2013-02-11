from django.contrib.auth.models import User
from tastypie import fields
from tastypie.authorization import Authorization
from tastypie.resources import ModelResource, ALL, ALL_WITH_RELATIONS
from walls.models import Wall, Mark, Waypoint, Undo, Redo


class UserResource(ModelResource):
    class Meta:
        queryset = User.objects.all()
        resource_name = 'user'
        authorization = Authorization()
        excludes = ['email', 'password', 'is_active', 'is_staff', 'is_superuser']
        allowed_methods = ['get']
        filtering = {
            'id': ALL,
            'username': ALL,
        }

class WallResource(ModelResource):
    user = fields.ForeignKey(UserResource, 'user')
    
    class Meta:
        queryset = Wall.objects.all()
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'id': ALL,
            'user': ALL_WITH_RELATIONS,
        }

class MarkResource(ModelResource):
    wall = fields.ForeignKey(WallResource, 'wall')
    
    class Meta:
        queryset = Mark.objects.all()
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'id': ALL,
            'wall': ALL_WITH_RELATIONS,
        }

class WaypointResource(ModelResource):
    wall = fields.ForeignKey(WallResource, 'wall')
    
    class Meta:
        queryset = Waypoint.objects.all()
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'id': ALL,
            'wall': ALL_WITH_RELATIONS,
        }

class UndoResource(ModelResource):
    wall = fields.ForeignKey(WallResource, 'wall')
    
    class Meta:
        queryset = Undo.objects.all()
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'id': ALL,
            'wall': ALL_WITH_RELATIONS,
        }

class RedoResource(ModelResource):
    wall = fields.ForeignKey(WallResource, 'wall')
    
    class Meta:
        queryset = Redo.objects.all()
        authorization = Authorization()
        always_return_data = True
        filtering = {
            'id': ALL,
            'wall': ALL_WITH_RELATIONS,
        }