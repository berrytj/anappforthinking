from django.conf.urls import patterns, include, url
from django.conf import settings

from django.contrib import admin
admin.autodiscover()

from django.conf.urls.defaults import *
from tastypie.api import Api
from walls.api import ( WallResource, MarkResource, WaypointResource,
                        UserResource, UndoResource, RedoResource )


v1_api = Api(api_name='v1')
v1_api.register(UserResource())
v1_api.register(WallResource())
v1_api.register(MarkResource())
v1_api.register(WaypointResource())
v1_api.register(UndoResource())
v1_api.register(RedoResource())


urlpatterns = patterns('',
    url(r'^gallery/', 'walls.views.gallery'),
	url(r'^admin/', include(admin.site.urls)),
	url(r'^settings/', 'userena.views.profile_detail'),
	url(r'^api/', include(v1_api.urls)),
    url(r'^', include('my_import.urls')),
	url(r'^', include('walls.urls')),
	url(r'^', include('userena.urls')),
)

if not settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
    )

    # Examples:
    # url(r'^$', 'mysite.views.home', name='home'),
    # url(r'^mysite/', include('mysite.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),