from accounts.models import MyProfile
from django.contrib.auth.models import User
from walls.models import Wall, Mark, Waypoint, Undo, Redo

def clear_redos():
	for redo in Redo.objects.all():
		redo.delete()

def save_undo(w, obj, type):
	undo = Undo(wall = w,
				obj_pk = obj.pk,
				text = obj.text,
				x = obj.x,
				y = obj.y,
				type = type)
	undo.save()

def save_redo(w, obj, type):
	redo = Redo(wall = w,
				obj_pk = obj.pk,
				text = obj.text,
				x = obj.x,
				y = obj.y,
				type = type)
	redo.save()

def update_obj(obj, text, x, y):
	obj.text = text
	obj.x = x
	obj.y = y
	obj.save()

def create_new(w, text, x, y, type):
	if type == "mark":
		return Mark(wall=w, text=text, x=x, y=y)
	elif type == "waypoint":
		return Waypoint(wall=w, text=text, x=x, y=y)

def get_obj(w, pk, type): #add try / except clause?
	if type == "mark":
		return w.mark_set.get(pk=pk)
	elif type == "waypoint":
		return w.waypoint_set.get(pk=pk)

def execute_undo(w, prev, redo):
	pk = prev.obj_pk
	type = prev.type
	obj = get_obj(w, pk, type)
	if(redo):
		save_undo(w, obj, type)
	else:
		save_redo(w, obj, type)
	text = prev.text
	x = prev.x
	y = prev.y
	update_obj(obj, text, x, y)
	prev.delete()
	render_data = { "pk":pk, "text":text, "x":x, "y":y, "type":type }
	return render_data

def get_user(username):
	user = User.objects.get(username=username)
	profile = MyProfile.objects.get(user=user)
	return profile