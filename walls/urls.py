from django.conf.urls import patterns, include, url
from django.views.generic import DetailView, ListView
from walls.models import Wall
from accounts.models import MyProfile

urlpatterns = patterns('',
    url(r'^$', 'walls.views.index', name='index'),
    url(r'^(?P<pk>\d+)/$', 'walls.views.detail'),
    url(r'^(?P<wall_id>\d+)/newObj/$', 'walls.views.newObj'),
    url(r'^(?P<wall_id>\d+)/moveObj/$', 'walls.views.moveObj'),
    url(r'^(?P<wall_id>\d+)/eraseObj/$', 'walls.views.eraseObj'),
    url(r'^(?P<wall_id>\d+)/editObj/$', 'walls.views.editObj'),
    url(r'^(?P<wall_id>\d+)/undo/$', 'walls.views.undo'),
    url(r'^(?P<wall_id>\d+)/redo/$', 'walls.views.redo'),
    url(r'^newWall/$', 'walls.views.newWall'),
)