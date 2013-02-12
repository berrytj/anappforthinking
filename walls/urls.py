from django.conf.urls import patterns, include, url
from django.views.generic import DetailView, ListView
from walls.models import Wall
from accounts.models import MyProfile

urlpatterns = patterns('',
    url(r'^$', 'walls.views.index', name='index'),
    url(r'^(?P<pk>\d+)/$', 'walls.views.wall'),
    url(r'^newWall/$', 'walls.views.newWall'),
)