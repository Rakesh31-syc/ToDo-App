import React, { useEffect, useState } from 'react';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Todo = Database['public']['Tables']['todos']['Row'];

interface TodoListProps {
  user: { id: string; email: string };
}

function TodoList({ user }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchTodos();
    const subscription = subscribeTodos();
    return () => {
      subscription();
    };
  }, []);

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
    if (!newTodo.trim()) return;

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

  return (
    <div className="max-w-4xl mx-auto p-6">
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
    </div>
  );
}

export default TodoList;