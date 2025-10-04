import { supabase } from '../lib/supabase';

class TodosService {
  // Get all todos for a user
  async getTodosForUser(userEmail) {
    try {
      // First get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Error getting user:', userError);
        return [];
      }

      if (!user) {
        console.log('User not found:', userEmail);
        return [];
      }

      // Get todos for the user
      const { data: todos, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (todosError) {
        console.error('Error getting todos:', todosError);
        return [];
      }

      return todos || [];
    } catch (error) {
      console.error('Error in getTodosForUser:', error);
      return [];
    }
  }

  // Save or update a todo
  async saveTodo(userEmail, todoData) {
    try {
      // Get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return null;
      }

      const todoPayload = {
        user_id: user.id,
        contract_id: todoData.contractId,
        task_id: todoData.id,
        title: todoData.title,
        description: todoData.description,
        type: todoData.type,
        priority: todoData.priority,
        status: todoData.status,
        due_date: todoData.dueDate,
        completed_at: todoData.status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      // Try to update first (upsert)
      const { data, error } = await supabase
        .from('todos')
        .upsert(todoPayload, { 
          onConflict: 'user_id,task_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving todo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveTodo:', error);
      return null;
    }
  }

  // Update todo status
  async updateTodoStatus(userEmail, todoId, status) {
    try {
      // Get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return null;
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('id', todoId)
        .select()
        .single();

      if (error) {
        console.error('Error updating todo status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTodoStatus:', error);
      return null;
    }
  }

  // Bulk save todos (for initial generation)
  async bulkSaveTodos(userEmail, todos) {
    try {
      // Get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return [];
      }

      const todosPayload = todos.map(todo => ({
        user_id: user.id,
        contract_id: todo.contractId,
        task_id: todo.id,
        title: todo.title,
        description: todo.description,
        type: todo.type,
        priority: todo.priority,
        status: todo.status,
        due_date: todo.dueDate,
        completed_at: todo.status === 'completed' ? new Date().toISOString() : null
      }));

      const { data, error } = await supabase
        .from('todos')
        .upsert(todosPayload, { 
          onConflict: 'user_id,task_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Error bulk saving todos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in bulkSaveTodos:', error);
      return [];
    }
  }

  // Delete todos for a specific contract (when contract is deleted)
  async deleteTodosForContract(userEmail, contractId) {
    try {
      // Get the user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return false;
      }

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', user.id)
        .eq('contract_id', contractId);

      if (error) {
        console.error('Error deleting todos for contract:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTodosForContract:', error);
      return false;
    }
  }
}

export const todosService = new TodosService();
export default todosService;
