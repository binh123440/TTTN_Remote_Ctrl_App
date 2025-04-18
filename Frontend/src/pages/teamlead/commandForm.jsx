import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CommandForm = () => {
  const { id } = useParams(); // Lấy ID từ URL (nếu có)
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', commands: [] });

  // Fetch command list data if editing
  useEffect(() => {
    if (id) {
      axios.get(`/api/command-lists/${id}`)
        .then((response) => setFormData(response.data))
        .catch((error) => console.error('Error fetching command list:', error));
    }
  }, [id]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const apiCall = id
      ? axios.put(`/api/command-lists/${id}`, formData)
      : axios.post('/api/command-lists/', formData);

    apiCall
      .then(() => navigate('/commands'))
      .catch((error) => console.error('Error saving command list:', error));
  };

  return (
    <div>
      <h1>{id ? 'Edit Command List' : 'Create Command List'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </label>
        <label>
          Commands (comma-separated):
          <input
            type="text"
            value={formData.commands.join(', ')}
            onChange={(e) =>
              setFormData({ ...formData, commands: e.target.value.split(',').map((cmd) => cmd.trim()) })
            }
          />
        </label>
        <button type="submit">Save</button>
        <button type="button" onClick={() => navigate('/commands')}>Cancel</button>
      </form>
    </div>
  );
};

export default CommandForm;