from django.conf.urls import patterns, url

urlpatterns = patterns('walls.views',
    url(r'^$', 'index', name='index'),
    url(r'^(?P<pk>\d+)/$', 'wall'),
    url(r'^newWall/$', 'newWall'),
    url(r'^sortTags/$', 'sortTags'),
)