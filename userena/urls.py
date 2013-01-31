from django.conf.urls.defaults import *
from django.views.generic.base import TemplateView
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required

from userena import views as userena_views
from userena import settings as userena_settings

urlpatterns = patterns('',
    # Signup, signin and signout
    url(r'^signup/$',
       userena_views.signup,
       name='userena_signup'),
    url(r'^login/$',
       userena_views.signin,
       name='userena_signin'),
    url(r'^logout/$',
       userena_views.signout,
       name='userena_signout'),

    # Reset password
    url(r'^password/reset/$',
       auth_views.password_reset,
       {'template_name': 'userena/password_reset_form.html',
        'email_template_name': 'userena/emails/password_reset_message.txt'},
       name='userena_password_reset'),
    url(r'^password/reset/done/$',
       auth_views.password_reset_done,
       {'template_name': 'userena/password_reset_done.html'},
       name='userena_password_reset_done'),
    url(r'^password/reset/confirm/(?P<uidb36>[0-9A-Za-z]+)-(?P<token>.+)/$',
       auth_views.password_reset_confirm,
       {'template_name': 'userena/password_reset_confirm_form.html'},
       name='userena_password_reset_confirm'),
    url(r'^password/reset/confirm/complete/$',
       auth_views.password_reset_complete,
       {'template_name': 'userena/password_reset_complete.html'}),

    # Signup
#    url(r'^(?P<username>[\.\w]+)/signup/complete/$',
#       userena_views.direct_to_user_template,
#       {'template_name': 'userena/signup_complete.html',
#        'extra_context': {'userena_activation_required': userena_settings.USERENA_ACTIVATION_REQUIRED,
#                          'userena_activation_days': userena_settings.USERENA_ACTIVATION_DAYS}},
#       name='userena_signup_complete'),

    # View profile
    url(r'^(?P<username>(?!logout|signup|login)[\.\w]+)/$',
       userena_views.profile_detail,
       name='userena_profile_detail'),
)
