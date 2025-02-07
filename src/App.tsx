import React from 'react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import TodoList from './components/TodoList';
import type { Database } from './lib/database.types';

type Todo = Database['public']['Tables']['todos']['Row'];

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

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
      {user ? <TodoList user={user} /> : <AuthPage />}
    </div>
  );
}

export default App;