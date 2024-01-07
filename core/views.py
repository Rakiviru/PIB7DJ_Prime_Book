from django.shortcuts import render, redirect
from django.contrib.auth.models import User, auth
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import Profile, Post, LikePost, FollowersCount
from itertools import chain
from django.core.mail import send_mail
from django.conf import settings
import random


# Create your views here.

@login_required(login_url='signin')
def index(request):
    user_object = User.objects.get(username=request.user.username)
    user_profile = Profile.objects.get(user=user_object)

    user_following_list = []
    feed = []

    user_following = FollowersCount.objects.filter(follower=request.user.username)

    for users in user_following:
        user_following_list.append(users.user)

    for usernames in user_following_list:
        feed_lists = Post.objects.filter(user=usernames)
        feed.append(feed_lists)

    feed_list = list(chain(*feed))

    # user suggestion starts
    all_users = User.objects.all()
    user_following_all = []

    # for user in user_following:
    #     user_list = User.objects.get(username=user.user)
    #     user_following_all.append(user_list)

    new_suggestions_list = [x for x in list(all_users) if (x not in list(user_following_all))]
    current_user = User.objects.filter(username=request.user.username)
    final_suggestions_list = [x for x in list(new_suggestions_list) if (x not in list(current_user))]
    random.shuffle(final_suggestions_list)

    username_profile = []
    username_profile_list = []

    for users in final_suggestions_list:
        username_profile.append(users.id)

    for ids in username_profile:
        profile_lists = Profile.objects.filter(id_user=ids)
        username_profile_list.append(profile_lists)

    suggestions_username_profile_list = list(chain(*username_profile_list))

    return render(request, 'index.html', {'user_profile': user_profile, 'posts': feed_list,
                                          'suggestions_username_profile_list': suggestions_username_profile_list})

@login_required(login_url='signin')
def follow(request):
    if request.method == 'POST':
        follower = request.POST['follower']
        user = request.POST['user']

        if FollowersCount.objects.filter(follower=follower, user=user).first():
            delete_follower = FollowersCount.objects.get(follower=follower, user=user)
            delete_follower.delete()
            return redirect('/profile/' + user)
        else:
            new_follower = FollowersCount.objects.create(follower=follower, user=user)
            new_follower.save()
            return redirect('/profile/' + user)
    else:
        return redirect('/')


# def email_followers(request):
#     # Assuming you have retrieved the follower's usernames in a list
#     follower_usernames = ["username1", "username2"]
#
#     # Retrieve the user objects for the followers
#     followers = User.objects.filter(username__in=follower_usernames)
#
#     # Extract the email addresses of the followers
#     follower_emails = [follower.email for follower in followers if follower.email]
#
#     if follower_emails:
#         subject = f'{request.user.username} added a new post'
#         message = f'{request.user.username} added a new post.'
#         email_from = 'your_email@gmail.com'  # Replace with your email
#         password = 'your_email_password'  # Replace with your email password
#         recipient_list = follower_emails
#
#         send_mail(subject, message, email_from, recipient_list, auth_user=email_from, auth_password=password)
#     else:
#         # Handle the case where there are no followers with valid emails
#         pass


# @login_required(login_url='signin')
# def upload(request):
#     if request.method == 'POST':
#         user = request.user.username
#         image = request.FILES.get('image_upload')
#         caption = request.POST['caption']
#
#
#         new_post = Post.objects.create(user=user, image=image, caption=caption)
#         new_post.save()
#         email_followers(request)
#
#
#         return redirect('/')
#     else:
#         return redirect('/')

user_emails = User.objects.values_list('email', flat=True)
from django.contrib.auth.models import User

# def fetch_user_emails(request):
#     user_emails = User.objects.values_list('email', flat=True)
#
#     for email in user_emails:
#         print(email)
#
#     # You can return or use the email addresses in your view as needed.
# from django.core.mail import send_mail
# from django.contrib.auth.models import User

def send_email_notification(request, uploaded_by):
    # Retrieve the email addresses of registered users
    user_emails = User.objects.values_list('email', flat=True)

    # Compose the email
    subject = 'New Photo Uploaded'
    message = f'Hello,\n\n{uploaded_by.username} has uploaded a new photo on the platform.\n\n' \
               'You can check it out on the platform.' # f is used consider variable within the string
    from_email = 'primebook06@gmail.com'  # Replace with your email address
    recipient_list = list(user_emails)

    # Send the email
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)

# In your view for uploading pictures
def upload(request):
    if request.method == 'POST':
        user = request.user
        image = request.FILES.get('image_upload')
        caption = request.POST['caption']

        new_post = Post.objects.create(user=user.username, image=image, caption=caption)
        new_post.save()

        # Send email notification to registered users
        send_email_notification(request, user)

        return redirect('/')
    else:
        return redirect('/')


@login_required(login_url='signin')
def search(request):
    user_object = User.objects.get(username=request.user.username)
    user_profile = Profile.objects.get(user=user_object)

    if request.method == 'POST':
        username = request.POST['username']
        username_object = User.objects.filter(username__icontains=username)

        username_profile = []
        username_profile_list = []

        for users in username_object:
            username_profile.append(users.id)

        for ids in username_profile:
            profile_lists = Profile.objects.filter(id_user=ids)
            username_profile_list.append(profile_lists)

        username_profile_list = list(chain(*username_profile_list))
    return render(request, 'search.html',
                  {'user_profile': user_profile, 'username_profile_list': username_profile_list})


@login_required(login_url='signin')
def like_post(request):
    username = request.user.username
    post_id = request.GET.get('post_id')

    post = Post.objects.get(id=post_id)

    like_filter = LikePost.objects.filter(post_id=post_id, username=username).first()

    if like_filter == None:
        new_like = LikePost.objects.create(post_id=post_id, username=username)
        new_like.save()
        post.no_of_likes = post.no_of_likes + 1
        post.save()
        return redirect('/')
    else:
        like_filter.delete()
        post.no_of_likes = post.no_of_likes - 1
        post.save()
        return redirect('/')


@login_required(login_url='signin')
def profile(request, pk):
    user_object = User.objects.get(username=pk)
    user_profile = Profile.objects.get(user=user_object)
    user_posts = Post.objects.filter(user=pk)
    user_post_length = len(user_posts)

    follower = request.user.username
    user = pk

    if FollowersCount.objects.filter(follower=follower, user=user).first():
        button_text = 'Unfollow'
    else:
        button_text = 'Follow'

    user_followers = len(FollowersCount.objects.filter(user=pk))
    user_following = len(FollowersCount.objects.filter(follower=pk))

    context = {
        'user_object': user_object,
        'user_profile': user_profile,
        'user_posts': user_posts,
        'user_post_length': user_post_length,
        'button_text': button_text,
        'user_followers': user_followers,
        'user_following': user_following,
    }
    return render(request, 'profile.html', context)




@login_required(login_url='signin')
def settings(request):
    user_profile = Profile.objects.get(user=request.user)

    if request.method == 'POST':

        if request.FILES.get('image') == None:
            image = user_profile.profileimg
            bio = request.POST['bio']
            location = request.POST['location']

            user_profile.profileimg = image
            user_profile.bio = bio
            user_profile.location = location
            user_profile.save()
        if request.FILES.get('image') != None:
            image = request.FILES.get('image')
            bio = request.POST['bio']
            location = request.POST['location']

            user_profile.profileimg = image
            user_profile.bio = bio
            user_profile.location = location
            user_profile.save()

        return redirect('settings')
    return render(request, 'setting.html', {'user_profile': user_profile})


def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        password2 = request.POST['password2']

        if password == password2:
            if User.objects.filter(email=email).exists():
                messages.info(request, 'Email Taken')
                return redirect('signup')
            elif User.objects.filter(username=username).exists():
                messages.info(request, 'Username Taken')
                return redirect('signup')
            else:
                user = User.objects.create_user(username=username, email=email, password=password)
                user.save()

                # Email sending
                subject = 'welcome to Prime Book'
                message = f'Hi {user.username}, thank you for registering in Prime Book.'
                email_from = 'primebook06@gmail.com'
                password = 'wrhcqjmsvqpxyooy'
                recipient_list = [user.email, ]
                send_mail(subject, message, email_from, recipient_list)


                # # log user in and redirect to settings page
                # user_login = auth.authenticate(username=username, password=password)
                # auth.login(request, user_login)

                # create a Profile object for the new user
                user_model = User.objects.get(username=username)
                new_profile = Profile.objects.create(user=user_model, id_user=user_model.id)
                new_profile.save()
                return redirect('settings')
        else:
            messages.info(request, 'Password Not Matching')
            return redirect('signup')

    else:
        return render(request, 'signup.html')


def signin(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        user = auth.authenticate(username=username, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect('/')
        else:
            messages.info(request, 'Credentials Invalid')
            return redirect('signin')

    else:
        return render(request, 'signin.html')


@login_required(login_url='signin')
def logout(request):
    auth.logout(request)
    return redirect('signin')


# @login_required(login_url='signin')
# def upload(request):
#     if request.method == 'POST':
#         user = request.user
#         image = request.FILES.get('image_upload')
#         caption = request.POST['caption']
#
#         new_post = Post.objects.create(user=user.username, image=image, caption=caption)
#         new_post.save()
#
#         # Send email notification
#         send_upload_notification(user, new_post.image)
#
#         return redirect('/')
#     else:
#         return redirect('/')
#
#
# def send_upload_notification(user, image):
#     subject = 'New Photo Uploaded'
#     message = f'Hello {user.username},\n\nYou have uploaded a new photo on your profile.\n\n' \
#               f'Check it out on your profile page!'
#     from_email = 'primebook06@gmail.com'  # Replace with your email address
#     recipient_list = [user.email]
#
#     send_mail(subject, message, from_email, recipient_list, fail_silently=False)

#####################################################
