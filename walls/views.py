from django.shortcuts import render, render_to_response, get_object_or_404
from django.http import Http404, HttpResponseRedirect, HttpResponse, HttpResponseBadRequest
from django.utils import simplejson as json
from django.views.generic import UpdateView
from django.core.urlresolvers import reverse
from django.template import RequestContext
from accounts.models import MyProfile
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from walls.models import Wall, Mark, Waypoint, Undo, Redo
from walls.extra import clear_redos, save_undo, create_new, get_obj, execute_undo, get_user

#use this to make "type" stuff simpler
#from django.db.models import get_model

@login_required(login_url='/login/')
def index(request):
    return render(request, 'walls/index.html')

@login_required(login_url='/login/')
def detail(request, pk):
	w = get_object_or_404(Wall, pk=pk)
	return render(request, 'walls/detail.html', { 'wall':w, 'username':request.user.username })

def newWall(request):
	user = request.user
	title = request.POST['wall']
	new = Wall(user=user, title=title)
	new.save()
	return HttpResponseRedirect(reverse('walls.views.detail', args=(new.pk,)))

def newObj(request, wall_id):
	w = get_object_or_404(Wall, pk=wall_id)
	type = request.POST['type']
	new = create_new(w, request.POST['text'], request.POST['x'], request.POST['y'], type)
	new.save()
	new.text = ""  # not saved, just used to put empty mark in undo stack
	save_undo(w, new, type)
	clear_redos()
	pk = new.pk
	return HttpResponse(json.dumps(pk), mimetype="application/json")

def eraseObj(request, wall_id):
	w = get_object_or_404(Wall, pk=wall_id)  # how to do this with Wall (model name) as variable (eg Mark or Waypoint)?
	type = request.POST['type']
	obj = get_obj(w, request.POST['pk'], type)
	save_undo(w, obj, type)
	clear_redos()
	obj.text = ""  # front-end knows not to render empty marks (they're pseudo-deleted)
	obj.save()
	return HttpResponse(json.dumps("hey"), mimetype="application/json")

def moveObj(request, wall_id):
	w = get_object_or_404(Wall, pk=wall_id)
	type = request.POST['type']
	obj = get_obj(w, request.POST['pk'], type)
	save_undo(w, obj, type)
	clear_redos()
	obj.x = request.POST['x']
	obj.y = request.POST['y']
	obj.save()
	return HttpResponse(json.dumps("hey"), mimetype="application/json")

def editObj(request, wall_id):
	w = get_object_or_404(Wall, pk=wall_id)
	obj = get_obj(w, request.POST['pk'], "mark")
	save_undo(w, obj, "mark")
	clear_redos()
	obj.text = request.POST['text']
	obj.save()
	return HttpResponse(json.dumps("hey"), mimetype="application/json")

def undo(request, wall_id):#start printing stuff
	w = get_object_or_404(Wall, pk=wall_id)
	count = w.undo_set.count()
	try:
		prev = w.undo_set.latest()  # first object on the undo list is the previous version of a mark
	except Undo.DoesNotExist:
		return HttpResponse(json.dumps({ "pk":-1 }), mimetype="application/json")
	redo = False
	render_data = execute_undo(w, prev, redo)
	render_data["remaining"] = count
	return HttpResponse(json.dumps(render_data), mimetype="application/json")

def redo(request, wall_id):
	w = get_object_or_404(Wall, pk=wall_id)
	count = w.redo_set.count()
	try:
		prev = w.redo_set.latest()
	except Redo.DoesNotExist:
		return HttpResponse(json.dumps({ "pk":-1 }), mimetype="application/json")
	redo = True
	render_data = execute_undo(w, prev, redo)
	render_data["remaining"] = count
	return HttpResponse(json.dumps(render_data), mimetype="application/json")