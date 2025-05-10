from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from app.models import User
from app import db
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import functools

# Create a blueprint for authentication routes
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def login_required(view):
    """Decorator to require authentication for views"""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login', next=request.url))
        return view(**kwargs)
    return wrapped_view

def admin_required(view):
    """Decorator to require admin role for views"""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('auth.login', next=request.url))
            
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin():
            flash('You do not have permission to access this page.', 'error')
            return redirect(url_for('home.index'))
            
        return view(**kwargs)
    return wrapped_view

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Register a new user"""
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        # Validate input
        error = None
        if not username:
            error = 'Username is required.'
        elif not email:
            error = 'Email is required.'
        elif not password:
            error = 'Password is required.'
        elif password != password_confirm:
            error = 'Passwords do not match.'
            
        if error is None:
            # Create user
            user = User(username=username, email=email)
            user.set_password(password)
            
            try:
                db.session.add(user)
                db.session.commit()
                flash(f'Account created for {username}. Please log in.', 'success')
                return redirect(url_for('auth.login'))
            except IntegrityError:
                db.session.rollback()
                error = 'Username or email already exists.'
        
        flash(error, 'error')
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Log in a user"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Validate input
        error = None
        if not username:
            error = 'Username is required.'
        elif not password:
            error = 'Password is required.'
            
        if error is None:
            # Check credentials
            user = User.query.filter_by(username=username).first()
            
            if user and user.check_password(password):
                # Log in user
                session.clear()
                session['user_id'] = user.id
                
                # Update last login time
                user.last_login = datetime.utcnow()
                db.session.commit()
                
                # Redirect to next URL or home
                next_url = request.args.get('next')
                if next_url:
                    return redirect(next_url)
                else:
                    return redirect(url_for('home.index'))
            else:
                error = 'Invalid username or password.'
        
        flash(error, 'error')
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    """Log out a user"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home.index'))

@auth_bp.before_app_request
def load_logged_in_user():
    """Load user data for each request"""
    user_id = session.get('user_id')
    
    if user_id is None:
        current_app.jinja_env.globals['current_user'] = None
    else:
        user = User.query.get(user_id)
        current_app.jinja_env.globals['current_user'] = user 