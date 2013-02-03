from django.core.urlresolvers import reverse
from django.shortcuts import redirect, get_object_or_404, render
from django.contrib.auth import authenticate, login, logout, REDIRECT_FIELD_NAME
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import logout as Signout
from django.views.generic import TemplateView
from django.template.context import RequestContext
from django.views.generic.list import ListView
from django.conf import settings
from django.contrib import messages
from django.utils.translation import ugettext as _
from django.http import HttpResponseForbidden, Http404

from userena.forms import (SignupForm, SignupFormOnlyEmail, AuthenticationForm,
                           ChangeEmailForm, EditProfileForm)
from userena.models import UserenaSignup
from userena.decorators import secure_required
from userena.backends import UserenaAuthenticationBackend
from userena.utils import signin_redirect, get_profile_model
from userena import signals as userena_signals
from userena import settings as userena_settings

from guardian.decorators import permission_required_or_403

import warnings

class ExtraContextTemplateView(TemplateView):
    """ Add extra context to a simple template view """
    extra_context = None

    def get_context_data(self, *args, **kwargs):
        context = super(ExtraContextTemplateView, self).get_context_data(*args, **kwargs)
        if self.extra_context:
            context.update(self.extra_context)
        return context

    # this view is used in POST requests, e.g. signup when the form is not valid
    post = TemplateView.get

@secure_required
def signup(request, signup_form=SignupForm,
           template_name='userena/signup.html', success_url='/',
           extra_context=None):
    """
    Signup of an account.
    Signup requiring a username, email and password. After signup a user gets
    an email with an activation link used to activate their account. After
    successful signup redirects to ``success_url``.
    :param signup_form:
        Form that will be used to sign a user. Defaults to userena's
        :class:`SignupForm`.
    :param template_name:
        String containing the template name that will be used to display the
        signup form. Defaults to ``userena/signup_form.html``.
    :param success_url:
        String containing the URI which should be redirected to after a
        successfull signup. If not supplied will redirect to
        ``userena_signup_complete`` view.
    :param extra_context:
        Dictionary containing variables which are added to the template
        context. Defaults to a dictionary with a ``form`` key containing the
        ``signup_form``.
    **Context**
    ``form``
        Form supplied by ``signup_form``.
    """

    form = signup_form()

    if request.method == 'POST':
        form = signup_form(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()

            # Send the signup complete signal
            userena_signals.signup_complete.send(sender=None,
                                                 user=user)
            
            # A new signed user should logout the old one.
            logout(request)
            
            # Must authenticate user before logging in.
            user = authenticate(username=request.POST['username'],
                                password=request.POST['password1'])
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect(success_url)
                else:
                    return redirect('/login/?status=deactivated')
            else:
                return redirect('/login/?status=invalid')

    if not extra_context: extra_context = dict()
    extra_context['form'] = form
    return ExtraContextTemplateView.as_view(template_name=template_name,
                                            extra_context=extra_context)(request)

@secure_required
def signin(request, auth_form=AuthenticationForm,
           template_name='userena/login.html',
           redirect_field_name=REDIRECT_FIELD_NAME,
           redirect_signin_function=signin_redirect, extra_context=None):
    """
    Signin using email or username with password.
    Signs a user in by combining email/username with password. If the
    combination is correct and the user :func:`is_active` the
    :func:`redirect_signin_function` is called with the arguments
    ``REDIRECT_FIELD_NAME`` and an instance of the :class:`User` whois is
    trying the login. The returned value of the function will be the URL that
    is redirected to.
    A user can also select to be remembered for ``USERENA_REMEMBER_DAYS``.
    :param auth_form:
        Form to use for signing the user in. Defaults to the
        :class:`AuthenticationForm` supplied by userena.
    :param template_name:
        String defining the name of the template to use. Defaults to
        ``userena/signin_form.html``.
    :param redirect_field_name:
        Form field name which contains the value for a redirect to the
        successing page. Defaults to ``next`` and is set in
        ``REDIRECT_FIELD_NAME`` setting.
    :param redirect_signin_function:
        Function which handles the redirect. This functions gets the value of
        ``REDIRECT_FIELD_NAME`` and the :class:`User` who has logged in. It
        must return a string which specifies the URI to redirect to.
    :param extra_context:
        A dictionary containing extra variables that should be passed to the
        rendered template. The ``form`` key is always the ``auth_form``.
    **Context**
    ``form``
        Form used for authentication supplied by ``auth_form``.
    """
    form = auth_form

    if request.method == 'POST':
        form = auth_form(request.POST, request.FILES)
        if form.is_valid():
            identification, password, remember_me = (form.cleaned_data['identification'],
                                                     form.cleaned_data['password'],
                                                     form.cleaned_data['remember_me'])
            user = authenticate(identification=identification,
                                password=password)
            if user.is_active:
                login(request, user)
                if remember_me:
                    request.session.set_expiry(
                        userena_settings.USERENA_REMEMBER_ME_DAYS[1] * 86400)
                else: request.session.set_expiry(0)

                if userena_settings.USERENA_USE_MESSAGES:
                    messages.success(request, _('You have been signed in.'),
                                     fail_silently=True)

                # Whereto now?
                redirect_to = redirect_signin_function(
                    request.REQUEST.get(redirect_field_name), user)
                return redirect(redirect_to)
            else:
                return redirect(reverse('userena_disabled',
                                        kwargs={ 'username':user.username }))
    
    if request.method == 'GET' and 'status' in request.GET:
        status = request.GET['status']
        if not status:
            status = ''
    else:
        status = ''
    
    if not extra_context: extra_context = dict()
    extra_context.update({
        'form': form,
        'next': request.REQUEST.get(redirect_field_name),
        'status': status,
    })
    return ExtraContextTemplateView.as_view(template_name=template_name,
                                            extra_context=extra_context)(request)

@secure_required
def signout(request, next_page=userena_settings.USERENA_REDIRECT_ON_SIGNOUT, 
            template_name='userena/logout.html', *args, **kwargs):
    """
    Signs out the user and adds a success message ``You have been signed
    out.`` If next_page is defined you will be redirected to the URI. If
    not the template in template_name is used.
    :param next_page:
        A string which specifies the URI to redirect to.
    :param template_name:
        String defining the name of the template to use. Defaults to
        ``userena/signout.html``.
    """
    if request.user.is_authenticated() and userena_settings.USERENA_USE_MESSAGES: # pragma: no cover
        messages.success(request, _('You have been signed out.'), fail_silently=True)
    return Signout(request, next_page, template_name, *args, **kwargs)

@secure_required
def profile_detail(request,
                   template_name=userena_settings.USERENA_PROFILE_DETAIL_TEMPLATE,
                   email_form=ChangeEmailForm, pass_form=PasswordChangeForm,
                   extra_context=None, **kwargs):
    
    user = request.user
    f = None
    email_f = email_form(user)
    pass_f = pass_form(user=user)
    
    if request.method == 'POST':
        if 'em' in request.POST:
            email_f = email_form(user, request.POST, request.FILES)
            f = email_f
            if email_f.is_valid():
                email_f.save()
                return redirect('/settings/?status=ce')
        elif 'pass' in request.POST:
            pass_f = pass_form(user=user, data=request.POST)
            f = pass_f
            if pass_f.is_valid():
                pass_f.save()
                userena_signals.password_complete.send(sender=None, user=user)
                return redirect('/settings/?status=cp')
    
    if request.method == 'GET' and 'status' in request.GET:
        status = request.GET['status']
        if not status:
            status = ''
    else:
        status = ''
    
    if not extra_context: extra_context = dict()
    
    # Add invalid form f to extra context
    extra_context['form'] = f
    
    extra_context['profile'] = user.get_profile()
    extra_context['email_form'] = email_f
    extra_context['pass_form'] = pass_f
    extra_context['status'] = status
    
    return ExtraContextTemplateView.as_view(template_name='userena/settings.html',
                                            extra_context=extra_context)(request)

@secure_required
def email_confirm(request, confirmation_key,
                  template_name='userena/email_confirm_fail.html',
                  success_url=None, extra_context=None):
    """
    Confirms an email address with a confirmation key.

    Confirms a new email address by running :func:`User.objects.confirm_email`
    method. If the method returns an :class:`User` the user will have his new
    e-mail address set and redirected to ``success_url``. If no ``User`` is
    returned the user will be represented with a fail message from
    ``template_name``.

    :param confirmation_key:
        String with a SHA1 representing the confirmation key used to verify a
        new email address.

    :param template_name:
        String containing the template name which should be rendered when
        confirmation fails. When confirmation is successful, no template is
        needed because the user will be redirected to ``success_url``.

    :param extra_context:
        Dictionary of variables that are passed on to the template supplied by
        ``template_name``.

    """
    user = UserenaSignup.objects.confirm_email(confirmation_key)
    if user: return redirect('/login/?status=new_email')
    else:
        if not extra_context: extra_context = dict()
        return ExtraContextTemplateView.as_view(template_name=template_name,
                                            extra_context=extra_context)(request)