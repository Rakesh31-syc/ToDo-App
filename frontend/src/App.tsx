import React, { useEffect, useState } from 'react';
import { Loader2, LogIn, LogOut, Plus, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import type { Todo } from './types';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
      subscribeTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch todos');
      return;
    }

    setTodos(data || []);
  };

  const subscribeTodos = () => {
    const channel = supabase
      .channel('todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        () => {
          fetchTodos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setAuthLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed up successfully! You can now sign in.');
      setEmail('');
      setPassword('');
    }

    setAuthLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully!');
      setEmail('');
      setPassword('');
    }

    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      setTodos([]);
      toast.success('Signed out successfully!');
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    const { error } = await supabase.from('todos').insert({
      title: newTodo,
      user_id: user.id,
    });

    if (error) {
      toast.error('Failed to add todo');
    } else {
      setNewTodo('');
      toast.success('Todo added successfully!');
    }
  };

  const toggleTodo = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id);

    if (error) {
      toast.error('Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete todo');
    } else {
      toast.success('Todo deleted successfully!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto p-6">
        {user ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Todo List</h1>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            <form onSubmit={addTodo} className="flex gap-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Todo
              </button>
            </form>

            <div className="bg-white rounded-lg shadow">
              {todos.length === 0 ? (
                <p className="p-4 text-center text-gray-500">No todos yet!</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {todos.map((todo) => (
                    <li key={todo.id} className="p-4 flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo)}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <span
                        className={`flex-1 ${
                          todo.completed ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {todo.title}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to Todo List
            </h1>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSignUp}
                  disabled={authLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Sign Up
                </button>
                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Sign In
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;