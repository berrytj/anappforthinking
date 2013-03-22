from nose.tools import *
from django.contrib.auth.models import User
from walls.models import *


def test_room():

    user_info = {'username': 'alice',
                 'password': 'swordfish',
                 'email': 'alice@example.com'}

    user = User(user_info)
    user.save()
    wall = Wall(user=user, title='new wall')
    wall.save()

    assert_equal(wall.user, user)
    assert_equal(wall.title, 'new wall')